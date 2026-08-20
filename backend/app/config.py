import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ChainPulse Graph API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # CognoDB / Neo4j Connection
    cogndb_uri: str = os.getenv("COGNDB_URI", "")
    cogndb_user: str = os.getenv("COGNDB_USER", "cognodb")
    cogndb_password: str = os.getenv("COGNDB_PASSWORD", "")
    cogndb_database: str = os.getenv("COGNDB_DATABASE", "neo4j")
    
    # Server configuration
    port: int = int(os.getenv("PORT", "8000"))
    host: str = os.getenv("HOST", "0.0.0.0")
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def has_db_credentials(self) -> bool:
        return bool(self.cogndb_uri and self.cogndb_password)

settings = Settings()
