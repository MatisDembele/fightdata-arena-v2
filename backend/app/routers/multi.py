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

MAX_QUESTIONS = 5
GAME_MODES = ("startup", "punish")


def _make_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase, k=4))


class Room:
    def __init__(self, code: str, game_mode: str = "startup"):
        self.code = code
        self.game_mode = game_mode if game_mode in GAME_MODES else "startup"
        self.players: dict[str, WebSocket] = {}
        self.scores: dict[str, int] = {}
        self.current_question: Optional[dict] = None
        self.answers: dict[str, str] = {}
        self.question_number: int = 0
        self.question_sent_at: float = 0.0
        self.points_this_round: dict[str, int] = {}
        self.correct_counts: dict[str, int] = {}
        self.lock = asyncio.Lock()

    def is_full(self) -> bool:
        return len(self.players) >= 2

    def is_ready(self) -> bool:
        return len(self.players) == 2

    def all_answered(self) -> bool:
        return len(self.answers) == len(self.players)


rooms: dict[str, Room] = {}


async def _broadcast(room: Room, message: dict):
    disconnected = []
    for name, ws in room.players.items():
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


async def _next_question(room: Room, db: Session):
    room.question_number += 1
    room.answers = {}
    room.points_this_round = {}

    if room.question_number > MAX_QUESTIONS:
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
            "total": MAX_QUESTIONS,
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
        "total": MAX_QUESTIONS,
        "game_mode": room.game_mode,
    })
    room.question_sent_at = time.time()


@router.post("/rooms")
def create_room(game_mode: str = "startup"):
    mode = game_mode if game_mode in GAME_MODES else "startup"
    for _ in range(10):
        code = _make_code()
        if code not in rooms:
            rooms[code] = Room(code, mode)
            return {"room_code": code, "game_mode": mode}
    return {"error": "Impossible de créer une room"}, 500
