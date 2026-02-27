"""Data Quality endpoints."""

from fastapi import APIRouter
from app.services.data_quality import (
    assess_data_quality,
    get_quality_overview,
    get_quality_by_country,
)

router = APIRouter(prefix="/data-quality", tags=["Data Quality"])


@router.get("/overview")
async def quality_overview():
    """Get continental data quality overview."""
    return await get_quality_overview()


@router.get("/by-country")
async def quality_by_country():
    """Get data quality scores for each member state."""
    return {"scores": await get_quality_by_country()}


@router.post("/assess")
async def run_assessment():
    """Trigger a full data quality assessment."""
    return await assess_data_quality()


@router.get("/gaps")
async def data_gaps():
    """Identify missing data — countries and indicators with no data."""
    from app.core.database import get_supabase

    supabase = get_supabase()

    countries = supabase.table("member_states").select("id, name, iso_code").execute()
    indicators = supabase.table("indicators").select("id, name, code").execute()

    gaps = []
    for country in countries.data:
        for indicator in indicators.data:
            count = (
                supabase.table("indicator_values")
                .select("id", count="exact")
                .eq("member_state_id", country["id"])
                .eq("indicator_id", indicator["id"])
                .execute()
            )
            if (count.count or 0) == 0:
                gaps.append({
                    "country": country["name"],
                    "iso_code": country["iso_code"],
                    "indicator": indicator["name"],
                    "indicator_code": indicator["code"],
                })

    return {"gaps": gaps[:100], "total_gaps": len(gaps)}
