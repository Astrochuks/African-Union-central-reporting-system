"""Agenda 2063 Goals endpoints."""

from fastapi import APIRouter, Query
from app.core.database import get_supabase
from app.services.analytics_service import get_goal_progress_by_region

router = APIRouter(prefix="/goals", tags=["Agenda 2063 Goals"])


@router.get("")
async def list_goals():
    """Get all 20 Agenda 2063 goals with progress."""
    supabase = get_supabase()
    result = (
        supabase.table("goals")
        .select("*, aspirations(number, name)")
        .order("number")
        .execute()
    )
    return {"goals": result.data, "total": len(result.data)}


@router.get("/{goal_id}")
async def get_goal(goal_id: int):
    """Get a specific goal with its indicators."""
    supabase = get_supabase()
    goal = supabase.table("goals").select("*, aspirations(number, name)").eq("id", goal_id).execute()
    if not goal.data:
        return {"error": "Goal not found"}

    indicators = (
        supabase.table("indicators")
        .select("*")
        .eq("goal_id", goal_id)
        .execute()
    )

    return {
        "goal": goal.data[0],
        "indicators": indicators.data,
    }


@router.get("/{goal_id}/progress")
async def goal_progress(goal_id: int):
    """Get progress data for a specific goal over time."""
    supabase = get_supabase()
    goal = supabase.table("goals").select("*").eq("id", goal_id).execute()
    if not goal.data:
        return {"error": "Goal not found"}

    # Get all indicators for this goal and their latest values
    indicators = supabase.table("indicators").select("id, name, code, target_value").eq("goal_id", goal_id).execute()

    progress_data = []
    for ind in indicators.data:
        values = (
            supabase.table("indicator_values")
            .select("year, value, member_states(name)")
            .eq("indicator_id", ind["id"])
            .order("year")
            .execute()
        )
        # Continental average per year
        year_data = {}
        for v in values.data:
            yr = v["year"]
            if yr not in year_data:
                year_data[yr] = []
            if v["value"] is not None:
                year_data[yr].append(v["value"])

        progress_data.append({
            "indicator": ind["name"],
            "code": ind["code"],
            "target": ind.get("target_value"),
            "time_series": [
                {"year": yr, "avg_value": round(sum(vals) / len(vals), 2), "countries": len(vals)}
                for yr, vals in sorted(year_data.items())
                if vals
            ],
        })

    return {
        "goal": goal.data[0],
        "progress": progress_data,
    }


@router.get("/{goal_id}/by-region")
async def goal_by_region(goal_id: int):
    """Get goal progress broken down by AU region."""
    return await get_goal_progress_by_region(goal_id)


@router.get("/{goal_id}/insights")
async def goal_insights(goal_id: int):
    """Get auto-generated insights for a specific goal."""
    supabase = get_supabase()
    insights = (
        supabase.table("insights")
        .select("*")
        .eq("goal_id", goal_id)
        .eq("is_active", True)
        .order("generated_at", desc=True)
        .execute()
    )
    return {"insights": insights.data, "total": len(insights.data)}
