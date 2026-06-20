from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.weekly_score import WeeklyScore
from app.utils import validate_name, check_rate

router = APIRouter(prefix="/weekly", tags=["weekly"])


class ScoreSubmit(BaseModel):
    player_name: str
    score: int
    accuracy: int
    elapsed_seconds: Optional[float] = None


class ScoreEntry(BaseModel):
    rank: int
    player_name: str
    score: int
    accuracy: int
    elapsed_seconds: Optional[float] = None
    model_config = {"from_attributes": True}


def _this_week() -> str:
    today = datetime.now(timezone.utc).date()
    monday = today - timedelta(days=today.weekday())
    return monday.isoformat()


@router.post("/score")
def submit_score(payload: ScoreSubmit, request: Request, db: Session = Depends(get_db)):
    check_rate(request)
    name = validate_name(payload.player_name)
    # score is now a time-based point total (≈ up to 1000 per question × 20).
    if not (0 <= payload.score <= 20000 and 0 <= payload.accuracy <= 100):
        raise HTTPException(400, "Invalid score")

    week = _this_week()
    existing = db.query(WeeklyScore).filter_by(player_name=name, week=week).first()
    if existing:
        better = (
            payload.score > existing.score or
            (payload.score == existing.score and payload.accuracy > existing.accuracy) or
            (
                payload.score == existing.score and
                payload.accuracy == existing.accuracy and
                payload.elapsed_seconds is not None and
                (existing.elapsed_seconds is None or payload.elapsed_seconds < existing.elapsed_seconds)
            )
        )
        if better:
            existing.score           = payload.score
            existing.accuracy        = payload.accuracy
            existing.elapsed_seconds = payload.elapsed_seconds
            db.commit()
    else:
        db.add(WeeklyScore(
            player_name=name,
            score=payload.score,
            accuracy=payload.accuracy,
            elapsed_seconds=payload.elapsed_seconds,
            week=week,
        ))
        db.commit()

    return {"ok": True}


@router.get("/leaderboard", response_model=list[ScoreEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    week = _this_week()
    rows = (
        db.query(WeeklyScore)
        .filter(WeeklyScore.week == week)
        .order_by(
            WeeklyScore.score.desc(),
            WeeklyScore.accuracy.desc(),
            func.coalesce(WeeklyScore.elapsed_seconds, 999999).asc(),
        )
        .limit(10)
        .all()
    )
    return [
        ScoreEntry(
            rank=i + 1,
            player_name=r.player_name,
            score=r.score,
            accuracy=r.accuracy,
            elapsed_seconds=r.elapsed_seconds,
        )
        for i, r in enumerate(rows)
    ]
