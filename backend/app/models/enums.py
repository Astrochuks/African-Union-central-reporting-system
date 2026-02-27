"""Enumerations used across the application."""

from enum import Enum


class InsightType(str, Enum):
    FINDING = "finding"
    ALERT = "alert"
    TREND = "trend"
    RECOMMENDATION = "recommendation"
    COMPARISON = "comparison"
    MILESTONE = "milestone"


class InsightSeverity(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    WARNING = "warning"
    CRITICAL = "critical"


class DataQuality(str, Enum):
    VERIFIED = "verified"
    ESTIMATED = "estimated"
    MISSING = "missing"


class ETLStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ReportType(str, Enum):
    EXECUTIVE_SUMMARY = "executive_summary"
    GENDER_BRIEF = "gender_brief"
    YOUTH_BRIEF = "youth_brief"
    COUNTRY_PROFILE = "country_profile"
    GOAL_PROGRESS = "goal_progress"


class SourceType(str, Enum):
    API = "api"
    MANUAL_UPLOAD = "manual_upload"
    CSV = "csv"


class Region(str, Enum):
    NORTH_AFRICA = "North Africa"
    WEST_AFRICA = "West Africa"
    CENTRAL_AFRICA = "Central Africa"
    EAST_AFRICA = "East Africa"
    SOUTHERN_AFRICA = "Southern Africa"
