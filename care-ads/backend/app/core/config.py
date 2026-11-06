from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Care Ads Manager"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://alexistarrifa@localhost:5432/care_ads_db"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://alexistarrifa@localhost:5432/care_ads_db"
    
    # Security & Auth
    SECRET_KEY: str = "caretech-secret-key-super-secure-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 horas
    
    # 2FA Settings
    MFA_ISSUER: str = "CareTech Ads"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }


settings = Settings()
