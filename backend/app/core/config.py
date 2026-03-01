"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    DATABASE_URL: str = ""

    # API
    API_TITLE: str = "AU Central Reporting System"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: str = '["*"]'

    # Logging
    LOG_LEVEL: str = "INFO"

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:3000", "http://localhost:8000"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
