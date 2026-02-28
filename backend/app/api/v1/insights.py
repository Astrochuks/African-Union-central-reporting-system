"""Insights Engine endpoints — auto-generated findings, alerts, trends."""

from fastapi import APIRouter, Query, Depends
from app.core.database import get_supabase
from app.core.auth import require_analyst
from app.services.insights_engine import generate_all_insights

router = APIRouter(prefix="/insights", tags=["Insights Engine"])


@router.get("")
async def list_insights(
    type: str | None = None,
    severity: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
):
    """Get all active insights with optional filtering."""
    supabase = get_supabase()
    query = (
        supabase.table("insights")
        .select("*")
        .eq("is_active", True)
        .order("generated_at", desc=True)
    )

    if type:
        query = query.eq("type", type)
    if severity:
        query = query.eq("severity", severity)

    result = query.range(offset, offset + limit - 1).execute()
    return {"insights": result.data, "total": len(result.data), "offset": offset}


@router.get("/latest")
async def latest_insights(limit: int = Query(default=10, le=50)):
    """Get the most recent insights."""
    supabase = get_supabase()
    result = (
        supabase.table("insights")
        .select("*")
        .eq("is_active", True)
        .order("generated_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"insights": result.data}


@router.get("/critical")
async def critical_insights():
    """Get all critical alerts that need immediate attention."""
    supabase = get_supabase()
    result = (
        supabase.table("insights")
        .select("*")
        .eq("is_active", True)
        .eq("severity", "critical")
        .order("generated_at", desc=True)
        .execute()
    )
    return {"insights": result.data, "total": len(result.data)}


@router.get("/by-goal/{goal_id}")
async def insights_by_goal(goal_id: int):
    """Get all insights related to a specific Agenda 2063 goal."""
    supabase = get_supabase()
    result = (
        supabase.table("insights")
        .select("*")
        .eq("goal_id", goal_id)
        .eq("is_active", True)
        .order("generated_at", desc=True)
        .execute()
    )
    return {"insights": result.data, "total": len(result.data)}


@router.get("/summary")
async def insights_summary():
    """Get insight statistics — counts by type and severity."""
    supabase = get_supabase()
    insights = (
        supabase.table("insights")
        .select("type, severity, generated_at")
        .eq("is_active", True)
        .execute()
    )

    by_type = {}
    by_severity = {}
    for i in insights.data:
        by_type[i["type"]] = by_type.get(i["type"], 0) + 1
        by_severity[i["severity"]] = by_severity.get(i["severity"], 0) + 1

    latest = max((i["generated_at"] for i in insights.data), default=None) if insights.data else None

    return {
        "total_active": len(insights.data),
        "by_type": by_type,
        "by_severity": by_severity,
        "latest_generated": latest,
    }


@router.post("/generate")
async def trigger_insight_generation(user: dict = Depends(require_analyst)):
    """Trigger the Insights Engine to regenerate all insights from current data."""
    result = await generate_all_insights()
    return result
