"""
Fight Data Arena — Setup Backend
==================================
Lance ce script depuis C:\\Users\\matis\\OneDrive\\Bureau\\FDA\\
Il crée toute la structure du backend automatiquement.

Usage :
  py setup_backend.py
"""

from pathlib import Path

# ---------------------------------------------------------------------------
# Contenu de chaque fichier
# ---------------------------------------------------------------------------

FILES = {

"backend/.env": """DATABASE_URL=postgresql://postgres:TON_MOT_DE_PASSE@localhost:5432/fight_data_arena
""",

"backend/requirements.txt": """fastapi==0.135.3
uvicorn==0.44.0
sqlalchemy==2.0.49
psycopg2-binary==2.9.11
python-dotenv==1.2.2
alembic==1.18.4
pydantic==2.12.5
pydantic-settings==2.9.1
""",

"backend/app/__init__.py": "",

"backend/app/config.py": """from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    class Config:
        env_file = ".env"


settings = Settings()
""",

"backend/app/database.py": """from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
""",

"backend/app/main.py": """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import fighters, quiz

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fight Data Arena API",
    description="API de frame data Street Fighter 6",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fighters.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Fight Data Arena API", "status": "ok"}
""",

"backend/app/models/__init__.py": """from app.models.fighter import Fighter
from app.models.move import Move, FighterStat
""",

"backend/app/models/fighter.py": """from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Fighter(Base):
    __tablename__ = "fighters"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    slug       = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    moves = relationship("Move", back_populates="fighter", cascade="all, delete-orphan")
    stats = relationship("FighterStat", back_populates="fighter", cascade="all, delete-orphan")
""",

"backend/app/models/move.py": """from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Move(Base):
    __tablename__ = "moves"

    id           = Column(Integer, primary_key=True, index=True)
    fighter_id   = Column(Integer, ForeignKey("fighters.id"), nullable=False, index=True)
    section      = Column(String, nullable=False)
    move_name    = Column(String, nullable=False)
    input        = Column(String, nullable=True)
    startup      = Column(String, nullable=True)
    active       = Column(String, nullable=True)
    recovery     = Column(String, nullable=True)
    total_frames = Column(String, nullable=True)
    on_hit       = Column(String, nullable=True)
    on_block     = Column(String, nullable=True)
    damage       = Column(String, nullable=True)
    guard        = Column(String, nullable=True)
    cancel       = Column(String, nullable=True)
    notes        = Column(String, nullable=True)
    which_hitbox = Column(String, nullable=True)
    gif_url      = Column(String, nullable=True)
    gif_path     = Column(String, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    fighter = relationship("Fighter", back_populates="moves")


class FighterStat(Base):
    __tablename__ = "fighter_stats"

    id         = Column(Integer, primary_key=True, index=True)
    fighter_id = Column(Integer, ForeignKey("fighters.id"), nullable=False, index=True)
    key        = Column(String, nullable=False)
    value      = Column(String, nullable=False)

    fighter = relationship("Fighter", back_populates="stats")
""",

"backend/app/schemas/__init__.py": """from app.schemas.fighter import FighterOut, FighterWithStats
from app.schemas.move import MoveOut, QuizQuestion
""",

"backend/app/schemas/fighter.py": """from pydantic import BaseModel
from datetime import datetime


class FighterBase(BaseModel):
    name: str
    slug: str


class FighterCreate(FighterBase):
    pass


class FighterOut(FighterBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FighterWithStats(FighterOut):
    stats: dict = {}
""",

"backend/app/schemas/move.py": """from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MoveOut(BaseModel):
    id:           int
    fighter_id:   int
    section:      str
    move_name:    str
    input:        Optional[str] = None
    startup:      Optional[str] = None
    active:       Optional[str] = None
    recovery:     Optional[str] = None
    total_frames: Optional[str] = None
    on_hit:       Optional[str] = None
    on_block:     Optional[str] = None
    damage:       Optional[str] = None
    guard:        Optional[str] = None
    cancel:       Optional[str] = None
    notes:        Optional[str] = None
    which_hitbox: Optional[str] = None
    gif_url:      Optional[str] = None
    gif_path:     Optional[str] = None
    created_at:   datetime

    class Config:
        from_attributes = True


class QuizQuestion(BaseModel):
    move_name:    str
    section:      str
    gif_url:      Optional[str] = None
    gif_path:     Optional[str] = None
    question:     str
    choices:      list[str]
    answer:       str
    fighter_slug: str
""",

"backend/app/routers/__init__.py": "",

"backend/app/routers/fighters.py": """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.fighter import FighterOut, FighterWithStats
from app.schemas.move import MoveOut
from app.services import fighter_service, move_service

router = APIRouter(prefix="/fighters", tags=["fighters"])


@router.get("/", response_model=list[FighterOut])
def list_fighters(db: Session = Depends(get_db)):
    return fighter_service.get_all_fighters(db)


@router.get("/{slug}", response_model=FighterWithStats)
def get_fighter(slug: str, db: Session = Depends(get_db)):
    fighter = fighter_service.get_fighter_by_slug(db, slug)
    if not fighter:
        raise HTTPException(status_code=404, detail=f"Personnage '{slug}' introuvable")
    stats = fighter_service.get_fighter_stats(db, fighter.id)
    return {**fighter.__dict__, "stats": stats}


@router.get("/{slug}/moves", response_model=list[MoveOut])
def get_fighter_moves(
    slug: str,
    section: str | None = None,
    db: Session = Depends(get_db),
):
    fighter = fighter_service.get_fighter_by_slug(db, slug)
    if not fighter:
        raise HTTPException(status_code=404, detail=f"Personnage '{slug}' introuvable")
    return move_service.get_moves_by_fighter(db, fighter.id, section)
""",

"backend/app/routers/quiz.py": """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.move import QuizQuestion
from app.services import quiz_service

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/random", response_model=QuizQuestion)
def random_question(db: Session = Depends(get_db)):
    question = quiz_service.generate_random_question(db)
    if not question:
        raise HTTPException(status_code=404, detail="Pas assez de données pour générer un quiz")
    return question


@router.get("/{slug}/startup", response_model=QuizQuestion)
def startup_question(slug: str, db: Session = Depends(get_db)):
    question = quiz_service.generate_startup_question(db, slug)
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"Pas assez de données pour '{slug}'"
        )
    return question
""",

"backend/app/services/__init__.py": "",

"backend/app/services/fighter_service.py": """from sqlalchemy.orm import Session
from app.models.fighter import Fighter
from app.models.move import FighterStat


def get_all_fighters(db: Session) -> list[Fighter]:
    return db.query(Fighter).order_by(Fighter.name).all()


def get_fighter_by_slug(db: Session, slug: str) -> Fighter | None:
    return db.query(Fighter).filter(Fighter.slug == slug).first()


def get_fighter_stats(db: Session, fighter_id: int) -> dict:
    stats = db.query(FighterStat).filter(FighterStat.fighter_id == fighter_id).all()
    return {s.key: s.value for s in stats}
""",

"backend/app/services/move_service.py": """from sqlalchemy.orm import Session
from app.models.move import Move


def get_moves_by_fighter(db: Session, fighter_id: int, section: str | None = None) -> list[Move]:
    query = db.query(Move).filter(Move.fighter_id == fighter_id)
    if section:
        query = query.filter(Move.section == section)
    return query.order_by(Move.id).all()


def get_move_by_id(db: Session, move_id: int) -> Move | None:
    return db.query(Move).filter(Move.id == move_id).first()
""",

"backend/app/services/quiz_service.py": """import random
import re
from sqlalchemy.orm import Session
from app.models.move import Move
from app.models.fighter import Fighter
from app.schemas.move import QuizQuestion


def _is_numeric(value: str | None) -> bool:
    if not value:
        return False
    return bool(re.match(r"^\\d+$", value.strip()))


def generate_startup_question(db: Session, slug: str) -> QuizQuestion | None:
    fighter = db.query(Fighter).filter(Fighter.slug == slug).first()
    if not fighter:
        return None

    candidates = (
        db.query(Move)
        .filter(Move.fighter_id == fighter.id, Move.gif_path.isnot(None))
        .all()
    )
    candidates = [m for m in candidates if _is_numeric(m.startup)]

    if len(candidates) < 4:
        return None

    correct_move = random.choice(candidates)
    correct_answer = correct_move.startup

    other_startups = list({
        m.startup for m in candidates
        if m.startup != correct_answer and _is_numeric(m.startup)
    })

    if len(other_startups) < 3:
        return None

    wrong_answers = random.sample(other_startups, 3)
    choices = wrong_answers + [correct_answer]
    random.shuffle(choices)

    return QuizQuestion(
        move_name=correct_move.move_name,
        section=correct_move.section,
        gif_url=correct_move.gif_url,
        gif_path=correct_move.gif_path,
        question=f"Quel est le startup de {correct_move.move_name} ?",
        choices=choices,
        answer=correct_answer,
        fighter_slug=slug,
    )


def generate_random_question(db: Session) -> QuizQuestion | None:
    fighters = db.query(Fighter).all()
    if not fighters:
        return None
    random.shuffle(fighters)
    for fighter in fighters:
        question = generate_startup_question(db, fighter.slug)
        if question:
            return question
    return None
""",

"backend/scripts/__init__.py": "",

"backend/scripts/seed_db.py": """import argparse
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
        print(f"\\nImport termine !")
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
""",

}

# ---------------------------------------------------------------------------
# Création des fichiers
# ---------------------------------------------------------------------------

BASE = Path(".")

print("Fight Data Arena — Création de la structure backend\n")

for relative_path, content in FILES.items():
    full_path = BASE / relative_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_text(content, encoding="utf-8")
    print(f"  ✅ {relative_path}")

print("\n✅ Structure backend créée !")
print("\nProchaines étapes :")
print("  1. Edite backend\\.env et remplace TON_MOT_DE_PASSE")
print("  2. cd backend && venv\\Scripts\\activate.bat")
print("  3. pip install pydantic-settings")
print("  4. python scripts\\seed_db.py")
print("  5. uvicorn app.main:app --reload")
