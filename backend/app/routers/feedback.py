import httpx
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.feedback import Feedback
from app.config import settings
from app.utils import check_rate

router = APIRouter(prefix="/feedback", tags=["feedback"])

VALID_CATEGORIES = {"mode", "feature", "bug", "other"}


class FeedbackIn(BaseModel):
    category: str = Field(..., max_length=20)
    message: str = Field(..., min_length=1, max_length=2000)
    contact: Optional[str] = Field(None, max_length=120)
    lang: Optional[str] = Field(None, max_length=5)


@router.post("")
async def submit_feedback(payload: FeedbackIn, request: Request, db: Session = Depends(get_db)):
    # Light rate-limit: 4 messages / 10 min per IP
    check_rate(request, limit=4, window=600.0)

    message = payload.message.strip()
    if not message:
        raise HTTPException(400, "Empty message")

    category = payload.category if payload.category in VALID_CATEGORIES else "other"
    contact = (payload.contact or "").strip()[:120] or None
    lang = (payload.lang or "").strip()[:5] or None

    fb = Feedback(category=category, message=message[:2000], contact=contact, lang=lang)
    db.add(fb)
    db.commit()

    # Best-effort mirror to a Discord channel (only if a webhook is configured)
    webhook = settings.FEEDBACK_DISCORD_WEBHOOK
    if webhook:
        content = f"**[{category.upper()}]** {message[:1700]}"
        if contact:
            content += f"\n— contact: {contact}"
        if lang:
            content += f"  ·  {lang}"
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                await client.post(webhook, json={"content": content[:1900], "username": "FDA Feedback"})
        except Exception:
            pass  # never fail the request because Discord is unreachable

    return {"ok": True}
