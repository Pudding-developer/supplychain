import React from 'react';
import { 
  Database, 
  Terminal, 
  Layers, 
  RotateCcw, 
  AlertTriangle,
  Radio
} from 'lucide-react';

export default function Navbar({ 
  health, 
  totalNodes = 0,
  totalLinks = 0,
  spofCount = 0,
  revenueAtRisk = 0,
  disruptedNodes = [], 
  onResetDisruption, 
  onOpenCypherModal, 
  onOpenBOMModal 
}) {
  const isConnected = health?.connected;
  const isDisrupted = disruptedNodes.length > 0;

  const formatCurrency = (val) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <header className="navbar">
      {/* Brand */}
      <div className="brand-container">
        <div className="brand-title-wrap">
          <span className="brand-title">ChainPulse</span>
          <span className="brand-tag">Graph 1.0</span>
        </div>
      </div>

      {/* Telemetry Indicators (Integrated, Minimalist) */}
      <div className="header-telemetry">
        <div className="telemetry-item">
          <span>Topology</span>
          <strong>{totalNodes} Nodes</strong>
          <span style={{ color: 'var(--text-muted)' }}>({totalLinks} links)</span>
        </div>

        <div className="telemetry-divider" />

        <div className="telemetry-item">
          <span>SPOFs</span>
          <strong style={{ color: spofCount > 0 ? 'var(--accent-amber)' : 'inherit' }}>
            {spofCount} Sole-Source
          </strong>
        </div>

        <div className="telemetry-divider" />

        <div className={`telemetry-item ${isDisrupted ? 'risk' : ''}`}>
          <span>Daily Risk</span>
          <strong>{formatCurrency(revenueAtRisk)}/day</strong>
        </div>

        {isDisrupted && (
          <div className="badge badge-critical" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
            <AlertTriangle size={11} />
            <span>{disruptedNodes.length} Outage{disruptedNodes.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Database Health Pill */}
        <div className="status-pill" title={health?.uri || 'CognoDB Instance'}>
          <div className={`status-dot ${isConnected ? 'healthy' : 'fallback'}`} />
          <span>{isConnected ? 'CognoDB Cloud' : 'Demo Mode'}</span>
        </div>

        <button 
          className="btn btn-sm"
          onClick={onOpenCypherModal}
          title="Inspect parameterized openCypher query"
        >
          <Terminal size={12} style={{ color: 'var(--text-secondary)' }} />
          <span>Cypher</span>
        </button>

        <button 
          className="btn btn-sm"
          onClick={onOpenBOMModal}
          title="Inspect product Bill of Materials tree"
        >
          <Layers size={12} style={{ color: 'var(--text-secondary)' }} />
          <span>BOM</span>
        </button>

        {isDisrupted && (
          <button 
            className="btn btn-sm btn-danger"
            onClick={onResetDisruption}
            title="Clear all active simulations"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </header>
  );
}
