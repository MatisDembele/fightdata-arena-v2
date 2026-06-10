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


def _pick_distractors(correct: int, pool: set[int], rng: random.Random) -> list[int]:
    """Return 3 distractor startup values close to `correct` (±3 frames first)."""
    close = sorted(
        [v for v in pool if v != correct and abs(v - correct) <= 3],
        key=lambda v: abs(v - correct),
    )
    rng.shuffle(close)
    chosen: list[int] = close[:3]

    if len(chosen) < 3:
        used = pool | set(chosen) | {correct}
        for offset in [1, -1, 2, -2, 3, -3]:
            if len(chosen) == 3:
                break
            c = correct + offset
            if c > 0 and c not in used:
                chosen.append(c)
                used.add(c)

    # Last resort: nearest real values from broader pool
    if len(chosen) < 3:
        for v in sorted(pool, key=lambda v: abs(v - correct)):
            if len(chosen) == 3:
                break
            if v not in chosen and v != correct:
                chosen.append(v)

    return chosen[:3]


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
    correct_int = int(correct_answer)

    pool_ints = {int(m.startup) for m in candidates if _is_numeric(m.startup) and m.startup != correct_answer}
    rng = random.Random()
    distractors = _pick_distractors(correct_int, pool_ints, rng)
    choices = [str(v) for v in sorted(distractors + [correct_int])]

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


def _generate_startup_question_rng(
    db: Session, slug: str, rng: random.Random
) -> QuizQuestion | None:
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

    correct_move = rng.choice(candidates)
    correct_answer = correct_move.startup
    correct_int = int(correct_answer)

    pool_ints = {int(m.startup) for m in candidates if _is_numeric(m.startup) and m.startup != correct_answer}
    distractors = _pick_distractors(correct_int, pool_ints, rng)
    choices = [str(v) for v in sorted(distractors + [correct_int])]

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


def generate_daily_questions(db: Session, date_str: str) -> list[QuizQuestion]:
    rng = random.Random(date_str)
    fighters = db.query(Fighter).all()
    fighters_copy = list(fighters)  # copy so rng.shuffle doesn't mutate the ORM result
    rng.shuffle(fighters_copy)

    questions: list[QuizQuestion] = []
    for fighter in fighters_copy:
        if len(questions) >= 10:
            break
        q = _generate_startup_question_rng(db, fighter.slug, rng)
        if q:
            questions.append(q)

    return questions
