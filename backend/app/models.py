from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# Base Node & Link models for Graph Visualization
class GraphNode(BaseModel):
    id: str
    label: str
    name: str
    type: Optional[str] = None
    tier: Optional[str] = None
    country: Optional[str] = None
    category: Optional[str] = None
    reliability_score: Optional[float] = None
    risk_rating: Optional[str] = None
    revenue_impact_daily_usd: Optional[float] = None
    lead_time_days: Optional[int] = None
    unit_cost_usd: Optional[float] = None
    status: Optional[str] = "Operational"
    properties: Dict[str, Any] = Field(default_factory=dict)

class GraphLink(BaseModel):
    source: str
    target: str
    type: str
    lead_time_days: Optional[int] = None
    is_primary: Optional[bool] = None
    is_critical: Optional[bool] = None
    quantity_required: Optional[int] = None
    transit_days: Optional[int] = None
    properties: Dict[str, Any] = Field(default_factory=dict)

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]
    total_nodes: int
    total_links: int
    source_mode: str = "live_cogndb"

# Simulation Models
class DisruptionRequest(BaseModel):
    disrupted_node_ids: List[str]
    scenario_name: Optional[str] = "Custom Disruption"
    description: Optional[str] = None

class AffectedProduct(BaseModel):
    product_id: str
    product_name: str
    category: str
    daily_revenue_risk: float
    depth: int
    impact_path: List[Dict[str, Any]]

class DisruptionSimulationResponse(BaseModel):
    scenario_name: str
    disrupted_nodes: List[str]
    total_affected_products: int
    total_daily_revenue_at_risk_usd: float
    affected_products: List[AffectedProduct]
    affected_node_ids: List[str]
    affected_link_ids: List[str]
    executed_cypher: str
    execution_time_ms: float
    source_mode: str

# Single Point of Failure (SPOF) Models
class SPOFItem(BaseModel):
    component_id: str
    component_name: str
    lead_time_days: int
    unit_cost: float
    sole_supplier: str
    supplier_id: Optional[str] = None
    supplier_country: Optional[str] = None
    affected_products: List[str]
    product_count: int
    risk_level: str = "HIGH"

class SPOFResponse(BaseModel):
    total_spofs: int
    critical_items: List[SPOFItem]
    executed_cypher: str
    execution_time_ms: float
    source_mode: str

# Alternate Supplier Models
class AlternateSupplier(BaseModel):
    supplier_id: str
    supplier_name: str
    tier: str
    country: str
    reliability: float
    risk_rating: str
    lead_time_days: int
    is_primary: bool

class AlternateSupplierResponse(BaseModel):
    component_id: str
    disrupted_supplier_id: Optional[str] = None
    alternate_suppliers: List[AlternateSupplier]
    executed_cypher: str
    source_mode: str

# Health Check Model
class HealthResponse(BaseModel):
    status: str
    mode: str
    connected: bool
    uri: str
    database: Optional[str] = None
    error: Optional[str] = None
    version: str
