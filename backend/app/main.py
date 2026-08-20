import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import db_manager
from app.routes import (
    health_router,
    graph_router,
    simulation_router,
    spof_router,
    products_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("chainpulse")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: attempt database connection
    logger.info("Initializing ChainPulse Graph Application...")
    connected = db_manager.connect()
    if connected:
        logger.info("Connected to CognoDB Cloud successfully.")
    else:
        logger.warning("Starting in Fallback Mock Mode. Database connection can be configured in .env.")
    yield
    # Shutdown: close connection pool
    logger.info("Shutting down ChainPulse Graph Application...")
    db_manager.close()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Multi-tier Supply Chain Resilience & Impact Intelligence Platform backed by CognoDB openCypher.",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for easy development and hosted demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(graph_router)
app.include_router(simulation_router)
app.include_router(spof_router)
app.include_router(products_router)

@app.get("/")
async def root():
    return {
        "message": "ChainPulse Graph API is running",
        "version": settings.app_version,
        "docs_url": "/docs",
        "health_check": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
