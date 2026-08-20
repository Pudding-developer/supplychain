/**
 * ChainPulse Graph - API Client
 * Interacts with FastAPI backend endpoints.
 */

const API_BASE = '/api';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      mode: 'fallback_mock',
      connected: false,
      error: err.message,
      version: '1.0.0'
    };
  }
}

export async function fetchGraph({ label, tier } = {}) {
  const params = new URLSearchParams();
  if (label) params.append('label', label);
  if (tier) params.append('tier', tier);
  
  const url = `${API_BASE}/graph${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch graph: ${res.statusText}`);
  return await res.json();
}

export async function simulateDisruption(disruptedNodeIds, scenarioName = 'Disruption Simulation') {
  const res = await fetch(`${API_BASE}/simulation/disrupt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      disrupted_node_ids: disruptedNodeIds,
      scenario_name: scenarioName
    })
  });
  if (!res.ok) throw new Error(`Disruption simulation failed: ${res.statusText}`);
  return await res.json();
}

export async function fetchAlternateSuppliers(componentId, disruptedSupplierId = '') {
  const params = new URLSearchParams({
    component_id: componentId,
    disrupted_supplier_id: disruptedSupplierId
  });
  const res = await fetch(`${API_BASE}/simulation/alternate-suppliers?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch alternate suppliers: ${res.statusText}`);
  return await res.json();
}

export async function fetchSPOFs() {
  const res = await fetch(`${API_BASE}/spof`);
  if (!res.ok) throw new Error(`Failed to fetch SPOFs: ${res.statusText}`);
  return await res.json();
}

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
  return await res.json();
}

export async function fetchProductBOM(productId) {
  const res = await fetch(`${API_BASE}/products/${productId}/bom`);
  if (!res.ok) throw new Error(`Failed to fetch product BOM: ${res.statusText}`);
  return await res.json();
}
