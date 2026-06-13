from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.flash_score import FlashScore
from app.utils import validate_name, check_rate

router = APIRouter(prefix="/flash", tags=["flash"])


class ScorePayload(BaseModel):
    player_name: str
    best_score: int


class LeaderboardEntry(BaseModel):
    rank: int
    player_name: str
    best_score: int
    model_config = {"from_attributes": True}


@router.post("/score")
def submit_score(payload: ScorePayload, request: Request, db: Session = Depends(get_db)):
    check_rate(request)
    name = validate_name(payload.player_name)
    if not (0 <= payload.best_score <= 999):
        return {"ok": False}
    row = db.query(FlashScore).filter_by(player_name=name).first()
    if row:
        if payload.best_score > row.best_score:
            row.best_score = payload.best_score
        else:
            return {"ok": True}
    else:
        row = FlashScore(player_name=name, best_score=payload.best_score)
        db.add(row)
    db.commit()
    return {"ok": True}


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    rows = (
        db.query(FlashScore)
        .order_by(FlashScore.best_score.desc())
        .limit(10)
        .all()
    )
    return [
        LeaderboardEntry(rank=i + 1, player_name=r.player_name, best_score=r.best_score)
        for i, r in enumerate(rows)
    ]
