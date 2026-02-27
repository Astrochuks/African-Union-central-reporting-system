"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from app.models.enums import (
    InsightType, InsightSeverity, DataQuality,
    ETLStatus, ReportType, SourceType,
)


# ── Agenda 2063 Framework ──────────────────────────────────────────

class AspirationBase(BaseModel):
    number: int = Field(..., ge=1, le=7, description="Aspiration number (1-7)")
    name: str
    description: Optional[str] = None


class AspirationResponse(AspirationBase):
    id: int
    goals: Optional[List["GoalSummary"]] = None

    model_config = {"from_attributes": True}


class GoalSummary(BaseModel):
    id: int
    number: int
    name: str
    current_progress: Optional[float] = None


class GoalBase(BaseModel):
    aspiration_id: int
    number: int = Field(..., ge=1, le=20, description="Goal number (1-20)")
    name: str
    description: Optional[str] = None
    target_2063: Optional[str] = None


class GoalResponse(GoalBase):
    id: int
    current_progress: Optional[float] = None
    aspiration_name: Optional[str] = None
    indicator_count: Optional[int] = None

    model_config = {"from_attributes": True}


class GoalProgress(BaseModel):
    goal_id: int
    goal_name: str
    goal_number: int
    current_progress: float
    target: Optional[str] = None
    trend: Optional[str] = None  # "improving", "declining", "stable"
    regional_breakdown: Optional[dict] = None


# ── Indicators ──────────────────────────────────────────────────────

class IndicatorBase(BaseModel):
    goal_id: int
    name: str
    code: Optional[str] = None
    unit: Optional[str] = None
    source: Optional[str] = None
    baseline_value: Optional[float] = None
    baseline_year: Optional[int] = None
    target_value: Optional[float] = None
    target_year: int = 2063


class IndicatorResponse(IndicatorBase):
    id: int
    latest_value: Optional[float] = None
    latest_year: Optional[int] = None
    data_points: Optional[int] = None

    model_config = {"from_attributes": True}


class IndicatorValue(BaseModel):
    indicator_id: int
    member_state_id: int
    year: int
    value: Optional[float] = None
    data_quality: DataQuality = DataQuality.VERIFIED
    source_detail: Optional[str] = None


class IndicatorTimeSeries(BaseModel):
    indicator_id: int
    indicator_name: str
    country: Optional[str] = None
    unit: Optional[str] = None
    values: List[dict]  # [{"year": 2020, "value": 45.2}, ...]


class CountryRanking(BaseModel):
    rank: int
    country_name: str
    iso_code: str
    value: float
    year: int
    region: Optional[str] = None


# ── Member States ───────────────────────────────────────────────────

class MemberStateBase(BaseModel):
    name: str
    iso_code: str = Field(..., min_length=2, max_length=2)
    iso3_code: Optional[str] = Field(None, min_length=3, max_length=3)
    region_id: Optional[int] = None
    population: Optional[int] = None
    gdp_per_capita: Optional[float] = None
    au_membership_year: Optional[int] = None


class MemberStateResponse(MemberStateBase):
    id: int
    region_name: Optional[str] = None

    model_config = {"from_attributes": True}


class CountryProfile(BaseModel):
    country: MemberStateResponse
    key_indicators: List[dict]
    gender_metrics: Optional[dict] = None
    youth_metrics: Optional[dict] = None
    agenda_2063_progress: Optional[List[dict]] = None
    data_quality_score: Optional[float] = None


class CountryScorecard(BaseModel):
    country: MemberStateResponse
    overall_score: float
    goals: List[GoalProgress]
    strengths: List[str]
    challenges: List[str]


# ── Gender & Youth ──────────────────────────────────────────────────

class GenderMetrics(BaseModel):
    id: Optional[int] = None
    member_state_id: int
    year: int
    women_parliament_pct: Optional[float] = None
    gender_parity_education: Optional[float] = None
    women_labor_force_pct: Optional[float] = None
    maternal_mortality_ratio: Optional[float] = None
    adolescent_fertility_rate: Optional[float] = None
    country_name: Optional[str] = None

    model_config = {"from_attributes": True}


class GenderOverview(BaseModel):
    continental_avg_women_parliament: Optional[float] = None
    continental_avg_labor_force: Optional[float] = None
    continental_avg_parity_index: Optional[float] = None
    countries_above_30pct_parliament: int = 0
    total_countries_with_data: int = 0
    regional_breakdown: Optional[List[dict]] = None
    trends: Optional[List[dict]] = None


class YouthMetrics(BaseModel):
    id: Optional[int] = None
    member_state_id: int
    year: int
    youth_unemployment_pct: Optional[float] = None
    youth_literacy_pct: Optional[float] = None
    youth_neet_pct: Optional[float] = None
    secondary_enrollment_pct: Optional[float] = None
    country_name: Optional[str] = None

    model_config = {"from_attributes": True}


class YouthOverview(BaseModel):
    continental_avg_unemployment: Optional[float] = None
    continental_avg_literacy: Optional[float] = None
    continental_avg_enrollment: Optional[float] = None
    countries_high_unemployment: int = 0
    total_countries_with_data: int = 0
    regional_breakdown: Optional[List[dict]] = None
    trends: Optional[List[dict]] = None


# ── Insights Engine ─────────────────────────────────────────────────

class InsightBase(BaseModel):
    type: InsightType
    severity: InsightSeverity
    title: str
    description: str
    evidence: Optional[dict] = None
    goal_id: Optional[int] = None
    indicator_id: Optional[int] = None
    member_state_id: Optional[int] = None


class InsightResponse(InsightBase):
    id: int
    generated_at: datetime
    etl_run_id: Optional[int] = None
    is_active: bool = True
    included_in_report: bool = False

    model_config = {"from_attributes": True}


class InsightsSummary(BaseModel):
    total_active: int
    by_type: dict  # {"finding": 5, "alert": 3, ...}
    by_severity: dict  # {"critical": 2, "warning": 5, ...}
    latest_generated: Optional[datetime] = None


# ── ETL Pipeline ────────────────────────────────────────────────────

class ETLRunResponse(BaseModel):
    id: int
    data_source_id: Optional[int] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    records_processed: int = 0
    records_failed: int = 0
    insights_generated: int = 0
    status: ETLStatus

    model_config = {"from_attributes": True}


class ETLTriggerRequest(BaseModel):
    indicators: Optional[List[str]] = None  # Specific indicator codes, or all
    countries: Optional[List[str]] = None  # Specific ISO codes, or all 55
    years: Optional[List[int]] = None  # Specific years, or default range


class DataSourceResponse(BaseModel):
    id: int
    name: str
    api_url: Optional[str] = None
    source_type: Optional[str] = None
    last_refresh: Optional[datetime] = None
    record_count: Optional[int] = None
    status: str = "active"

    model_config = {"from_attributes": True}


class PipelineStatus(BaseModel):
    latest_run: Optional[ETLRunResponse] = None
    total_runs: int = 0
    total_records: int = 0
    sources: List[DataSourceResponse] = []


# ── Data Quality ────────────────────────────────────────────────────

class DataQualityScore(BaseModel):
    member_state_id: Optional[int] = None
    indicator_id: Optional[int] = None
    country_name: Optional[str] = None
    indicator_name: Optional[str] = None
    completeness_pct: float
    timeliness_years: Optional[int] = None
    consistency_score: Optional[float] = None
    overall_score: float
    assessed_at: Optional[datetime] = None


class DataQualityOverview(BaseModel):
    continental_avg_score: float
    countries_with_good_data: int  # score > 70
    countries_with_poor_data: int  # score < 40
    most_complete_indicators: List[dict]
    least_complete_indicators: List[dict]
    gaps: List[dict]


# ── Reports ─────────────────────────────────────────────────────────

class ReportGenerateRequest(BaseModel):
    report_type: ReportType
    title: Optional[str] = None
    parameters: Optional[dict] = None  # e.g., {"country": "NG", "goal_id": 17}


class ReportResponse(BaseModel):
    id: int
    title: str
    report_type: str
    parameters: Optional[dict] = None
    insights_included: Optional[List[int]] = None
    generated_at: datetime
    file_url: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Dashboard ───────────────────────────────────────────────────────

class DashboardSummary(BaseModel):
    total_member_states: int = 55
    total_goals: int = 20
    total_indicators: int = 0
    total_data_points: int = 0
    avg_goal_progress: Optional[float] = None
    latest_etl_run: Optional[ETLRunResponse] = None
    recent_insights: List[InsightResponse] = []
    kpis: List[dict] = []
    data_quality_score: Optional[float] = None


# ── Upload ──────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    filename: str
    records_processed: int
    records_failed: int
    errors: List[str] = []
    status: str


# Resolve forward references
AspirationResponse.model_rebuild()
