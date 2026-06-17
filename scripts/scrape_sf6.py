"""
Fight Data Arena — SF6 Scraper (v2)
=====================================
Structure HTML réelle de ultimateframedata.com/sf6/{slug} :

  <h1 class="charactername">Akuma</h1>
  <div id="contentcontainer">
    <h2 class="movecategory" id="normalattacks">Normal Attacks</h2>
    <div class="moves">
      <div class="movecontainer">
        <div class="hitbox">
          <a class="hitboximg" href="hitboxes/akuma/akuma-st-lp.gif">
            <img src="hitboxes/akuma/akuma-st-lp.gif">
          </a>
        </div>
        <div class="movename">Standing Light Punch</div>
        <div class="startup">4</div>
        <div class="totalframes">13</div>
        <div class="basedamage">300</div>
        <div class="attacktype">High</div>
        <div class="cancellable">Chain, Special, Super</div>
        <div class="notes">--</div>
        <div class="whichhitbox">--</div>
        <div class="onhit">+4</div>
        <div class="onblock">-1</div>
        <div class="activeframes">3</div>
        <div class="recovery">7</div>
      </div>
    </div>
  </div>

Usage :
  pip install requests beautifulsoup4

  # Tester sur un seul perso
  python scrape_sf6.py --fighter akuma

  # Tout le roster
  python scrape_sf6.py --all

  # Sans télécharger les GIFs
  python scrape_sf6.py --all --no-gifs
"""

import argparse
import json
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL     = "https://ultimateframedata.com/sf6"
GIF_BASE_URL = "https://ultimateframedata.com/sf6/"

SF6_ROSTER = [
    "ryu", "luke", "jamie", "chunli", "guile", "kimberly",
    "juri", "ken", "blanka", "dhalsim", "ehonda", "deejay",
    "manon", "marisa", "jp", "zangief", "lily", "cammy",
    "rashid", "aki", "ed", "akuma", "mbison", "terry",
    "mai", "elena", "alex", "sagat", "cviper",
]

SECTION_ID_MAP = {
    "normalattacks": "normal_attacks",
    "uniqueattacks": "unique_attacks",
    "targetcombos":  "target_combos",
    "jumpattacks":   "jump_attacks",
    "specialmoves":  "special_moves",
    "superarts":     "super_arts",
    "misc":          "misc",
}

# Classes CSS réelles du site → clés JSON
FIELD_MAP = {
    "movename":     "move_name",
    "startup":      "startup",
    "totalframes":  "total_frames",
    "basedamage":   "damage",
    "attacktype":   "guard",
    "cancellable":  "cancel",
    "notes":        "notes",
    "whichhitbox":  "which_hitbox",
    "onhit":        "on_hit",
    "onblock":      "on_block",
    "activeframes": "active",
    "recovery":     "recovery",
    "inputsequence": "input",   # UFD's class for the move's command (e.g. "Down, Down-Forward, Forward + LP")
}

OUTPUT_DIR = Path("data")
JSON_DIR   = OUTPUT_DIR / "json"
GIF_DIR    = OUTPUT_DIR / "gifs"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

REQUEST_DELAY = 1.5


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def is_empty(val: str) -> bool:
    return val in ("", "--", "**", "N/A", "-")


def fetch_page(slug: str) -> BeautifulSoup | None:
    url = f"{BASE_URL}/{slug}"
    print(f"  📡 GET {url}")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except requests.RequestException as e:
        print(f"  ❌ Erreur fetch : {e}")
        return None


def download_gif(url: str, dest: Path) -> bool:
    if dest.exists():
        return True
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20, stream=True)
        resp.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except requests.RequestException as e:
        print(f"    ⚠️  GIF non téléchargé {url}: {e}")
        return False


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------

def parse_fighter(slug: str, download_gifs: bool) -> dict | None:
    print(f"\n🔍 Scraping : {slug}")
    soup = fetch_page(slug)
    if not soup:
        return None

    # Nom du perso
    h1 = soup.find(class_="charactername")
    fighter_name = clean(h1.get_text()) if h1 else slug.replace("-", " ").title()

    fighter_data = {
        "name":  fighter_name,
        "slug":  slug,
        "moves": [],
        "stats": {},
    }

    current_section = "unknown"

    content = soup.find(id="contentcontainer") or soup.find("body")
    if not content:
        print("  ❌ Pas de #contentcontainer trouvé")
        return None

    for element in content.find_all(["h2", "div"]):

        # Détection de section
        if element.name == "h2" and "movecategory" in element.get("class", []):
            section_id = element.get("id", "")
            current_section = SECTION_ID_MAP.get(section_id, section_id)
            continue

        if "movecontainer" not in element.get("class", []):
            continue

        # Section misc → stats
        if current_section == "misc":
            _parse_misc(element, fighter_data["stats"])
            continue

        move = _parse_move(element, current_section, slug, download_gifs)
        if move:
            fighter_data["moves"].append(move)
            print(f"    📌 [{current_section}] {move.get('move_name', '?')}")

    total = len(fighter_data["moves"])
    print(f"  ✅ {total} moves parsés pour {fighter_name}")

    if total == 0:
        print("  ⚠️  Aucun move trouvé — la structure HTML a peut-être changé")

    return fighter_data


def _parse_move(container, section: str, slug: str, download_gifs: bool) -> dict | None:
    move = {"section": section}

    # --- GIF ---
    # Structure : div.hitbox > a.hitboximg > img[src="hitboxes/slug/slug-move.gif"]
    # Le src est RELATIF à /sf6/ donc : https://ultimateframedata.com/sf6/ + src
    hitbox_div = container.find(class_="hitbox")
    if hitbox_div:
        img = hitbox_div.find("img")
        if img and img.get("src"):
            src = img["src"].lstrip("/").lower()    # "hitboxes/akuma/akuma-st-lp.gif" (lowercase)
            gif_url = GIF_BASE_URL + src            # URL absolue correcte
            gif_filename = src.split("/")[-1]       # "akuma-st-lp.gif"

            move["gif_url"]  = gif_url
            move["gif_path"] = f"gifs/{slug}/{gif_filename}"

            if download_gifs:
                dest = GIF_DIR / slug / gif_filename
                ok = download_gif(gif_url, dest)
                if ok:
                    print(f"    🎞  {gif_filename}")

    # --- Données de frame ---
    for css_class, json_key in FIELD_MAP.items():
        el = container.find(class_=css_class)
        if el:
            for span in el.find_all("span", class_="label"):
                span.decompose()
            val = clean(el.get_text())
            if not is_empty(val):
                move[json_key] = val

    if "move_name" not in move:
        return None

    return move


def _parse_misc(container, stats: dict):
    text = clean(container.get_text())
    if "—" in text:
        parts = text.split("—", 1)
        key = clean(parts[0]).lower().replace(" ", "_")
        val = clean(parts[1])
        if key and val and not is_empty(val):
            stats[key] = val


# ---------------------------------------------------------------------------
# Sauvegarde
# ---------------------------------------------------------------------------

def save_json(data: dict, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  💾 {path}")


# ---------------------------------------------------------------------------
# Entry points
# ---------------------------------------------------------------------------

def scrape_one(slug: str, download_gifs: bool) -> dict | None:
    data = parse_fighter(slug, download_gifs)
    if data:
        save_json(data, JSON_DIR / f"{slug}.json")
    return data


def scrape_all(download_gifs: bool):
    all_data = {}
    failed   = []

    for slug in SF6_ROSTER:
        data = scrape_one(slug, download_gifs)
        if data and len(data["moves"]) > 0:
            all_data[slug] = data
        else:
            failed.append(slug)
        time.sleep(REQUEST_DELAY)

    save_json(all_data, JSON_DIR / "all_fighters.json")

    print(f"\n{'='*50}")
    print(f"✅ {len(all_data)}/{len(SF6_ROSTER)} persos scrapés avec succès")
    if failed:
        print(f"❌ Échecs : {', '.join(failed)}")

    return all_data


def main():
    parser = argparse.ArgumentParser(description="Fight Data Arena — SF6 Scraper v2")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--fighter", type=str, help="Slug du perso (ex: akuma)")
    group.add_argument("--all",     action="store_true", help="Scraper tout le roster")
    parser.add_argument("--no-gifs", action="store_true", help="Ne pas télécharger les GIFs")
    args = parser.parse_args()

    download_gifs = not args.no_gifs

    JSON_DIR.mkdir(parents=True, exist_ok=True)
    if download_gifs:
        GIF_DIR.mkdir(parents=True, exist_ok=True)

    if args.all:
        scrape_all(download_gifs)
    else:
        slug = args.fighter.lower()
        scrape_one(slug, download_gifs)


if __name__ == "__main__":
    main()
