import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  Search
} from 'lucide-react';
import { fetchAlternateSuppliers } from '../services/api';

export default function NodeDrawer({
  node,
  onClose,
  onSimulateDisruption,
  isDisrupted = false
}) {
  const [alternateSuppliers, setAlternateSuppliers] = useState([]);
  const [loadingAlternates, setLoadingAlternates] = useState(false);

  useEffect(() => {
    if (!node) return;

    if (node.label === 'Component') {
      setLoadingAlternates(true);
      fetchAlternateSuppliers(node.id)
        .then(res => setAlternateSuppliers(res.alternate_suppliers || []))
        .catch(() => setAlternateSuppliers([]))
        .finally(() => setLoadingAlternates(false));
    } else {
      setAlternateSuppliers([]);
    }
  }, [node]);

  if (!node) return null;

  const formatCurrency = (val) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="sidebar-panel" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 40 }}>
      {/* Header */}
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`badge badge-${node.label?.toLowerCase()}`}>
            {node.label}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {node.id}
          </span>
        </div>
        <button className="btn btn-icon btn-sm" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="sidebar-content">
        {/* Title */}
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {node.name}
          </div>
          {node.type && (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {node.type}
            </div>
          )}
        </div>

        {/* Outage Trigger Button */}
        <div>
          {isDisrupted ? (
            <div className="badge badge-critical" style={{ width: '100%', justifyContent: 'center', padding: '6px' }}>
              <AlertTriangle size={12} style={{ marginRight: '6px' }} />
              Simulated Outage Active
            </div>
          ) : (
            <button
              className="btn btn-danger"
              style={{ width: '100%' }}
              onClick={() => onSimulateDisruption([node.id], `Disrupt ${node.name}`)}
            >
              <AlertTriangle size={13} />
              <span>Simulate Outage on this Node</span>
            </button>
          )}
        </div>

        {/* Properties Matrix */}
        <div className="card-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Entity Attributes
          </div>

          {node.country && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Location / Origin</span>
              <span style={{ color: 'var(--text-primary)' }}>{node.country}</span>
            </div>
          )}

          {node.tier && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Supplier Tier</span>
              <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{node.tier}</span>
            </div>
          )}

          {node.reliability_score !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Reliability Score</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {(node.reliability_score * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {node.risk_rating && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Risk Rating</span>
              <span className={node.risk_rating === 'High' ? 'badge badge-critical' : 'badge badge-high'}>
                {node.risk_rating}
              </span>
            </div>
          )}

          {node.lead_time_days !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Lead Time</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{node.lead_time_days} days</span>
            </div>
          )}

          {node.unit_cost_usd !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Unit Cost</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(node.unit_cost_usd)}
              </span>
            </div>
          )}

          {node.revenue_impact_daily_usd !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Product Daily Revenue</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(node.revenue_impact_daily_usd)}/day
              </span>
            </div>
          )}
        </div>

        {/* Alternate Sourcing Recommendations */}
        {node.label === 'Component' && (
          <div className="card-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Alternate Suppliers
              </span>
              <span className="badge badge-hub">
                {alternateSuppliers.length} Qualified
              </span>
            </div>

            {loadingAlternates ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                Querying graph...
              </div>
            ) : alternateSuppliers.length === 0 ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', padding: '4px' }}>
                No backup supplier in graph (Single Point of Failure).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alternateSuppliers.map(alt => (
                  <div
                    key={alt.supplier_id}
                    style={{
                      padding: '6px 8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '4px',
                      border: '1px solid var(--border-hairline)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.74rem' }}>
                        {alt.supplier_name}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{alt.country}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <span>Lead Time: <strong style={{ color: 'var(--text-primary)' }}>{alt.lead_time_days}d</strong></span>
                      <span>Reliability: <strong style={{ color: 'var(--accent-green)' }}>{(alt.reliability * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
