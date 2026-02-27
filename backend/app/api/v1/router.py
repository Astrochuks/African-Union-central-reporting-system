"""API Router — aggregates all v1 route modules."""

from fastapi import APIRouter
from app.api.v1 import (
    health,
    dashboard,
    goals,
    indicators,
    countries,
    gender,
    youth,
    insights,
    pipeline,
    reports,
    upload,
    data_quality,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(dashboard.router)
api_router.include_router(goals.router)
api_router.include_router(indicators.router)
api_router.include_router(countries.router)
api_router.include_router(gender.router)
api_router.include_router(youth.router)
api_router.include_router(insights.router)
api_router.include_router(pipeline.router)
api_router.include_router(reports.router)
api_router.include_router(upload.router)
api_router.include_router(data_quality.router)
