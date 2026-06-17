"""
Enrich data/json/all_fighters.json with the `input` (command) field only.

all_fighters.json is the canonical seed source (read by seed_db.py). The
per-slug *.json files are stale and unused at runtime, so we touch ONLY
all_fighters.json here.

Why merge instead of re-scrape: the optimized WebP on the CDN are keyed by the
current `gif_path` values. We fetch fresh UFD pages purely to read each move's
`inputsequence`, then merge that single field in by (section, move_name) order.
Every other field (gif_path, gif_url, frame data) is left byte-for-byte intact,
so the WebP mapping is preserved and the diff stays minimal.

Usage:
  py scripts/enrich_inputs.py
"""

import json
import time
from collections import defaultdict, deque

from scrape_sf6 import parse_fighter, JSON_DIR, REQUEST_DELAY

ALL = JSON_DIR / "all_fighters.json"


def _norm(s: str | None) -> str:
    # all_fighters.json uses spaces ("special moves"); the scraper emits
    # underscores ("special_moves"). Normalize so keys match.
    return (s or "").lower().replace("_", " ").strip()


def main():
    data = json.load(open(ALL, encoding="utf-8"))
    total = 0
    for slug, fighter in data.items():
        fresh = parse_fighter(slug, download_gifs=False)
        if not fresh:
            print(f"  ! skip {slug} (no page)")
            time.sleep(REQUEST_DELAY)
            continue
        q: dict = defaultdict(deque)
        for m in fresh["moves"]:
            if m.get("input"):
                q[(_norm(m.get("section")), m.get("move_name"))].append(m["input"])
        n = 0
        for m in fighter.get("moves", []):
            key = (_norm(m.get("section")), m.get("move_name"))
            if q[key]:
                m["input"] = q[key].popleft()
                n += 1
        total += n
        print(f"  + {slug}: {n} inputs merged")
        time.sleep(REQUEST_DELAY)

    with open(ALL, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\nDONE — {total} moves enriched with input in all_fighters.json")


if __name__ == "__main__":
    main()
