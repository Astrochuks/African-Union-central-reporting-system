"""Database connection management for Supabase and direct PostgreSQL."""

from supabase import create_client, Client
from app.core.config import settings
import asyncpg
import structlog

logger = structlog.get_logger()

# Supabase client (REST API)
_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get or create Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY,
        )
        logger.info("supabase_client_initialized", url=settings.SUPABASE_URL)
    return _supabase_client


# Direct PostgreSQL connection pool (for complex queries)
_pg_pool: asyncpg.Pool | None = None


async def get_pg_pool() -> asyncpg.Pool:
    """Get or create asyncpg connection pool."""
    global _pg_pool
    if _pg_pool is None and settings.DATABASE_URL:
        _pg_pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=30,
        )
        logger.info("pg_pool_initialized")
    return _pg_pool


async def close_pg_pool():
    """Close the PostgreSQL connection pool."""
    global _pg_pool
    if _pg_pool:
        await _pg_pool.close()
        _pg_pool = None
        logger.info("pg_pool_closed")
