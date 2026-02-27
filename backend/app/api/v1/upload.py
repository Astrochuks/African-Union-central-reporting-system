"""Data Upload endpoints — Excel/CSV ingestion."""

from fastapi import APIRouter, UploadFile, File
from app.core.database import get_supabase
import pandas as pd
import io

router = APIRouter(prefix="/upload", tags=["Data Upload"])


@router.post("/excel")
async def upload_excel(file: UploadFile = File(...)):
    """
    Upload supplementary data from Excel/CSV files.

    Expects columns: country_iso, indicator_code, year, value
    """
    supabase = get_supabase()

    try:
        contents = await file.read()
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        required_cols = {"country_iso", "indicator_code", "year", "value"}
        if not required_cols.issubset(set(df.columns)):
            return {
                "status": "error",
                "filename": file.filename,
                "records_processed": 0,
                "records_failed": 0,
                "errors": [f"Missing required columns. Expected: {required_cols}. Got: {set(df.columns)}"],
            }

        # Build lookups
        countries = supabase.table("member_states").select("id, iso_code").execute()
        country_lookup = {c["iso_code"]: c["id"] for c in countries.data}

        indicators = supabase.table("indicators").select("id, code").execute()
        indicator_lookup = {i["code"]: i["id"] for i in indicators.data}

        processed = 0
        failed = 0
        errors = []

        for _, row in df.iterrows():
            try:
                country_id = country_lookup.get(str(row["country_iso"]).upper())
                indicator_id = indicator_lookup.get(str(row["indicator_code"]))

                if not country_id:
                    errors.append(f"Unknown country: {row['country_iso']}")
                    failed += 1
                    continue
                if not indicator_id:
                    errors.append(f"Unknown indicator: {row['indicator_code']}")
                    failed += 1
                    continue

                supabase.table("indicator_values").upsert({
                    "indicator_id": indicator_id,
                    "member_state_id": country_id,
                    "year": int(row["year"]),
                    "value": float(row["value"]) if pd.notna(row["value"]) else None,
                    "data_quality": "verified",
                    "source_detail": f"Manual upload: {file.filename}",
                }, on_conflict="indicator_id,member_state_id,year").execute()
                processed += 1

            except Exception as e:
                failed += 1
                errors.append(str(e))

        return {
            "status": "completed",
            "filename": file.filename,
            "records_processed": processed,
            "records_failed": failed,
            "errors": errors[:20],
        }

    except Exception as e:
        return {
            "status": "error",
            "filename": file.filename,
            "records_processed": 0,
            "records_failed": 0,
            "errors": [str(e)],
        }


@router.get("/template")
async def get_upload_template():
    """Get the expected upload template format."""
    return {
        "required_columns": ["country_iso", "indicator_code", "year", "value"],
        "example_row": {
            "country_iso": "NG",
            "indicator_code": "SG.GEN.PARL.ZS",
            "year": 2023,
            "value": 3.6,
        },
        "supported_formats": [".xlsx", ".csv"],
        "valid_country_codes": "Use ISO 3166-1 alpha-2 codes (e.g., NG, ZA, KE, EG)",
        "valid_indicators": "See /api/v1/indicators for available codes",
    }
