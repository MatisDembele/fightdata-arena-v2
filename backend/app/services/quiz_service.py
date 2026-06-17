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


def _move_candidates(db: Session, fighter_id: int, require_gif: bool = True) -> list[Move]:
    """Moves for a fighter. When require_gif is False, moves without a hitbox
    GIF (special moves, super arts, throws…) are included too — the frontend
    falls back to the move's input notation for those."""
    q = db.query(Move).filter(Move.fighter_id == fighter_id)
    if require_gif:
        q = q.filter(Move.gif_path.isnot(None))
    return q.all()


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


def _parse_damage(value: str | None) -> int | None:
    """Accept only simple integer damage values (e.g. '600'), reject ranges."""
    if not value:
        return None
    if re.match(r"^\d+$", value.strip()):
        return int(value.strip())
    return None


def _pick_damage_distractors(correct: int, pool: set[int], rng: random.Random) -> list[int]:
    close = sorted(
        [v for v in pool if v != correct and abs(v - correct) <= 300],
        key=lambda v: abs(v - correct),
    )
    rng.shuffle(close)
    chosen: list[int] = close[:3]
    if len(chosen) < 3:
        used = pool | set(chosen) | {correct}
        for offset in [100, -100, 200, -200, 300, -300, 150, -150, 50, -50]:
            if len(chosen) == 3:
                break
            c = correct + offset
            if c > 0 and c not in used:
                chosen.append(c)
                used.add(c)
    if len(chosen) < 3:
        for v in sorted(pool, key=lambda v: abs(v - correct)):
            if len(chosen) == 3:
                break
            if v not in chosen and v != correct:
                chosen.append(v)
    return chosen[:3]


def generate_damage_question(db: Session, slug: str, require_gif: bool = True) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None
    candidates = _move_candidates(db, fighter.id, require_gif)
    candidates = [m for m in candidates if _parse_damage(m.damage) is not None]
    if len(candidates) < 4:
        return None
    rng = random.Random()
    correct_move = rng.choice(candidates)
    correct_int = _parse_damage(correct_move.damage)
    pool_ints = {_parse_damage(m.damage) for m in candidates if _parse_damage(m.damage) != correct_int}
    pool_ints.discard(None)
    distractors = _pick_damage_distractors(correct_int, pool_ints, rng)
    choices = [str(v) for v in sorted(distractors + [correct_int])]
    return QuizQuestion(
        move_name=correct_move.move_name,
        section=correct_move.section,
        gif_url=correct_move.gif_url,
        gif_path=correct_move.gif_path,
        input=correct_move.input,
        question=f"Quel est le damage de {correct_move.move_name} ?",
        choices=choices,
        answer=str(correct_int),
        fighter_slug=slug,
    )


def generate_random_damage_question(db: Session, require_gif: bool = True) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        q = generate_damage_question(db, fighter.slug, require_gif)
        if q:
            return q
    return None


def _parse_on_block(value: str | None) -> int | None:
    if not value:
        return None
    match = re.match(r"^([+-]?\d+)", value.strip())
    if not match:
        return None
    return int(match.group(1))


def generate_startup_question(db: Session, slug: str, require_gif: bool = True) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None

    candidates = _move_candidates(db, fighter.id, require_gif)
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
        input=correct_move.input,
        question=f"Quel est le startup de {correct_move.move_name} ?",
        choices=choices,
        answer=correct_answer,
        fighter_slug=slug,
    )


def generate_random_question(db: Session, require_gif: bool = True) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        question = generate_startup_question(db, fighter.slug, require_gif)
        if question:
            return question
    return None


def generate_punish_question(db: Session, slug: str, require_gif: bool = True) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None

    candidates = _move_candidates(db, fighter.id, require_gif)
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
        input=correct_move.input,
        question=f"{correct_move.move_name} est-il punissable on block ?",
        choices=[],
        answer=answer,
        fighter_slug=slug,
        on_block_value=correct_move.on_block,
    )


def generate_random_punish_question(db: Session, require_gif: bool = True) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        question = generate_punish_question(db, fighter.slug, require_gif)
        if question:
            return question
    return None


def _generate_startup_question_rng(
    db: Session, slug: str, rng: random.Random, require_gif: bool = True
) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None

    candidates = _move_candidates(db, fighter.id, require_gif)
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
        input=correct_move.input,
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


def _pick_onblock_distractors(correct: int, pool: set[int], rng: random.Random) -> list[int]:
    close = sorted(
        [v for v in pool if v != correct and abs(v - correct) <= 4],
        key=lambda v: abs(v - correct),
    )
    rng.shuffle(close)
    chosen = close[:3]
    if len(chosen) < 3:
        used = pool | set(chosen) | {correct}
        for offset in [2, -2, 4, -4, 6, -6, 1, -1, 3, -3, 8, -8]:
            if len(chosen) == 3:
                break
            c = correct + offset
            if c not in used:
                chosen.append(c)
                used.add(c)
    if len(chosen) < 3:
        for v in sorted(pool, key=lambda v: abs(v - correct)):
            if len(chosen) == 3:
                break
            if v not in chosen and v != correct:
                chosen.append(v)
    return chosen[:3]


def _fmt_ob(v: int) -> str:
    return f"+{v}" if v > 0 else str(v)


def generate_onblock_question(db: Session, slug: str, require_gif: bool = True) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None
    candidates = _move_candidates(db, fighter.id, require_gif)
    candidates = [m for m in candidates if _parse_on_block(m.on_block) is not None]
    if len(candidates) < 4:
        return None
    rng = random.Random()
    correct_move = rng.choice(candidates)
    correct_int = _parse_on_block(correct_move.on_block)
    pool_ints = {_parse_on_block(m.on_block) for m in candidates if _parse_on_block(m.on_block) != correct_int}
    pool_ints.discard(None)
    distractors = _pick_onblock_distractors(correct_int, pool_ints, rng)
    choices = [_fmt_ob(v) for v in sorted(distractors + [correct_int])]
    return QuizQuestion(
        move_name=correct_move.move_name,
        section=correct_move.section,
        gif_url=correct_move.gif_url,
        gif_path=correct_move.gif_path,
        input=correct_move.input,
        question=f"Quelle est la valeur on block de {correct_move.move_name} ?",
        choices=choices,
        answer=_fmt_ob(correct_int),
        fighter_slug=slug,
        on_block_value=correct_move.on_block,
    )


def generate_random_onblock_question(db: Session, require_gif: bool = True) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        q = generate_onblock_question(db, fighter.slug, require_gif)
        if q:
            return q
    return None


def generate_onhit_question(db: Session, slug: str, require_gif: bool = True) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None
    candidates = _move_candidates(db, fighter.id, require_gif)
    candidates = [m for m in candidates if _parse_on_block(m.on_hit) is not None]
    if len(candidates) < 4:
        return None
    rng = random.Random()
    correct_move = rng.choice(candidates)
    correct_int = _parse_on_block(correct_move.on_hit)
    pool_ints = {_parse_on_block(m.on_hit) for m in candidates if _parse_on_block(m.on_hit) != correct_int}
    pool_ints.discard(None)
    distractors = _pick_onblock_distractors(correct_int, pool_ints, rng)
    choices = [_fmt_ob(v) for v in sorted(distractors + [correct_int])]
    return QuizQuestion(
        move_name=correct_move.move_name,
        section=correct_move.section,
        gif_url=correct_move.gif_url,
        gif_path=correct_move.gif_path,
        input=correct_move.input,
        question=f"Quelle est la valeur on hit de {correct_move.move_name} ?",
        choices=choices,
        answer=_fmt_ob(correct_int),
        fighter_slug=slug,
    )


def generate_random_onhit_question(db: Session, require_gif: bool = True) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        q = generate_onhit_question(db, fighter.slug, require_gif)
        if q:
            return q
    return None


def generate_recovery_question(db: Session, slug: str, require_gif: bool = True) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None
    candidates = _move_candidates(db, fighter.id, require_gif)
    candidates = [m for m in candidates if _is_numeric(m.recovery)]
    if len(candidates) < 4:
        return None
    rng = random.Random()
    correct_move = rng.choice(candidates)
    correct_answer = correct_move.recovery
    correct_int = int(correct_answer)
    pool_ints = {int(m.recovery) for m in candidates if _is_numeric(m.recovery) and m.recovery != correct_answer}
    distractors = _pick_distractors(correct_int, pool_ints, rng)
    choices = [str(v) for v in sorted(distractors + [correct_int])]
    return QuizQuestion(
        move_name=correct_move.move_name,
        section=correct_move.section,
        gif_url=correct_move.gif_url,
        gif_path=correct_move.gif_path,
        input=correct_move.input,
        question=f"Quelle est la recovery de {correct_move.move_name} ?",
        choices=choices,
        answer=correct_answer,
        fighter_slug=slug,
    )


def generate_random_recovery_question(db: Session, require_gif: bool = True) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        q = generate_recovery_question(db, fighter.slug, require_gif)
        if q:
            return q
    return None


def generate_active_question(db: Session, slug: str, require_gif: bool = True) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None
    candidates = _move_candidates(db, fighter.id, require_gif)
    candidates = [m for m in candidates if _is_numeric(m.active)]
    if len(candidates) < 4:
        return None
    rng = random.Random()
    correct_move = rng.choice(candidates)
    correct_answer = correct_move.active
    correct_int = int(correct_answer)
    pool_ints = {int(m.active) for m in candidates if _is_numeric(m.active) and m.active != correct_answer}
    distractors = _pick_distractors(correct_int, pool_ints, rng)
    choices = [str(v) for v in sorted(distractors + [correct_int])]
    return QuizQuestion(
        move_name=correct_move.move_name,
        section=correct_move.section,
        gif_url=correct_move.gif_url,
        gif_path=correct_move.gif_path,
        input=correct_move.input,
        question=f"Combien de frames active pour {correct_move.move_name} ?",
        choices=choices,
        answer=correct_answer,
        fighter_slug=slug,
    )


def generate_random_active_question(db: Session, require_gif: bool = True) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        q = generate_active_question(db, fighter.slug, require_gif)
        if q:
            return q
    return None


def generate_seeded_questions(db: Session, seed: str, n: int = 10) -> list[QuizQuestion]:
    rng = random.Random(seed)
    fighters = db.query(Fighter).all()
    fighters_copy = list(fighters)
    rng.shuffle(fighters_copy)
    questions: list[QuizQuestion] = []
    for fighter in fighters_copy:
        if len(questions) >= n:
            break
        q = _generate_startup_question_rng(db, fighter.slug, rng)
        if q:
            questions.append(q)
    return questions


def generate_weekly_questions(db: Session, week_str: str) -> list[QuizQuestion]:
    rng = random.Random(week_str)
    fighters = db.query(Fighter).all()
    fighters_copy = list(fighters)
    rng.shuffle(fighters_copy)
    questions: list[QuizQuestion] = []
    for fighter in fighters_copy:
        if len(questions) >= 20:
            break
        q = _generate_startup_question_rng(db, fighter.slug, rng)
        if q:
            questions.append(q)
    return questions
