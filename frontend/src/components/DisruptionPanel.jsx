import React from 'react';
import { 
  Flame, 
  Ship, 
  Globe, 
  Cpu, 
  ArrowRight, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    id: 'vanilla_cyclone',
    name: 'Madagascar Vanilla Harvest Cyclone',
    description: 'Category 4 cyclone destroys vanilla sun-curing sheds in Sambava, halting pure Bourbon Vanilla supply.',
    icon: Flame,
    nodeIds: ['sup_6', 'fac_3']
  },
  {
    id: 'ghana_drought',
    name: 'West African Cocoa Crop Drought',
    description: 'Severe drought in Ghana disrupts cocoa pod harvesting and fermented cocoa butter production.',
    icon: Globe,
    nodeIds: ['sup_8', 'port_1']
  },
  {
    id: 'coffee_frost',
    name: 'Ethiopian Highland Coffee Frost',
    description: 'Unseasonal frost in Yirgacheffe highlands halts washed Arabica green coffee bean supply.',
    icon: Cpu,
    nodeIds: ['sup_9', 'comp_t2_4']
  },
  {
    id: 'rotterdam_congestion',
    name: 'Port of Rotterdam Cold-Storage Gridlock',
    description: 'Refrigerated container bottleneck at Rotterdam delays dairy and confection ingredient distribution.',
    icon: Ship,
    nodeIds: ['port_3', 'fac_4']
  }
];

export default function DisruptionPanel({
  onTriggerDisruption,
  simulationResult,
  activeDisruptedIds = [],
  onResetDisruption,
  onSelectNode
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Disruption Scenarios
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Simulate multi-hop supply chain failure cascades
          </div>
        </div>

        {activeDisruptedIds.length > 0 && (
          <button 
            className="btn btn-sm btn-danger"
            onClick={onResetDisruption}
            style={{ fontSize: '0.7rem', padding: '2px 8px' }}
          >
            <RotateCcw size={11} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Preset List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {PRESET_SCENARIOS.map(sc => {
          const Icon = sc.icon;
          const isActive = sc.nodeIds.every(id => activeDisruptedIds.includes(id));

          return (
            <div
              key={sc.id}
              className="card-item"
              style={{
                cursor: 'pointer',
                background: isActive ? 'var(--accent-red-subtle)' : 'rgba(255, 255, 255, 0.035)'
              }}
              onClick={() => onTriggerDisruption(sc.nodeIds, sc.name)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={14} style={{ color: isActive ? 'var(--accent-red)' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {sc.name}
                  </span>
                </div>
                {isActive ? (
                  <span className="badge badge-critical">Active</span>
                ) : (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Trigger →</span>
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                {sc.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Live Simulation Results */}
      {simulationResult && (
        <div className="card-item" style={{ background: 'rgba(229, 72, 77, 0.08)', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <AlertTriangle size={14} style={{ color: 'var(--accent-red)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-red)' }}>
              Cascade Blast Radius ({simulationResult.total_affected_products} Product Lines Halted)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>DAILY REVENUE AT RISK</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(simulationResult.total_daily_revenue_at_risk_usd)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CYPHER LATENCY</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {simulationResult.execution_time_ms}ms
              </div>
            </div>
          </div>

          {/* Affected Products List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {simulationResult.affected_products.map(p => (
              <div 
                key={p.product_id}
                style={{
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.76rem' }}>
                    {p.product_name}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-red)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(p.daily_revenue_risk)}/d
                  </span>
                </div>

                {/* Traversal Path */}
                {p.impact_path && p.impact_path.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {p.impact_path.map((node, idx) => (
                      <React.Fragment key={idx}>
                        <span 
                          className="tag-pill"
                          style={{
                            background: idx === 0 ? 'var(--accent-red-subtle)' : undefined,
                            color: idx === 0 ? 'var(--accent-red)' : undefined,
                            cursor: 'pointer'
                          }}
                          onClick={() => onSelectNode(node)}
                        >
                          {node.name}
                        </span>
                        {idx < p.impact_path.length - 1 && (
                          <ArrowRight size={9} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
