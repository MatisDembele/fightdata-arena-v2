from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import create_token, get_current_user
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.user_profile import UserProfile

router = APIRouter(prefix="/auth", tags=["auth"])


class SyncPayload(BaseModel):
    achievements: dict = {}
    lifetime: dict = {}
    history: list = []


@router.get("/discord/callback")
async def discord_callback(code: str, db: Session = Depends(get_db)):
    if not settings.DISCORD_CLIENT_ID or not settings.DISCORD_CLIENT_SECRET:
        raise HTTPException(503, "Discord OAuth non configuré")

    async with httpx.AsyncClient() as client:
        # Exchange authorization code for access token
        token_res = await client.post(
            "https://discord.com/api/oauth2/token",
            data={
                "client_id": settings.DISCORD_CLIENT_ID,
                "client_secret": settings.DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.DISCORD_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10.0,
        )
        if not token_res.is_success:
            raise HTTPException(400, "Échange de code Discord échoué")
        access_token: Optional[str] = token_res.json().get("access_token")
        if not access_token:
            raise HTTPException(400, "Access token Discord manquant")

        # Fetch Discord user info
        user_res = await client.get(
            "https://discord.com/api/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0,
        )
        if not user_res.is_success:
            raise HTTPException(400, "Impossible de récupérer l'utilisateur Discord")
        d = user_res.json()

    discord_id: str = d["id"]
    # global_name is the display name on new accounts; username is the handle
    username: str = d.get("global_name") or d.get("username") or "Player"

    # Upsert user
    user = db.query(User).filter(User.discord_id == discord_id).first()
    if not user:
        user = User(discord_id=discord_id, username=username)
        db.add(user)
        db.flush()
        db.add(UserProfile(user_id=user.id))
    else:
        user.username = username
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.discord_id, user.username)
    return {
        "token": token,
        "user": {"id": user.id, "username": user.username, "discord_id": user.discord_id},
    }


@router.get("/me")
def get_me(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.discord_id == payload["sub"]).first()
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    return {
        "user": {"id": user.id, "username": user.username, "discord_id": user.discord_id},
        "profile": {
            "achievements": profile.achievements if profile else {},
            "lifetime": profile.lifetime if profile else {},
            "history": profile.history if profile else [],
        },
    }


@router.post("/sync")
def sync_profile(
    body: SyncPayload,
    payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.discord_id == payload["sub"]).first()
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    profile.achievements = body.achievements
    profile.lifetime = body.lifetime
    profile.history = body.history[:30]
    db.commit()
    return {"ok": True}
