import re
from collections import defaultdict
from time import monotonic

from fastapi import HTTPException, Request

NAME_RE = re.compile(r'^[A-Za-z0-9 _\-\.]{1,20}$')
_rate_store: dict[str, list[float]] = defaultdict(list)


def validate_name(raw: str) -> str:
    name = raw.strip()
    if not name or len(name) > 20 or not NAME_RE.match(name):
        raise HTTPException(400, "Invalid player name — letters, numbers, spaces, _ - . only (max 20 chars)")
    return name


def check_rate(request: Request, limit: int = 5, window: float = 300.0) -> None:
    forwarded = request.headers.get("x-forwarded-for")
    client = request.client
    ip = forwarded.split(",")[0].strip() if forwarded else (client.host if client else "unknown")
    now = monotonic()
    _rate_store[ip] = [t for t in _rate_store[ip] if now - t < window]
    if len(_rate_store[ip]) >= limit:
        raise HTTPException(429, "Too many requests — please wait before submitting again")
    _rate_store[ip].append(now)
