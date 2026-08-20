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

  // Compute 1-hop connected neighbors for the selected node
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return null;
    const ids = new Set([selectedNode.id]);
    (graphData.links || []).forEach(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      if (srcId === selectedNode.id) ids.add(tgtId);
      if (tgtId === selectedNode.id) ids.add(srcId);
    });
    return ids;
  }, [selectedNode, graphData.links]);

  // Keep live references to dynamic state for force-graph canvas callbacks
  const stateRef = useRef({
    disruptedSet,
    affectedSet,
    selectedNode,
    hoverNode,
    onSelectNode,
    connectedNodeIds
  });

  stateRef.current = {
    disruptedSet,
    affectedSet,
    selectedNode,
    hoverNode,
    onSelectNode,
    connectedNodeIds
  };

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
      .nodeLabel(() => '')
      .linkLabel(() => '')
      .autoPauseRedraw(false)
      .nodeVal(node => (node.label === 'Product' ? 14 : node.label === 'Supplier' ? 10 : 8))
      .nodeRelSize(1)
      .linkSource('source')
      .linkTarget('target')
      .linkColor(link => {
        const { disruptedSet: dSet, affectedSet: aSet, selectedNode: sNode } = stateRef.current;
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
        const isDisruptedLink = dSet.has(srcId) || (aSet.has(srcId) && aSet.has(tgtId));

        if (sNode) {
          const isConnected = srcId === sNode.id || tgtId === sNode.id;
          if (isConnected) {
            return isDisruptedLink ? 'rgba(239, 68, 68, 1)' : '#38bdf8';
          }
          return 'rgba(100, 116, 139, 0.08)'; // Dim unrelated links
        }

        if (isDisruptedLink) {
          return 'rgba(239, 68, 68, 0.9)';
        }
        return 'rgba(203, 213, 225, 0.35)';
      })
      .linkWidth(link => {
        const { disruptedSet: dSet, affectedSet: aSet, selectedNode: sNode } = stateRef.current;
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sNode && (srcId === sNode.id || tgtId === sNode.id)) {
          return 3.0; // Highlight connected edges
        }
        if (dSet.has(srcId) || (aSet.has(srcId) && aSet.has(tgtId))) {
          return 2.4;
        }
        return 1.4;
      })
      .linkDirectionalParticles(link => {
        const { disruptedSet: dSet, affectedSet: aSet, selectedNode: sNode } = stateRef.current;
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sNode && (srcId === sNode.id || tgtId === sNode.id)) {
          return 3;
        }
        if (dSet.has(srcId) || (aSet.has(srcId) && aSet.has(tgtId))) {
          return 4;
        }
        return 1;
      })
      .linkDirectionalParticleSpeed(0.008)
      .linkDirectionalParticleColor(link => {
        const { disruptedSet: dSet, selectedNode: sNode } = stateRef.current;
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sNode && (srcId === sNode.id || tgtId === sNode.id)) {
          return '#38bdf8';
        }
        return dSet.has(srcId) ? '#ef4444' : '#60a5fa';
      })
      .linkDirectionalParticleWidth(2.2)
      .linkDirectionalArrowLength(4.5)
      .linkDirectionalArrowRelPos(0.96)
      .nodeCanvasObject((node, ctx, globalScale) => {
        const { disruptedSet: dSet, affectedSet: aSet, selectedNode: sNode, hoverNode: hNode, connectedNodeIds: cIds } = stateRef.current;
        const isDisrupted = dSet.has(node.id);
        const isAffected = aSet.has(node.id);
        const isSelected = sNode?.id === node.id;
        const isHovered = hNode?.id === node.id;
        const isConnectedNeighbor = cIds ? cIds.has(node.id) : true;

        // Apply focus dimming for unrelated nodes
        const alpha = isConnectedNeighbor ? 1.0 : 0.18;
        ctx.globalAlpha = alpha;

        const baseRadius = node.label === 'Product' ? 7.5 : node.label === 'Supplier' ? 6 : node.label === 'Region' ? 6.5 : 5;
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

        // Selected / Hovered Outer Ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI, false);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.2 / globalScale;
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
        ctx.fillStyle = isSelected ? 'rgba(30, 41, 59, 0.95)' : isHovered ? 'rgba(30, 41, 59, 0.92)' : 'rgba(18, 21, 31, 0.88)';
        ctx.strokeStyle = isDisrupted 
          ? 'rgba(239, 68, 68, 0.7)' 
          : isSelected 
            ? '#ffffff' 
            : isHovered 
              ? 'rgba(255, 255, 255, 0.4)' 
              : 'rgba(255, 255, 255, 0.12)';
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
        ctx.fillStyle = isDisrupted ? '#fca5a5' : isSelected ? '#ffffff' : isHovered ? '#ffffff' : '#f1f5f9';
        ctx.fillText(label, node.x, textY);

        // Reset globalAlpha
        ctx.globalAlpha = 1.0;
      })
      // Ensure both the node circle and label pill are clickable hit areas with generous hit testing
      .nodePointerAreaPaint((node, color, ctx, globalScale) => {
        const baseRadius = node.label === 'Product' ? 7.5 : node.label === 'Supplier' ? 6 : node.label === 'Region' ? 6.5 : 5;
        const r = baseRadius * 1.35;
        
        ctx.fillStyle = color;
        
        // 1. Circle area
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
        ctx.fill();

        // 2. Label pill area
        const label = node.name || node.id;
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `600 ${fontSize}px Inter, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const padX = 5 / globalScale;
        const padY = 2.5 / globalScale;
        const textY = node.y + r + (4 / globalScale);

        const pillX = node.x - textWidth / 2 - padX;
        const pillY = textY - padY;
        const pillW = textWidth + padX * 2;
        const pillH = fontSize + padY * 2;

        ctx.beginPath();
        ctx.rect(pillX, pillY, pillW, pillH);
        ctx.fill();
      })
      .onNodeClick((node, event) => {
        if (node && stateRef.current.onSelectNode) {
          stateRef.current.onSelectNode(node);
        }
      })
      .onBackgroundClick(() => {
        if (!stateRef.current.hoverNode && stateRef.current.onSelectNode) {
          stateRef.current.onSelectNode(null);
        }
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
        if (graphInstanceRef.current && !selectedNode) {
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
          {['ALL', 'Product', 'Component', 'Supplier', 'Facility', 'LogisticsHub', 'Region'].map(lbl => (
            <button
              key={lbl}
              className={`btn btn-sm ${filterLabel === lbl ? 'btn-primary' : ''}`}
              style={{ padding: '3px 8px', fontSize: '0.7rem', border: 'none' }}
              onClick={() => setFilterLabel(lbl)}
            >
              {lbl === 'LogisticsHub' ? 'Hubs' : lbl === 'Region' ? 'Regions' : lbl}
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
          <div className="legend-item" onClick={() => setFilterLabel('Region')}>
            <div className="legend-dot" style={{ backgroundColor: NODE_PALETTE.Region }} />
            <span>Region</span>
          </div>
        </div>
      </div>
    </div>
  );
}
