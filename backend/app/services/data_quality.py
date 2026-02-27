"""
Data Quality Service — Validates data completeness, timeliness, and consistency.
"""

import structlog
from datetime import datetime, timezone
from app.core.database import get_supabase

logger = structlog.get_logger()

# Expected year range
EXPECTED_YEARS = list(range(2000, 2025))
EXPECTED_YEAR_COUNT = len(EXPECTED_YEARS)


async def assess_data_quality() -> dict:
    """Run a full data quality assessment across all countries and indicators."""
    supabase = get_supabase()

    countries = supabase.table("member_states").select("id, name").execute()
    indicators = supabase.table("indicators").select("id, name, code").execute()

    scores = []
    for country in countries.data:
        for indicator in indicators.data:
            values = (
                supabase.table("indicator_values")
                .select("year, value, data_quality")
                .eq("member_state_id", country["id"])
                .eq("indicator_id", indicator["id"])
                .execute()
            )

            years_with_data = [v["year"] for v in values.data if v["value"] is not None]

            # Completeness: % of expected years with data
            completeness = (len(years_with_data) / EXPECTED_YEAR_COUNT) * 100 if EXPECTED_YEAR_COUNT else 0

            # Timeliness: how old is the latest data
            timeliness = (datetime.now().year - max(years_with_data)) if years_with_data else None

            # Consistency: check for suspicious jumps (>200% year-over-year change)
            sorted_values = sorted(
                [(v["year"], v["value"]) for v in values.data if v["value"] is not None],
                key=lambda x: x[0],
            )
            inconsistencies = 0
            for i in range(1, len(sorted_values)):
                prev_val = sorted_values[i - 1][1]
                curr_val = sorted_values[i][1]
                if prev_val != 0 and abs((curr_val - prev_val) / prev_val) > 2:
                    inconsistencies += 1
            consistency = max(0, 100 - (inconsistencies * 20)) if sorted_values else 0

            # Overall score
            t_score = max(0, 100 - (timeliness * 15)) if timeliness is not None else 0
            overall = (completeness * 0.4 + t_score * 0.3 + consistency * 0.3)

            scores.append({
                "member_state_id": country["id"],
                "indicator_id": indicator["id"],
                "completeness_pct": round(completeness, 2),
                "timeliness_years": timeliness,
                "consistency_score": round(consistency, 2),
                "overall_score": round(overall, 2),
                "assessed_at": datetime.now(timezone.utc).isoformat(),
            })

    # Batch upsert scores (in chunks)
    for i in range(0, len(scores), 200):
        chunk = scores[i:i + 200]
        supabase.table("data_quality_scores").upsert(chunk).execute()

    logger.info("data_quality_assessed", total_scores=len(scores))
    return {"total_scores": len(scores), "status": "completed"}


async def get_quality_overview() -> dict:
    """Get continental data quality overview."""
    supabase = get_supabase()

    scores = supabase.table("data_quality_scores").select("overall_score, member_state_id, indicator_id").execute()

    if not scores.data:
        return {
            "continental_avg_score": 0,
            "countries_with_good_data": 0,
            "countries_with_poor_data": 0,
            "most_complete_indicators": [],
            "least_complete_indicators": [],
            "gaps": [],
        }

    # Average by country
    country_scores = {}
    for s in scores.data:
        cid = s["member_state_id"]
        if cid not in country_scores:
            country_scores[cid] = []
        country_scores[cid].append(s["overall_score"])

    country_avgs = {cid: sum(vals) / len(vals) for cid, vals in country_scores.items()}
    overall_avg = sum(country_avgs.values()) / len(country_avgs) if country_avgs else 0

    good = len([v for v in country_avgs.values() if v > 70])
    poor = len([v for v in country_avgs.values() if v < 40])

    # Average by indicator
    indicator_scores = {}
    for s in scores.data:
        iid = s["indicator_id"]
        if iid not in indicator_scores:
            indicator_scores[iid] = []
        indicator_scores[iid].append(s["overall_score"])

    indicator_avgs = {iid: sum(vals) / len(vals) for iid, vals in indicator_scores.items()}

    # Get indicator names
    indicators = supabase.table("indicators").select("id, name").execute()
    ind_names = {i["id"]: i["name"] for i in indicators.data}

    sorted_indicators = sorted(indicator_avgs.items(), key=lambda x: x[1], reverse=True)
    most_complete = [{"indicator": ind_names.get(iid, ""), "score": round(v, 1)} for iid, v in sorted_indicators[:5]]
    least_complete = [{"indicator": ind_names.get(iid, ""), "score": round(v, 1)} for iid, v in sorted_indicators[-5:]]

    # Identify gaps (country-indicator combos with 0 data)
    gaps = [
        {"member_state_id": s["member_state_id"], "indicator_id": s["indicator_id"]}
        for s in scores.data
        if s["overall_score"] == 0
    ]

    return {
        "continental_avg_score": round(overall_avg, 1),
        "countries_with_good_data": good,
        "countries_with_poor_data": poor,
        "most_complete_indicators": most_complete,
        "least_complete_indicators": least_complete,
        "gaps": gaps[:20],
    }


async def get_quality_by_country() -> list[dict]:
    """Get data quality scores aggregated by country."""
    supabase = get_supabase()

    scores = supabase.table("data_quality_scores").select("overall_score, completeness_pct, member_state_id").execute()
    countries = supabase.table("member_states").select("id, name, iso_code").execute()

    country_names = {c["id"]: {"name": c["name"], "iso_code": c["iso_code"]} for c in countries.data}

    country_scores = {}
    for s in scores.data:
        cid = s["member_state_id"]
        if cid not in country_scores:
            country_scores[cid] = {"overall": [], "completeness": []}
        country_scores[cid]["overall"].append(s["overall_score"])
        if s.get("completeness_pct") is not None:
            country_scores[cid]["completeness"].append(s["completeness_pct"])

    result = []
    for cid, vals in country_scores.items():
        info = country_names.get(cid, {})
        result.append({
            "country_name": info.get("name"),
            "iso_code": info.get("iso_code"),
            "overall_score": round(sum(vals["overall"]) / len(vals["overall"]), 1),
            "completeness": round(sum(vals["completeness"]) / len(vals["completeness"]), 1) if vals["completeness"] else 0,
            "indicators_covered": len(vals["overall"]),
        })

    return sorted(result, key=lambda x: x["overall_score"], reverse=True)
