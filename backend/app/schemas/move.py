from pydantic import BaseModel
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
