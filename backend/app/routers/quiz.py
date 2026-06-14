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


@router.get("/random/onblock", response_model=QuizQuestion)
def random_onblock_question(db: Session = Depends(get_db)):
    question = quiz_service.generate_random_onblock_question(db)
    if not question:
        raise HTTPException(status_code=404, detail="Pas assez de données pour générer un quiz on block")
    return question


@router.get("/random/onhit", response_model=QuizQuestion)
def random_onhit_question(db: Session = Depends(get_db)):
    question = quiz_service.generate_random_onhit_question(db)
    if not question:
        raise HTTPException(status_code=404, detail="Pas assez de données pour générer un quiz on hit")
    return question


@router.get("/random/recovery", response_model=QuizQuestion)
def random_recovery_question(db: Session = Depends(get_db)):
    question = quiz_service.generate_random_recovery_question(db)
    if not question:
        raise HTTPException(status_code=404, detail="Pas assez de données pour générer un quiz recovery")
    return question


@router.get("/random/active", response_model=QuizQuestion)
def random_active_question(db: Session = Depends(get_db)):
    question = quiz_service.generate_random_active_question(db)
    if not question:
        raise HTTPException(status_code=404, detail="Pas assez de données pour générer un quiz active")
    return question


@router.get("/weekly", response_model=list[QuizQuestion])
def weekly_questions(db: Session = Depends(get_db)):
    from datetime import timedelta
    today = datetime.now(timezone.utc).date()
    monday = today - timedelta(days=today.weekday())
    questions = quiz_service.generate_weekly_questions(db, str(monday))
    if not questions:
        raise HTTPException(status_code=404, detail="Impossible de générer le weekly challenge")
    return questions


@router.get("/daily", response_model=list[QuizQuestion])
def daily_questions(db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    questions = quiz_service.generate_daily_questions(db, str(today))
    if not questions:
        raise HTTPException(status_code=404, detail="Impossible de générer le daily challenge")
    return questions


@router.get("/seeded", response_model=list[QuizQuestion])
def seeded_questions(seed: str, n: int = 10, db: Session = Depends(get_db)):
    questions = quiz_service.generate_seeded_questions(db, seed, min(n, 20))
    if not questions:
        raise HTTPException(status_code=404, detail="Impossible de générer les questions")
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


@router.get("/{slug}/active", response_model=QuizQuestion)
def active_question(slug: str, db: Session = Depends(get_db)):
    question = quiz_service.generate_active_question(db, slug)
    if not question:
        raise HTTPException(status_code=404, detail=f"Pas assez de données active pour '{slug}'")
    return question


@router.get("/{slug}/recovery", response_model=QuizQuestion)
def recovery_question_by_fighter(slug: str, db: Session = Depends(get_db)):
    question = quiz_service.generate_recovery_question(db, slug)
    if not question:
        raise HTTPException(status_code=404, detail=f"Pas assez de données recovery pour '{slug}'")
    return question


@router.get("/{slug}/onblock", response_model=QuizQuestion)
def onblock_question_by_fighter(slug: str, db: Session = Depends(get_db)):
    question = quiz_service.generate_onblock_question(db, slug)
    if not question:
        raise HTTPException(status_code=404, detail=f"Pas assez de données on block pour '{slug}'")
    return question


@router.get("/{slug}/onhit", response_model=QuizQuestion)
def onhit_question_by_fighter(slug: str, db: Session = Depends(get_db)):
    question = quiz_service.generate_onhit_question(db, slug)
    if not question:
        raise HTTPException(status_code=404, detail=f"Pas assez de données on hit pour '{slug}'")
    return question


@router.get("/{slug}/damage", response_model=QuizQuestion)
def damage_question_by_fighter(slug: str, db: Session = Depends(get_db)):
    question = quiz_service.generate_damage_question(db, slug)
    if not question:
        raise HTTPException(status_code=404, detail=f"Pas assez de données damage pour '{slug}'")
    return question


@router.get("/{slug}/punish", response_model=QuizQuestion)
def punish_question(slug: str, db: Session = Depends(get_db)):
    question = quiz_service.generate_punish_question(db, slug)
    if not question:
        raise HTTPException(status_code=404, detail=f"Pas assez de données punish pour '{slug}'")
    return question
