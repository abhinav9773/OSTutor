"""
FastAPI dependency that reads the "Authorization: Bearer <token>" header,
verifies it was signed by us (issued at login time in routes/auth.py),
and returns the user info encoded inside it.

This is what makes chat history actually secure per-user — a request
can only ever read/write chats belonging to the "sub" inside its own
valid token, never someone else's, and never just by passing a raw ID.
"""

import jwt
from fastapi import Header, HTTPException

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
