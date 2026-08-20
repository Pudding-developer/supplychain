from .health import router as health_router
from .graph import router as graph_router
from .simulation import router as simulation_router
from .spof import router as spof_router
from .products import router as products_router

__all__ = [
    "health_router",
    "graph_router",
    "simulation_router",
    "spof_router",
    "products_router"
]
