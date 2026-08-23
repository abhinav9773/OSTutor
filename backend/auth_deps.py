"""
FastAPI dependencies for authentication and authorization.

get_current_user verifies the "Authorization: Bearer <token>" header
(the JWT issued at login time in routes/auth.py) and returns the user
info encoded inside it - this is what makes chat history secure per-user.

require_admin builds on top of that: it only allows through users whose
email is in ADMIN_EMAILS. Used to lock down document/URL ingestion so a
random signed-in user can't upload arbitrary files or flood the
knowledge base - anyone else gets a clean 403, even if they call the
API directly and bypass the UI entirely.
"""

import jwt
from fastapi import Header, HTTPException, Depends

from config import settings


def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session token")

    return {
        "sub": payload["sub"],
        "email": payload.get("email"),
        "name": payload.get("name"),
        "picture": payload.get("picture"),
    }


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    email = (user.get("email") or "").lower()
    if email not in settings.admin_emails_list:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
