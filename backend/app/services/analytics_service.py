"""
Analytics Service — Aggregations, trends, comparisons, and rankings.
"""

import structlog
from app.core.database import get_supabase

logger = structlog.get_logger()


async def get_dashboard_summary() -> dict:
    """Build the main dashboard KPI summary."""
    supabase = get_supabase()

    # Counts
    states = supabase.table("member_states").select("id", count="exact").execute()
    goals = supabase.table("goals").select("id", count="exact").execute()
    indicators = supabase.table("indicators").select("id", count="exact").execute()
    data_points = supabase.table("indicator_values").select("id", count="exact").execute()

    # Latest ETL run
    latest_etl = (
        supabase.table("etl_runs")
        .select("*")
        .order("started_at", desc=True)
        .limit(1)
        .execute()
    )

    # Recent insights
    recent_insights = (
        supabase.table("insights")
        .select("*")
        .eq("is_active", True)
        .order("generated_at", desc=True)
        .limit(10)
        .execute()
    )

    # Goal progress averages
    goal_data = supabase.table("goals").select("current_progress").execute()
    progress_vals = [g["current_progress"] for g in goal_data.data if g.get("current_progress")]
    avg_progress = sum(progress_vals) / len(progress_vals) if progress_vals else None

    # Key KPIs
    kpis = []

    # GDP per capita
    gdp = await _get_continental_average("NY.GDP.PCAP.CD")
    if gdp is not None:
        kpis.append({"label": "Avg GDP per Capita", "value": f"${gdp:,.0f}", "target": "$12,000", "unit": "USD"})

    # Life expectancy
    le = await _get_continental_average("SP.DYN.LE00.IN")
    if le is not None:
        kpis.append({"label": "Avg Life Expectancy", "value": f"{le:.1f} years", "target": "75 years", "unit": "years"})

    # Women in parliament
    wip = await _get_continental_average("SG.GEN.PARL.ZS")
    if wip is not None:
        kpis.append({"label": "Women in Parliament", "value": f"{wip:.1f}%", "target": "50%", "unit": "%"})

    # Youth unemployment
    yu = await _get_continental_average("SL.UEM.1524.ZS")
    if yu is not None:
        kpis.append({"label": "Youth Unemployment", "value": f"{yu:.1f}%", "target": "<6%", "unit": "%"})

    # Internet access
    ia = await _get_continental_average("IT.NET.USER.ZS")
    if ia is not None:
        kpis.append({"label": "Internet Penetration", "value": f"{ia:.1f}%", "target": "100%", "unit": "%"})

    # Electricity access
    ea = await _get_continental_average("EG.ELC.ACCS.ZS")
    if ea is not None:
        kpis.append({"label": "Electricity Access", "value": f"{ea:.1f}%", "target": "100%", "unit": "%"})

    return {
        "total_member_states": states.count or 55,
        "total_goals": goals.count or 20,
        "total_indicators": indicators.count or 0,
        "total_data_points": data_points.count or 0,
        "avg_goal_progress": avg_progress,
        "latest_etl_run": latest_etl.data[0] if latest_etl.data else None,
        "recent_insights": recent_insights.data,
        "kpis": kpis,
    }


async def _get_continental_average(indicator_code: str) -> float | None:
    """Get the average of the most recent values across all countries for an indicator."""
    supabase = get_supabase()

    indicator = supabase.table("indicators").select("id").eq("code", indicator_code).execute()
    if not indicator.data:
        return None

    values = (
        supabase.table("indicator_values")
        .select("member_state_id, year, value")
        .eq("indicator_id", indicator.data[0]["id"])
        .order("year", desc=True)
        .execute()
    )

    # Keep latest per country
    seen = set()
    latest = []
    for v in values.data:
        if v["value"] is not None and v["member_state_id"] not in seen:
            seen.add(v["member_state_id"])
            latest.append(v["value"])

    return sum(latest) / len(latest) if latest else None


async def get_indicator_time_series(indicator_id: int, country_iso: str | None = None) -> dict:
    """Get time series for an indicator, optionally filtered by country."""
    supabase = get_supabase()

    indicator = supabase.table("indicators").select("*").eq("id", indicator_id).execute()
    if not indicator.data:
        return {"error": "Indicator not found"}

    query = (
        supabase.table("indicator_values")
        .select("year, value, member_states(name, iso_code)")
        .eq("indicator_id", indicator_id)
        .order("year")
    )

    if country_iso:
        # Get country ID
        country = supabase.table("member_states").select("id").eq("iso_code", country_iso.upper()).execute()
        if country.data:
            query = query.eq("member_state_id", country.data[0]["id"])

    result = query.execute()

    return {
        "indicator_id": indicator_id,
        "indicator_name": indicator.data[0]["name"],
        "unit": indicator.data[0].get("unit"),
        "country": country_iso,
        "values": [
            {"year": v["year"], "value": v["value"], "country": v.get("member_states", {}).get("name")}
            for v in result.data
        ],
    }


async def get_indicator_ranking(indicator_id: int, year: int | None = None, limit: int = 55) -> list[dict]:
    """Rank countries by an indicator value."""
    supabase = get_supabase()

    query = (
        supabase.table("indicator_values")
        .select("value, year, member_states(name, iso_code, regions(name))")
        .eq("indicator_id", indicator_id)
        .not_.is_("value", "null")
        .order("value", desc=True)
    )

    if year:
        query = query.eq("year", year)

    result = query.execute()

    # If no year filter, keep latest per country
    if not year:
        seen = set()
        filtered = []
        for v in result.data:
            cname = v.get("member_states", {}).get("name")
            if cname and cname not in seen:
                seen.add(cname)
                filtered.append(v)
    else:
        filtered = result.data

    return [
        {
            "rank": i + 1,
            "country_name": v.get("member_states", {}).get("name"),
            "iso_code": v.get("member_states", {}).get("iso_code"),
            "value": v["value"],
            "year": v["year"],
            "region": v.get("member_states", {}).get("regions", {}).get("name") if v.get("member_states", {}).get("regions") else None,
        }
        for i, v in enumerate(filtered[:limit])
    ]


async def get_goal_progress_by_region(goal_id: int) -> dict:
    """Get average progress for a goal broken down by region."""
    supabase = get_supabase()

    # Get indicators for this goal
    indicators = supabase.table("indicators").select("id, code, name, target_value").eq("goal_id", goal_id).execute()
    if not indicators.data:
        return {"goal_id": goal_id, "regions": {}}

    regions = supabase.table("regions").select("id, name").execute()
    region_names = {r["id"]: r["name"] for r in regions.data}

    region_data = {}
    for ind in indicators.data:
        values = (
            supabase.table("indicator_values")
            .select("value, member_states(region_id)")
            .eq("indicator_id", ind["id"])
            .not_.is_("value", "null")
            .order("year", desc=True)
            .execute()
        )

        # Latest per country grouped by region
        seen = set()
        for v in values.data:
            ms = v.get("member_states", {})
            rid = ms.get("region_id")
            if rid and v["value"] is not None and (ind["id"], rid, id(v)) not in seen:
                seen.add((ind["id"], rid, id(v)))
                rname = region_names.get(rid, "Unknown")
                if rname not in region_data:
                    region_data[rname] = []
                region_data[rname].append(v["value"])

    return {
        "goal_id": goal_id,
        "regions": {
            r: {"average": round(sum(vals) / len(vals), 2), "countries": len(vals)}
            for r, vals in region_data.items()
        },
    }


async def get_gender_overview() -> dict:
    """Get continental gender analytics summary."""
    supabase = get_supabase()

    # Latest gender metrics
    metrics = supabase.table("gender_metrics").select("*, member_states(name, iso_code, regions(name))").order("year", desc=True).execute()

    # Latest per country
    seen = set()
    latest = []
    for m in metrics.data:
        cid = m["member_state_id"]
        if cid not in seen:
            seen.add(cid)
            latest.append(m)

    parliament_vals = [m["women_parliament_pct"] for m in latest if m.get("women_parliament_pct")]
    labor_vals = [m["women_labor_force_pct"] for m in latest if m.get("women_labor_force_pct")]
    parity_vals = [m["gender_parity_education"] for m in latest if m.get("gender_parity_education")]

    return {
        "continental_avg_women_parliament": round(sum(parliament_vals) / len(parliament_vals), 2) if parliament_vals else None,
        "continental_avg_labor_force": round(sum(labor_vals) / len(labor_vals), 2) if labor_vals else None,
        "continental_avg_parity_index": round(sum(parity_vals) / len(parity_vals), 3) if parity_vals else None,
        "countries_above_30pct_parliament": len([v for v in parliament_vals if v >= 30]),
        "total_countries_with_data": len(latest),
    }


async def get_youth_overview() -> dict:
    """Get continental youth analytics summary."""
    supabase = get_supabase()

    metrics = supabase.table("youth_metrics").select("*, member_states(name, iso_code, regions(name))").order("year", desc=True).execute()

    seen = set()
    latest = []
    for m in metrics.data:
        cid = m["member_state_id"]
        if cid not in seen:
            seen.add(cid)
            latest.append(m)

    unemp_vals = [m["youth_unemployment_pct"] for m in latest if m.get("youth_unemployment_pct")]
    enroll_vals = [m["secondary_enrollment_pct"] for m in latest if m.get("secondary_enrollment_pct")]

    return {
        "continental_avg_unemployment": round(sum(unemp_vals) / len(unemp_vals), 2) if unemp_vals else None,
        "continental_avg_enrollment": round(sum(enroll_vals) / len(enroll_vals), 2) if enroll_vals else None,
        "countries_high_unemployment": len([v for v in unemp_vals if v > 25]),
        "total_countries_with_data": len(latest),
    }


async def get_country_profile(iso_code: str) -> dict:
    """Get comprehensive country profile."""
    supabase = get_supabase()

    country = (
        supabase.table("member_states")
        .select("*, regions(name)")
        .eq("iso_code", iso_code.upper())
        .execute()
    )
    if not country.data:
        return {"error": "Country not found"}

    country_data = country.data[0]
    country_id = country_data["id"]

    # Latest indicator values
    values = (
        supabase.table("indicator_values")
        .select("value, year, indicators(name, code, unit, goals(number, name))")
        .eq("member_state_id", country_id)
        .order("year", desc=True)
        .execute()
    )

    # Deduplicate by indicator
    seen = set()
    key_indicators = []
    for v in values.data:
        ind = v.get("indicators", {})
        code = ind.get("code")
        if code and code not in seen:
            seen.add(code)
            key_indicators.append({
                "indicator": ind.get("name"),
                "code": code,
                "value": v["value"],
                "year": v["year"],
                "unit": ind.get("unit"),
                "goal": ind.get("goals", {}).get("name") if ind.get("goals") else None,
            })

    # Gender metrics
    gender = (
        supabase.table("gender_metrics")
        .select("*")
        .eq("member_state_id", country_id)
        .order("year", desc=True)
        .limit(1)
        .execute()
    )

    # Youth metrics
    youth = (
        supabase.table("youth_metrics")
        .select("*")
        .eq("member_state_id", country_id)
        .order("year", desc=True)
        .limit(1)
        .execute()
    )

    return {
        "country": country_data,
        "key_indicators": key_indicators,
        "gender_metrics": gender.data[0] if gender.data else None,
        "youth_metrics": youth.data[0] if youth.data else None,
    }
