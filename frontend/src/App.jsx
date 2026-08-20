import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GraphCanvas from './components/GraphCanvas';
import DisruptionPanel from './components/DisruptionPanel';
import SPOFRadar from './components/SPOFRadar';
import NodeDrawer from './components/NodeDrawer';
import CypherModal from './components/CypherModal';
import ProductBOMModal from './components/ProductBOMModal';
import { checkHealth, fetchGraph, simulateDisruption, fetchSPOFs } from './services/api';

export default function App() {
  const [health, setHealth] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [spofData, setSpofData] = useState(null);
  const [activeTab, setActiveTab] = useState('DISRUPTION'); // 'DISRUPTION' | 'SPOF'
  
  // Disruption Simulation state
  const [disruptedNodeIds, setDisruptedNodeIds] = useState([]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);

  // Inspector & Modals state
  const [selectedNode, setSelectedNode] = useState(null);
  const [isCypherModalOpen, setIsCypherModalOpen] = useState(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);

  // Load initial graph, health & SPOFs
  useEffect(() => {
    checkHealth().then(setHealth).catch(console.error);
    fetchGraph().then(setGraphData).catch(console.error);
    fetchSPOFs().then(setSpofData).catch(console.error);
  }, []);

  // Handler for triggering disruptions
  const handleTriggerDisruption = async (nodeIds, scenarioName = 'Custom Disruption') => {
    setDisruptedNodeIds(nodeIds);
    setLoadingSimulation(true);
    try {
      const result = await simulateDisruption(nodeIds, scenarioName);
      setSimulationResult(result);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoadingSimulation(false);
    }
  };

  // Reset all active simulations
  const handleResetDisruption = () => {
    setDisruptedNodeIds([]);
    setSimulationResult(null);
  };

  // Select node for detailed inspector
  const handleSelectNode = (node) => {
    setSelectedNode(node);
  };

  const handleSelectComponentFromSPOF = (compId) => {
    const found = graphData.nodes?.find(n => n.id === compId);
    if (found) {
      setSelectedNode(found);
    }
  };

  const revenueAtRisk = simulationResult?.total_daily_revenue_at_risk_usd || 0;
  const affectedNodeIds = simulationResult?.affected_node_ids || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Streamlined Top Navigation with Integrated Telemetry Metrics */}
      <Navbar
        health={health}
        totalNodes={graphData.nodes?.length || 0}
        totalLinks={graphData.links?.length || 0}
        spofCount={spofData?.total_spofs || 0}
        revenueAtRisk={revenueAtRisk}
        disruptedNodes={disruptedNodeIds}
        onResetDisruption={handleResetDisruption}
        onOpenCypherModal={() => setIsCypherModalOpen(true)}
        onOpenBOMModal={() => setIsBOMModalOpen(true)}
      />

      {/* Main Full-Height Workbench */}
      <div className="app-layout">
        {/* Interactive Graph Canvas Area */}
        <div className="canvas-area">
          <GraphCanvas
            graphData={graphData}
            disruptedNodeIds={disruptedNodeIds}
            affectedNodeIds={affectedNodeIds}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
            onSimulateDisruption={handleTriggerDisruption}
          />
        </div>

        {/* Right Workbench Sidebar */}
        <aside className="sidebar-panel">
          <div className="sidebar-header">
            <div className="segmented-control">
              <button
                className={`segmented-button ${activeTab === 'DISRUPTION' ? 'active' : ''}`}
                onClick={() => setActiveTab('DISRUPTION')}
              >
                Disruption Lab
              </button>
              <button
                className={`segmented-button ${activeTab === 'SPOF' ? 'active' : ''}`}
                onClick={() => setActiveTab('SPOF')}
              >
                SPOF Radar ({spofData?.total_spofs || 0})
              </button>
            </div>
          </div>

          <div className="sidebar-content">
            {activeTab === 'DISRUPTION' ? (
              <DisruptionPanel
                onTriggerDisruption={handleTriggerDisruption}
                simulationResult={simulationResult}
                activeDisruptedIds={disruptedNodeIds}
                onResetDisruption={handleResetDisruption}
                onSelectNode={handleSelectNode}
              />
            ) : (
              <SPOFRadar
                spofData={spofData}
                onSimulateDisruption={handleTriggerDisruption}
                onSelectComponent={handleSelectComponentFromSPOF}
              />
            )}
          </div>
        </aside>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <NodeDrawer
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onSimulateDisruption={handleTriggerDisruption}
            isDisrupted={disruptedNodeIds.includes(selectedNode.id)}
          />
        )}
      </div>

      {/* openCypher Query Inspector Modal */}
      <CypherModal
        isOpen={isCypherModalOpen}
        onClose={() => setIsCypherModalOpen(false)}
      />

      {/* Product BOM Tree Explorer Modal */}
      <ProductBOMModal
        isOpen={isBOMModalOpen}
        onClose={() => setIsBOMModalOpen(false)}
        selectedProductId={selectedNode?.label === 'Product' ? selectedNode.id : 'prod_1'}
      />
    </div>
  );
}
