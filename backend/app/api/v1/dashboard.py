"""Dashboard endpoint — KPI summary + recent insights."""

from fastapi import APIRouter
from app.services.analytics_service import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def dashboard_summary():
    """
    Get the main dashboard summary with KPIs and recent insights.

    Returns continental-level metrics, latest ETL run status,
    and the most recent auto-generated insights.
    """
    return await get_dashboard_summary()
