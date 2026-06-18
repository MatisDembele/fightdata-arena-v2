"""In-memory presence tracking for "online now" (single worker — see Procfile)."""
from time import monotonic

WINDOW = 60.0  # a session pinging within this many seconds counts as online
_seen: dict[str, float] = {}


def touch(sid: str) -> None:
    if not sid:
        return
    _seen[sid] = monotonic()
    if len(_seen) > 5000:
        prune()


def prune() -> None:
    now = monotonic()
    for k in [k for k, t in _seen.items() if now - t > WINDOW]:
        _seen.pop(k, None)


def count_online(window: float = WINDOW) -> int:
    now = monotonic()
    return sum(1 for t in _seen.values() if now - t <= window)
