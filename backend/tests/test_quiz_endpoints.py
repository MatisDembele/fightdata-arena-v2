"""HTTP tests for all /api/quiz/* endpoints via TestClient."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.move import QuizQuestion
from app.services import quiz_service


client = TestClient(app)

_BASE_QUESTION = QuizQuestion(
    move_name="Standing Light Punch",
    section="normals",
    gif_url="http://example.com/slp.gif",
    gif_path="gifs/ryu/ryu-st-lp.gif",
    question="Quel est le startup ?",
    choices=["4", "5", "6", "7"],
    answer="4",
    fighter_slug="ryu",
)


def _patch(monkeypatch, fn_name, return_value):
    monkeypatch.setattr(quiz_service, fn_name, lambda *a, **kw: return_value)


# ── /api/quiz/random ──────────────────────────────────────────────────────────

def test_random_returns_200(monkeypatch):
    _patch(monkeypatch, "generate_random_question", _BASE_QUESTION)
    r = client.get("/api/quiz/random")
    assert r.status_code == 200
    d = r.json()
    assert d["answer"] == "4"
    assert len(d["choices"]) == 4

def test_random_returns_404_when_none(monkeypatch):
    _patch(monkeypatch, "generate_random_question", None)
    r = client.get("/api/quiz/random")
    assert r.status_code == 404


# ── /api/quiz/random/punish ───────────────────────────────────────────────────

def test_punish_returns_200(monkeypatch):
    _patch(monkeypatch, "generate_random_punish_question", _BASE_QUESTION)
    r = client.get("/api/quiz/random/punish")
    assert r.status_code == 200

def test_punish_returns_404_when_none(monkeypatch):
    _patch(monkeypatch, "generate_random_punish_question", None)
    r = client.get("/api/quiz/random/punish")
    assert r.status_code == 404


# ── /api/quiz/random/damage ───────────────────────────────────────────────────

def test_damage_returns_200(monkeypatch):
    _patch(monkeypatch, "generate_random_damage_question", _BASE_QUESTION)
    r = client.get("/api/quiz/random/damage")
    assert r.status_code == 200

def test_damage_returns_404_when_none(monkeypatch):
    _patch(monkeypatch, "generate_random_damage_question", None)
    r = client.get("/api/quiz/random/damage")
    assert r.status_code == 404


# ── /api/quiz/random/onblock ──────────────────────────────────────────────────

def test_onblock_returns_200(monkeypatch):
    _patch(monkeypatch, "generate_random_onblock_question", _BASE_QUESTION)
    r = client.get("/api/quiz/random/onblock")
    assert r.status_code == 200

def test_onblock_returns_404_when_none(monkeypatch):
    _patch(monkeypatch, "generate_random_onblock_question", None)
    r = client.get("/api/quiz/random/onblock")
    assert r.status_code == 404


# ── /api/quiz/random/onhit ────────────────────────────────────────────────────

def test_onhit_returns_200(monkeypatch):
    _patch(monkeypatch, "generate_random_onhit_question", _BASE_QUESTION)
    r = client.get("/api/quiz/random/onhit")
    assert r.status_code == 200

def test_onhit_returns_404_when_none(monkeypatch):
    _patch(monkeypatch, "generate_random_onhit_question", None)
    r = client.get("/api/quiz/random/onhit")
    assert r.status_code == 404


# ── /api/quiz/random/recovery ─────────────────────────────────────────────────

def test_recovery_returns_200(monkeypatch):
    _patch(monkeypatch, "generate_random_recovery_question", _BASE_QUESTION)
    r = client.get("/api/quiz/random/recovery")
    assert r.status_code == 200

def test_recovery_returns_404_when_none(monkeypatch):
    _patch(monkeypatch, "generate_random_recovery_question", None)
    r = client.get("/api/quiz/random/recovery")
    assert r.status_code == 404


# ── /api/quiz/{slug}/startup ─────────────────────────────────────────────────

def test_fighter_startup_returns_200(monkeypatch):
    _patch(monkeypatch, "generate_startup_question", _BASE_QUESTION)
    r = client.get("/api/quiz/ryu/startup")
    assert r.status_code == 200

def test_fighter_startup_returns_404_for_unknown(monkeypatch):
    _patch(monkeypatch, "generate_startup_question", None)
    r = client.get("/api/quiz/unknown_fighter/startup")
    assert r.status_code == 404


# ── /api/quiz/{slug}/punish ───────────────────────────────────────────────────

def test_fighter_punish_returns_200(monkeypatch):
    _patch(monkeypatch, "generate_punish_question", _BASE_QUESTION)
    r = client.get("/api/quiz/ryu/punish")
    assert r.status_code == 200


# ── Response shape ────────────────────────────────────────────────────────────

def test_question_has_gif_path(monkeypatch):
    _patch(monkeypatch, "generate_random_question", _BASE_QUESTION)
    r = client.get("/api/quiz/random")
    d = r.json()
    assert "gif_path" in d
    assert d["gif_path"] == "gifs/ryu/ryu-st-lp.gif"

def test_question_answer_in_choices(monkeypatch):
    _patch(monkeypatch, "generate_random_question", _BASE_QUESTION)
    r = client.get("/api/quiz/random")
    d = r.json()
    assert d["answer"] in d["choices"]
