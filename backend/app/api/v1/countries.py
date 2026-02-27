"""Member States endpoints — profiles, scorecards, comparisons."""

from fastapi import APIRouter, Query
from app.core.database import get_supabase
from app.services.analytics_service import get_country_profile

router = APIRouter(prefix="/countries", tags=["Member States"])


@router.get("")
async def list_countries(region: str | None = None):
    """List all 55 AU member states."""
    supabase = get_supabase()
    query = supabase.table("member_states").select("*, regions(name)")

    if region:
        # Filter by region name
        regions = supabase.table("regions").select("id").eq("name", region).execute()
        if regions.data:
            query = query.eq("region_id", regions.data[0]["id"])

    result = query.order("name").execute()
    return {"countries": result.data, "total": len(result.data)}


@router.get("/{iso_code}/profile")
async def country_profile(iso_code: str):
    """Get a full country profile with indicators and metrics."""
    return await get_country_profile(iso_code)


@router.get("/{iso_code}/scorecard")
async def country_scorecard(iso_code: str):
    """Get Agenda 2063 scorecard for a country."""
    supabase = get_supabase()

    country = (
        supabase.table("member_states")
        .select("*, regions(name)")
        .eq("iso_code", iso_code.upper())
        .execute()
    )
    if not country.data:
        return {"error": "Country not found"}

    country_id = country.data[0]["id"]

    # Get all goals and their indicators
    goals = supabase.table("goals").select("*, aspirations(name)").order("number").execute()
    indicators = supabase.table("indicators").select("id, goal_id, name, code, target_value, unit").execute()

    goal_scores = []
    for goal in goals.data:
        goal_indicators = [i for i in indicators.data if i["goal_id"] == goal["id"]]
        goal_values = []

        for ind in goal_indicators:
            value = (
                supabase.table("indicator_values")
                .select("value, year")
                .eq("indicator_id", ind["id"])
                .eq("member_state_id", country_id)
                .order("year", desc=True)
                .limit(1)
                .execute()
            )
            if value.data and value.data[0]["value"] is not None:
                goal_values.append({
                    "indicator": ind["name"],
                    "value": value.data[0]["value"],
                    "year": value.data[0]["year"],
                    "unit": ind.get("unit"),
                    "target": ind.get("target_value"),
                })

        goal_scores.append({
            "goal_number": goal["number"],
            "goal_name": goal["name"],
            "aspiration": goal.get("aspirations", {}).get("name"),
            "indicators": goal_values,
            "data_completeness": f"{len(goal_values)}/{len(goal_indicators)}" if goal_indicators else "0/0",
        })

    # Country insights
    insights = (
        supabase.table("insights")
        .select("type, severity, title, description")
        .eq("member_state_id", country_id)
        .eq("is_active", True)
        .execute()
    )

    return {
        "country": country.data[0],
        "scorecard": goal_scores,
        "insights": insights.data,
    }


@router.get("/compare")
async def compare_countries(
    countries: str = Query(..., description="Comma-separated ISO codes (e.g., NG,ZA,KE)"),
    indicator_code: str | None = None,
):
    """Compare multiple countries on key indicators."""
    supabase = get_supabase()
    iso_codes = [c.strip().upper() for c in countries.split(",")]

    country_data = (
        supabase.table("member_states")
        .select("*, regions(name)")
        .in_("iso_code", iso_codes)
        .execute()
    )

    if not country_data.data:
        return {"error": "No countries found"}

    comparison = []
    for c in country_data.data:
        query = (
            supabase.table("indicator_values")
            .select("value, year, indicators(name, code, unit)")
            .eq("member_state_id", c["id"])
            .order("year", desc=True)
        )

        if indicator_code:
            ind = supabase.table("indicators").select("id").eq("code", indicator_code).execute()
            if ind.data:
                query = query.eq("indicator_id", ind.data[0]["id"])

        values = query.execute()

        # Latest per indicator
        seen = set()
        latest = []
        for v in values.data:
            code = v.get("indicators", {}).get("code")
            if code and code not in seen:
                seen.add(code)
                latest.append({
                    "indicator": v["indicators"]["name"],
                    "code": code,
                    "value": v["value"],
                    "year": v["year"],
                    "unit": v["indicators"].get("unit"),
                })

        comparison.append({
            "country": c["name"],
            "iso_code": c["iso_code"],
            "region": c.get("regions", {}).get("name") if c.get("regions") else None,
            "indicators": latest,
        })

    return {"comparison": comparison}
