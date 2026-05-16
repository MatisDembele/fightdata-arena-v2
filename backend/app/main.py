import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, SessionLocal
from app.routers import fighters, quiz, multi
from app.routers.multi import rooms, Room, _broadcast, _send, _next_question

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
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fighters.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(multi.router, prefix="/api/multi")


@app.websocket("/api/multi/ws/{room_code}/{player_name}")
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
                    await _send(room.players[opponent], {"type": "opponent_answered"})

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


@app.websocket("/ws-test")
async def ws_test(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"type": "ok"})
    await websocket.close()


@app.get("/")
def root():
    return {"message": "Fight Data Arena API", "status": "ok"}
