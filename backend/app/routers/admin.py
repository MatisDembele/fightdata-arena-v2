from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app import presence
from app.models.user import User
from app.models.feedback import Feedback
from app.models.global_score import GlobalScore
from app.models.daily_score import DailyScore
from app.models.weekly_score import WeeklyScore
from app.models.survival_score import SurvivalScore
from app.models.flash_score import FlashScore
from app.models.fighter import Fighter
from app.models.move import Move

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(authorization: Optional[str]):
    if not settings.ADMIN_TOKEN:
        raise HTTPException(503, "Admin dashboard disabled — set ADMIN_TOKEN")
    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if token != settings.ADMIN_TOKEN:
        raise HTTPException(401, "Unauthorized")


def _iso(dt):
    return dt.isoformat() if dt else None


@router.get("/online")
def online(authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    return {"online": presence.count_online()}


@router.get("/stats")
def stats(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    _require_admin(authorization)

    def count(model) -> int:
        return db.query(func.count()).select_from(model).scalar() or 0

    first, latest = db.query(func.min(User.created_at), func.max(User.created_at)).first()
    recent_users = [
        {"username": u.username, "created_at": _iso(u.created_at)}
        for u in db.query(User).order_by(User.created_at.desc()).limit(25)
    ]
    recent_feedback = [
        {
            "category": f.category,
            "message": f.message,
            "contact": f.contact,
            "lang": f.lang,
            "created_at": _iso(f.created_at),
        }
        for f in db.query(Feedback).order_by(Feedback.created_at.desc()).limit(50)
    ]

    return {
        "online_now": presence.count_online(),
        "users": {
            "count": count(User),
            "first": _iso(first),
            "latest": _iso(latest),
            "recent": recent_users,
        },
        "plays": {
            "global": count(GlobalScore),
            "global_distinct_players": db.query(func.count(func.distinct(GlobalScore.player_name))).scalar() or 0,
            "daily": count(DailyScore),
            "weekly": count(WeeklyScore),
            "survival": count(SurvivalScore),
            "flash": count(FlashScore),
        },
        "feedback": {"count": count(Feedback), "recent": recent_feedback},
        "data": {"fighters": count(Fighter), "moves": count(Move)},
    }
