import React, { useState, useEffect } from 'react';

const PERCENTAGES = [10, 20, 35, 40, 55, 67, 88, 100];
const STATUS_LOGS = [
  'INITIALIZING SYSTEM',
  'CONNECTING TO COGNODB BOLT CLUSTER',
  'FETCHING MULTI-TIER GRAPH TOPOLOGY',
  'PARSING OPENCYPHER RESILIENCE SCHEMAS',
  'COMPUTING DEGREE CENTRALITY & SPOFS',
  'ASSEMBLING BOM HIERARCHIES',
  'MOUNTING FORCE CANVAS',
  'SYSTEM READY'
];

export default function LoadingScreen({ isLoaded }) {
  const [percentIndex, setPercentIndex] = useState(0);
  const [shouldRender, setShouldRender] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Stepped progression across 2 seconds (250ms * 8 steps = 2000ms)
    const interval = setInterval(() => {
      setPercentIndex(prev => {
        if (prev < PERCENTAGES.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 240);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (percentIndex === PERCENTAGES.length - 1) {
      // Reached 100%, wait brief 200ms moment then fade out cleanly
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setShouldRender(false), 250);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [percentIndex]);

  if (!shouldRender) return null;

  const currentPercent = PERCENTAGES[percentIndex];
  const logMessage = STATUS_LOGS[percentIndex];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#16181f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
        fontFamily: 'var(--font-mono, monospace)',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '280px', gap: '14px' }}>
        {/* Minimalist System Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em', color: '#f1f5f9' }}>
            CHAINPULSE
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8' }}>
            {currentPercent}%
          </span>
        </div>

        {/* Minimalist 2px Track */}
        <div
          style={{
            width: '100%',
            height: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: '#f1f5f9',
              width: `${currentPercent}%`,
              transition: 'width 200ms ease-out'
            }}
          />
        </div>

        {/* Raw Monospace Status Log */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b' }}>
          <span>{logMessage}</span>
          <span>[{percentIndex + 1}/{PERCENTAGES.length}]</span>
        </div>
      </div>
    </div>
  );
}
