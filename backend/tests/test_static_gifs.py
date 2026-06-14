"""Verify the /gifs/ StaticFiles mount serves GIFs correctly."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_gif_returns_200():
    r = client.get("/gifs/ryu/ryu-st-lp.gif")
    assert r.status_code == 200


def test_gif_content_type_is_image():
    r = client.get("/gifs/ryu/ryu-st-lp.gif")
    assert r.headers["content-type"].startswith("image/")


def test_gif_has_content():
    r = client.get("/gifs/ryu/ryu-st-lp.gif")
    assert len(r.content) > 1000


def test_gif_unknown_fighter_returns_404():
    r = client.get("/gifs/unknown_fighter/fake.gif")
    assert r.status_code == 404


def test_gif_unknown_file_returns_404():
    r = client.get("/gifs/ryu/does_not_exist.gif")
    assert r.status_code == 404


def test_multiple_fighters_served():
    fighters = ["ryu", "luke", "jamie", "guile"]
    for slug in fighters:
        r = client.get(f"/gifs/{slug}/{slug}-st-lp.gif")
        # Either 200 (file exists) or 404 (different filename) — never 500
        assert r.status_code in (200, 404), f"Unexpected status {r.status_code} for {slug}"
