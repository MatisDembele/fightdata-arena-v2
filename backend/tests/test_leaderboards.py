"""Tests for survival, flash and global leaderboard endpoints."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

# Import all models so Base.metadata knows all tables
from app.database import Base, get_db
import app.models.survival_score  # noqa: F401
import app.models.flash_score     # noqa: F401
import app.models.global_score    # noqa: F401
from app.main import app
import app.utils as utils_module


@pytest.fixture
def client():
    # One in-memory engine per test — use StaticPool so all connections share the same DB
    from sqlalchemy.pool import StaticPool
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)

    def override():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    utils_module._rate_store.clear()
    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


# ── Survival ──────────────────────────────────────────────────────────────────

def test_survival_submit_new_score(client):
    r = client.post("/api/survival/score", json={"player_name": "Matis", "best_score": 42})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_survival_leaderboard_empty(client):
    r = client.get("/api/survival/leaderboard")
    assert r.status_code == 200
    assert r.json() == []


def test_survival_leaderboard_ranks(client):
    client.post("/api/survival/score", json={"player_name": "Alice", "best_score": 80})
    utils_module._rate_store.clear()
    client.post("/api/survival/score", json={"player_name": "Bob",   "best_score": 50})
    r = client.get("/api/survival/leaderboard")
    data = r.json()
    assert data[0]["player_name"] == "Alice"
    assert data[0]["rank"] == 1
    assert data[1]["player_name"] == "Bob"


def test_survival_doesnt_decrease_score(client):
    client.post("/api/survival/score", json={"player_name": "Alice", "best_score": 80})
    utils_module._rate_store.clear()
    client.post("/api/survival/score", json={"player_name": "Alice", "best_score": 30})
    lb = client.get("/api/survival/leaderboard").json()
    assert lb[0]["best_score"] == 80


def test_survival_updates_if_better(client):
    client.post("/api/survival/score", json={"player_name": "Alice", "best_score": 80})
    utils_module._rate_store.clear()
    client.post("/api/survival/score", json={"player_name": "Alice", "best_score": 120})
    lb = client.get("/api/survival/leaderboard").json()
    assert lb[0]["best_score"] == 120


def test_survival_rejects_invalid_name(client):
    r = client.post("/api/survival/score", json={"player_name": "<xss>", "best_score": 10})
    assert r.status_code == 400


def test_survival_rejects_negative_score(client):
    r = client.post("/api/survival/score", json={"player_name": "Matis", "best_score": -1})
    assert r.json()["ok"] is False


def test_survival_rejects_score_over_9999(client):
    r = client.post("/api/survival/score", json={"player_name": "Matis", "best_score": 10000})
    assert r.json()["ok"] is False


# ── Flash ─────────────────────────────────────────────────────────────────────

def test_flash_submit_new_score(client):
    r = client.post("/api/flash/score", json={"player_name": "Matis", "best_score": 850})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_flash_rejects_score_over_999(client):
    r = client.post("/api/flash/score", json={"player_name": "Matis", "best_score": 1000})
    assert r.json()["ok"] is False


def test_flash_leaderboard_empty(client):
    r = client.get("/api/flash/leaderboard")
    assert r.status_code == 200
    assert r.json() == []


def test_flash_leaderboard_top10(client):
    for i in range(12):
        utils_module._rate_store.clear()
        client.post("/api/flash/score", json={"player_name": f"P{i}", "best_score": i * 100})
    r = client.get("/api/flash/leaderboard")
    assert len(r.json()) == 10


# ── Global leaderboard ────────────────────────────────────────────────────────

def test_global_submit_score(client):
    r = client.post("/api/global/score", json={
        "player_name": "Matis", "correct": 8, "total": 10,
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_global_rejects_invalid_payload(client):
    r = client.post("/api/global/score", json={
        "player_name": "Matis", "correct": 5,  # missing total
    })
    assert r.status_code == 422


def test_global_leaderboard_empty(client):
    r = client.get("/api/global/leaderboard")
    assert r.status_code == 200
    assert r.json() == []


def test_global_leaderboard_accumulates(client):
    client.post("/api/global/score", json={"player_name": "Alice", "correct": 8, "total": 10})
    utils_module._rate_store.clear()
    client.post("/api/global/score", json={"player_name": "Alice", "correct": 6, "total": 10})
    r = client.get("/api/global/leaderboard")
    data = r.json()
    assert data[0]["total_correct"] == 14


def test_global_leaderboard_ranked_by_correct(client):
    client.post("/api/global/score", json={"player_name": "Bob",   "correct": 5, "total": 10})
    utils_module._rate_store.clear()
    client.post("/api/global/score", json={"player_name": "Alice", "correct": 9, "total": 10})
    r = client.get("/api/global/leaderboard")
    data = r.json()
    assert data[0]["player_name"] == "Alice"
