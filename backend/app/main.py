import asyncio
import time
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from sqlalchemy import inspect as _sa_inspect, text as _sa_text
from app.database import Base, engine, SessionLocal
from app.routers import fighters, quiz, multi, daily, weekly, global_lb, flash, survival, auth, feedback, admin, presence
from app.routers.multi import rooms, _broadcast, _send, _next_question, _reset_room, GAME_MODES, VALID_QUESTIONS, RECONNECT_GRACE


async def _heartbeat(websocket: WebSocket):
    """Ping every 25s to prevent proxy/Vercel idle-timeout disconnects."""
    try:
        while True:
            await asyncio.sleep(25)
            await _send(websocket, {"type": "ping"})
    except asyncio.CancelledError:
        pass


async def _room_sweeper():
    """Background loop: drop players who never reconnected within the grace window,
    and clean up abandoned empty rooms. Runs independently of any connection."""
    while True:
        await asyncio.sleep(5)
        now = time.time()
        for code, room in list(rooms.items()):
            expired = [
                n for n, ts in list(room.disconnected.items())
                if n not in room.players and now - ts > RECONNECT_GRACE
            ]
            for name in expired:
                async with room.lock:
                    room.scores.pop(name, None)
                    room.player_avatars.pop(name, None)
                    room.ready_players.discard(name)
                    room.correct_counts.pop(name, None)
                    room.answers.pop(name, None)
                    room.disconnected.pop(name, None)
                    if room.host == name and room.players:
                        room.host = next(iter(room.players))
                    members = set(room.scores.keys())
                if not room.players and not members:
                    rooms.pop(code, None)
                    continue
                await _broadcast(room, {
                    "type": "player_left",
                    "player": name,
                    "players": list(room.players.keys()),
                    "avatars": dict(room.player_avatars),
                    "host": room.host,
                    "ready_players": list(room.ready_players),
                    "disconnected": list(room.disconnected.keys()),
                })
            # Reap rooms that were created but abandoned (nobody ever stayed)
            if not room.players and not room.scores and now - room.created_at > 600:
                rooms.pop(code, None)

Base.metadata.create_all(bind=engine)

with engine.connect() as _conn:
    for _table, _col, _type in [
        ("daily_scores",  "elapsed_seconds", "FLOAT"),
        ("weekly_scores", "elapsed_seconds", "FLOAT"),
        ("users",         "avatar",          "VARCHAR"),
        ("user_profiles", "mode_bests",      "JSON"),
        ("user_profiles", "mistakes",         "JSON"),
    ]:
        try:
            _existing = {c["name"] for c in _sa_inspect(engine).get_columns(_table)}
            if _col not in _existing:
                _conn.execute(_sa_text(f"ALTER TABLE {_table} ADD COLUMN {_col} {_type}"))
                _conn.commit()
        except Exception:
            pass

app = FastAPI(
    title="Fight Data Arena API",
    description="API de frame data Street Fighter 6",
    version="1.0.0",
)


@app.on_event("startup")
async def _start_sweeper():
    asyncio.create_task(_room_sweeper())

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
    allow_headers=["Content-Type", "Authorization"],
)

_GIF_DIR = Path(__file__).parent.parent.parent / "data" / "gifs"


_GIF_CACHE_HEADERS = {"Cache-Control": "public, max-age=31536000, immutable", "Vary": "Accept"}

@app.get("/gifs/{path:path}")
async def serve_gif(path: str, request: Request):
    file_path = (_GIF_DIR / path).resolve()
    if not str(file_path).startswith(str(_GIF_DIR.resolve())):
        raise HTTPException(status_code=403)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404)
    # Serve WebP if the browser accepts it and a converted file exists alongside the GIF
    if "image/webp" in request.headers.get("Accept", ""):
        webp_path = file_path.with_suffix(".webp")
        if webp_path.exists():
            return FileResponse(str(webp_path), media_type="image/webp", headers=_GIF_CACHE_HEADERS)
    return FileResponse(str(file_path), media_type="image/gif", headers=_GIF_CACHE_HEADERS)

app.include_router(auth.router, prefix="/api")
app.include_router(fighters.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(daily.router, prefix="/api")
app.include_router(weekly.router, prefix="/api")
app.include_router(global_lb.router, prefix="/api")
app.include_router(flash.router, prefix="/api")
app.include_router(survival.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(presence.router, prefix="/api")
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
    returning = player_name in room.scores   # already a member (possibly mid-grace)

    if room.is_full() and player_name not in room.scores:
        await _send(websocket, {"type": "error", "message": "Room pleine."})
        await websocket.close()
        db.close()
        return

    if room.game_started and not returning:
        await _send(websocket, {"type": "error", "message": "Partie déjà en cours."})
        await websocket.close()
        db.close()
        return

    async with room.lock:
        is_first = len(room.scores) == 0
        room.players[player_name] = websocket
        room.scores.setdefault(player_name, 0)
        room.player_avatars[player_name] = avatar
        room.disconnected.pop(player_name, None)
        if is_first or not room.host:
            room.host = player_name

    player_list = list(room.players.keys())
    avatars = dict(room.player_avatars)

    # Message to the (re)joining client
    if room.game_started and returning:
        # Reconnecting mid-game: resync state; answers resume from the next question
        await _send(websocket, {
            "type": "resync",
            "room_code": room_code,
            "players": player_list,
            "avatars": avatars,
            "scores": dict(room.scores),
            "game_mode": room.game_mode,
            "max_questions": room.max_questions,
            "exclude_jumps": room.exclude_jumps,
            "host": room.host,
        })
    else:
        await _send(websocket, {
            "type": "room_joined",
            "room_code": room_code,
            "players": player_list,
            "avatars": avatars,
            "game_mode": room.game_mode,
            "max_questions": room.max_questions,
            "exclude_jumps": room.exclude_jumps,
            "host": room.host,
            "ready_players": list(room.ready_players),
        })

    # Notify the others
    await _broadcast(room, {
        "type": "player_reconnected" if returning else "player_joined",
        "player": player_name,
        "players": player_list,
        "avatars": avatars,
        "host": room.host,
        "ready_players": list(room.ready_players),
        "disconnected": list(room.disconnected.keys()),
    })

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") in ("pong", "ping"):
                continue

            if data.get("type") == "set_ready":
                async with room.lock:
                    if player_name in room.ready_players:
                        room.ready_players.discard(player_name)
                    else:
                        room.ready_players.add(player_name)
                await _broadcast(room, {
                    "type": "ready_update",
                    "ready_players": list(room.ready_players),
                    "can_start": room.can_start(),
                    "all_ready": room.all_ready(),
                })

            elif data.get("type") == "set_game_mode":
                if player_name != room.host:
                    continue
                mode = data.get("mode", "startup")
                if mode in GAME_MODES:
                    room.game_mode = mode
                await _broadcast(room, {
                    "type": "settings_update",
                    "game_mode": room.game_mode,
                    "max_questions": room.max_questions,
                    "exclude_jumps": room.exclude_jumps,
                })

            elif data.get("type") == "set_questions":
                if player_name != room.host:
                    continue
                n = int(data.get("n", 10))
                if n in VALID_QUESTIONS:
                    room.max_questions = n
                await _broadcast(room, {
                    "type": "settings_update",
                    "game_mode": room.game_mode,
                    "max_questions": room.max_questions,
                    "exclude_jumps": room.exclude_jumps,
                })

            elif data.get("type") == "set_exclude_jumps":
                if player_name != room.host:
                    continue
                room.exclude_jumps = bool(data.get("value", False))
                await _broadcast(room, {
                    "type": "settings_update",
                    "game_mode": room.game_mode,
                    "max_questions": room.max_questions,
                    "exclude_jumps": room.exclude_jumps,
                })

            elif data.get("type") == "start_game":
                if player_name != room.host or not room.can_start() or room.game_started:
                    continue
                room.game_started = True
                room.scores = {p: 0 for p in room.players}
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

            elif data.get("type") == "answer":
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

                await _broadcast(room, {
                    "type": "player_answered",
                    "answered_count": len(room.answers),
                    "total_count": len(room.players),
                    "player": player_name,
                })

                if all_done:
                    if room.timeout_task and not room.timeout_task.done():
                        room.timeout_task.cancel()
                    await _broadcast(room, {
                        "type": "answer_result",
                        "correct_answer": room.current_question["answer"] if room.current_question else "",
                        "player_answers": dict(room.answers),
                        "scores": dict(room.scores),
                        "points_earned": dict(room.points_this_round),
                        "on_block_value": room.current_question.get("on_block_value") if room.current_question else None,
                        "game_mode": room.game_mode,
                    })
                    await asyncio.sleep(3.5)
                    await _next_question(room, db)

            elif data.get("type") == "vote_mode":
                chosen = data.get("mode", "startup")
                if chosen not in GAME_MODES:
                    continue
                all_voted = False
                async with room.lock:
                    room.mode_votes[player_name] = chosen
                    all_voted = len(room.mode_votes) >= len(room.players)

                # Tally votes per mode
                vote_counts = {m: 0 for m in GAME_MODES}
                for v in room.mode_votes.values():
                    if v in vote_counts:
                        vote_counts[v] += 1

                if not all_voted:
                    await _broadcast(room, {
                        "type": "mode_vote_update",
                        "votes": vote_counts,
                        "player_votes": dict(room.mode_votes),
                        "voted": len(room.mode_votes),
                        "total": len(room.players),
                    })
                else:
                    # Pick winner — random on tie
                    import random as _rand
                    max_v = max(vote_counts.values())
                    winners = [m for m, c in vote_counts.items() if c == max_v]
                    room.game_mode = _rand.choice(winners)
                    _reset_room(room)
                    await _broadcast(room, {
                        "type": "rematch_start",
                        "players": list(room.players.keys()),
                        "avatars": dict(room.player_avatars),
                        "host": room.host,
                        "game_mode": room.game_mode,
                        "max_questions": room.max_questions,
                        "exclude_jumps": room.exclude_jumps,
                    })

    except WebSocketDisconnect:
        async with room.lock:
            # Only treat this as a drop if the active socket is still ours
            # (a reconnection may have already replaced room.players[name]).
            if room.players.get(player_name) is websocket:
                room.players.pop(player_name, None)
                room.ready_players.discard(player_name)
                room.disconnected[player_name] = time.time()
                still_ours = True
            else:
                still_ours = False
            was_host = room.host == player_name
            connected = list(room.players.keys())
            if was_host and connected:
                room.host = connected[0]

        if not still_ours:
            heartbeat_task.cancel()
            db.close()
            return

        # Keep the slot/score; show the player as disconnected (greyed) to others.
        await _broadcast(room, {
            "type": "player_disconnected",
            "player": player_name,
            "players": connected,
            "avatars": dict(room.player_avatars),
            "host": room.host,
            "ready_players": list(room.ready_players),
            "disconnected": list(room.disconnected.keys()),
        })

        # If a round was only waiting on this player, advance it.
        if room.players and room.game_started and room.current_question and room.answers and room.all_answered():
            if room.timeout_task and not room.timeout_task.done():
                room.timeout_task.cancel()
            await _broadcast(room, {
                "type": "answer_result",
                "correct_answer": room.current_question["answer"],
                "player_answers": dict(room.answers),
                "scores": dict(room.scores),
                "points_earned": dict(room.points_this_round),
                "on_block_value": room.current_question.get("on_block_value"),
                "game_mode": room.game_mode,
            })
            await asyncio.sleep(3.5)
            await _next_question(room, db)

        # The player keeps their slot/score; the background sweeper removes them
        # if they don't reconnect within RECONNECT_GRACE.
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
