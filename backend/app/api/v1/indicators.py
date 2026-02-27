"""Indicator endpoints — time series, rankings, trends."""

from fastapi import APIRouter, Query
from app.core.database import get_supabase
from app.services.analytics_service import get_indicator_time_series, get_indicator_ranking

router = APIRouter(prefix="/indicators", tags=["Indicators"])


@router.get("")
async def list_indicators(goal_id: int | None = None):
    """List all indicator definitions, optionally filtered by goal."""
    supabase = get_supabase()
    query = supabase.table("indicators").select("*, goals(number, name)")

    if goal_id:
        query = query.eq("goal_id", goal_id)

    result = query.order("id").execute()
    return {"indicators": result.data, "total": len(result.data)}


@router.get("/{indicator_id}/values")
async def indicator_values(indicator_id: int, country: str | None = None):
    """Get time series values for an indicator."""
    return await get_indicator_time_series(indicator_id, country)


@router.get("/{indicator_id}/ranking")
async def indicator_ranking(
    indicator_id: int,
    year: int | None = None,
    limit: int = Query(default=55, le=55),
):
    """Rank countries by indicator value."""
    return {"ranking": await get_indicator_ranking(indicator_id, year, limit)}


@router.get("/{indicator_id}/trend")
async def indicator_trend(indicator_id: int):
    """Get continental trend analysis for an indicator."""
    supabase = get_supabase()

    indicator = supabase.table("indicators").select("*").eq("id", indicator_id).execute()
    if not indicator.data:
        return {"error": "Indicator not found"}

    values = (
        supabase.table("indicator_values")
        .select("year, value")
        .eq("indicator_id", indicator_id)
        .not_.is_("value", "null")
        .order("year")
        .execute()
    )

    # Continental average per year
    year_data = {}
    for v in values.data:
        yr = v["year"]
        if yr not in year_data:
            year_data[yr] = []
        year_data[yr].append(v["value"])

    trend = [
        {
            "year": yr,
            "avg": round(sum(vals) / len(vals), 2),
            "min": round(min(vals), 2),
            "max": round(max(vals), 2),
            "countries": len(vals),
        }
        for yr, vals in sorted(year_data.items())
        if vals
    ]

    # Determine trend direction
    if len(trend) >= 3:
        recent_avg = trend[-1]["avg"]
        earlier_avg = trend[-3]["avg"]
        if recent_avg > earlier_avg * 1.05:
            direction = "improving"
        elif recent_avg < earlier_avg * 0.95:
            direction = "declining"
        else:
            direction = "stable"
    else:
        direction = "insufficient_data"

    return {
        "indicator": indicator.data[0],
        "trend": trend,
        "direction": direction,
    }
