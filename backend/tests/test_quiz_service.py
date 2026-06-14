"""Unit tests for quiz_service helpers — no DB required."""
import random
import pytest
from app.services.quiz_service import _is_numeric, _pick_distractors, _parse_damage, _pick_damage_distractors


# ── _is_numeric ──────────────────────────────────────────────────────────────

def test_is_numeric_plain_int():
    assert _is_numeric("8") is True

def test_is_numeric_two_digits():
    assert _is_numeric("14") is True

def test_is_numeric_rejects_range():
    assert _is_numeric("4~6") is False

def test_is_numeric_rejects_plus():
    assert _is_numeric("+4") is False

def test_is_numeric_rejects_minus():
    assert _is_numeric("-6") is False

def test_is_numeric_rejects_empty():
    assert _is_numeric("") is False

def test_is_numeric_rejects_none():
    assert _is_numeric(None) is False

def test_is_numeric_rejects_dash():
    assert _is_numeric("—") is False


# ── _parse_damage ─────────────────────────────────────────────────────────────

def test_parse_damage_valid():
    assert _parse_damage("600") == 600

def test_parse_damage_rejects_range():
    assert _parse_damage("300~400") is None

def test_parse_damage_rejects_none():
    assert _parse_damage(None) is None

def test_parse_damage_rejects_empty():
    assert _parse_damage("") is None


# ── _pick_distractors ─────────────────────────────────────────────────────────

def test_pick_distractors_returns_3():
    pool = set(range(4, 25))
    rng = random.Random(42)
    result = _pick_distractors(8, pool, rng)
    assert len(result) == 3

def test_pick_distractors_no_correct_in_result():
    pool = set(range(4, 25))
    rng = random.Random(42)
    result = _pick_distractors(8, pool, rng)
    assert 8 not in result

def test_pick_distractors_prefers_close_values():
    pool = set(range(4, 30))
    rng = random.Random(0)
    result = _pick_distractors(10, pool, rng)
    for v in result:
        assert abs(v - 10) <= 6, f"{v} too far from 10"

def test_pick_distractors_small_pool():
    # Pool smaller than 3 — should still return something without crash
    pool = {5, 7}
    rng = random.Random(0)
    result = _pick_distractors(6, pool, rng)
    assert 6 not in result
    assert len(result) <= 3


# ── _pick_damage_distractors ──────────────────────────────────────────────────

def test_pick_damage_distractors_returns_3():
    pool = {300, 400, 500, 600, 700, 800, 900}
    rng = random.Random(0)
    result = _pick_damage_distractors(600, pool, rng)
    assert len(result) == 3

def test_pick_damage_distractors_no_correct():
    pool = {300, 400, 500, 700, 800}
    rng = random.Random(0)
    result = _pick_damage_distractors(600, pool, rng)
    assert 600 not in result

def test_pick_damage_distractors_fallback_offsets():
    # Very small pool — relies on offset fallback
    pool = {500}
    rng = random.Random(0)
    result = _pick_damage_distractors(600, pool, rng)
    assert 600 not in result
    assert all(v > 0 for v in result)
