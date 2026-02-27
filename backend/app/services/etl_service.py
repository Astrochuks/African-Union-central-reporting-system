"""
ETL Service — Extracts data from World Bank API for all 55 AU member states.

Pipeline: Extract (World Bank API) → Transform (clean, validate) → Load (Supabase)
"""

import httpx
import structlog
from datetime import datetime, timezone
from typing import Optional
from app.core.database import get_supabase

logger = structlog.get_logger()

# World Bank API base
WB_BASE = "https://api.worldbank.org/v2"

# All 55 AU member states (ISO2 codes)
AU_COUNTRIES = [
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD",
    "KM", "CG", "CD", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET",
    "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG",
    "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW",
    "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG",
    "TN", "UG", "ZM", "ZW",
]

# Indicators mapped to Agenda 2063 goals
WB_INDICATORS = {
    "NY.GDP.PCAP.CD": "GDP per capita (current US$)",
    "SI.POV.DDAY": "Poverty headcount ratio ($2.15/day)",
    "SE.ADT.LITR.ZS": "Adult literacy rate",
    "SE.PRM.ENRR": "Primary school enrollment",
    "SE.SEC.ENRR": "Secondary school enrollment",
    "SP.DYN.LE00.IN": "Life expectancy at birth",
    "SH.STA.MMRT": "Maternal mortality ratio",
    "SH.DYN.MORT": "Under-5 mortality rate",
    "NV.IND.MANF.ZS": "Manufacturing value added (% GDP)",
    "BX.KLT.DINV.WD.GD.ZS": "FDI net inflows (% GDP)",
    "NV.AGR.TOTL.ZS": "Agriculture value added (% GDP)",
    "EN.ATM.CO2E.PC": "CO2 emissions per capita",
    "EG.FEC.RNEW.ZS": "Renewable energy consumption (%)",
    "IT.NET.USER.ZS": "Internet users (% population)",
    "IT.CEL.SETS.P2": "Mobile subscriptions per 100",
    "EG.ELC.ACCS.ZS": "Access to electricity (%)",
    "SG.GEN.PARL.ZS": "Women in parliament (%)",
    "SE.ENR.PRIM.FM.ZS": "Gender parity index (primary)",
    "SL.TLF.CACT.FE.ZS": "Female labor force participation",
    "SL.UEM.1524.ZS": "Youth unemployment (%)",
    "SH.STA.BRTC.ZS": "Births attended by skilled staff (%)",
    "GC.TAX.TOTL.GD.ZS": "Tax revenue (% GDP)",
    "SP.ADO.TFRT": "Adolescent fertility rate",
    "SH.HIV.INCD.TL.P3": "HIV incidence (per 1,000)",
}

# Gender-specific indicators for the gender_metrics table
GENDER_INDICATORS = {
    "SG.GEN.PARL.ZS": "women_parliament_pct",
    "SE.ENR.PRIM.FM.ZS": "gender_parity_education",
    "SL.TLF.CACT.FE.ZS": "women_labor_force_pct",
    "SH.STA.MMRT": "maternal_mortality_ratio",
    "SP.ADO.TFRT": "adolescent_fertility_rate",
}

# Youth-specific indicators for the youth_metrics table
YOUTH_INDICATORS = {
    "SL.UEM.1524.ZS": "youth_unemployment_pct",
    "SE.SEC.ENRR": "secondary_enrollment_pct",
}


async def fetch_world_bank_indicator(
    indicator_code: str,
    countries: list[str] | None = None,
    start_year: int = 2000,
    end_year: int = 2024,
) -> list[dict]:
    """Fetch a single indicator from World Bank API for specified countries."""
    country_str = ";".join(countries or AU_COUNTRIES)
    url = f"{WB_BASE}/country/{country_str}/indicator/{indicator_code}"
    params = {
        "format": "json",
        "per_page": 10000,
        "date": f"{start_year}:{end_year}",
    }

    all_records = []
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

            if not data or len(data) < 2:
                logger.warning("wb_empty_response", indicator=indicator_code)
                return []

            records = data[1] or []
            for record in records:
                if record.get("value") is not None:
                    all_records.append({
                        "country_iso": record["countryiso3code"],
                        "country_iso2": record["country"]["id"],
                        "country_name": record["country"]["value"],
                        "indicator_code": indicator_code,
                        "indicator_name": record["indicator"]["value"],
                        "year": int(record["date"]),
                        "value": float(record["value"]),
                    })

            # Handle pagination
            total_pages = data[0].get("pages", 1)
            for page in range(2, total_pages + 1):
                params["page"] = page
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                page_data = resp.json()
                if page_data and len(page_data) >= 2 and page_data[1]:
                    for record in page_data[1]:
                        if record.get("value") is not None:
                            all_records.append({
                                "country_iso": record["countryiso3code"],
                                "country_iso2": record["country"]["id"],
                                "country_name": record["country"]["value"],
                                "indicator_code": indicator_code,
                                "indicator_name": record["indicator"]["value"],
                                "year": int(record["date"]),
                                "value": float(record["value"]),
                            })

            logger.info(
                "wb_fetch_success",
                indicator=indicator_code,
                records=len(all_records),
            )

        except httpx.HTTPError as e:
            logger.error("wb_fetch_error", indicator=indicator_code, error=str(e))
        except Exception as e:
            logger.error("wb_parse_error", indicator=indicator_code, error=str(e))

    return all_records


def _build_country_lookup(supabase) -> dict:
    """Build ISO code → member_state_id lookup."""
    result = supabase.table("member_states").select("id, iso_code, iso3_code").execute()
    lookup = {}
    for row in result.data:
        lookup[row["iso_code"]] = row["id"]
        if row.get("iso3_code"):
            lookup[row["iso3_code"]] = row["id"]
    return lookup


def _build_indicator_lookup(supabase) -> dict:
    """Build indicator code → indicator_id lookup."""
    result = supabase.table("indicators").select("id, code").execute()
    return {row["code"]: row["id"] for row in result.data if row.get("code")}


async def run_etl(
    indicator_codes: list[str] | None = None,
    countries: list[str] | None = None,
    start_year: int = 2000,
    end_year: int = 2024,
) -> dict:
    """
    Run the full ETL pipeline.

    1. Create ETL run record
    2. Fetch data from World Bank API
    3. Transform and validate
    4. Load into Supabase
    5. Update gender/youth metric tables
    6. Return summary
    """
    supabase = get_supabase()
    indicators_to_fetch = indicator_codes or list(WB_INDICATORS.keys())

    # Create ETL run record
    run_data = supabase.table("etl_runs").insert({
        "data_source_id": 1,  # World Bank
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    etl_run_id = run_data.data[0]["id"]

    # Build lookups
    country_lookup = _build_country_lookup(supabase)
    indicator_lookup = _build_indicator_lookup(supabase)

    total_processed = 0
    total_failed = 0

    logger.info(
        "etl_started",
        run_id=etl_run_id,
        indicators=len(indicators_to_fetch),
    )

    for indicator_code in indicators_to_fetch:
        try:
            records = await fetch_world_bank_indicator(
                indicator_code, countries, start_year, end_year,
            )

            indicator_id = indicator_lookup.get(indicator_code)
            if not indicator_id:
                logger.warning("indicator_not_in_db", code=indicator_code)
                continue

            # Batch upsert into indicator_values
            batch = []
            for rec in records:
                country_id = country_lookup.get(rec["country_iso2"]) or country_lookup.get(rec["country_iso"])
                if not country_id:
                    continue

                batch.append({
                    "indicator_id": indicator_id,
                    "member_state_id": country_id,
                    "year": rec["year"],
                    "value": rec["value"],
                    "data_quality": "verified",
                    "source_detail": f"World Bank API ({rec['indicator_code']})",
                })

            if batch:
                # Upsert in chunks of 500
                for i in range(0, len(batch), 500):
                    chunk = batch[i:i + 500]
                    supabase.table("indicator_values").upsert(
                        chunk,
                        on_conflict="indicator_id,member_state_id,year",
                    ).execute()
                total_processed += len(batch)

            # Update gender_metrics table if applicable
            if indicator_code in GENDER_INDICATORS:
                col = GENDER_INDICATORS[indicator_code]
                await _update_gender_metrics(supabase, records, country_lookup, col)

            # Update youth_metrics table if applicable
            if indicator_code in YOUTH_INDICATORS:
                col = YOUTH_INDICATORS[indicator_code]
                await _update_youth_metrics(supabase, records, country_lookup, col)

            logger.info(
                "indicator_loaded",
                code=indicator_code,
                records=len(batch),
            )

        except Exception as e:
            total_failed += 1
            logger.error("etl_indicator_error", code=indicator_code, error=str(e))

    # Update ETL run record
    supabase.table("etl_runs").update({
        "status": "completed",
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "records_processed": total_processed,
        "records_failed": total_failed,
    }).eq("id", etl_run_id).execute()

    logger.info(
        "etl_completed",
        run_id=etl_run_id,
        processed=total_processed,
        failed=total_failed,
    )

    return {
        "etl_run_id": etl_run_id,
        "status": "completed",
        "records_processed": total_processed,
        "records_failed": total_failed,
        "indicators_fetched": len(indicators_to_fetch),
    }


async def _update_gender_metrics(supabase, records, country_lookup, column):
    """Upsert a gender metric column from fetched records."""
    for rec in records:
        country_id = country_lookup.get(rec["country_iso2"]) or country_lookup.get(rec["country_iso"])
        if not country_id:
            continue

        # Check if row exists
        existing = (
            supabase.table("gender_metrics")
            .select("id")
            .eq("member_state_id", country_id)
            .eq("year", rec["year"])
            .execute()
        )

        if existing.data:
            supabase.table("gender_metrics").update(
                {column: rec["value"]}
            ).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("gender_metrics").insert({
                "member_state_id": country_id,
                "year": rec["year"],
                column: rec["value"],
            }).execute()


async def _update_youth_metrics(supabase, records, country_lookup, column):
    """Upsert a youth metric column from fetched records."""
    for rec in records:
        country_id = country_lookup.get(rec["country_iso2"]) or country_lookup.get(rec["country_iso"])
        if not country_id:
            continue

        existing = (
            supabase.table("youth_metrics")
            .select("id")
            .eq("member_state_id", country_id)
            .eq("year", rec["year"])
            .execute()
        )

        if existing.data:
            supabase.table("youth_metrics").update(
                {column: rec["value"]}
            ).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("youth_metrics").insert({
                "member_state_id": country_id,
                "year": rec["year"],
                column: rec["value"],
            }).execute()


async def seed_database():
    """Seed the database with aspirations, goals, member states, and indicators from JSON files."""
    import json
    from pathlib import Path

    supabase = get_supabase()
    seed_dir = Path(__file__).parent.parent.parent.parent / "data" / "seed"

    # 1. Seed regions
    regions = [
        {"name": "North Africa", "rec_name": "UMA"},
        {"name": "West Africa", "rec_name": "ECOWAS"},
        {"name": "Central Africa", "rec_name": "ECCAS"},
        {"name": "East Africa", "rec_name": "EAC/IGAD"},
        {"name": "Southern Africa", "rec_name": "SADC"},
    ]
    for r in regions:
        existing = supabase.table("regions").select("id").eq("name", r["name"]).execute()
        if not existing.data:
            supabase.table("regions").insert(r).execute()

    region_lookup = {
        row["name"]: row["id"]
        for row in supabase.table("regions").select("id, name").execute().data
    }

    # 2. Seed aspirations
    with open(seed_dir / "aspirations.json") as f:
        aspirations = json.load(f)
    for asp in aspirations:
        existing = supabase.table("aspirations").select("id").eq("number", asp["number"]).execute()
        if not existing.data:
            supabase.table("aspirations").insert(asp).execute()

    aspiration_lookup = {
        row["number"]: row["id"]
        for row in supabase.table("aspirations").select("id, number").execute().data
    }

    # 3. Seed goals
    with open(seed_dir / "goals.json") as f:
        goals = json.load(f)
    for goal in goals:
        existing = supabase.table("goals").select("id").eq("number", goal["number"]).execute()
        if not existing.data:
            supabase.table("goals").insert({
                "aspiration_id": aspiration_lookup[goal["aspiration_number"]],
                "number": goal["number"],
                "name": goal["name"],
                "description": goal.get("description"),
                "target_2063": goal.get("target_2063"),
            }).execute()

    goal_lookup = {
        row["number"]: row["id"]
        for row in supabase.table("goals").select("id, number").execute().data
    }

    # 4. Seed member states
    with open(seed_dir / "member_states.json") as f:
        states = json.load(f)
    for state in states:
        existing = supabase.table("member_states").select("id").eq("iso_code", state["iso_code"]).execute()
        if not existing.data:
            supabase.table("member_states").insert({
                "name": state["name"],
                "iso_code": state["iso_code"],
                "iso3_code": state.get("iso3_code"),
                "region_id": region_lookup.get(state.get("region")),
                "au_membership_year": state.get("au_membership_year"),
            }).execute()

    # 5. Seed indicators
    with open(seed_dir / "indicator_definitions.json") as f:
        indicators = json.load(f)
    for ind in indicators:
        existing = supabase.table("indicators").select("id").eq("code", ind["code"]).execute()
        if not existing.data:
            supabase.table("indicators").insert({
                "goal_id": goal_lookup.get(ind["goal_number"]),
                "name": ind["name"],
                "code": ind["code"],
                "unit": ind.get("unit"),
                "source": ind.get("source", "World Bank"),
                "description": ind.get("description"),
                "baseline_year": ind.get("baseline_year"),
                "target_value": ind.get("target_value"),
            }).execute()

    logger.info("database_seeded")
    return {"status": "seeded", "regions": 5, "aspirations": 7, "goals": 20, "member_states": len(states), "indicators": len(indicators)}
