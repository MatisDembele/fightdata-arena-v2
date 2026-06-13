from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.global_score import GlobalScore
from app.utils import validate_name, check_rate

router = APIRouter(prefix="/global", tags=["global"])


class ScoreDelta(BaseModel):
    player_name: str
    correct: int
    total: int


class LeaderboardEntry(BaseModel):
    rank: int
    player_name: str
    total_correct: int
    total_questions: int
    model_config = {"from_attributes": True}


@router.post("/score")
def add_score(payload: ScoreDelta, request: Request, db: Session = Depends(get_db)):
    check_rate(request, limit=10, window=60.0)
    name = validate_name(payload.player_name)
    if payload.total <= 0 or not (0 <= payload.correct <= payload.total):
        return {"ok": False}

    row = db.query(GlobalScore).filter_by(player_name=name).first()
    if row:
        row.total_correct   += payload.correct
        row.total_questions += payload.total
    else:
        row = GlobalScore(player_name=name, total_correct=payload.correct, total_questions=payload.total)
        db.add(row)
    db.commit()
    return {"ok": True}


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    rows = (
        db.query(GlobalScore)
        .order_by(GlobalScore.total_correct.desc())
        .limit(10)
        .all()
    )
    return [
        LeaderboardEntry(rank=i + 1, player_name=r.player_name, total_correct=r.total_correct, total_questions=r.total_questions)
        for i, r in enumerate(rows)
    ]
