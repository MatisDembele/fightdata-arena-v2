from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.fighter import FighterOut, FighterWithStats
from app.schemas.move import MoveOut
from app.services import fighter_service, move_service

router = APIRouter(prefix="/fighters", tags=["fighters"])


@router.get("/", response_model=list[FighterOut])
def list_fighters(db: Session = Depends(get_db)):
    return fighter_service.get_all_fighters(db)


@router.get("/{slug}", response_model=FighterWithStats)
def get_fighter(slug: str, db: Session = Depends(get_db)):
    fighter = fighter_service.get_fighter_by_slug(db, slug)
    if not fighter:
        raise HTTPException(status_code=404, detail=f"Personnage '{slug}' introuvable")
    stats = fighter_service.get_fighter_stats(db, fighter.id)
    return {**fighter.__dict__, "stats": stats}


@router.get("/{slug}/moves", response_model=list[MoveOut])
def get_fighter_moves(
    slug: str,
    section: str | None = None,
    db: Session = Depends(get_db),
):
    fighter = fighter_service.get_fighter_by_slug(db, slug)
    if not fighter:
        raise HTTPException(status_code=404, detail=f"Personnage '{slug}' introuvable")
    return move_service.get_moves_by_fighter(db, fighter.id, section)
