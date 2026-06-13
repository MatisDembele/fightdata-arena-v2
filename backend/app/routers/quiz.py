from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.move import QuizQuestion
from app.services import quiz_service

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/random", response_model=QuizQuestion)
def random_question(db: Session = Depends(get_db)):
    question = quiz_service.generate_random_question(db)
    if not question:
        raise HTTPException(status_code=404, detail="Pas assez de données pour générer un quiz")
    return question


@router.get("/random/punish", response_model=QuizQuestion)
def random_punish_question(db: Session = Depends(get_db)):
    question = quiz_service.generate_random_punish_question(db)
    if not question:
        raise HTTPException(status_code=404, detail="Pas assez de données pour générer un quiz punish")
    return question


@router.get("/random/damage", response_model=QuizQuestion)
def random_damage_question(db: Session = Depends(get_db)):
    question = quiz_service.generate_random_damage_question(db)
    if not question:
        raise HTTPException(status_code=404, detail="Pas assez de données pour générer un quiz damage")
    return question


@router.get("/daily", response_model=list[QuizQuestion])
def daily_questions(db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    questions = quiz_service.generate_daily_questions(db, str(today))
    if not questions:
        raise HTTPException(status_code=404, detail="Impossible de générer le daily challenge")
    return questions


@router.get("/{slug}/startup", response_model=QuizQuestion)
def startup_question(slug: str, db: Session = Depends(get_db)):
    question = quiz_service.generate_startup_question(db, slug)
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"Pas assez de données pour '{slug}'"
        )
    return question


@router.get("/{slug}/punish", response_model=QuizQuestion)
def punish_question(slug: str, db: Session = Depends(get_db)):
    question = quiz_service.generate_punish_question(db, slug)
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"Pas assez de données punish pour '{slug}'"
        )
    return question
