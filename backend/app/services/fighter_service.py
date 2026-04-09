from sqlalchemy.orm import Session
from app.models.fighter import Fighter
from app.models.move import FighterStat


def get_all_fighters(db: Session) -> list[Fighter]:
    return db.query(Fighter).order_by(Fighter.name).all()


def get_fighter_by_slug(db: Session, slug: str) -> Fighter | None:
    return db.query(Fighter).filter(Fighter.slug == slug).first()


def get_fighter_stats(db: Session, fighter_id: int) -> dict:
    stats = db.query(FighterStat).filter(FighterStat.fighter_id == fighter_id).all()
    return {s.key: s.value for s in stats}
