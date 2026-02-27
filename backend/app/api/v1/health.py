"""Health check endpoint."""

from fastapi import APIRouter
from datetime import datetime, timezone
from app.core.config import settings
from app.core.database import get_supabase

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Check API and database connectivity."""
    db_status = "disconnected"
    try:
        supabase = get_supabase()
        result = supabase.table("regions").select("id", count="exact").execute()
        db_status = "connected" if result is not None else "error"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
        "version": settings.API_VERSION or "1.0.0",
        "database": db_status,
    }
