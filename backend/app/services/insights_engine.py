"""
Insights Engine — Automatically generates findings, alerts, trends,
recommendations, comparisons, and milestones from AU data.

After each ETL run, this engine analyzes loaded data and creates
insight records as first-class database objects.
"""

import structlog
from datetime import datetime, timezone
from app.core.database import get_supabase

logger = structlog.get_logger()


async def generate_all_insights(etl_run_id: int | None = None) -> dict:
    """
    Run all insight generators and return summary.

    Called after each ETL run to auto-generate insights.
    """
    supabase = get_supabase()

    # Deactivate old insights before generating new ones
    supabase.table("insights").update({"is_active": False}).eq("is_active", True).execute()

    insights_count = {
        "finding": 0,
        "alert": 0,
        "trend": 0,
        "recommendation": 0,
        "comparison": 0,
        "milestone": 0,
    }

    generators = [
        _generate_gender_findings,
        _generate_youth_alerts,
        _generate_health_findings,
        _generate_education_findings,
        _generate_economic_findings,
        _generate_infrastructure_findings,
        _generate_regional_comparisons,
        _generate_milestone_insights,
        _generate_trend_insights,
        _generate_recommendations,
    ]

    for gen in generators:
        try:
            results = await gen(supabase, etl_run_id)
            for r in results:
                insights_count[r["type"]] += 1
        except Exception as e:
            logger.error("insight_generation_error", generator=gen.__name__, error=str(e))

    total = sum(insights_count.values())

    # Update ETL run with insights count
    if etl_run_id:
        supabase.table("etl_runs").update(
            {"insights_generated": total}
        ).eq("id", etl_run_id).execute()

    logger.info("insights_generated", total=total, breakdown=insights_count)
    return {"total_insights": total, "by_type": insights_count}


def _insert_insight(supabase, insight: dict, etl_run_id: int | None = None) -> dict:
    """Insert a single insight record."""
    insight["generated_at"] = datetime.now(timezone.utc).isoformat()
    insight["is_active"] = True
    insight["included_in_report"] = False
    if etl_run_id:
        insight["etl_run_id"] = etl_run_id
    result = supabase.table("insights").insert(insight).execute()
    return result.data[0] if result.data else insight


def _get_latest_values(supabase, indicator_code: str) -> list[dict]:
    """Get the most recent value per country for an indicator."""
    indicator = supabase.table("indicators").select("id").eq("code", indicator_code).execute()
    if not indicator.data:
        return []
    indicator_id = indicator.data[0]["id"]

    # Get all values, ordered by year desc
    values = (
        supabase.table("indicator_values")
        .select("*, member_states(name, iso_code, region_id, regions(name))")
        .eq("indicator_id", indicator_id)
        .order("year", desc=True)
        .execute()
    )

    # Keep only the latest value per country
    seen = set()
    latest = []
    for v in values.data:
        cid = v["member_state_id"]
        if cid not in seen:
            seen.add(cid)
            latest.append(v)
    return latest


def _get_year_over_year(supabase, indicator_code: str) -> list[dict]:
    """Get year-over-year changes for an indicator by country."""
    indicator = supabase.table("indicators").select("id").eq("code", indicator_code).execute()
    if not indicator.data:
        return []
    indicator_id = indicator.data[0]["id"]

    values = (
        supabase.table("indicator_values")
        .select("*, member_states(name, iso_code, region_id)")
        .eq("indicator_id", indicator_id)
        .order("year", desc=True)
        .execute()
    )

    # Group by country
    by_country = {}
    for v in values.data:
        cid = v["member_state_id"]
        if cid not in by_country:
            by_country[cid] = []
        by_country[cid].append(v)

    changes = []
    for cid, vals in by_country.items():
        if len(vals) >= 2:
            latest = vals[0]
            previous = vals[1]
            if latest["value"] is not None and previous["value"] is not None and previous["value"] != 0:
                pct_change = ((latest["value"] - previous["value"]) / abs(previous["value"])) * 100
                changes.append({
                    "member_state_id": cid,
                    "country_name": latest["member_states"]["name"],
                    "iso_code": latest["member_states"]["iso_code"],
                    "latest_year": latest["year"],
                    "latest_value": latest["value"],
                    "previous_year": previous["year"],
                    "previous_value": previous["value"],
                    "pct_change": round(pct_change, 2),
                    "region_id": latest["member_states"].get("region_id"),
                })
    return changes


# ── Gender Findings ─────────────────────────────────────────────────

async def _generate_gender_findings(supabase, etl_run_id) -> list[dict]:
    insights = []

    # Women in parliament analysis
    latest = _get_latest_values(supabase, "SG.GEN.PARL.ZS")
    if latest:
        above_30 = [v for v in latest if v["value"] and v["value"] >= 30]
        below_15 = [v for v in latest if v["value"] and v["value"] < 15]
        total_with_data = len([v for v in latest if v["value"] is not None])

        if total_with_data > 0:
            avg = sum(v["value"] for v in latest if v["value"]) / total_with_data

            insights.append(_insert_insight(supabase, {
                "type": "finding",
                "severity": "warning" if len(above_30) < total_with_data * 0.3 else "neutral",
                "title": f"Only {len(above_30)} of {total_with_data} AU member states have >30% women in parliament",
                "description": (
                    f"The continental average for women's representation in national parliament is {avg:.1f}%. "
                    f"{len(above_30)} countries exceed the 30% threshold, while {len(below_15)} countries "
                    f"remain below 15%. The Agenda 2063 target is 50% representation."
                ),
                "evidence": {
                    "indicator": "SG.GEN.PARL.ZS",
                    "countries_above_30": len(above_30),
                    "countries_below_15": len(below_15),
                    "continental_avg": round(avg, 2),
                    "total_countries": total_with_data,
                    "target": 50,
                },
                "goal_id": _get_goal_id(supabase, 17),
            }, etl_run_id))

        # Top and bottom performers
        sorted_vals = sorted([v for v in latest if v["value"]], key=lambda x: x["value"], reverse=True)
        if len(sorted_vals) >= 3:
            top3 = sorted_vals[:3]
            bottom3 = sorted_vals[-3:]
            insights.append(_insert_insight(supabase, {
                "type": "comparison",
                "severity": "neutral",
                "title": "Women in parliament: Top vs bottom AU performers",
                "description": (
                    f"Leaders: {top3[0]['member_states']['name']} ({top3[0]['value']:.1f}%), "
                    f"{top3[1]['member_states']['name']} ({top3[1]['value']:.1f}%), "
                    f"{top3[2]['member_states']['name']} ({top3[2]['value']:.1f}%). "
                    f"Lagging: {bottom3[-1]['member_states']['name']} ({bottom3[-1]['value']:.1f}%), "
                    f"{bottom3[-2]['member_states']['name']} ({bottom3[-2]['value']:.1f}%), "
                    f"{bottom3[-3]['member_states']['name']} ({bottom3[-3]['value']:.1f}%)."
                ),
                "evidence": {
                    "indicator": "SG.GEN.PARL.ZS",
                    "top_3": [{"country": v["member_states"]["name"], "value": v["value"]} for v in top3],
                    "bottom_3": [{"country": v["member_states"]["name"], "value": v["value"]} for v in bottom3],
                },
                "goal_id": _get_goal_id(supabase, 17),
            }, etl_run_id))

    return insights


# ── Youth Alerts ────────────────────────────────────────────────────

async def _generate_youth_alerts(supabase, etl_run_id) -> list[dict]:
    insights = []

    # Youth unemployment
    latest = _get_latest_values(supabase, "SL.UEM.1524.ZS")
    if latest:
        high_unemployment = [v for v in latest if v["value"] and v["value"] > 30]
        total_with_data = len([v for v in latest if v["value"] is not None])

        if high_unemployment:
            countries = ", ".join(
                f"{v['member_states']['name']} ({v['value']:.1f}%)"
                for v in sorted(high_unemployment, key=lambda x: x["value"], reverse=True)[:5]
            )
            insights.append(_insert_insight(supabase, {
                "type": "alert",
                "severity": "critical",
                "title": f"{len(high_unemployment)} AU countries have youth unemployment above 30%",
                "description": (
                    f"Critical youth employment crisis: {len(high_unemployment)} member states report "
                    f"youth unemployment rates exceeding 30%. Highest: {countries}. "
                    f"The Agenda 2063 target is below 6%."
                ),
                "evidence": {
                    "indicator": "SL.UEM.1524.ZS",
                    "countries_above_30": len(high_unemployment),
                    "target": 6,
                    "highest": [
                        {"country": v["member_states"]["name"], "value": round(v["value"], 1)}
                        for v in sorted(high_unemployment, key=lambda x: x["value"], reverse=True)[:5]
                    ],
                },
                "goal_id": _get_goal_id(supabase, 18),
            }, etl_run_id))

        # Year-over-year changes
        changes = _get_year_over_year(supabase, "SL.UEM.1524.ZS")
        worsening = [c for c in changes if c["pct_change"] > 10]  # >10% increase
        if worsening:
            for c in sorted(worsening, key=lambda x: x["pct_change"], reverse=True)[:3]:
                insights.append(_insert_insight(supabase, {
                    "type": "alert",
                    "severity": "warning",
                    "title": f"Youth unemployment in {c['country_name']} rose {c['pct_change']:.0f}% year-over-year",
                    "description": (
                        f"Youth unemployment in {c['country_name']} increased from "
                        f"{c['previous_value']:.1f}% ({c['previous_year']}) to "
                        f"{c['latest_value']:.1f}% ({c['latest_year']}), a {c['pct_change']:.1f}% increase."
                    ),
                    "evidence": {
                        "indicator": "SL.UEM.1524.ZS",
                        "country": c["country_name"],
                        "iso_code": c["iso_code"],
                        "previous": c["previous_value"],
                        "current": c["latest_value"],
                        "change_pct": c["pct_change"],
                    },
                    "goal_id": _get_goal_id(supabase, 18),
                    "member_state_id": c["member_state_id"],
                }, etl_run_id))

    return insights


# ── Health Findings ─────────────────────────────────────────────────

async def _generate_health_findings(supabase, etl_run_id) -> list[dict]:
    insights = []

    # Life expectancy
    latest = _get_latest_values(supabase, "SP.DYN.LE00.IN")
    if latest:
        with_data = [v for v in latest if v["value"] is not None]
        if with_data:
            avg = sum(v["value"] for v in with_data) / len(with_data)
            below_60 = [v for v in with_data if v["value"] < 60]

            insights.append(_insert_insight(supabase, {
                "type": "finding",
                "severity": "warning" if avg < 65 else "neutral",
                "title": f"Continental average life expectancy: {avg:.1f} years (target: 75)",
                "description": (
                    f"Across {len(with_data)} AU member states, the average life expectancy is "
                    f"{avg:.1f} years. {len(below_60)} countries remain below 60 years. "
                    f"The Agenda 2063 target is 75 years."
                ),
                "evidence": {
                    "indicator": "SP.DYN.LE00.IN",
                    "continental_avg": round(avg, 1),
                    "countries_below_60": len(below_60),
                    "target": 75,
                },
                "goal_id": _get_goal_id(supabase, 3),
            }, etl_run_id))

    # Maternal mortality
    latest_mmr = _get_latest_values(supabase, "SH.STA.MMRT")
    if latest_mmr:
        with_data = [v for v in latest_mmr if v["value"] is not None]
        critical = [v for v in with_data if v["value"] > 500]
        if critical:
            insights.append(_insert_insight(supabase, {
                "type": "alert",
                "severity": "critical",
                "title": f"{len(critical)} AU countries have maternal mortality >500 per 100,000",
                "description": (
                    f"{len(critical)} member states report maternal mortality ratios exceeding "
                    f"500 per 100,000 live births — critically above the Agenda 2063 target of 50."
                ),
                "evidence": {
                    "indicator": "SH.STA.MMRT",
                    "countries_above_500": len(critical),
                    "target": 50,
                    "highest": [
                        {"country": v["member_states"]["name"], "value": round(v["value"])}
                        for v in sorted(critical, key=lambda x: x["value"], reverse=True)[:5]
                    ],
                },
                "goal_id": _get_goal_id(supabase, 3),
            }, etl_run_id))

    return insights


# ── Education Findings ──────────────────────────────────────────────

async def _generate_education_findings(supabase, etl_run_id) -> list[dict]:
    insights = []

    latest = _get_latest_values(supabase, "SE.ADT.LITR.ZS")
    if latest:
        with_data = [v for v in latest if v["value"] is not None]
        if with_data:
            avg = sum(v["value"] for v in with_data) / len(with_data)
            below_50 = [v for v in with_data if v["value"] < 50]

            insights.append(_insert_insight(supabase, {
                "type": "finding",
                "severity": "warning" if len(below_50) > 5 else "neutral",
                "title": f"Continental adult literacy rate: {avg:.1f}% (target: 100%)",
                "description": (
                    f"The average adult literacy rate across {len(with_data)} reporting AU states is "
                    f"{avg:.1f}%. {len(below_50)} countries report literacy rates below 50%."
                ),
                "evidence": {
                    "indicator": "SE.ADT.LITR.ZS",
                    "continental_avg": round(avg, 1),
                    "countries_below_50": len(below_50),
                    "target": 100,
                },
                "goal_id": _get_goal_id(supabase, 2),
            }, etl_run_id))

    return insights


# ── Economic Findings ───────────────────────────────────────────────

async def _generate_economic_findings(supabase, etl_run_id) -> list[dict]:
    insights = []

    latest = _get_latest_values(supabase, "NY.GDP.PCAP.CD")
    if latest:
        with_data = [v for v in latest if v["value"] is not None]
        if with_data:
            avg = sum(v["value"] for v in with_data) / len(with_data)
            below_1000 = [v for v in with_data if v["value"] < 1000]

            insights.append(_insert_insight(supabase, {
                "type": "finding",
                "severity": "neutral",
                "title": f"Continental average GDP per capita: ${avg:,.0f} (target: $12,000)",
                "description": (
                    f"Average GDP per capita across {len(with_data)} AU states is ${avg:,.0f}. "
                    f"{len(below_1000)} countries remain below $1,000 per capita. "
                    f"The Agenda 2063 target is $12,000+."
                ),
                "evidence": {
                    "indicator": "NY.GDP.PCAP.CD",
                    "continental_avg": round(avg, 2),
                    "countries_below_1000": len(below_1000),
                    "target": 12000,
                },
                "goal_id": _get_goal_id(supabase, 1),
            }, etl_run_id))

    return insights


# ── Infrastructure Findings ─────────────────────────────────────────

async def _generate_infrastructure_findings(supabase, etl_run_id) -> list[dict]:
    insights = []

    # Internet usage
    latest = _get_latest_values(supabase, "IT.NET.USER.ZS")
    if latest:
        with_data = [v for v in latest if v["value"] is not None]
        if with_data:
            avg = sum(v["value"] for v in with_data) / len(with_data)
            below_20 = [v for v in with_data if v["value"] < 20]

            insights.append(_insert_insight(supabase, {
                "type": "finding",
                "severity": "warning" if avg < 40 else "neutral",
                "title": f"Internet penetration: {avg:.1f}% continental average (target: 100%)",
                "description": (
                    f"Only {avg:.1f}% of the continental population uses the Internet. "
                    f"{len(below_20)} AU states have internet penetration below 20%, "
                    f"limiting digital transformation progress toward Agenda 2063."
                ),
                "evidence": {
                    "indicator": "IT.NET.USER.ZS",
                    "continental_avg": round(avg, 1),
                    "countries_below_20": len(below_20),
                    "target": 100,
                },
                "goal_id": _get_goal_id(supabase, 10),
            }, etl_run_id))

    # Electricity access
    latest_elec = _get_latest_values(supabase, "EG.ELC.ACCS.ZS")
    if latest_elec:
        with_data = [v for v in latest_elec if v["value"] is not None]
        if with_data:
            avg = sum(v["value"] for v in with_data) / len(with_data)
            below_50 = [v for v in with_data if v["value"] < 50]

            if len(below_50) > 10:
                insights.append(_insert_insight(supabase, {
                    "type": "alert",
                    "severity": "warning",
                    "title": f"{len(below_50)} AU countries have <50% electricity access",
                    "description": (
                        f"Electricity access remains below 50% in {len(below_50)} member states. "
                        f"Continental average is {avg:.1f}%. Universal electricity access is a "
                        f"prerequisite for Agenda 2063 Goal 10 (world-class infrastructure)."
                    ),
                    "evidence": {
                        "indicator": "EG.ELC.ACCS.ZS",
                        "continental_avg": round(avg, 1),
                        "countries_below_50": len(below_50),
                        "target": 100,
                    },
                    "goal_id": _get_goal_id(supabase, 10),
                }, etl_run_id))

    return insights


# ── Regional Comparisons ───────────────────────────────────────────

async def _generate_regional_comparisons(supabase, etl_run_id) -> list[dict]:
    insights = []

    # Compare regions on key indicators
    for indicator_code, label in [
        ("NY.GDP.PCAP.CD", "GDP per capita"),
        ("SP.DYN.LE00.IN", "life expectancy"),
        ("IT.NET.USER.ZS", "internet penetration"),
    ]:
        latest = _get_latest_values(supabase, indicator_code)
        if not latest:
            continue

        # Group by region
        by_region = {}
        for v in latest:
            if v["value"] is None:
                continue
            ms = v.get("member_states", {})
            region_data = ms.get("regions")
            region_name = region_data["name"] if region_data else "Unknown"
            if region_name not in by_region:
                by_region[region_name] = []
            by_region[region_name].append(v["value"])

        if len(by_region) >= 2:
            region_avgs = {
                r: round(sum(vals) / len(vals), 2)
                for r, vals in by_region.items()
                if vals and r != "Unknown"
            }
            if region_avgs:
                best = max(region_avgs, key=region_avgs.get)
                worst = min(region_avgs, key=region_avgs.get)

                if region_avgs[best] != region_avgs[worst]:
                    insights.append(_insert_insight(supabase, {
                        "type": "comparison",
                        "severity": "neutral",
                        "title": f"{label.title()}: {best} leads ({region_avgs[best]:,.1f}), {worst} lags ({region_avgs[worst]:,.1f})",
                        "description": (
                            f"Regional comparison for {label}: {best} leads with an average of "
                            f"{region_avgs[best]:,.1f}, while {worst} lags at {region_avgs[worst]:,.1f}. "
                            f"Regional breakdown: {', '.join(f'{r}: {v:,.1f}' for r, v in sorted(region_avgs.items(), key=lambda x: x[1], reverse=True))}."
                        ),
                        "evidence": {
                            "indicator": indicator_code,
                            "regional_averages": region_avgs,
                            "best_region": best,
                            "worst_region": worst,
                        },
                    }, etl_run_id))

    return insights


# ── Milestone Insights ──────────────────────────────────────────────

async def _generate_milestone_insights(supabase, etl_run_id) -> list[dict]:
    insights = []

    # Check goals with indicators that have targets
    indicators = supabase.table("indicators").select("*").not_.is_("target_value", "null").execute()

    for ind in indicators.data:
        if ind["target_value"] is None:
            continue

        latest = _get_latest_values(supabase, ind["code"])
        if not latest:
            continue

        with_data = [v for v in latest if v["value"] is not None]
        if not with_data:
            continue

        avg = sum(v["value"] for v in with_data) / len(with_data)
        target = float(ind["target_value"])

        # Calculate progress (handle inverted indicators like mortality)
        inverted = ind["code"] in ["SH.STA.MMRT", "SH.DYN.MORT", "SI.POV.DDAY", "SL.UEM.1524.ZS", "EN.ATM.CO2E.PC", "SP.ADO.TFRT", "SH.HIV.INCD.TL.P3"]

        if inverted:
            baseline = ind.get("baseline_value") or (avg * 2)
            if baseline > target:
                progress = max(0, min(100, ((baseline - avg) / (baseline - target)) * 100))
            else:
                progress = 100 if avg <= target else 0
        else:
            if target > 0:
                progress = min(100, (avg / target) * 100)
            else:
                progress = 0

        progress = round(progress, 1)

        if progress >= 60:
            severity = "positive"
            status = "on track" if progress >= 75 else "progressing"
        elif progress >= 30:
            severity = "warning"
            status = "needs acceleration"
        else:
            severity = "critical"
            status = "significantly off track"

        # Only generate for notable milestones
        if progress >= 50 or progress <= 20:
            insights.append(_insert_insight(supabase, {
                "type": "milestone",
                "severity": severity,
                "title": f"{ind['name']}: {progress}% toward 2063 target — {status}",
                "description": (
                    f"Continental average for {ind['name']} is {avg:,.1f} {ind.get('unit', '')}. "
                    f"Target: {target:,.1f}. Progress: {progress}% — {status}."
                ),
                "evidence": {
                    "indicator": ind["code"],
                    "current_avg": round(avg, 2),
                    "target": target,
                    "progress_pct": progress,
                    "countries_reporting": len(with_data),
                },
                "goal_id": ind.get("goal_id"),
                "indicator_id": ind["id"],
            }, etl_run_id))

    return insights


# ── Trend Insights ──────────────────────────────────────────────────

async def _generate_trend_insights(supabase, etl_run_id) -> list[dict]:
    insights = []

    for indicator_code, label in [
        ("SG.GEN.PARL.ZS", "Women in parliament"),
        ("SP.DYN.LE00.IN", "Life expectancy"),
        ("IT.NET.USER.ZS", "Internet penetration"),
        ("EG.ELC.ACCS.ZS", "Electricity access"),
    ]:
        changes = _get_year_over_year(supabase, indicator_code)
        if not changes:
            continue

        improving = [c for c in changes if c["pct_change"] > 5]
        declining = [c for c in changes if c["pct_change"] < -5]

        if len(improving) > len(changes) * 0.6 and len(changes) >= 10:
            insights.append(_insert_insight(supabase, {
                "type": "trend",
                "severity": "positive",
                "title": f"{label}: Positive continental trend — {len(improving)} of {len(changes)} countries improving",
                "description": (
                    f"{label} is improving across the continent. {len(improving)} of {len(changes)} "
                    f"countries with data show positive year-over-year changes."
                ),
                "evidence": {
                    "indicator": indicator_code,
                    "improving_countries": len(improving),
                    "total_countries": len(changes),
                    "declining_countries": len(declining),
                },
            }, etl_run_id))
        elif len(declining) > len(changes) * 0.4 and declining:
            insights.append(_insert_insight(supabase, {
                "type": "trend",
                "severity": "warning",
                "title": f"{label}: Concerning trend — {len(declining)} countries declining",
                "description": (
                    f"{label} is declining in {len(declining)} of {len(changes)} countries. "
                    f"This warrants attention and potential intervention."
                ),
                "evidence": {
                    "indicator": indicator_code,
                    "declining_countries": len(declining),
                    "total_countries": len(changes),
                },
            }, etl_run_id))

    return insights


# ── Recommendations ─────────────────────────────────────────────────

async def _generate_recommendations(supabase, etl_run_id) -> list[dict]:
    insights = []

    # Recommendation: Youth employment intervention
    latest_youth = _get_latest_values(supabase, "SL.UEM.1524.ZS")
    if latest_youth:
        critical = [v for v in latest_youth if v["value"] and v["value"] > 25]
        if len(critical) >= 5:
            # Group by region
            by_region = {}
            for v in critical:
                ms = v.get("member_states", {})
                region_data = ms.get("regions")
                rname = region_data["name"] if region_data else "Unknown"
                if rname not in by_region:
                    by_region[rname] = []
                by_region[rname].append(v["member_states"]["name"])

            worst_region = max(by_region, key=lambda r: len(by_region[r]))
            insights.append(_insert_insight(supabase, {
                "type": "recommendation",
                "severity": "warning",
                "title": f"Prioritize youth employment interventions in {worst_region} ({len(by_region[worst_region])} countries above 25%)",
                "description": (
                    f"{worst_region} has {len(by_region[worst_region])} countries with youth unemployment "
                    f"above 25%: {', '.join(by_region[worst_region])}. Targeted interventions are needed "
                    f"to meet the Agenda 2063 target of <6% youth unemployment."
                ),
                "evidence": {
                    "indicator": "SL.UEM.1524.ZS",
                    "region": worst_region,
                    "countries": by_region[worst_region],
                    "target": 6,
                },
                "goal_id": _get_goal_id(supabase, 18),
            }, etl_run_id))

    # Recommendation: Digital infrastructure
    latest_internet = _get_latest_values(supabase, "IT.NET.USER.ZS")
    if latest_internet:
        low_internet = [v for v in latest_internet if v["value"] and v["value"] < 25]
        if len(low_internet) >= 5:
            insights.append(_insert_insight(supabase, {
                "type": "recommendation",
                "severity": "warning",
                "title": f"Accelerate digital infrastructure in {len(low_internet)} underconnected AU states",
                "description": (
                    f"{len(low_internet)} AU member states have internet penetration below 25%. "
                    f"Digital infrastructure investment is critical for Agenda 2063 Goal 10 "
                    f"and enabling e-governance, digital trade, and modern service delivery."
                ),
                "evidence": {
                    "indicator": "IT.NET.USER.ZS",
                    "countries_below_25": len(low_internet),
                    "countries": [v["member_states"]["name"] for v in low_internet[:10]],
                },
                "goal_id": _get_goal_id(supabase, 10),
            }, etl_run_id))

    return insights


# ── Helpers ─────────────────────────────────────────────────────────

def _get_goal_id(supabase, goal_number: int) -> int | None:
    """Get goal database ID from goal number."""
    result = supabase.table("goals").select("id").eq("number", goal_number).execute()
    return result.data[0]["id"] if result.data else None
