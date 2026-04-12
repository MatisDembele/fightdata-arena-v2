import random
import re
from sqlalchemy.orm import Session
from app.models.move import Move
from app.models.fighter import Fighter
from app.schemas.move import QuizQuestion


def _is_numeric(value: str | None) -> bool:
    if not value:
        return False
    return bool(re.match(r"^\d+$", value.strip()))


def _parse_on_block(value: str | None) -> int | None:
    if not value:
        return None
    match = re.match(r"^([+-]?\d+)", value.strip())
    if not match:
        return None
    return int(match.group(1))


def generate_startup_question(db: Session, slug: str) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None

    candidates = (
        db.query(Move)
        .filter(Move.fighter_id == fighter.id, Move.gif_path.isnot(None))
        .all()
    )
    candidates = [m for m in candidates if _is_numeric(m.startup)]

    if len(candidates) < 4:
        return None

    correct_move = random.choice(candidates)
    correct_answer = correct_move.startup

    other_startups = list({
        m.startup for m in candidates
        if m.startup != correct_answer and _is_numeric(m.startup)
    })

    if len(other_startups) < 3:
        return None

    wrong_answers = random.sample(other_startups, 3)
    choices = wrong_answers + [correct_answer]
    random.shuffle(choices)

    return QuizQuestion(
        move_name=correct_move.move_name,
        section=correct_move.section,
        gif_url=correct_move.gif_url,
        gif_path=correct_move.gif_path,
        question=f"Quel est le startup de {correct_move.move_name} ?",
        choices=choices,
        answer=correct_answer,
        fighter_slug=slug,
    )


def generate_random_question(db: Session) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        question = generate_startup_question(db, fighter.slug)
        if question:
            return question
    return None


def generate_punish_question(db: Session, slug: str) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None

    candidates = (
        db.query(Move)
        .filter(Move.fighter_id == fighter.id, Move.gif_path.isnot(None))
        .all()
    )
    candidates = [m for m in candidates if _parse_on_block(m.on_block) is not None]

    if not candidates:
        return None

    correct_move = random.choice(candidates)
    on_block_num = _parse_on_block(correct_move.on_block)
    # Punishable if -4 or worse (fastest normal in SF6 is 4 frames)
    answer = "punissable" if on_block_num <= -4 else "safe"

    return QuizQuestion(
        move_name=correct_move.move_name,
        section=correct_move.section,
        gif_url=correct_move.gif_url,
        gif_path=correct_move.gif_path,
        question=f"{correct_move.move_name} est-il punissable on block ?",
        choices=[],
        answer=answer,
        fighter_slug=slug,
        on_block_value=correct_move.on_block,
    )


def generate_random_punish_question(db: Session) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        question = generate_punish_question(db, fighter.slug)
        if question:
            return question
    return None
