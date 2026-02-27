"""
Report Generator — Creates executive-quality PDF and Excel reports
following the Pyramid Principle (answer first, evidence second).
"""

import io
import structlog
from datetime import datetime, timezone
from app.core.database import get_supabase

logger = structlog.get_logger()


async def generate_executive_summary() -> dict:
    """Generate an executive summary report with insights."""
    supabase = get_supabase()

    # Gather key data
    insights = (
        supabase.table("insights")
        .select("*")
        .eq("is_active", True)
        .order("generated_at", desc=True)
        .execute()
    )

    critical = [i for i in insights.data if i["severity"] == "critical"]
    warnings = [i for i in insights.data if i["severity"] == "warning"]
    positive = [i for i in insights.data if i["severity"] == "positive"]
    findings = [i for i in insights.data if i["type"] == "finding"]
    recommendations = [i for i in insights.data if i["type"] == "recommendation"]

    # Build report structure
    report = {
        "title": f"AU Agenda 2063 Executive Summary — {datetime.now().strftime('%B %Y')}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sections": [
            {
                "heading": "Key Finding",
                "content": critical[0]["description"] if critical else (
                    findings[0]["description"] if findings else "No findings generated yet."
                ),
            },
            {
                "heading": "Critical Alerts",
                "items": [{"title": i["title"], "description": i["description"]} for i in critical[:5]],
            },
            {
                "heading": "Areas of Progress",
                "items": [{"title": i["title"], "description": i["description"]} for i in positive[:5]],
            },
            {
                "heading": "Warnings Requiring Attention",
                "items": [{"title": i["title"], "description": i["description"]} for i in warnings[:5]],
            },
            {
                "heading": "Recommendations",
                "items": [{"title": i["title"], "description": i["description"]} for i in recommendations[:5]],
            },
        ],
        "insight_ids": [i["id"] for i in insights.data],
        "summary_stats": {
            "total_insights": len(insights.data),
            "critical_alerts": len(critical),
            "warnings": len(warnings),
            "positive_trends": len(positive),
        },
    }

    # Save to database
    db_report = supabase.table("reports").insert({
        "title": report["title"],
        "report_type": "executive_summary",
        "parameters": {"type": "executive_summary"},
        "insights_included": report["insight_ids"][:50],
        "generated_at": report["generated_at"],
    }).execute()

    report["id"] = db_report.data[0]["id"] if db_report.data else None

    # Mark insights as included
    for iid in report["insight_ids"][:50]:
        supabase.table("insights").update({"included_in_report": True}).eq("id", iid).execute()

    return report


async def generate_gender_brief() -> dict:
    """Generate a gender analytics brief."""
    supabase = get_supabase()

    gender_insights = (
        supabase.table("insights")
        .select("*")
        .eq("is_active", True)
        .in_("goal_id", [_get_goal_id(supabase, 17)])
        .order("generated_at", desc=True)
        .execute()
    )

    # Latest gender metrics summary
    metrics = (
        supabase.table("gender_metrics")
        .select("*, member_states(name, iso_code)")
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

    parl_vals = [m["women_parliament_pct"] for m in latest if m.get("women_parliament_pct")]
    labor_vals = [m["women_labor_force_pct"] for m in latest if m.get("women_labor_force_pct")]

    report = {
        "title": f"Gender Equality Brief — {datetime.now().strftime('%B %Y')}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "key_metrics": {
            "avg_women_parliament": round(sum(parl_vals) / len(parl_vals), 1) if parl_vals else None,
            "avg_labor_force": round(sum(labor_vals) / len(labor_vals), 1) if labor_vals else None,
            "countries_above_30pct": len([v for v in parl_vals if v >= 30]),
            "countries_reporting": len(latest),
        },
        "insights": [
            {"title": i["title"], "description": i["description"], "severity": i["severity"]}
            for i in gender_insights.data[:10]
        ],
    }

    # Save
    supabase.table("reports").insert({
        "title": report["title"],
        "report_type": "gender_brief",
        "parameters": {"type": "gender_brief"},
        "generated_at": report["generated_at"],
    }).execute()

    return report


async def generate_country_profile_report(iso_code: str) -> dict:
    """Generate a country profile report."""
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

    # Key indicators
    values = (
        supabase.table("indicator_values")
        .select("value, year, indicators(name, code, unit, target_value)")
        .eq("member_state_id", country_id)
        .order("year", desc=True)
        .execute()
    )

    seen = set()
    indicators = []
    for v in values.data:
        code = v.get("indicators", {}).get("code")
        if code and code not in seen:
            seen.add(code)
            indicators.append({
                "name": v["indicators"]["name"],
                "value": v["value"],
                "year": v["year"],
                "unit": v["indicators"].get("unit"),
                "target": v["indicators"].get("target_value"),
            })

    # Country-specific insights
    country_insights = (
        supabase.table("insights")
        .select("*")
        .eq("member_state_id", country_id)
        .eq("is_active", True)
        .execute()
    )

    report = {
        "title": f"Country Profile: {country_data['name']}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "country": country_data,
        "indicators": indicators,
        "insights": [
            {"title": i["title"], "description": i["description"], "severity": i["severity"]}
            for i in country_insights.data
        ],
    }

    supabase.table("reports").insert({
        "title": report["title"],
        "report_type": "country_profile",
        "parameters": {"iso_code": iso_code.upper()},
        "generated_at": report["generated_at"],
    }).execute()

    return report


async def generate_excel_report() -> io.BytesIO:
    """Generate an Excel report with multiple sheets."""
    import xlsxwriter

    supabase = get_supabase()
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output)

    # Formats
    header_fmt = workbook.add_format({"bold": True, "bg_color": "#C8A415", "font_color": "white"})
    number_fmt = workbook.add_format({"num_format": "#,##0.00"})

    # Sheet 1: Goals Progress
    ws = workbook.add_worksheet("Goals Progress")
    goals = supabase.table("goals").select("*, aspirations(name)").order("number").execute()
    headers = ["Goal #", "Goal Name", "Aspiration", "Progress %", "Target 2063"]
    for col, h in enumerate(headers):
        ws.write(0, col, h, header_fmt)
    for row, g in enumerate(goals.data, 1):
        ws.write(row, 0, g["number"])
        ws.write(row, 1, g["name"])
        ws.write(row, 2, g.get("aspirations", {}).get("name", ""))
        ws.write(row, 3, g.get("current_progress") or 0, number_fmt)
        ws.write(row, 4, g.get("target_2063", ""))

    # Sheet 2: Member States
    ws2 = workbook.add_worksheet("Member States")
    countries = supabase.table("member_states").select("*, regions(name)").order("name").execute()
    headers2 = ["Country", "ISO Code", "Region", "AU Member Since"]
    for col, h in enumerate(headers2):
        ws2.write(0, col, h, header_fmt)
    for row, c in enumerate(countries.data, 1):
        ws2.write(row, 0, c["name"])
        ws2.write(row, 1, c["iso_code"])
        ws2.write(row, 2, c.get("regions", {}).get("name", "") if c.get("regions") else "")
        ws2.write(row, 3, c.get("au_membership_year") or "")

    # Sheet 3: Insights
    ws3 = workbook.add_worksheet("Insights")
    insights = supabase.table("insights").select("*").eq("is_active", True).order("generated_at", desc=True).execute()
    headers3 = ["Type", "Severity", "Title", "Description", "Generated"]
    for col, h in enumerate(headers3):
        ws3.write(0, col, h, header_fmt)
    for row, i in enumerate(insights.data, 1):
        ws3.write(row, 0, i["type"])
        ws3.write(row, 1, i["severity"])
        ws3.write(row, 2, i["title"])
        ws3.write(row, 3, i["description"])
        ws3.write(row, 4, i.get("generated_at", ""))

    workbook.close()
    output.seek(0)
    return output


def _get_goal_id(supabase, goal_number: int) -> int | None:
    result = supabase.table("goals").select("id").eq("number", goal_number).execute()
    return result.data[0]["id"] if result.data else None
