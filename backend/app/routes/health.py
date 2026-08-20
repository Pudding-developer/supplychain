from fastapi import APIRouter
from app.config import settings
from app.db import db_manager
from app.models import HealthResponse

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("", response_model=HealthResponse)
async def get_health():
    """
    Check backend health and verify CognoDB / Neo4j database connectivity.
    """
    db_health = db_manager.check_health()
    return HealthResponse(
        status="healthy" if db_health.get("status") == "healthy" else "degraded",
        mode=db_health.get("mode", "fallback_mock"),
        connected=db_health.get("connected", False),
        uri=db_health.get("uri", settings.cogndb_uri or "Not configured"),
        database=db_health.get("database", settings.cogndb_database),
        error=db_health.get("error"),
        version=settings.app_version
    )
