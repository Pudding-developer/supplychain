import React from 'react';
import { Network, AlertTriangle, DollarSign, ShieldCheck } from 'lucide-react';

export default function StatsCards({
  totalNodes = 0,
  totalLinks = 0,
  disruptedCount = 0,
  revenueAtRisk = 0,
  spofCount = 0
}) {
  const formatCurrency = (val) => {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '16px 24px 0 24px' }}>
      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--accent-cyan)' }}>
          <Network size={18} />
        </div>
        <div>
          <div className="stat-label">Graph Topology</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
            {totalNodes} Nodes <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({totalLinks} Links)</span>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', borderRadius: '8px', background: disruptedCount > 0 ? 'rgba(255, 51, 102, 0.15)' : 'rgba(16, 185, 129, 0.1)', color: disruptedCount > 0 ? 'var(--accent-danger)' : 'var(--accent-emerald)' }}>
          <AlertTriangle size={18} />
        </div>
        <div>
          <div className="stat-label">Disruption State</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: disruptedCount > 0 ? 'var(--accent-danger)' : 'var(--accent-emerald)' }}>
            {disruptedCount > 0 ? `${disruptedCount} Disrupted` : 'All Systems Green'}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }}>
          <DollarSign size={18} />
        </div>
        <div>
          <div className="stat-label">Revenue at Risk</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: revenueAtRisk > 0 ? 'var(--accent-danger)' : 'var(--text-highlight)' }}>
            {formatCurrency(revenueAtRisk)}/day
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)' }}>
          <ShieldCheck size={18} />
        </div>
        <div>
          <div className="stat-label">SPOF Bottlenecks</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
            {spofCount} Sole-Source
          </div>
        </div>
      </div>
    </div>
  );
}
