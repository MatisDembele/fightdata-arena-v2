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
    mode_bests: dict = {}
    mistakes: dict = {}


@router.get("/discord/callback")
async def discord_callback(code: str, redirect_uri: Optional[str] = None, db: Session = Depends(get_db)):
    if not settings.DISCORD_CLIENT_ID or not settings.DISCORD_CLIENT_SECRET:
        raise HTTPException(503, "Discord OAuth non configuré")

    # Use the redirect_uri passed by the frontend (mirrors the one used in the authorize URL)
    # Fall back to the env setting if not provided
    actual_redirect_uri = redirect_uri or settings.DISCORD_REDIRECT_URI

    async with httpx.AsyncClient() as client:
        # Exchange authorization code for access token
        token_res = await client.post(
            "https://discord.com/api/oauth2/token",
            data={
                "client_id": settings.DISCORD_CLIENT_ID,
                "client_secret": settings.DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": actual_redirect_uri,
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
    username: str = d.get("global_name") or d.get("username") or "Player"
    avatar: Optional[str] = d.get("avatar")  # hash string or None

    # Upsert user
    user = db.query(User).filter(User.discord_id == discord_id).first()
    if not user:
        user = User(discord_id=discord_id, username=username, avatar=avatar)
        db.add(user)
        db.flush()
        db.add(UserProfile(user_id=user.id))
    else:
        user.username = username
        user.avatar = avatar
        # Ensure profile exists for users created before profiles were introduced
        if not db.query(UserProfile).filter(UserProfile.user_id == user.id).first():
            db.add(UserProfile(user_id=user.id))
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.discord_id, user.username, user.avatar)
    return {
        "token": token,
        "user": {"id": user.id, "username": user.username, "discord_id": user.discord_id, "avatar": user.avatar},
    }


@router.get("/me")
def get_me(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.discord_id == payload["sub"]).first()
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    return {
        "user": {"id": user.id, "username": user.username, "discord_id": user.discord_id, "avatar": user.avatar},
        "profile": {
            "achievements": (profile.achievements or {}) if profile else {},
            "lifetime":     (profile.lifetime     or {}) if profile else {},
            "history":      (profile.history      or []) if profile else [],
            "mode_bests":   (profile.mode_bests   or {}) if profile else {},
            "mistakes":     (profile.mistakes      or {}) if profile else {},
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
    profile.mode_bests = body.mode_bests
    profile.mistakes = body.mistakes
    db.commit()
    return {"ok": True}


@router.delete("/me")
def delete_account(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.discord_id == payload["sub"]).first()
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    db.query(UserProfile).filter(UserProfile.user_id == user.id).delete()
    db.delete(user)
    db.commit()
    return {"ok": True}
