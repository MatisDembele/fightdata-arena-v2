import asyncio
import random
import string
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.database import SessionLocal
from app.services.quiz_service import generate_random_question

router = APIRouter()

MAX_QUESTIONS = 5


def _make_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase, k=4))


class Room:
    def __init__(self, code: str):
        self.code = code
        self.players: dict[str, WebSocket] = {}
        self.scores: dict[str, int] = {}
        self.current_question: Optional[dict] = None
        self.answers: dict[str, str] = {}
        self.question_number: int = 0
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

    if room.question_number > MAX_QUESTIONS:
        winner = max(room.scores, key=lambda n: room.scores[n])
        if list(room.scores.values()).count(room.scores[winner]) > 1:
            winner = "draw"
        await _broadcast(room, {
            "type": "game_over",
            "scores": room.scores,
            "winner": winner,
        })
        return

    q = generate_random_question(db)
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
    }

    await _broadcast(room, {
        "type": "question",
        "question": {k: v for k, v in room.current_question.items() if k != "answer"},
        "question_number": room.question_number,
        "total": MAX_QUESTIONS,
    })


@router.post("/rooms")
def create_room():
    for _ in range(10):
        code = _make_code()
        if code not in rooms:
            rooms[code] = Room(code)
            return {"room_code": code}
    return {"error": "Impossible de créer une room"}, 500


@router.websocket("/ws/{room_code}/{player_name}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_code: str,
    player_name: str,
):
    await websocket.accept()
    db = SessionLocal()

    room_code = room_code.upper()

    if room_code not in rooms:
        await _send(websocket, {"type": "error", "message": "Room introuvable."})
        await websocket.close()
        return

    room = rooms[room_code]

    if room.is_full() and player_name not in room.players:
        await _send(websocket, {"type": "error", "message": "Room pleine."})
        await websocket.close()
        return

    async with room.lock:
        room.players[player_name] = websocket
        room.scores.setdefault(player_name, 0)

    player_list = list(room.players.keys())

    await _send(websocket, {
        "type": "room_joined",
        "room_code": room_code,
        "players": player_list,
    })

    await _broadcast(room, {
        "type": "player_joined",
        "players": player_list,
    })

    if not room.is_ready():
        await _send(websocket, {"type": "waiting", "message": "En attente d'un adversaire..."})
    else:
        await asyncio.sleep(0.5)
        await _next_question(room, db)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "answer":
                answer = str(data.get("value", "")).strip()

                async with room.lock:
                    if player_name in room.answers:
                        continue
                    room.answers[player_name] = answer

                correct = room.current_question and answer == room.current_question["answer"]
                if correct:
                    room.scores[player_name] = room.scores.get(player_name, 0) + 1

                opponent = next((n for n in room.players if n != player_name), None)
                if opponent and opponent in room.players:
                    await _send(room.players[opponent], {
                        "type": "opponent_answered",
                    })

                if room.all_answered():
                    await _broadcast(room, {
                        "type": "answer_result",
                        "correct_answer": room.current_question["answer"] if room.current_question else "",
                        "player_answers": room.answers,
                        "scores": room.scores,
                    })
                    await asyncio.sleep(2.5)
                    await _next_question(room, db)

    except WebSocketDisconnect:
        async with room.lock:
            room.players.pop(player_name, None)

        if room.players:
            await _broadcast(room, {
                "type": "player_left",
                "player": player_name,
                "players": list(room.players.keys()),
            })
        else:
            rooms.pop(room_code, None)
    finally:
        db.close()
