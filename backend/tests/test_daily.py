import pytest
from unittest.mock import MagicMock
from app.services.quiz_service import generate_daily_questions


def _make_fighter(id, slug):
    f = MagicMock()
    f.id = id
    f.slug = slug
    return f


def _make_move(fighter_id, move_name, startup, gif_path="fake.gif"):
    m = MagicMock()
    m.fighter_id = fighter_id
    m.move_name = move_name
    m.startup = startup
    m.gif_path = gif_path
    m.gif_url = f"http://example.com/{move_name}.gif"
    m.section = "normals"
    m.on_block = None
    return m


def _build_db(n_fighters=15, moves_per_fighter=10):
    db = MagicMock()
    fighters = [_make_fighter(i, f"fighter_{i}") for i in range(n_fighters)]

    def query_side_effect(model):
        q = MagicMock()
        from app.models.fighter import Fighter
        from app.models.move import Move
        if model is Fighter:
            q.all.return_value = fighters
            q.filter.return_value = q
            q.first.side_effect = lambda: fighters[0]
        if model is Move:
            def make_filter(*args, **kwargs):
                inner = MagicMock()
                fid = None
                for arg in args:
                    try:
                        fid = int(str(arg).split("fighter_id = ")[1].split(")")[0])
                    except Exception:
                        pass
                moves = [
                    _make_move(fid if fid is not None else 0, f"move_{j}", str(4 + j))
                    for j in range(moves_per_fighter)
                ]
                inner.all.return_value = moves
                inner.filter.return_value = inner
                return inner
            q.filter.side_effect = make_filter
        return q

    db.query.side_effect = query_side_effect
    return db, fighters


def test_generate_daily_questions_returns_10():
    db, _ = _build_db()
    questions = generate_daily_questions(db, "2026-05-19")
    assert len(questions) == 10


def test_generate_daily_questions_deterministic():
    db1, _ = _build_db()
    db2, _ = _build_db()
    q1 = generate_daily_questions(db1, "2026-05-19")
    q2 = generate_daily_questions(db2, "2026-05-19")
    assert [q.move_name for q in q1] == [q.move_name for q in q2]


def test_generate_daily_questions_different_per_day():
    db1, _ = _build_db()
    db2, _ = _build_db()
    q1 = generate_daily_questions(db1, "2026-05-19")
    q2 = generate_daily_questions(db2, "2026-05-20")
    fighter_order_1 = [q.fighter_slug for q in q1]
    fighter_order_2 = [q.fighter_slug for q in q2]
    assert fighter_order_1 != fighter_order_2


def test_generate_daily_questions_each_has_4_choices():
    db, _ = _build_db()
    questions = generate_daily_questions(db, "2026-05-19")
    for q in questions:
        assert len(q.choices) == 4
        assert q.answer in q.choices
