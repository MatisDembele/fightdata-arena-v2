"""
═══════════════════════════════════════════════════════════════
Fight Data Arena — Update Patch
Automatise la mise à jour des données après un patch SF6.
═══════════════════════════════════════════════════════════════

Usage :
    py scripts/update_patch.py --dry-run
        → scraping + diff uniquement, ne touche à rien

    py scripts/update_patch.py
        → pipeline complet (scrape → diff → confirmation → seed)

    py scripts/update_patch.py --skip-scrape
        → réutilise data/json/all_fighters_new.json existant
          (diff → confirmation → seed)

    py scripts/update_patch.py --skip-scrape --db-url postgresql://...
        → idem en passant l'URL de BDD en argument

Variables d'environnement :
    DATABASE_URL : URL PostgreSQL pour le seed (ou via --db-url)

Étapes :
    🔍 1. Scraping complet ultimateframedata.com/sf6
          (détection automatique des nouveaux persos)
    📊 2. Diff ancien/nouveau → data/patch_diff.md
    ✋ 3. Confirmation interactive
    💾 4. Seed BDD (idempotent)
    ✅ 5. Checklist des actions manuelles restantes
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from datetime import date
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ── Chemins ──────────────────────────────────────────────────────────────────

ROOT          = Path(__file__).resolve().parent.parent
JSON_DIR      = ROOT / "data" / "json"
OLD_JSON      = JSON_DIR / "all_fighters.json"
NEW_JSON      = JSON_DIR / "all_fighters_new.json"
DIFF_MD       = ROOT / "data" / "patch_diff.md"

BASE_URL      = "https://ultimateframedata.com"
SF6_URL       = f"{BASE_URL}/sf6"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
}

# Champs comparés dans le diff
DIFF_FIELDS = ["startup", "active", "recovery", "on_hit", "on_block", "damage"]


# ══════════════════════════════════════════════════════════════
# ÉTAPE 1 — SCRAPING
# ══════════════════════════════════════════════════════════════

def get_fighter_slugs() -> list[str]:
    """Récupère dynamiquement la liste des persos depuis la page d'accueil SF6."""
    print("🔍 Récupération de la liste des personnages...")
    resp = requests.get(SF6_URL, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    slugs: list[str] = []
    # Les liens persos sont de la forme /sf6/{slug} (hors pages utilitaires)
    excluded = {"", "stats", "hitboxes", "glossary", "about"}
    for a in soup.find_all("a", href=True):
        m = re.match(r"^/sf6/([a-z0-9][a-z0-9-]*)/?$", a["href"])
        if m:
            slug = m.group(1)
            if slug not in excluded and slug not in slugs:
                slugs.append(slug)

    if not slugs:
        raise RuntimeError(
            "Aucun perso détecté — la structure HTML d'ultimateframedata a peut-être changé."
        )

    print(f"   {len(slugs)} personnages trouvés : {', '.join(slugs)}")
    return slugs


_EMPTY = {"", "--", "**", "N/A", "-"}

def _txt(container, cls: str) -> str | None:
    """Texte d'un div.{cls} dans un movecontainer, ou None si absent/vide."""
    el = container.find("div", class_=cls)
    if el is None:
        return None
    val = re.sub(r"\s+", " ", el.get_text().strip())
    return None if val in _EMPTY else val


def scrape_fighter(slug: str) -> dict:
    """Scrape un perso : stats + tous ses moves."""
    resp = requests.get(f"{SF6_URL}/{slug}", headers=HEADERS, timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # Nom affiché
    h1 = soup.find("h1")
    name = h1.get_text(strip=True) if h1 else slug.capitalize()

    moves = []
    current_section = "normals"

    # On parcourt le DOM dans l'ordre pour suivre les sections (h2) et les moves
    for el in soup.find_all(["h2", "div"]):
        if el.name == "h2":
            section_txt = el.get_text(strip=True).lower()
            if section_txt:
                current_section = section_txt
        elif el.name == "div" and "movecontainer" in (el.get("class") or []):
            move_name = _txt(el, "movename")
            if not move_name:
                continue
            gif_slug = re.sub(r"[^a-z0-9]+", "", move_name.lower())
            moves.append({
                "section":      current_section,
                "move_name":    move_name,
                "startup":      _txt(el, "startup"),
                "active":       _txt(el, "activeframes"),
                "recovery":     _txt(el, "recovery"),
                "total_frames": _txt(el, "totalframes"),
                "on_hit":       _txt(el, "onhit"),
                "on_block":     _txt(el, "onblock"),
                "damage":       _txt(el, "basedamage"),
                "guard":        _txt(el, "attacktype"),
                "cancel":       _txt(el, "cancellable"),
                "notes":        _txt(el, "notes"),
                "gif_url":      f"{BASE_URL}/sf6/hitboxes/{slug}/{slug}-{gif_slug}.gif",
                "gif_path":     f"{slug}/{slug}-{gif_slug}.gif",
            })

    return {"name": name, "slug": slug, "moves": moves}


def run_scraping(known_slugs: set[str]) -> dict:
    """Scrape tous les persos. Retourne le dict complet {slug: fighter}."""
    slugs = get_fighter_slugs()

    new_slugs = [s for s in slugs if s not in known_slugs]
    for s in new_slugs:
        print(f"\n⚠️  NOUVEAU PERSO DÉTECTÉ : {s} — pense à ajouter son portrait")
        print(f"    dans frontend/lib/portraits.ts\n")

    fighters: dict[str, dict] = {}
    failures: list[str] = []

    for i, slug in enumerate(slugs, 1):
        try:
            print(f"🔍 [{i}/{len(slugs)}] Scraping {slug}...", end=" ")
            fighter = scrape_fighter(slug)
            fighters[slug] = fighter
            print(f"✅ {len(fighter['moves'])} moves")
            time.sleep(0.5)  # politesse envers le serveur
        except Exception as e:
            failures.append(slug)
            print(f"❌ {e}")

    if failures:
        print(f"\n⚠️  Échecs de scraping : {', '.join(failures)}")
        print("    Relance le script ou vérifie ces pages manuellement.")

    return {"fighters": fighters, "scraped_at": str(date.today()), "failures": failures}


# ══════════════════════════════════════════════════════════════
# Helpers de chargement JSON (structure souple)
# ══════════════════════════════════════════════════════════════

def load_fighters_dict(path: Path) -> dict[str, dict]:
    """
    Charge un JSON de fighters et le normalise en {slug: fighter}.
    Gère deux structures possibles : {"fighters": {...}} ou {"fighters": [...]}
    ou directement une liste/dict racine.
    """
    if not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))

    data = raw.get("fighters", raw) if isinstance(raw, dict) else raw

    if isinstance(data, dict):
        # Déjà {slug: fighter} — on vérifie que ce sont bien des fighters
        if all(isinstance(v, dict) and "moves" in v for v in data.values()):
            return data
    if isinstance(data, list):
        return {f["slug"]: f for f in data if isinstance(f, dict) and "slug" in f}

    raise ValueError(f"Structure JSON inattendue dans {path}")


def moves_by_name(fighter: dict) -> dict[str, dict]:
    return {m["move_name"]: m for m in fighter.get("moves", [])}


# ══════════════════════════════════════════════════════════════
# ÉTAPE 2 — DIFF
# ══════════════════════════════════════════════════════════════

def run_diff(old: dict[str, dict], new: dict[str, dict]) -> dict:
    """Compare ancien/nouveau et retourne la structure de diff."""
    diff = {
        "new_fighters":     [],
        "removed_fighters": [],
        "new_moves":        {},   # slug -> [move_name]
        "removed_moves":    {},   # slug -> [move_name]
        "changed_moves":    {},   # slug -> [(move_name, field, old, new)]
    }

    old_slugs, new_slugs = set(old), set(new)
    diff["new_fighters"]     = sorted(new_slugs - old_slugs)
    diff["removed_fighters"] = sorted(old_slugs - new_slugs)

    for slug in sorted(old_slugs & new_slugs):
        old_moves = moves_by_name(old[slug])
        new_moves = moves_by_name(new[slug])

        added   = sorted(set(new_moves) - set(old_moves))
        removed = sorted(set(old_moves) - set(new_moves))
        if added:
            diff["new_moves"][slug] = added
        if removed:
            diff["removed_moves"][slug] = removed

        changes = []
        for name in sorted(set(old_moves) & set(new_moves)):
            for field in DIFF_FIELDS:
                ov = old_moves[name].get(field)
                nv = new_moves[name].get(field)
                if ov != nv:
                    changes.append((name, field, ov, nv))
        if changes:
            diff["changed_moves"][slug] = changes

    return diff


def diff_summary(diff: dict) -> dict:
    return {
        "fighters_added":   len(diff["new_fighters"]),
        "fighters_removed": len(diff["removed_fighters"]),
        "moves_added":      sum(len(v) for v in diff["new_moves"].values()),
        "moves_removed":    sum(len(v) for v in diff["removed_moves"].values()),
        "moves_changed":    sum(len(v) for v in diff["changed_moves"].values()),
    }


def write_diff_report(diff: dict, path: Path) -> None:
    s = diff_summary(diff)
    lines = [
        f"# Patch Diff — {date.today()}",
        "",
        "## Résumé",
        "",
        f"- Personnages ajoutés : **{s['fighters_added']}**",
        f"- Personnages supprimés : **{s['fighters_removed']}**",
        f"- Moves ajoutés : **{s['moves_added']}**",
        f"- Moves supprimés : **{s['moves_removed']}**",
        f"- Valeurs modifiées : **{s['moves_changed']}**",
        "",
    ]

    if diff["new_fighters"]:
        lines += ["## 🆕 Nouveaux personnages", ""]
        lines += [f"- **{slug}**" for slug in diff["new_fighters"]]
        lines.append("")

    if diff["removed_fighters"]:
        lines += ["## ❌ Personnages supprimés", ""]
        lines += [f"- {slug}" for slug in diff["removed_fighters"]]
        lines.append("")

    if diff["new_moves"]:
        lines += ["## ➕ Nouveaux moves", ""]
        for slug, names in diff["new_moves"].items():
            lines.append(f"### {slug}")
            lines += [f"- {n}" for n in names]
            lines.append("")

    if diff["removed_moves"]:
        lines += ["## ➖ Moves supprimés", ""]
        for slug, names in diff["removed_moves"].items():
            lines.append(f"### {slug}")
            lines += [f"- {n}" for n in names]
            lines.append("")

    if diff["changed_moves"]:
        lines += ["## 🔧 Valeurs modifiées", ""]
        for slug, changes in diff["changed_moves"].items():
            lines.append(f"### {slug}")
            for name, field, ov, nv in changes:
                lines.append(f"- **{name}** : {field} `{ov}` → `{nv}`")
            lines.append("")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


# ══════════════════════════════════════════════════════════════
# ÉTAPE 4 — SEED BDD
# ══════════════════════════════════════════════════════════════

def run_seed(db_url: str, fighters: dict[str, dict]) -> None:
    """Lance seed_db.py via le venv backend (évite les conflits de dépendances)."""
    seed_script = ROOT / "backend" / "scripts" / "seed_db.py"

    # Cherche le Python du venv backend (Windows puis Unix)
    for candidate in [
        ROOT / "backend" / "venv" / "Scripts" / "python.exe",
        ROOT / "backend" / "venv" / "bin" / "python",
    ]:
        if candidate.exists():
            python = str(candidate)
            break
    else:
        python = sys.executable  # fallback : Python courant

    env = {**os.environ, "DATABASE_URL": db_url, "PYTHONUTF8": "1"}
    proc = subprocess.Popen(
        [python, str(seed_script), "--reset"],
        env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, encoding="utf-8",
    )
    for line in proc.stdout:
        print(" ", line, end="")
    proc.wait()
    if proc.returncode != 0:
        raise RuntimeError(f"seed_db.py a échoué (code {proc.returncode})")


# ══════════════════════════════════════════════════════════════
# ÉTAPE 5 — CHECKLIST
# ══════════════════════════════════════════════════════════════

def print_checklist(new_fighters: list[str]) -> None:
    print("\n" + "═" * 60)
    print("✅ PIPELINE TERMINÉ — Actions manuelles restantes :")
    print("═" * 60)
    if new_fighters:
        for slug in new_fighters:
            print(f"  [ ] Ajouter le portrait de '{slug}' dans frontend/lib/portraits.ts")
            print(f"      → teste https://www.streetfighter.com/6/assets/images/"
                  f"character/select_character{{N}}_over.png")
        print(f"  [ ] Mettre à jour le compteur de persos sur l'accueil "
              f"(frontend/app/page.tsx, STATS)")
    print(f"  [ ] Mettre à jour le texte \"PATCH {{MOIS}} {{ANNÉE}}\" sur l'accueil")
    print(f"  [ ] git add -A && git commit -m \"patch update\" && git push")
    print(f"  [ ] Vérifier le déploiement Vercel + Render")
    print("═" * 60)


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(description="Mise à jour patch SF6")
    parser.add_argument("--dry-run", action="store_true",
                        help="Scraping + diff uniquement, pas de seed")
    parser.add_argument("--skip-scrape", action="store_true",
                        help="Réutilise all_fighters_new.json existant")
    parser.add_argument("--db-url", default=None,
                        help="URL PostgreSQL (sinon variable DATABASE_URL)")
    args = parser.parse_args()

    # ── Chargement de l'ancien JSON ──
    old_fighters = load_fighters_dict(OLD_JSON)
    print(f"📂 Données actuelles : {len(old_fighters)} persos "
          f"({OLD_JSON.relative_to(ROOT)})")

    # ── ÉTAPE 1 : Scraping ──
    if args.skip_scrape:
        if not NEW_JSON.exists():
            sys.exit(f"❌ --skip-scrape demandé mais {NEW_JSON} n'existe pas.")
        print(f"⏩ Scraping ignoré, réutilisation de {NEW_JSON.relative_to(ROOT)}")
        new_raw = json.loads(NEW_JSON.read_text(encoding="utf-8"))
        new_fighters = load_fighters_dict(NEW_JSON)
        scrape_failures = new_raw.get("failures", []) if isinstance(new_raw, dict) else []
    else:
        result = run_scraping(set(old_fighters))
        new_fighters = result["fighters"]
        scrape_failures = result["failures"]
        JSON_DIR.mkdir(parents=True, exist_ok=True)
        NEW_JSON.write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"💾 Nouveau JSON : {NEW_JSON.relative_to(ROOT)}")

    # ── ÉTAPE 2 : Diff ──
    print("\n📊 Calcul du diff...")
    diff = run_diff(old_fighters, new_fighters)
    s = diff_summary(diff)
    write_diff_report(diff, DIFF_MD)

    print(f"""
┌─────────────────────────────────────────┐
│  RÉSUMÉ DU PATCH                        │
├─────────────────────────────────────────┤
│  Persos ajoutés    : {s['fighters_added']:>4}               │
│  Persos supprimés  : {s['fighters_removed']:>4}               │
│  Moves ajoutés     : {s['moves_added']:>4}               │
│  Moves supprimés   : {s['moves_removed']:>4}               │
│  Valeurs modifiées : {s['moves_changed']:>4}               │
└─────────────────────────────────────────┘
📄 Rapport complet : {DIFF_MD.relative_to(ROOT)}""")

    if scrape_failures:
        print(f"⚠️  Persos en échec de scraping : {', '.join(scrape_failures)}")

    if args.dry_run:
        print("\n🏁 Mode --dry-run : arrêt ici, rien n'a été modifié.")
        return

    if sum(s.values()) == 0:
        print("\n✅ Aucun changement détecté — rien à appliquer.")
        return

    # ── ÉTAPE 3 : Confirmation ──
    answer = input("\n✋ Appliquer ces changements ? (o/n) ").strip().lower()
    if answer not in ("o", "oui", "y", "yes"):
        print("🛑 Annulé. Les fichiers _new restent disponibles pour inspection.")
        return

    # Backup + remplacement du JSON principal
    if OLD_JSON.exists():
        backup = JSON_DIR / f"all_fighters_backup_{date.today()}.json"
        backup.write_text(OLD_JSON.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"💾 Backup : {backup.relative_to(ROOT)}")
    OLD_JSON.write_text(
        json.dumps(new_fighters, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"💾 {OLD_JSON.relative_to(ROOT)} mis à jour")

    # ── ÉTAPE 4 : Seed ──
    db_url = args.db_url or os.environ.get("DATABASE_URL")
    if not db_url:
        print("""
❌ DATABASE_URL manquante. Définis-la puis relance avec --skip-scrape :

   set DATABASE_URL=postgresql://user:pass@host/dbname
   py scripts/update_patch.py --skip-scrape
""")
        return

    run_seed(db_url, new_fighters)

    # ── ÉTAPE 5 : Checklist ──
    print_checklist(diff["new_fighters"])


if __name__ == "__main__":
    main()
