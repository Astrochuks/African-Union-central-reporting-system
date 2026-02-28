"""ETL Pipeline endpoints — trigger, status, data sources."""

from fastapi import APIRouter, BackgroundTasks, Depends
from app.core.database import get_supabase
from app.core.auth import require_admin
from app.services.etl_service import run_etl, seed_database
from app.services.insights_engine import generate_all_insights
from app.models.schemas import ETLTriggerRequest

router = APIRouter(prefix="/pipeline", tags=["ETL Pipeline"])


@router.post("/trigger")
async def trigger_pipeline(
    background_tasks: BackgroundTasks,
    request: ETLTriggerRequest | None = None,
    user: dict = Depends(require_admin),
):
    """
    Trigger a full ETL run: Extract from World Bank → Transform → Load → Generate Insights.

    Runs in the background. Check /pipeline/status for progress.
    """
    async def _run_pipeline():
        result = await run_etl(
            indicator_codes=request.indicators if request else None,
            countries=request.countries if request else None,
        )
        # Auto-generate insights after ETL
        if result.get("etl_run_id"):
            await generate_all_insights(result["etl_run_id"])

    background_tasks.add_task(_run_pipeline)
    return {"message": "ETL pipeline triggered. Check /pipeline/status for progress.", "status": "started"}


@router.post("/seed")
async def seed_db(user: dict = Depends(require_admin)):
    """Seed the database with aspirations, goals, member states, and indicator definitions."""
    result = await seed_database()
    return result


@router.get("/status")
async def pipeline_status():
    """Get ETL pipeline run history."""
    supabase = get_supabase()

    runs = (
        supabase.table("etl_runs")
        .select("*")
        .order("started_at", desc=True)
        .limit(20)
        .execute()
    )

    total_records = (
        supabase.table("indicator_values")
        .select("id", count="exact")
        .execute()
    )

    return {
        "runs": runs.data,
        "total_runs": len(runs.data),
        "total_data_records": total_records.count or 0,
    }


@router.get("/sources")
async def data_sources():
    """Get status of all data sources."""
    supabase = get_supabase()
    result = supabase.table("data_sources").select("*").execute()
    return {"sources": result.data}
