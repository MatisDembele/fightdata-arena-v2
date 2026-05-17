from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.move import QuizQuestion
from app.services import quiz_service

router = APIRouter(prefix="/quiz", tags=["quiz"])


def _parse_exclude(exclude: str) -> list[int]:
    if not exclude:
        return []
    return [int(x) for x in exclude.split(",") if x.strip().isdigit()]


@router.get("/random", response_model=QuizQuestion)
def random_question(
    exclude: str = "",
    force_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    question = quiz_service.generate_random_question(db, _parse_exclude(exclude), force_type)
    if not question:
        raise HTTPException(status_code=404, detail="Pas assez de données pour générer un quiz")
    return question


@router.get("/random/punish", response_model=QuizQuestion)
def random_punish_question(
    exclude: str = "",
    db: Session = Depends(get_db),
):
    question = quiz_service.generate_random_punish_question(db, _parse_exclude(exclude))
    if not question:
        raise HTTPException(status_code=404, detail="Pas assez de données pour générer un quiz punish")
    return question


@router.get("/{slug}/startup", response_model=QuizQuestion)
def startup_question(
    slug: str,
    exclude: str = "",
    force_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    question = quiz_service.generate_mcq_question(db, slug, _parse_exclude(exclude), force_type)
    if not question:
        raise HTTPException(status_code=404, detail=f"Pas assez de données pour '{slug}'")
    return question


@router.get("/{slug}/punish", response_model=QuizQuestion)
def punish_question(
    slug: str,
    exclude: str = "",
    db: Session = Depends(get_db),
):
    question = quiz_service.generate_punish_question(db, slug, _parse_exclude(exclude))
    if not question:
        raise HTTPException(status_code=404, detail=f"Pas assez de données punish pour '{slug}'")
    return question
