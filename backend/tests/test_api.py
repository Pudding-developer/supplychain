"""
Backend API Unit and Integration Tests
Validates all REST endpoints, models, and fallback graph traversal logic.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "mode" in data
    assert "version" in data

def test_graph_endpoint():
    response = client.get("/api/graph")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "links" in data
    assert data["total_nodes"] > 0
    assert data["total_links"] > 0

def test_disruption_simulation():
    payload = {
        "disrupted_node_ids": ["sup_6"],  # Taiwan Semiconductor Foundry
        "scenario_name": "TSMC Outage Test"
    }
    response = client.post("/api/simulation/disrupt", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_name"] == "TSMC Outage Test"
    assert data["total_affected_products"] >= 1
    assert data["total_daily_revenue_at_risk_usd"] > 0
    assert len(data["affected_products"]) >= 1
    assert "executed_cypher" in data

def test_spof_detection():
    response = client.get("/api/spof")
    assert response.status_code == 200
    data = response.json()
    assert data["total_spofs"] > 0
    assert len(data["critical_items"]) > 0
    assert "executed_cypher" in data

def test_products_bom():
    response = client.get("/api/products")
    assert response.status_code == 200
    products = response.json()["products"]
    assert len(products) > 0
    
    prod_id = products[0]["id"]
    bom_response = client.get(f"/api/products/{prod_id}/bom")
    assert bom_response.status_code == 200
    bom_data = bom_response.json()
    assert bom_data["total_components"] > 0
