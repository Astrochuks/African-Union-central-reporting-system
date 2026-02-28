"""Authentication middleware — validates Supabase JWT and enforces roles."""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import get_supabase
from typing import Optional

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """
    Validate Supabase JWT and return user info.
    Returns None if no credentials provided (public access).
    """
    if not credentials:
        return None

    try:
        supabase = get_supabase()
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user = user_response.user
        # Fetch role from user_profiles
        profile = supabase.table("user_profiles").select(
            "role, full_name, department"
        ).eq("id", str(user.id)).single().execute()

        return {
            "id": str(user.id),
            "email": user.email,
            "role": profile.data.get("role", "viewer") if profile.data else "viewer",
            "full_name": profile.data.get("full_name", "") if profile.data else "",
            "department": profile.data.get("department") if profile.data else None,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
) -> dict:
    """Require valid authentication. Returns user dict."""
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


async def require_admin(user: dict = Depends(require_auth)) -> dict:
    """Require admin role."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_analyst(user: dict = Depends(require_auth)) -> dict:
    """Require analyst or admin role."""
    if user.get("role") not in ("admin", "analyst"):
        raise HTTPException(status_code=403, detail="Analyst access required")
    return user
