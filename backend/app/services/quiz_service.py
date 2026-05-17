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


def _is_valid_value(value: str | None) -> bool:
    """True if value can be used as a quiz answer (not null/empty/variable)."""
    if not value or not value.strip():
        return False
    v = value.strip()
    return "~" not in v and "/" not in v


def _parse_on_block(value: str | None) -> int | None:
    if not value:
        return None
    match = re.match(r"^([+-]?\d+)", value.strip())
    if not match:
        return None
    return int(match.group(1))


def _make_choices(correct: str, pool: list[str], n: int = 3) -> list[str] | None:
    others = list({v for v in pool if v != correct})
    if len(others) < n:
        return None
    wrong = random.sample(others, n)
    choices = wrong + [correct]
    random.shuffle(choices)
    return choices


# ── MCQ question (startup / on_block / on_hit) ──────────────────────────────

def generate_mcq_question(
    db: Session,
    slug: str,
    exclude_ids: list[int] = [],
    force_type: str | None = None,
) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None

    all_moves = (
        db.query(Move)
        .filter(Move.fighter_id == fighter.id, Move.gif_path.isnot(None))
        .all()
    )
    if not all_moves:
        return None

    exclude_set = set(exclude_ids)
    candidates = [m for m in all_moves if m.id not in exclude_set]
    if not candidates:
        candidates = all_moves  # graceful fallback when all moves used in session

    # Value pools from ALL fighter moves for diverse wrong answers
    startup_pool  = [m.startup  for m in all_moves if _is_numeric(m.startup)]
    on_block_pool = [m.on_block for m in all_moves if _is_valid_value(m.on_block)]
    on_hit_pool   = [m.on_hit   for m in all_moves if _is_valid_value(m.on_hit)]

    types_to_try = [force_type] if force_type else ["startup", "on_block", "on_hit"]
    if not force_type:
        random.shuffle(types_to_try)

    random.shuffle(candidates)

    for move in candidates:
        for qtype in types_to_try:
            if qtype == "startup":
                if not _is_numeric(move.startup):
                    continue
                answer = move.startup
                pool   = startup_pool
                q_text = f"Quel est le startup de {move.move_name} ?"
            elif qtype == "on_block":
                if not _is_valid_value(move.on_block):
                    continue
                answer = move.on_block
                pool   = on_block_pool
                q_text = f"Quel est le on block de {move.move_name} ?"
            else:  # on_hit
                if not _is_valid_value(move.on_hit):
                    continue
                answer = move.on_hit
                pool   = on_hit_pool
                q_text = f"Quel est le on hit de {move.move_name} ?"

            choices = _make_choices(answer, pool)
            if not choices:
                continue

            return QuizQuestion(
                move_id=move.id,
                move_name=move.move_name,
                section=move.section,
                gif_url=move.gif_url,
                gif_path=move.gif_path,
                question=q_text,
                choices=choices,
                answer=answer,
                fighter_slug=slug,
                question_type=qtype,
            )

    return None


def generate_startup_question(
    db: Session,
    slug: str,
    exclude_ids: list[int] = [],
) -> QuizQuestion | None:
    """Backward-compat wrapper — always forces startup type."""
    return generate_mcq_question(db, slug, exclude_ids, force_type="startup")


def generate_random_question(
    db: Session,
    exclude_ids: list[int] = [],
    force_type: str | None = None,
) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        q = generate_mcq_question(db, fighter.slug, exclude_ids, force_type)
        if q:
            return q
    return None


# ── Punish question ──────────────────────────────────────────────────────────

def generate_punish_question(
    db: Session,
    slug: str,
    exclude_ids: list[int] = [],
) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None

    all_moves = (
        db.query(Move)
        .filter(Move.fighter_id == fighter.id, Move.gif_path.isnot(None))
        .all()
    )
    valid = [m for m in all_moves if _parse_on_block(m.on_block) is not None]
    if not valid:
        return None

    exclude_set = set(exclude_ids)
    candidates = [m for m in valid if m.id not in exclude_set]
    if not candidates:
        candidates = valid

    move = random.choice(candidates)
    on_block_num = _parse_on_block(move.on_block)
    # Punishable if -4 or worse (fastest normal in SF6 is 4 frames)
    answer = "punissable" if on_block_num <= -4 else "safe"

    return QuizQuestion(
        move_id=move.id,
        move_name=move.move_name,
        section=move.section,
        gif_url=move.gif_url,
        gif_path=move.gif_path,
        question=f"{move.move_name} est-il punissable on block ?",
        choices=[],
        answer=answer,
        fighter_slug=slug,
        question_type="punish",
        on_block_value=move.on_block,
    )


def generate_random_punish_question(
    db: Session,
    exclude_ids: list[int] = [],
) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        q = generate_punish_question(db, fighter.slug, exclude_ids)
        if q:
            return q
    return None
