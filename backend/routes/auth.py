"""
Handles Google Sign-In. The frontend gets an ID token from Google's own
sign-in button, sends it here, and we:
  1. Verify it's a genuine, unexpired token actually issued by Google
     for OUR client ID (this is the important security step — never
     trust a token without verifying it server-side).
  2. Pull the user's name/email/picture out of it.
  3. Issue our own short-lived session token (a JWT) that the frontend
     stores and could later send back on other requests if you want to
     protect them (not enforced yet, this just gets login working).
"""

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, HTTPException
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from pydantic import BaseModel

from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleLoginRequest(BaseModel):
    credential: str  # the ID token from Google's Sign-In button


@router.post("/google")
def google_login(request: GoogleLoginRequest):
    try:
        # This line does the real verification: checks the signature,
        # issuer, expiry, and that the token was issued for OUR client ID.
        idinfo = google_id_token.verify_oauth2_token(
            request.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    user = {
        "sub": idinfo["sub"],  # Google's stable unique user ID
        "email": idinfo.get("email"),
        "name": idinfo.get("name"),
        "picture": idinfo.get("picture"),
    }

    # Issue our own session token, valid for 7 days, so the frontend
    # doesn't need to re-verify with Google on every request.
    payload = {
        **user,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    session_token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

    return {"token": session_token, "user": user}
