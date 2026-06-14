from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

_bearer = HTTPBearer(auto_error=False)
_ALGO = "HS256"
_EXPIRE_DAYS = 60


def create_token(user_id: int, discord_id: str, username: str, avatar: Optional[str] = None) -> str:
    payload = {
        "sub": discord_id,
        "user_id": user_id,
        "username": username,
        "avatar": avatar,
        "exp": datetime.now(timezone.utc) + timedelta(days=_EXPIRE_DAYS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=_ALGO)


def _decode(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[_ALGO])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Non authentifié")
    return _decode(credentials.credentials)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[dict]:
    if not credentials:
        return None
    try:
        return _decode(credentials.credentials)
    except HTTPException:
        return None
