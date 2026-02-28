"""AI Chat endpoint — rule-based data querying with natural language interface."""

import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_supabase

router = APIRouter(prefix="/chat", tags=["AI Chat"])

# Country name → ISO code mapping (common names + official)
COUNTRY_MAP = {
    "nigeria": "NG", "south africa": "ZA", "kenya": "KE", "egypt": "EG",
    "ethiopia": "ET", "ghana": "GH", "morocco": "MA", "tanzania": "TZ",
    "rwanda": "RW", "senegal": "SN", "uganda": "UG", "cameroon": "CM",
    "mozambique": "MZ", "angola": "AO", "algeria": "DZ", "tunisia": "TN",
    "libya": "LY", "sudan": "SD", "south sudan": "SS", "somalia": "SO",
    "djibouti": "DJ", "eritrea": "ER", "mali": "ML", "niger": "NE",
    "chad": "TD", "burkina faso": "BF", "benin": "BJ", "togo": "TG",
    "guinea": "GN", "sierra leone": "SL", "liberia": "LR",
    "cote d'ivoire": "CI", "ivory coast": "CI", "congo": "CG",
    "drc": "CD", "dr congo": "CD", "gabon": "GA", "equatorial guinea": "GQ",
    "zimbabwe": "ZW", "zambia": "ZM", "malawi": "MW", "madagascar": "MG",
    "mauritius": "MU", "eswatini": "SZ", "swaziland": "SZ",
    "lesotho": "LS", "botswana": "BW", "namibia": "NA",
    "cabo verde": "CV", "cape verde": "CV", "mauritania": "MR",
    "guinea-bissau": "GW", "gambia": "GM", "sao tome": "ST",
    "comoros": "KM", "seychelles": "SC", "central african republic": "CF",
    "burundi": "BI",
}

# Indicator keyword → World Bank code mapping
INDICATOR_MAP = {
    "women in parliament": "SG.GEN.PARL.ZS",
    "parliament": "SG.GEN.PARL.ZS",
    "gender parity": "SE.ENR.PRIM.FM.ZS",
    "female labor": "SL.TLF.CACT.FE.ZS",
    "women labor": "SL.TLF.CACT.FE.ZS",
    "maternal mortality": "SH.STA.MMRT",
    "adolescent fertility": "SP.ADO.TFRT",
    "youth unemployment": "SL.UEM.1524.ZS",
    "youth employment": "SL.UEM.1524.ZS",
    "gdp": "NY.GDP.PCAP.CD",
    "gdp per capita": "NY.GDP.PCAP.CD",
    "life expectancy": "SP.DYN.LE00.IN",
    "literacy": "SE.ADT.LITR.ZS",
    "adult literacy": "SE.ADT.LITR.ZS",
    "primary enrollment": "SE.PRM.ENRR",
    "secondary enrollment": "SE.SEC.ENRR",
    "internet": "IT.NET.USER.ZS",
    "internet penetration": "IT.NET.USER.ZS",
    "electricity": "EG.ELC.ACCS.ZS",
    "electricity access": "EG.ELC.ACCS.ZS",
    "mobile": "IT.CEL.SETS.P2",
    "mobile subscriptions": "IT.CEL.SETS.P2",
    "poverty": "SI.POV.DDAY",
    "manufacturing": "NV.IND.MANF.ZS",
    "fdi": "BX.KLT.DINV.WD.GD.ZS",
    "agriculture": "NV.AGR.TOTL.ZS",
    "co2": "EN.ATM.CO2E.PC",
    "renewable energy": "EG.FEC.RNEW.ZS",
    "under-5 mortality": "SH.DYN.MORT",
    "child mortality": "SH.DYN.MORT",
    "hiv": "SH.HIV.INCD.TL.P3",
    "tax revenue": "GC.TAX.TOTL.GD.ZS",
}


class ChatRequest(BaseModel):
    message: str
    history: Optional[list] = None


class ChatResponse(BaseModel):
    response: str
    data: Optional[dict] = None
    suggested_follow_ups: Optional[list] = None


def extract_countries(text: str) -> list[str]:
    """Extract country ISO codes from text."""
    text_lower = text.lower()
    found = []
    # Check long names first to avoid partial matches
    for name, iso in sorted(COUNTRY_MAP.items(), key=lambda x: -len(x[0])):
        if name in text_lower:
            found.append(iso)
            text_lower = text_lower.replace(name, "")
    # Also check direct ISO codes (2-letter uppercase)
    for match in re.findall(r'\b([A-Z]{2})\b', text):
        if match in {v for v in COUNTRY_MAP.values()}:
            found.append(match)
    return list(dict.fromkeys(found))  # deduplicate preserving order


def extract_indicator(text: str) -> Optional[str]:
    """Extract indicator code from text."""
    text_lower = text.lower()
    for keyword, code in sorted(INDICATOR_MAP.items(), key=lambda x: -len(x[0])):
        if keyword in text_lower:
            return code
    return None


def detect_intent(text: str) -> str:
    """Detect user intent from the message."""
    text_lower = text.lower()
    if any(w in text_lower for w in ["compare", "vs", "versus", "difference between"]):
        return "compare"
    if any(w in text_lower for w in ["trend", "over time", "historical", "progress"]):
        return "trend"
    if any(w in text_lower for w in ["rank", "top", "best", "worst", "highest", "lowest", "leading"]):
        return "ranking"
    if any(w in text_lower for w in ["critical", "alert", "warning", "crisis"]):
        return "alerts"
    if any(w in text_lower for w in ["recommend", "suggestion", "what should", "intervention"]):
        return "recommendations"
    if any(w in text_lower for w in ["insight", "finding"]):
        return "insights"
    if any(w in text_lower for w in ["quality", "completeness", "missing data", "data gap"]):
        return "data_quality"
    if any(w in text_lower for w in ["how many", "total", "count"]):
        return "count"
    if any(w in text_lower for w in ["region", "regional"]):
        return "regional"
    return "general"


@router.post("")
async def chat(request: ChatRequest):
    """
    AI-powered chat interface for querying AU data.

    Analyzes the user's natural language question, extracts relevant
    entities (countries, indicators, intents), and queries the database
    to provide data-backed responses.
    """
    supabase = get_supabase()
    message = request.message.strip()
    countries = extract_countries(message)
    indicator_code = extract_indicator(message)
    intent = detect_intent(message)

    try:
        # Handle critical alerts / insights queries
        if intent == "alerts":
            result = supabase.table("insights").select("*").eq(
                "is_active", True
            ).eq("severity", "critical").execute()
            alerts = result.data or []
            if alerts:
                alert_texts = [f"- **{a['title']}**: {a['description']}" for a in alerts[:5]]
                return ChatResponse(
                    response=f"There are **{len(alerts)} critical alerts** currently active:\n\n" + "\n\n".join(alert_texts),
                    data={"total_critical": len(alerts), "alerts": [{"title": a["title"], "severity": a["severity"]} for a in alerts[:5]]},
                    suggested_follow_ups=["What are the recommendations?", "Which countries are most affected?", "Show me the full insights summary"],
                )
            return ChatResponse(
                response="Good news! There are currently **no critical alerts**. The system is monitoring 55 member states across 24 indicators.",
                suggested_follow_ups=["Show me all insights", "What is the continental progress?"],
            )

        # Handle recommendations
        if intent == "recommendations":
            result = supabase.table("insights").select("*").eq(
                "is_active", True
            ).eq("type", "recommendation").execute()
            recs = result.data or []
            if recs:
                rec_texts = [f"- {r['title']}" for r in recs[:5]]
                return ChatResponse(
                    response=f"Here are the top **{min(len(recs), 5)} recommendations** from the insights engine:\n\n" + "\n".join(rec_texts),
                    data={"total_recommendations": len(recs)},
                    suggested_follow_ups=["What are the critical alerts?", "Show me gender analytics"],
                )

        # Handle insights summary
        if intent == "insights":
            result = supabase.table("insights").select("type, severity").eq("is_active", True).execute()
            insights = result.data or []
            by_type = {}
            by_severity = {}
            for i in insights:
                by_type[i["type"]] = by_type.get(i["type"], 0) + 1
                by_severity[i["severity"]] = by_severity.get(i["severity"], 0) + 1
            type_str = ", ".join(f"{v} {k}s" for k, v in sorted(by_type.items(), key=lambda x: -x[1]))
            return ChatResponse(
                response=f"The insights engine currently has **{len(insights)} active insights**: {type_str}.\n\nBy severity: {by_severity.get('critical', 0)} critical, {by_severity.get('warning', 0)} warnings, {by_severity.get('positive', 0)} positive.",
                data={"total": len(insights), "by_type": by_type, "by_severity": by_severity},
                suggested_follow_ups=["Show me critical alerts", "What are the recommendations?", "Which goals are on track?"],
            )

        # Handle data quality queries
        if intent == "data_quality":
            scores = supabase.table("data_quality_scores").select("overall_score").execute()
            if scores.data:
                avg_score = sum(s["overall_score"] for s in scores.data if s["overall_score"]) / max(len(scores.data), 1)
                good = sum(1 for s in scores.data if s.get("overall_score", 0) and s["overall_score"] > 70)
                poor = sum(1 for s in scores.data if s.get("overall_score", 0) and s["overall_score"] < 40)
                return ChatResponse(
                    response=f"The continental data quality score averages **{avg_score:.1f}/100**. {good} countries have good data quality (>70), while {poor} countries have poor data quality (<40).",
                    data={"avg_score": round(avg_score, 1), "good_data_countries": good, "poor_data_countries": poor},
                    suggested_follow_ups=["Which countries have the best data?", "What indicators are most complete?"],
                )

        # Handle specific country profile
        if countries and not indicator_code and intent == "general":
            iso = countries[0]
            country = supabase.table("member_states").select(
                "name, iso_code, population, gdp_per_capita, au_membership_year, regions(name)"
            ).eq("iso_code", iso).single().execute()
            if country.data:
                c = country.data
                region = c.get("regions", {}).get("name", "Unknown") if c.get("regions") else "Unknown"
                pop = f"{c.get('population', 0):,}" if c.get("population") else "N/A"
                gdp = f"${c.get('gdp_per_capita', 0):,.0f}" if c.get("gdp_per_capita") else "N/A"

                # Get latest gender and youth metrics
                gender = supabase.table("gender_metrics").select("*").eq(
                    "member_state_id", supabase.table("member_states").select("id").eq("iso_code", iso).single().execute().data["id"]
                ).order("year", desc=True).limit(1).execute()

                response = f"**{c['name']}** ({iso})\n\n"
                response += f"- **Region**: {region}\n"
                response += f"- **Population**: {pop}\n"
                response += f"- **GDP per capita**: {gdp}\n"
                response += f"- **AU Member since**: {c.get('au_membership_year', 'N/A')}\n"

                if gender.data:
                    g = gender.data[0]
                    if g.get("women_parliament_pct"):
                        response += f"- **Women in Parliament**: {g['women_parliament_pct']:.1f}%\n"
                    if g.get("women_labor_force_pct"):
                        response += f"- **Female Labor Force**: {g['women_labor_force_pct']:.1f}%\n"

                return ChatResponse(
                    response=response,
                    data={"country": c["name"], "iso": iso, "region": region},
                    suggested_follow_ups=[
                        f"What is {c['name']}'s Agenda 2063 progress?",
                        f"Compare {c['name']} with other {region} countries",
                        f"What is {c['name']}'s women in parliament rate?",
                    ],
                )

        # Handle country + indicator query
        if countries and indicator_code:
            iso = countries[0]
            # Get country and indicator IDs
            country_res = supabase.table("member_states").select("id, name").eq("iso_code", iso).single().execute()
            indicator_res = supabase.table("indicators").select("id, name, unit").eq("code", indicator_code).single().execute()

            if country_res.data and indicator_res.data:
                values = supabase.table("indicator_values").select("year, value").eq(
                    "member_state_id", country_res.data["id"]
                ).eq("indicator_id", indicator_res.data["id"]).order("year", desc=True).limit(5).execute()

                if values.data:
                    latest = values.data[0]
                    unit = indicator_res.data.get("unit", "")
                    name = country_res.data["name"]
                    ind_name = indicator_res.data["name"]

                    history = ", ".join(f"{v['year']}: {v['value']:.1f}" for v in reversed(values.data) if v.get("value"))

                    return ChatResponse(
                        response=f"**{name}**'s {ind_name}: **{latest['value']:.1f}{unit}** (as of {latest['year']}).\n\nRecent trend: {history}",
                        data={"country": name, "indicator": ind_name, "latest_value": latest["value"], "year": latest["year"]},
                        suggested_follow_ups=[
                            f"How does {name} rank on {ind_name}?",
                            f"What is the continental average for {ind_name}?",
                            f"Show me {name}'s full profile",
                        ],
                    )

        # Handle indicator-only queries (continental average)
        if indicator_code and not countries:
            indicator_res = supabase.table("indicators").select("id, name, unit, target_value").eq("code", indicator_code).single().execute()
            if indicator_res.data:
                ind = indicator_res.data
                # Get latest values for all countries
                values = supabase.rpc("get_latest_indicator_values", {"p_indicator_id": ind["id"]}).execute() if False else None

                # Fallback: direct query for latest year
                all_values = supabase.table("indicator_values").select(
                    "value, year"
                ).eq("indicator_id", ind["id"]).order("year", desc=True).limit(55).execute()

                if all_values.data:
                    latest_year = all_values.data[0]["year"]
                    year_values = [v["value"] for v in all_values.data if v["year"] == latest_year and v.get("value")]
                    if year_values:
                        avg = sum(year_values) / len(year_values)
                        target = ind.get("target_value")
                        target_str = f" (Agenda 2063 target: {target})" if target else ""

                        return ChatResponse(
                            response=f"The continental average for **{ind['name']}** is **{avg:.1f}{ind.get('unit', '')}** based on {len(year_values)} countries reporting in {latest_year}{target_str}.",
                            data={"indicator": ind["name"], "avg": round(avg, 1), "countries_reporting": len(year_values), "year": latest_year},
                            suggested_follow_ups=[
                                f"Which countries rank highest on {ind['name']}?",
                                f"Show me the trend for {ind['name']}",
                                "What are the critical alerts?",
                            ],
                        )

        # Handle ranking queries
        if intent == "ranking" and indicator_code:
            indicator_res = supabase.table("indicators").select("id, name").eq("code", indicator_code).single().execute()
            if indicator_res.data:
                values = supabase.table("indicator_values").select(
                    "value, year, member_states(name, iso_code)"
                ).eq("indicator_id", indicator_res.data["id"]).order("year", desc=True).limit(55).execute()

                if values.data:
                    latest_year = values.data[0]["year"]
                    year_data = [v for v in values.data if v["year"] == latest_year and v.get("value")]
                    year_data.sort(key=lambda x: x["value"], reverse=True)
                    top5 = year_data[:5]

                    ranking_str = "\n".join(
                        f"{i+1}. **{v['member_states']['name']}**: {v['value']:.1f}"
                        for i, v in enumerate(top5)
                    )
                    return ChatResponse(
                        response=f"Top 5 countries for **{indicator_res.data['name']}** ({latest_year}):\n\n{ranking_str}",
                        data={"indicator": indicator_res.data["name"], "top_5": [{"country": v["member_states"]["name"], "value": v["value"]} for v in top5]},
                        suggested_follow_ups=["Show me the bottom 5", "What about regional averages?"],
                    )

        # Handle regional queries
        if intent == "regional":
            regions = supabase.table("regions").select("id, name").execute()
            if regions.data:
                region_info = []
                for r in regions.data:
                    count = supabase.table("member_states").select("id", count="exact").eq("region_id", r["id"]).execute()
                    region_info.append(f"- **{r['name']}**: {count.count} member states")
                return ChatResponse(
                    response=f"The AU has **5 regions** with 55 member states:\n\n" + "\n".join(region_info),
                    data={"regions": [r["name"] for r in regions.data]},
                    suggested_follow_ups=["Which region leads on gender parity?", "Compare regions on GDP", "Show me regional data quality"],
                )

        # Handle count queries
        if intent == "count":
            states = supabase.table("member_states").select("id", count="exact").execute()
            goals = supabase.table("goals").select("id", count="exact").execute()
            indicators = supabase.table("indicators").select("id", count="exact").execute()
            data_points = supabase.table("indicator_values").select("id", count="exact").execute()
            insights_count = supabase.table("insights").select("id", count="exact").eq("is_active", True).execute()

            return ChatResponse(
                response=f"The AU Central Reporting System currently tracks:\n\n"
                         f"- **{states.count}** member states\n"
                         f"- **{goals.count}** Agenda 2063 goals\n"
                         f"- **{indicators.count}** development indicators\n"
                         f"- **{data_points.count:,}** data points\n"
                         f"- **{insights_count.count}** active insights",
                data={"member_states": states.count, "goals": goals.count, "indicators": indicators.count,
                      "data_points": data_points.count, "insights": insights_count.count},
                suggested_follow_ups=["Show me the dashboard", "What are the critical alerts?", "What goals are on track?"],
            )

        # Default fallback
        return ChatResponse(
            response="I can help you explore AU development data across 55 member states. Try asking about:\n\n"
                     "- **Country profiles**: \"Tell me about Rwanda\" or \"What is Nigeria's GDP?\"\n"
                     "- **Indicators**: \"What is the continental average for women in parliament?\"\n"
                     "- **Comparisons**: \"Compare Kenya and Tanzania on youth unemployment\"\n"
                     "- **Insights**: \"What are the critical alerts?\" or \"Show me recommendations\"\n"
                     "- **Rankings**: \"Which countries rank highest on life expectancy?\"\n"
                     "- **Data quality**: \"How complete is the data?\"\n"
                     "- **System stats**: \"How many countries are tracked?\"",
            suggested_follow_ups=[
                "What is the continental average for women in parliament?",
                "Which countries have the highest youth unemployment?",
                "Show me the critical alerts",
                "Tell me about Rwanda",
            ],
        )

    except Exception as e:
        return ChatResponse(
            response=f"I encountered an issue processing your question. Please try rephrasing it.\n\nTechnical details: {str(e)[:200]}",
            suggested_follow_ups=["What are the critical alerts?", "Show me system statistics", "Tell me about Nigeria"],
        )
