from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.daily_score import DailyScore
from app.utils import validate_name, check_rate

router = APIRouter(prefix="/daily", tags=["daily"])


class ScoreSubmit(BaseModel):
    player_name: str
    score: int       # 0-10
    accuracy: int    # 0-100


class ScoreEntry(BaseModel):
    rank: int
    player_name: str
    score: int
    accuracy: int

    model_config = {"from_attributes": True}


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


@router.post("/score")
def submit_score(payload: ScoreSubmit, request: Request, db: Session = Depends(get_db)):
    check_rate(request)
    name = validate_name(payload.player_name)
    if not (0 <= payload.score <= 10 and 0 <= payload.accuracy <= 100):
        raise HTTPException(400, "Invalid score")

    today = _today()
    existing = db.query(DailyScore).filter_by(player_name=name, date=today).first()
    if existing:
        if payload.score > existing.score or (
            payload.score == existing.score and payload.accuracy > existing.accuracy
        ):
            existing.score    = payload.score
            existing.accuracy = payload.accuracy
            db.commit()
    else:
        db.add(DailyScore(
            player_name=name,
            score=payload.score,
            accuracy=payload.accuracy,
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
            DailyScore.created_at.asc(),
        )
        .limit(10)
        .all()
    )
    return [
        ScoreEntry(rank=i + 1, player_name=r.player_name, score=r.score, accuracy=r.accuracy)
        for i, r in enumerate(rows)
    ]
