"""Gender Analytics endpoints (WGYD)."""

from fastapi import APIRouter
from app.core.database import get_supabase
from app.services.analytics_service import get_gender_overview

router = APIRouter(prefix="/gender", tags=["Gender Analytics"])


@router.get("/overview")
async def gender_overview():
    """Continental gender summary — key metrics across all AU states."""
    return await get_gender_overview()


@router.get("/by-country")
async def gender_by_country():
    """Gender metrics for each AU member state."""
    supabase = get_supabase()
    metrics = (
        supabase.table("gender_metrics")
        .select("*, member_states(name, iso_code, regions(name))")
        .order("year", desc=True)
        .execute()
    )

    # Latest per country
    seen = set()
    latest = []
    for m in metrics.data:
        cid = m["member_state_id"]
        if cid not in seen:
            seen.add(cid)
            latest.append(m)

    return {"data": latest, "total": len(latest)}


@router.get("/trends")
async def gender_trends():
    """Multi-year gender metric trends."""
    supabase = get_supabase()

    # Get continental averages per year for women in parliament
    metrics = (
        supabase.table("gender_metrics")
        .select("year, women_parliament_pct, women_labor_force_pct, gender_parity_education")
        .order("year")
        .execute()
    )

    year_data = {}
    for m in metrics.data:
        yr = m["year"]
        if yr not in year_data:
            year_data[yr] = {"parliament": [], "labor": [], "parity": []}
        if m.get("women_parliament_pct"):
            year_data[yr]["parliament"].append(m["women_parliament_pct"])
        if m.get("women_labor_force_pct"):
            year_data[yr]["labor"].append(m["women_labor_force_pct"])
        if m.get("gender_parity_education"):
            year_data[yr]["parity"].append(m["gender_parity_education"])

    trends = []
    for yr in sorted(year_data.keys()):
        d = year_data[yr]
        trends.append({
            "year": yr,
            "avg_women_parliament": round(sum(d["parliament"]) / len(d["parliament"]), 2) if d["parliament"] else None,
            "avg_labor_force": round(sum(d["labor"]) / len(d["labor"]), 2) if d["labor"] else None,
            "avg_parity_index": round(sum(d["parity"]) / len(d["parity"]), 3) if d["parity"] else None,
            "countries_reporting": max(len(d["parliament"]), len(d["labor"]), len(d["parity"])),
        })

    return {"trends": trends}


@router.get("/parity-index")
async def gender_parity_ranking():
    """Rank countries by gender parity index in education."""
    supabase = get_supabase()
    metrics = (
        supabase.table("gender_metrics")
        .select("gender_parity_education, year, member_states(name, iso_code)")
        .not_.is_("gender_parity_education", "null")
        .order("year", desc=True)
        .execute()
    )

    seen = set()
    latest = []
    for m in metrics.data:
        cname = m.get("member_states", {}).get("name")
        if cname and cname not in seen:
            seen.add(cname)
            latest.append(m)

    ranked = sorted(latest, key=lambda x: abs(1 - (x["gender_parity_education"] or 0)))
    return {
        "ranking": [
            {
                "rank": i + 1,
                "country": m["member_states"]["name"],
                "iso_code": m["member_states"]["iso_code"],
                "parity_index": m["gender_parity_education"],
                "year": m["year"],
            }
            for i, m in enumerate(ranked)
        ]
    }
