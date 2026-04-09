from sqlalchemy.orm import Session
from app.models.move import Move


def get_moves_by_fighter(db: Session, fighter_id: int, section: str | None = None) -> list[Move]:
    query = db.query(Move).filter(Move.fighter_id == fighter_id)
    if section:
        query = query.filter(Move.section == section)
    return query.order_by(Move.id).all()


def get_move_by_id(db: Session, move_id: int) -> Move | None:
    return db.query(Move).filter(Move.id == move_id).first()
