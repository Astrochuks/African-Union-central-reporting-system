"""Report Generation endpoints."""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.core.database import get_supabase
from app.core.auth import require_analyst
from app.services.report_generator import (
    generate_executive_summary,
    generate_gender_brief,
    generate_country_profile_report,
    generate_excel_report,
)
from app.models.schemas import ReportGenerateRequest

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate")
async def generate_report(request: ReportGenerateRequest, user: dict = Depends(require_analyst)):
    """Generate a report based on type."""
    if request.report_type == "executive_summary":
        return await generate_executive_summary()
    elif request.report_type == "gender_brief":
        return await generate_gender_brief()
    elif request.report_type == "country_profile":
        iso_code = (request.parameters or {}).get("iso_code", "NG")
        return await generate_country_profile_report(iso_code)
    else:
        return {"error": f"Report type '{request.report_type}' not yet implemented"}


@router.get("/export/excel")
async def export_excel():
    """Download full data export as Excel file."""
    output = await generate_excel_report()
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=au_agenda2063_report.xlsx"},
    )


@router.get("")
async def list_reports():
    """List all generated reports."""
    supabase = get_supabase()
    result = (
        supabase.table("reports")
        .select("*")
        .order("generated_at", desc=True)
        .execute()
    )
    return {"reports": result.data, "total": len(result.data)}


@router.get("/{report_id}")
async def get_report(report_id: int):
    """Get a specific report."""
    supabase = get_supabase()
    result = supabase.table("reports").select("*").eq("id", report_id).execute()
    if not result.data:
        return {"error": "Report not found"}
    return result.data[0]
