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


@router.get("/{slug}/startup", response_model=QuizQuestion)
def startup_question(slug: str, db: Session = Depends(get_db)):
    question = quiz_service.generate_startup_question(db, slug)
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"Pas assez de données pour '{slug}'"
        )
    return question
