import React, { useEffect, useRef, useState, useMemo } from 'react';
import ForceGraph from 'force-graph';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Search, 
  X
} from 'lucide-react';

const NODE_PALETTE = {
  Product: '#ffffff',
  Component: '#38bdf8',
  Supplier: '#c084fc',
  Facility: '#fbbf24',
  LogisticsHub: '#34d399',
  Region: '#f472b6',
  Disrupted: '#ef4444'
};

export default function GraphCanvas({
  graphData,
  disruptedNodeIds = [],
  affectedNodeIds = [],
  selectedNode,
  onSelectNode,
  onSimulateDisruption
}) {
  const containerRef = useRef(null);
  const graphInstanceRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabel, setFilterLabel] = useState('ALL');
  const [hoverNode, setHoverNode] = useState(null);

  const disruptedSet = useMemo(() => new Set(disruptedNodeIds), [disruptedNodeIds]);
  const affectedSet = useMemo(() => new Set(affectedNodeIds), [affectedNodeIds]);

  // Filter nodes & links based on user selection and search query
  const filteredData = useMemo(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return { nodes: [], links: [] };
    }

    let targetNodes = graphData.nodes;
    if (filterLabel !== 'ALL') {
      targetNodes = targetNodes.filter(n => n.label === filterLabel);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      targetNodes = targetNodes.filter(n => 
        n.name?.toLowerCase().includes(q) || 
        n.id?.toLowerCase().includes(q) ||
        n.category?.toLowerCase().includes(q) ||
        n.type?.toLowerCase().includes(q)
      );
    }

    // If filtering by specific category, include connected 1-hop neighbor nodes so lines are always visible
    let finalNodes = targetNodes;
    let finalLinks = [];

    if (filterLabel !== 'ALL' || searchQuery.trim()) {
      const targetIds = new Set(targetNodes.map(n => n.id));
      const connectedNodeIds = new Set(targetIds);

      (graphData.links || []).forEach(l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        if (targetIds.has(srcId) || targetIds.has(tgtId)) {
          connectedNodeIds.add(srcId);
          connectedNodeIds.add(tgtId);
          finalLinks.push({ ...l });
        }
      });

      finalNodes = graphData.nodes.filter(n => connectedNodeIds.has(n.id));
    } else {
      finalNodes = graphData.nodes;
      finalLinks = graphData.links || [];
    }

    return {
      nodes: finalNodes.map(n => ({ ...n })),
      links: finalLinks.map(l => ({ ...l }))
    };
  }, [graphData, filterLabel, searchQuery]);

  // Initialize Force Graph instance
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const graph = ForceGraph()(containerRef.current)
      .width(width)
      .height(height)
      .backgroundColor('#1a1c23')
      .nodeId('id')
      .nodeVal(node => (node.label === 'Product' ? 14 : node.label === 'Supplier' ? 10 : 8))
      .nodeRelSize(1)
      .linkSource('source')
      .linkTarget('target')
      .linkColor(link => {
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
        if (disruptedSet.has(srcId) || (affectedSet.has(srcId) && affectedSet.has(tgtId))) {
          return 'rgba(239, 68, 68, 0.9)';
        }
        return 'rgba(203, 213, 225, 0.35)';
      })
      .linkWidth(link => {
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
        if (disruptedSet.has(srcId) || (affectedSet.has(srcId) && affectedSet.has(tgtId))) {
          return 2.4;
        }
        return 1.4;
      })
      .linkDirectionalParticles(link => {
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
        if (disruptedSet.has(srcId) || (affectedSet.has(srcId) && affectedSet.has(tgtId))) {
          return 4;
        }
        return 1;
      })
      .linkDirectionalParticleSpeed(0.008)
      .linkDirectionalParticleColor(link => {
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        return disruptedSet.has(srcId) ? '#ef4444' : '#60a5fa';
      })
      .linkDirectionalParticleWidth(2.2)
      .linkDirectionalArrowLength(4.5)
      .linkDirectionalArrowRelPos(0.96)
      .nodeCanvasObject((node, ctx, globalScale) => {
        const isDisrupted = disruptedSet.has(node.id);
        const isAffected = affectedSet.has(node.id);
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoverNode?.id === node.id;

        const baseRadius = node.label === 'Product' ? 7.5 : node.label === 'Supplier' ? 6 : 5;
        const r = isSelected || isHovered ? baseRadius * 1.35 : baseRadius;
        
        let color = NODE_PALETTE[node.label] || '#94a3b8';
        if (isDisrupted) color = NODE_PALETTE.Disrupted;
        else if (isAffected) color = '#f59e0b';

        // Disrupted Pulse Halo
        if (isDisrupted) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI, false);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
          ctx.fill();
        }

        // Selected Outer Ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();

        // Node Label with High-Contrast Backdrop Capsule
        const label = node.name || node.id;
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `600 ${fontSize}px Inter, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const padX = 4 / globalScale;
        const padY = 2 / globalScale;
        const textY = node.y + r + (4 / globalScale);

        // Draw backdrop pill for 100% legibility
        ctx.fillStyle = 'rgba(18, 21, 31, 0.88)';
        ctx.strokeStyle = isDisrupted ? 'rgba(239, 68, 68, 0.6)' : isSelected ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.8 / globalScale;
        
        const pillX = node.x - textWidth / 2 - padX;
        const pillY = textY - padY;
        const pillW = textWidth + padX * 2;
        const pillH = fontSize + padY * 2;
        const radius = 3 / globalScale;

        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, radius);
        ctx.fill();
        ctx.stroke();

        // Draw Label Text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isDisrupted ? '#fca5a5' : isSelected ? '#ffffff' : '#f1f5f9';
        ctx.fillText(label, node.x, textY);
      })
      .onNodeClick(node => {
        onSelectNode(node);
      })
      .onNodeHover(node => {
        setHoverNode(node || null);
        if (containerRef.current) {
          containerRef.current.style.cursor = node ? 'pointer' : 'default';
        }
      });

    // High repulsion force & collision protection so nodes fan out with generous breathing space
    graph.d3Force('charge').strength(-420);
    graph.d3Force('link').distance(115);

    graphInstanceRef.current = graph;

    const handleResize = () => {
      if (containerRef.current && graphInstanceRef.current) {
        graphInstanceRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphInstanceRef.current) {
        graphInstanceRef.current._destructor();
      }
    };
  }, []);

  // Update graph data and auto-fit camera
  useEffect(() => {
    if (graphInstanceRef.current && filteredData.nodes.length > 0) {
      graphInstanceRef.current.graphData(filteredData);
      setTimeout(() => {
        if (graphInstanceRef.current) {
          graphInstanceRef.current.zoomToFit(400, 40);
        }
      }, 300);
    }
  }, [filteredData, disruptedSet, affectedSet]);

  const handleZoomIn = () => {
    if (graphInstanceRef.current) {
      graphInstanceRef.current.zoom(graphInstanceRef.current.zoom() * 1.3, 200);
    }
  };

  const handleZoomOut = () => {
    if (graphInstanceRef.current) {
      graphInstanceRef.current.zoom(graphInstanceRef.current.zoom() / 1.3, 200);
    }
  };

  const handleFitView = () => {
    if (graphInstanceRef.current) {
      graphInstanceRef.current.zoomToFit(300, 40);
    }
  };

  return (
    <div className="graph-container">
      {/* Canvas container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating HUD Controls (Top Left) */}
      <div className="graph-hud">
        {/* Search */}
        <div className="hud-search-box">
          <Search size={13} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="hud-search-input"
            placeholder="Search network..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="hud-filter-group">
          {['ALL', 'Product', 'Component', 'Supplier', 'Facility', 'LogisticsHub'].map(lbl => (
            <button
              key={lbl}
              className={`btn btn-sm ${filterLabel === lbl ? 'btn-primary' : ''}`}
              style={{ padding: '3px 8px', fontSize: '0.7rem', border: 'none' }}
              onClick={() => setFilterLabel(lbl)}
            >
              {lbl === 'LogisticsHub' ? 'Hubs' : lbl}
            </button>
          ))}
        </div>

        {/* Zoom */}
        <div className="hud-zoom-group">
          <button className="btn btn-icon btn-sm" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={13} />
          </button>
          <button className="btn btn-icon btn-sm" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={13} />
          </button>
          <button className="btn btn-icon btn-sm" onClick={handleFitView} title="Fit to View">
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Minimalist Legend (Bottom Left) */}
      <div className="graph-legend">
        <div className="legend-title">Entity Types</div>
        <div className="legend-items">
          <div className="legend-item" onClick={() => setFilterLabel('Product')}>
            <div className="legend-dot" style={{ backgroundColor: NODE_PALETTE.Product }} />
            <span>Product</span>
          </div>
          <div className="legend-item" onClick={() => setFilterLabel('Component')}>
            <div className="legend-dot" style={{ backgroundColor: NODE_PALETTE.Component }} />
            <span>Component</span>
          </div>
          <div className="legend-item" onClick={() => setFilterLabel('Supplier')}>
            <div className="legend-dot" style={{ backgroundColor: NODE_PALETTE.Supplier }} />
            <span>Supplier</span>
          </div>
          <div className="legend-item" onClick={() => setFilterLabel('Facility')}>
            <div className="legend-dot" style={{ backgroundColor: NODE_PALETTE.Facility }} />
            <span>Facility</span>
          </div>
          <div className="legend-item" onClick={() => setFilterLabel('LogisticsHub')}>
            <div className="legend-dot" style={{ backgroundColor: NODE_PALETTE.LogisticsHub }} />
            <span>Port / Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
}
