"""
AU Central Reporting System — FastAPI Application Entry Point

A data intelligence platform that transforms fragmented continental data
into actionable insights for evidence-based decision-making across the
African Union's 55 member states and 20 Agenda 2063 goals.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from app.core.config import settings
from app.core.database import get_supabase, get_pg_pool, close_pg_pool
from app.api.v1.router import api_router

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    logger.info(
        "application_starting",
        environment=settings.ENVIRONMENT,
        api_version=settings.API_VERSION,
    )

    # Initialize Supabase client
    try:
        get_supabase()
        logger.info("supabase_connected")
    except Exception as e:
        logger.error("supabase_connection_failed", error=str(e))

    # Initialize PostgreSQL pool
    if settings.DATABASE_URL:
        try:
            await get_pg_pool()
            logger.info("postgres_pool_ready")
        except Exception as e:
            logger.warning("postgres_pool_failed", error=str(e))

    yield

    # Shutdown
    await close_pg_pool()
    logger.info("application_shutdown")


app = FastAPI(
    title=settings.API_TITLE or "AU Central Reporting System",
    description=(
        "Data intelligence platform for the African Union. "
        "Tracks Agenda 2063 progress across 55 member states with automated "
        "insights generation, gender & youth analytics, and executive reporting."
    ),
    version=settings.API_VERSION or "1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_PREFIX or "/api/v1")


@app.get("/", tags=["root"])
async def root():
    return {
        "name": "AU Central Reporting System",
        "version": settings.API_VERSION or "1.0.0",
        "description": "Data intelligence platform for the African Union",
        "docs": "/docs",
        "health": f"{settings.API_PREFIX or '/api/v1'}/health",
    }
