import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.fighter import Fighter
from app.models.move import Move, FighterStat

DATA_FILE = Path(__file__).parent.parent.parent / "data" / "json" / "all_fighters.json"


def reset_tables(db):
    print("Suppression des donnees existantes...")
    db.query(FighterStat).delete()
    db.query(Move).delete()
    db.query(Fighter).delete()
    db.commit()
    print("  Tables videes")


def seed(reset: bool = False):
    if not DATA_FILE.exists():
        print(f"Fichier introuvable : {DATA_FILE}")
        print("Lance d'abord : py scrape_sf6.py --all")
        sys.exit(1)

    print(f"Lecture de {DATA_FILE}...")
    with open(DATA_FILE, encoding="utf-8") as f:
        all_data = json.load(f)

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if reset:
            reset_tables(db)

        fighter_count = 0
        move_count    = 0
        stat_count    = 0

        for slug, data in all_data.items():
            existing = db.query(Fighter).filter(Fighter.slug == slug).first()
            if existing:
                print(f"  {data['name']} deja en base, ignore")
                continue

            fighter = Fighter(name=data["name"], slug=slug)
            db.add(fighter)
            db.flush()
            fighter_count += 1

            for move_data in data.get("moves", []):
                move = Move(
                    fighter_id   = fighter.id,
                    section      = move_data.get("section", "unknown"),
                    move_name    = move_data.get("move_name", ""),
                    input        = move_data.get("input"),
                    startup      = move_data.get("startup"),
                    active       = move_data.get("active"),
                    recovery     = move_data.get("recovery"),
                    total_frames = move_data.get("total_frames"),
                    on_hit       = move_data.get("on_hit"),
                    on_block     = move_data.get("on_block"),
                    damage       = move_data.get("damage"),
                    guard        = move_data.get("guard"),
                    cancel       = move_data.get("cancel"),
                    notes        = move_data.get("notes"),
                    which_hitbox = move_data.get("which_hitbox"),
                    gif_url      = move_data.get("gif_url"),
                    gif_path     = move_data.get("gif_path"),
                )
                db.add(move)
                move_count += 1

            for key, value in data.get("stats", {}).items():
                db.add(FighterStat(fighter_id=fighter.id, key=key, value=str(value)))
                stat_count += 1

            print(f"  OK {data['name']} — {len(data.get('moves', []))} moves")

        db.commit()
        print(f"\nImport termine !")
        print(f"  {fighter_count} personnages")
        print(f"  {move_count} moves")
        print(f"  {stat_count} stats")

    except Exception as e:
        db.rollback()
        print(f"Erreur : {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()
    seed(reset=args.reset)
