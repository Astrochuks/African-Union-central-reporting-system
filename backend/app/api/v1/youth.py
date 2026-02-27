"""Youth Analytics endpoints (WGYD)."""

from fastapi import APIRouter
from app.core.database import get_supabase
from app.services.analytics_service import get_youth_overview

router = APIRouter(prefix="/youth", tags=["Youth Analytics"])


@router.get("/overview")
async def youth_overview():
    """Continental youth summary — unemployment, education metrics."""
    return await get_youth_overview()


@router.get("/by-country")
async def youth_by_country():
    """Youth metrics for each AU member state."""
    supabase = get_supabase()
    metrics = (
        supabase.table("youth_metrics")
        .select("*, member_states(name, iso_code, regions(name))")
        .order("year", desc=True)
        .execute()
    )

    seen = set()
    latest = []
    for m in metrics.data:
        cid = m["member_state_id"]
        if cid not in seen:
            seen.add(cid)
            latest.append(m)

    return {"data": latest, "total": len(latest)}


@router.get("/employment")
async def youth_employment():
    """Youth employment/unemployment analysis across AU."""
    supabase = get_supabase()
    metrics = (
        supabase.table("youth_metrics")
        .select("youth_unemployment_pct, year, member_states(name, iso_code, regions(name))")
        .not_.is_("youth_unemployment_pct", "null")
        .order("year", desc=True)
        .execute()
    )

    # Latest per country
    seen = set()
    latest = []
    for m in metrics.data:
        cname = m.get("member_states", {}).get("name")
        if cname and cname not in seen:
            seen.add(cname)
            latest.append(m)

    # Sort worst to best
    ranked = sorted(latest, key=lambda x: x["youth_unemployment_pct"] or 0, reverse=True)

    return {
        "ranking": [
            {
                "rank": i + 1,
                "country": m["member_states"]["name"],
                "iso_code": m["member_states"]["iso_code"],
                "region": m["member_states"].get("regions", {}).get("name") if m["member_states"].get("regions") else None,
                "unemployment_pct": m["youth_unemployment_pct"],
                "year": m["year"],
            }
            for i, m in enumerate(ranked)
        ],
        "continental_avg": round(
            sum(m["youth_unemployment_pct"] for m in ranked if m["youth_unemployment_pct"]) / len(ranked), 2
        ) if ranked else None,
        "target": 6,
    }


@router.get("/trends")
async def youth_trends():
    """Multi-year youth metric trends."""
    supabase = get_supabase()
    metrics = (
        supabase.table("youth_metrics")
        .select("year, youth_unemployment_pct, secondary_enrollment_pct")
        .order("year")
        .execute()
    )

    year_data = {}
    for m in metrics.data:
        yr = m["year"]
        if yr not in year_data:
            year_data[yr] = {"unemployment": [], "enrollment": []}
        if m.get("youth_unemployment_pct"):
            year_data[yr]["unemployment"].append(m["youth_unemployment_pct"])
        if m.get("secondary_enrollment_pct"):
            year_data[yr]["enrollment"].append(m["secondary_enrollment_pct"])

    trends = []
    for yr in sorted(year_data.keys()):
        d = year_data[yr]
        trends.append({
            "year": yr,
            "avg_unemployment": round(sum(d["unemployment"]) / len(d["unemployment"]), 2) if d["unemployment"] else None,
            "avg_enrollment": round(sum(d["enrollment"]) / len(d["enrollment"]), 2) if d["enrollment"] else None,
            "countries_reporting": max(len(d["unemployment"]), len(d["enrollment"])),
        })

    return {"trends": trends}
