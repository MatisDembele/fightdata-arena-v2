"""Unit tests for validate_name and check_rate."""
import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock
from app.utils import validate_name, check_rate, _rate_store


# ── validate_name ─────────────────────────────────────────────────────────────

def test_validate_name_valid():
    assert validate_name("Matis") == "Matis"

def test_validate_name_strips_whitespace():
    assert validate_name("  Matis  ") == "Matis"

def test_validate_name_allows_numbers():
    assert validate_name("Player1") == "Player1"

def test_validate_name_allows_special_chars():
    assert validate_name("Pro_Player-X.1") == "Pro_Player-X.1"

def test_validate_name_rejects_empty():
    with pytest.raises(HTTPException) as exc:
        validate_name("")
    assert exc.value.status_code == 400

def test_validate_name_rejects_too_long():
    with pytest.raises(HTTPException) as exc:
        validate_name("A" * 21)
    assert exc.value.status_code == 400

def test_validate_name_rejects_special_chars():
    with pytest.raises(HTTPException) as exc:
        validate_name("<script>")
    assert exc.value.status_code == 400

def test_validate_name_rejects_at_sign():
    with pytest.raises(HTTPException) as exc:
        validate_name("user@mail")
    assert exc.value.status_code == 400


# ── check_rate ────────────────────────────────────────────────────────────────

def _make_request(ip="1.2.3.4"):
    req = MagicMock()
    req.headers = {}
    req.client = MagicMock()
    req.client.host = ip
    return req

def test_check_rate_allows_first_requests():
    _rate_store.clear()
    req = _make_request("10.0.0.1")
    for _ in range(5):
        check_rate(req, limit=5, window=300)  # should not raise

def test_check_rate_blocks_on_limit():
    _rate_store.clear()
    req = _make_request("10.0.0.2")
    for _ in range(5):
        check_rate(req, limit=5, window=300)
    with pytest.raises(HTTPException) as exc:
        check_rate(req, limit=5, window=300)
    assert exc.value.status_code == 429

def test_check_rate_different_ips_independent():
    _rate_store.clear()
    req_a = _make_request("10.0.1.1")
    req_b = _make_request("10.0.1.2")
    for _ in range(5):
        check_rate(req_a, limit=5, window=300)
    # req_b must still be allowed
    check_rate(req_b, limit=5, window=300)

def test_check_rate_uses_x_forwarded_for():
    _rate_store.clear()
    req = MagicMock()
    req.headers = {"x-forwarded-for": "5.5.5.5, 1.1.1.1"}
    req.client = MagicMock()
    req.client.host = "127.0.0.1"
    # Should track 5.5.5.5, not 127.0.0.1
    for _ in range(5):
        check_rate(req, limit=5, window=300)
    with pytest.raises(HTTPException):
        check_rate(req, limit=5, window=300)
    # Different IP still free
    req2 = _make_request("127.0.0.1")
    check_rate(req2, limit=5, window=300)
