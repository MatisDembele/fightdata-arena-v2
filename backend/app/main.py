import asyncio
import time
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine, SessionLocal
from app.routers import fighters, quiz, multi, daily, weekly, global_lb, flash, survival
from app.routers.multi import rooms, _broadcast, _send, _next_question, _reset_room


async def _heartbeat(websocket: WebSocket):
    """Ping every 25s to prevent proxy/Vercel idle-timeout disconnects."""
    try:
        while True:
            await asyncio.sleep(25)
            await _send(websocket, {"type": "ping"})
    except asyncio.CancelledError:
        pass

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fight Data Arena API",
    description="API de frame data Street Fighter 6",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://fightdata-arena-v2.vercel.app",
        "https://fightdata-arena-v2-git-main-matisdembeles-projects.vercel.app",
        "https://www.fightdata.app",
        "https://fightdata.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

_GIF_DIR = Path(__file__).parent.parent.parent / "data" / "gifs"
if _GIF_DIR.exists():
    app.mount("/gifs", StaticFiles(directory=str(_GIF_DIR)), name="gifs")

app.include_router(fighters.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(daily.router, prefix="/api")
app.include_router(weekly.router, prefix="/api")
app.include_router(global_lb.router, prefix="/api")
app.include_router(flash.router, prefix="/api")
app.include_router(survival.router, prefix="/api")
app.include_router(multi.router, prefix="/api/multi")


@app.websocket("/api/multi/ws/{room_code}/{player_name}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_code: str,
    player_name: str,
):
    await websocket.accept()
    heartbeat_task = asyncio.create_task(_heartbeat(websocket))
    db = SessionLocal()
    avatar = websocket.query_params.get("avatar", "ryu")

    room_code = room_code.upper()

    if room_code not in rooms:
        await _send(websocket, {"type": "error", "message": "Room introuvable."})
        await websocket.close()
        db.close()
        return

    room = rooms[room_code]

    if room.is_full() and player_name not in room.players:
        await _send(websocket, {"type": "error", "message": "Room pleine."})
        await websocket.close()
        db.close()
        return

    async with room.lock:
        room.players[player_name] = websocket
        room.scores.setdefault(player_name, 0)
        room.player_avatars[player_name] = avatar

    player_list = list(room.players.keys())
    avatars = dict(room.player_avatars)

    await _send(websocket, {
        "type": "room_joined",
        "room_code": room_code,
        "players": player_list,
        "avatars": avatars,
        "game_mode": room.game_mode,
        "max_questions": room.max_questions,
    })

    await _broadcast(room, {
        "type": "player_joined",
        "players": player_list,
        "avatars": avatars,
    })

    if not room.is_ready():
        await _send(websocket, {"type": "waiting", "message": "En attente d'un adversaire..."})
    else:
        await asyncio.sleep(0.3)
        await _broadcast(room, {
            "type": "vs",
            "players": list(room.players.keys()),
            "avatars": dict(room.player_avatars),
            "game_mode": room.game_mode,
        })
        await asyncio.sleep(2.5)
        for n in [3, 2, 1]:
            await _broadcast(room, {"type": "countdown", "value": n})
            await asyncio.sleep(1.0)
        await _next_question(room, db)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") in ("pong", "ping"):
                continue

            if data.get("type") == "answer":
                answer = str(data.get("value", "")).strip()

                all_done = False
                async with room.lock:
                    if player_name in room.answers:
                        continue
                    elapsed_ms = (time.time() - room.question_sent_at) * 1000
                    room.answers[player_name] = answer
                    correct = bool(room.current_question and answer == room.current_question["answer"])
                    pts = max(100, int(1000 - elapsed_ms / 10)) if correct else 0
                    room.scores[player_name] = room.scores.get(player_name, 0) + pts
                    room.points_this_round[player_name] = pts
                    if correct:
                        room.correct_counts[player_name] = room.correct_counts.get(player_name, 0) + 1
                    all_done = room.all_answered()

                opponent = next((n for n in room.players if n != player_name), None)
                if opponent and opponent in room.players:
                    await _send(room.players[opponent], {"type": "opponent_answered"})

                if all_done:
                    if room.timeout_task and not room.timeout_task.done():
                        room.timeout_task.cancel()
                    await _broadcast(room, {
                        "type": "answer_result",
                        "correct_answer": room.current_question["answer"] if room.current_question else "",
                        "player_answers": room.answers,
                        "scores": room.scores,
                        "points_earned": dict(room.points_this_round),
                        "on_block_value": room.current_question.get("on_block_value") if room.current_question else None,
                        "game_mode": room.game_mode,
                    })
                    await asyncio.sleep(3.5)
                    await _next_question(room, db)

            elif data.get("type") == "rematch":
                all_voted = False
                async with room.lock:
                    room.rematch_votes.add(player_name)
                    all_voted = len(room.rematch_votes) == len(room.players)

                if not all_voted:
                    opponent = next((n for n in room.players if n != player_name), None)
                    if opponent and opponent in room.players:
                        await _send(room.players[opponent], {"type": "rematch_requested", "player": player_name})
                else:
                    _reset_room(room)
                    await _broadcast(room, {
                        "type": "rematch_start",
                        "players": list(room.players.keys()),
                        "avatars": dict(room.player_avatars),
                    })
                    await asyncio.sleep(0.3)
                    await _broadcast(room, {
                        "type": "vs",
                        "players": list(room.players.keys()),
                        "avatars": dict(room.player_avatars),
                        "game_mode": room.game_mode,
                    })
                    await asyncio.sleep(2.5)
                    for n in [3, 2, 1]:
                        await _broadcast(room, {"type": "countdown", "value": n})
                        await asyncio.sleep(1.0)
                    await _next_question(room, db)

    except WebSocketDisconnect:
        async with room.lock:
            room.players.pop(player_name, None)

        if room.players:
            await _broadcast(room, {
                "type": "player_left",
                "player": player_name,
                "players": list(room.players.keys()),
                "avatars": dict(room.player_avatars),
            })
        else:
            rooms.pop(room_code, None)
    finally:
        heartbeat_task.cancel()
        db.close()


@app.websocket("/ws-test")
async def ws_test(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"type": "ok"})
    await websocket.close()


@app.get("/")
def root():
    return {"message": "Fight Data Arena API", "status": "ok"}
