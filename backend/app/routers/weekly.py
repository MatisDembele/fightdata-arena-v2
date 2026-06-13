from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.weekly_score import WeeklyScore

router = APIRouter(prefix="/weekly", tags=["weekly"])


class ScoreSubmit(BaseModel):
    player_name: str
    score: int
    accuracy: int


class ScoreEntry(BaseModel):
    rank: int
    player_name: str
    score: int
    accuracy: int
    model_config = {"from_attributes": True}


def _this_week() -> str:
    today = datetime.now(timezone.utc).date()
    monday = today - timedelta(days=today.weekday())
    return monday.isoformat()


@router.post("/score")
def submit_score(payload: ScoreSubmit, db: Session = Depends(get_db)):
    name = payload.player_name.strip()[:24]
    if not name:
        raise HTTPException(400, "Name required")
    if not (0 <= payload.score <= 20 and 0 <= payload.accuracy <= 100):
        raise HTTPException(400, "Invalid score")
    week = _this_week()
    existing = db.query(WeeklyScore).filter_by(player_name=name, week=week).first()
    if existing:
        if payload.score > existing.score or (payload.score == existing.score and payload.accuracy > existing.accuracy):
            existing.score = payload.score
            existing.accuracy = payload.accuracy
            db.commit()
    else:
        db.add(WeeklyScore(player_name=name, score=payload.score, accuracy=payload.accuracy, week=week))
        db.commit()
    return {"ok": True}


@router.get("/leaderboard", response_model=list[ScoreEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    week = _this_week()
    rows = (
        db.query(WeeklyScore)
        .filter(WeeklyScore.week == week)
        .order_by(WeeklyScore.score.desc(), WeeklyScore.accuracy.desc(), WeeklyScore.created_at.asc())
        .limit(10)
        .all()
    )
    return [ScoreEntry(rank=i + 1, player_name=r.player_name, score=r.score, accuracy=r.accuracy) for i, r in enumerate(rows)]
