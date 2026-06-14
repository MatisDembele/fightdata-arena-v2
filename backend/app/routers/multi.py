import asyncio
import random
import string
import time
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.quiz_service import generate_random_question, generate_random_punish_question

# WebSocket endpoint is registered directly on the main app (main.py)
# to work around FastAPI's router prefix + WebSocket routing issue.

router = APIRouter()

MAX_PLAYERS = 6
VALID_QUESTIONS = (5, 10, 15, 20)
GAME_MODES = ("startup", "punish")


def _make_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase, k=4))


class Room:
    def __init__(self, code: str):
        self.code = code
        self.game_mode: str = "startup"
        self.max_questions: int = 10
        self.players: dict[str, WebSocket] = {}
        self.scores: dict[str, int] = {}
        self.current_question: Optional[dict] = None
        self.answers: dict[str, str] = {}
        self.question_number: int = 0
        self.question_sent_at: float = 0.0
        self.points_this_round: dict[str, int] = {}
        self.correct_counts: dict[str, int] = {}
        self.player_avatars: dict[str, str] = {}
        self.ready_players: set[str] = set()
        self.host: str = ""
        self.game_started: bool = False
        self.rematch_votes: set[str] = set()
        self.timeout_task: Optional[asyncio.Task] = None
        self.lock = asyncio.Lock()

    def is_full(self) -> bool:
        return len(self.players) >= MAX_PLAYERS

    def is_ready(self) -> bool:
        return self.game_started

    def all_answered(self) -> bool:
        if not self.players:
            return True
        return all(p in self.answers for p in self.players)

    def can_start(self) -> bool:
        return len(self.players) >= 2

    def all_ready(self) -> bool:
        return len(self.players) >= 2 and self.ready_players.issuperset(set(self.players.keys()))


rooms: dict[str, Room] = {}


async def _broadcast(room: Room, message: dict):
    disconnected = []
    for name, ws in list(room.players.items()):
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.append(name)
    for name in disconnected:
        room.players.pop(name, None)


async def _send(ws: WebSocket, message: dict):
    try:
        await ws.send_json(message)
    except Exception:
        pass


def _reset_room(room: Room):
    """Reset game state for a rematch, keeping players/avatars/settings."""
    if room.timeout_task and not room.timeout_task.done():
        room.timeout_task.cancel()
    room.timeout_task = None
    room.scores = {p: 0 for p in room.players}
    room.correct_counts = {}
    room.points_this_round = {}
    room.answers = {}
    room.question_number = 0
    room.current_question = None
    room.question_sent_at = 0.0
    room.rematch_votes = set()
    room.ready_players = set()
    room.game_started = False


async def _timeout_question(room: Room, question_number: int):
    try:
        await asyncio.sleep(15.0)
    except asyncio.CancelledError:
        return
    db = SessionLocal()
    try:
        async with room.lock:
            if room.question_number != question_number:
                return
            current_q = room.current_question
            for p in list(room.players.keys()):
                if p not in room.answers:
                    room.answers[p] = "__timeout__"
                    room.points_this_round[p] = 0
        if not current_q:
            return
        await _broadcast(room, {
            "type": "answer_result",
            "correct_answer": current_q["answer"],
            "player_answers": dict(room.answers),
            "scores": dict(room.scores),
            "points_earned": dict(room.points_this_round),
            "on_block_value": current_q.get("on_block_value"),
            "game_mode": room.game_mode,
            "timed_out": True,
        })
        await asyncio.sleep(3.5)
        await _next_question(room, db)
    finally:
        db.close()


async def _next_question(room: Room, db: Session):
    room.question_number += 1
    room.answers = {}
    room.points_this_round = {}

    if room.timeout_task and not room.timeout_task.done():
        room.timeout_task.cancel()
    room.timeout_task = None

    if not room.players:
        return

    if room.question_number > room.max_questions:
        scores = room.scores
        max_score = max(scores.values()) if scores else 0
        leaders = [n for n, s in scores.items() if s == max_score]
        winner = leaders[0] if len(leaders) == 1 else "draw"
        await _broadcast(room, {
            "type": "game_over",
            "scores": scores,
            "winner": winner,
            "game_mode": room.game_mode,
            "correct_counts": dict(room.correct_counts),
            "total": room.max_questions,
            "avatars": dict(room.player_avatars),
        })
        return

    q = generate_random_punish_question(db) if room.game_mode == "punish" else generate_random_question(db)
    if not q:
        await _broadcast(room, {"type": "error", "message": "Impossible de générer une question."})
        return

    room.current_question = {
        "move_name": q.move_name,
        "section": q.section,
        "gif_url": q.gif_url,
        "gif_path": q.gif_path,
        "question": q.question,
        "choices": q.choices,
        "answer": q.answer,
        "fighter_slug": q.fighter_slug,
        "on_block_value": getattr(q, "on_block_value", None),
        "game_mode": room.game_mode,
    }

    await _broadcast(room, {
        "type": "question",
        "question": {k: v for k, v in room.current_question.items() if k != "answer"},
        "question_number": room.question_number,
        "total": room.max_questions,
        "game_mode": room.game_mode,
    })
    room.question_sent_at = time.time()
    room.timeout_task = asyncio.ensure_future(_timeout_question(room, room.question_number))


@router.post("/rooms")
def create_room():
    for _ in range(10):
        code = _make_code()
        if code not in rooms:
            rooms[code] = Room(code)
            return {"room_code": code}
    return {"error": "Impossible de créer une room"}, 500


@router.get("/rooms/{room_code}")
def get_room(room_code: str):
    code = room_code.upper()
    if code not in rooms:
        return {"exists": False}
    room = rooms[code]
    return {
        "exists": True,
        "players": list(room.players.keys()),
        "is_full": room.is_full(),
        "game_started": room.game_started,
    }
