from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.daily_score import DailyScore
from app.utils import validate_name, check_rate

router = APIRouter(prefix="/daily", tags=["daily"])


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


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


@router.post("/score")
def submit_score(payload: ScoreSubmit, request: Request, db: Session = Depends(get_db)):
    check_rate(request)
    name = validate_name(payload.player_name)
    # score is now a time-based point total (≈ up to 1000 per question × 10).
    if not (0 <= payload.score <= 10000 and 0 <= payload.accuracy <= 100):
        raise HTTPException(400, "Invalid score")

    today = _today()
    existing = db.query(DailyScore).filter_by(player_name=name, date=today).first()
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
        db.add(DailyScore(
            player_name=name,
            score=payload.score,
            accuracy=payload.accuracy,
            elapsed_seconds=payload.elapsed_seconds,
            date=today,
        ))
        db.commit()

    return {"ok": True}


@router.get("/leaderboard", response_model=list[ScoreEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    today = _today()
    rows = (
        db.query(DailyScore)
        .filter(DailyScore.date == today)
        .order_by(
            DailyScore.score.desc(),
            DailyScore.accuracy.desc(),
            func.coalesce(DailyScore.elapsed_seconds, 999999).asc(),
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
