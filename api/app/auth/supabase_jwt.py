"""Verify Supabase access tokens via JWT secret or Auth API."""

from __future__ import annotations

import os
from typing import Any, Dict, Optional
from urllib.request import Request, urlopen
import json

import jwt
from fastapi import HTTPException


def _jwt_secret() -> Optional[str]:
    """Raw HS256 secret — not the anon/service_role JWT keys."""
    secret = os.environ.get("SUPABASE_JWT_SECRET", "").strip() or None
    if not secret:
        return None
    # User sometimes pastes service_role/anon JWT here — those cannot verify other tokens
    if secret.startswith("eyJ"):
        return None
    return secret


def _supabase_url() -> Optional[str]:
    return os.environ.get("SUPABASE_URL", "").strip().rstrip("/") or None


def _api_key() -> Optional[str]:
    """anon or publishable key for Auth API calls."""
    return (
        os.environ.get("SUPABASE_ANON_KEY", "").strip()
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()
        or None
    )


def _verify_via_auth_api(token: str) -> Dict[str, Any]:
    base = _supabase_url()
    key = _api_key()
    if not base or not key:
        raise HTTPException(
            status_code=503,
            detail=(
                "SaaS auth not configured. Set SUPABASE_URL + SUPABASE_ANON_KEY "
                "(or SUPABASE_JWT_SECRET)."
            ),
        )
    req = Request(
        f"{base}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": key,
        },
        method="GET",
    )
    try:
        with urlopen(req, timeout=10) as resp:  # noqa: S310 — fixed Supabase host from env
            body = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail=f"Invalid or expired session: {exc}") from exc

    user_id = body.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Auth API returned no user id")
    # Shape compatible with JWT payload consumers
    return {
        "sub": user_id,
        "email": body.get("email"),
        "role": "authenticated",
        "user_metadata": body.get("user_metadata") or {},
        "app_metadata": body.get("app_metadata") or {},
    }


def verify_supabase_token(token: str) -> Dict[str, Any]:
    """
    Verify a user access token.
    Prefer SUPABASE_JWT_SECRET (Settings → API → JWT Secret).
    Fallback: GET {SUPABASE_URL}/auth/v1/user with the token.
    """
    secret = _jwt_secret()
    if secret:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={"require": ["exp", "sub"]},
            )
        except jwt.ExpiredSignatureError as exc:
            raise HTTPException(status_code=401, detail="Token expired") from exc
        except jwt.InvalidTokenError as exc:
            raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Token missing subject")
        return payload

    return _verify_via_auth_api(token)
