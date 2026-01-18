'use client';

import { useState, useEffect, useCallback } from 'react';
import { RiskScoreCard } from './RiskScoreCard';
import { RiskRankings } from './RiskRankings';
import { CostProjections } from './CostProjections';
import { AgentInsights } from './AgentInsights';
import { RiskScore, RiskRanking, CostProjection, AgentConclusion } from '@/lib/types/hazard';

interface RightSidebarProps {
  selectedRegionId?: string;
  onRegionSelect?: (regionId: string) => void;
}

interface RegionData {
  regionId: string;
  regionName: string;
  riskScore: RiskScore | null;
  costProjections: CostProjection[];
  agentConclusions: AgentConclusion[];
  hazardSummary: { totalHistoricalFires: number; totalAreaBurnedHa: number; lastUpdated: Date | null };
}

interface PipelineStatus {
  isRunning: boolean;
  lastRun: Date | null;
  regions: { total: number; scored: number };
}

export function RightSidebar({ selectedRegionId, onRegionSelect }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'settings'>('overview');
  const [rankings, setRankings] = useState<RiskRanking[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDemoRankings = (): RiskRanking[] => [
    { regionId: 'kamloops', regionName: 'Kamloops', score: 78, rank: 1, trend: 'increasing', changeFromLastPeriod: 5 },
    { regionId: 'kelowna', regionName: 'Kelowna', score: 72, rank: 2, trend: 'stable', changeFromLastPeriod: 1 },
    { regionId: 'penticton', regionName: 'Penticton', score: 65, rank: 3, trend: 'stable', changeFromLastPeriod: -2 },
    { regionId: 'vernon', regionName: 'Vernon', score: 58, rank: 4, trend: 'decreasing', changeFromLastPeriod: -8 },
    { regionId: 'merritt', regionName: 'Merritt', score: 54, rank: 5, trend: 'increasing', changeFromLastPeriod: 4 },
  ];

  const fetchRankings = useCallback(async () => {
    try {
      const response = await fetch('/api/risk/rankings');
      if (response.ok) {
        const data = await response.json();
        const rankingsData = data.rankings || [];
        setRankings(rankingsData.length > 0 ? rankingsData : getDemoRankings());
      } else {
        setRankings(getDemoRankings());
      }
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
      setRankings(getDemoRankings());
    }
  }, []);

  const getDemoRegionData = (regionId: string): RegionData => ({
    regionId,
    regionName: regionId.charAt(0).toUpperCase() + regionId.slice(1),
    riskScore: {
      regionId,
      overallScore: 72,
      category: 'high' as const,
      components: {
        wildfireExposure: 85,
        historicalLoss: 68,
        vulnerabilityIndex: 55,
        climateProjection: 72,
        mitigationFactor: 35
      },
      confidence: 0.82,
      calculatedAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    costProjections: [
      { regionId, scenario: 'baseline' as const, timeHorizon: 10, projectedAnnualLoss: 120000, confidenceInterval: { lower: 85000, upper: 180000 }, keyDrivers: ['Wildfire exposure', 'Interface zone'], mitigationSavings: 25000 },
      { regionId, scenario: 'moderate_climate' as const, timeHorizon: 10, projectedAnnualLoss: 185000, confidenceInterval: { lower: 140000, upper: 260000 }, keyDrivers: ['Climate trends', 'Drought risk'], mitigationSavings: 35000 },
      { regionId, scenario: 'severe_climate' as const, timeHorizon: 10, projectedAnnualLoss: 320000, confidenceInterval: { lower: 220000, upper: 480000 }, keyDrivers: ['Extreme events', 'Infrastructure age'], mitigationSavings: 55000 }
    ],
    agentConclusions: [
      { agentId: 'insurance-analyst', agentName: 'Insurance Risk Analyst', timestamp: new Date(), regionId, conclusion: 'High wildfire exposure due to interface zone location. Recommend FireSmart landscaping and defensible space maintenance.', confidence: 0.89, supportingEvidence: ['Historical fire data', 'Interface zone proximity'], reasoning: 'Analysis of 10-year fire perimeter data shows elevated risk in this zone.', dataSourcesCited: ['BC Wildfire Service', 'CWFIS'] },
      { agentId: 'mitigation-strategist', agentName: 'Mitigation Strategist', timestamp: new Date(), regionId, conclusion: 'Aging water infrastructure may limit fire suppression capacity. Coordinate with municipal authority on upgrades.', confidence: 0.75, supportingEvidence: ['Infrastructure age assessment', 'Flow rate analysis'], reasoning: 'Water system capacity analysis indicates potential bottlenecks during peak demand.', dataSourcesCited: ['Municipal Assessment', 'BC Infrastructure Report'] }
    ],
    hazardSummary: { totalHistoricalFires: 127, totalAreaBurnedHa: 45200, lastUpdated: new Date() }
  });

  const fetchRegionData = useCallback(async (regionId: string) => {
    try {
      const response = await fetch(`/api/risk/${regionId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedRegion(data.riskScore ? data : getDemoRegionData(regionId));
      } else {
        setSelectedRegion(getDemoRegionData(regionId));
      }
    } catch (err) {
      console.error('Failed to fetch region data:', err);
      setSelectedRegion(getDemoRegionData(regionId));
    }
  }, []);

  const fetchPipelineStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/pipeline');
      if (response.ok) {
        const data = await response.json();
        setPipelineStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline status:', err);
    }
  }, []);

  const runPipeline = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full' })
      });
      if (!response.ok) throw new Error('Pipeline execution failed');
      await Promise.all([fetchRankings(), fetchPipelineStatus(), selectedRegionId ? fetchRegionData(selectedRegionId) : Promise.resolve()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't auto-fetch rankings or region data on mount. Only fetch region data when a region is selected.
  useEffect(() => { 
    if (selectedRegionId) {
      fetchRegionData(selectedRegionId);
    } else {
      setSelectedRegion(null);
    }
  }, [selectedRegionId, fetchRegionData]);

  const handleRegionSelect = (regionId: string) => {
    onRegionSelect?.(regionId);
    fetchRegionData(regionId);
  };

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__title-group">
          <h2 className="sidebar__title">Finance & Insurance</h2>
          <span className="sidebar__subtitle">Risk Analysis Dashboard</span>
        </div>
        <div className="sidebar__status">
          {pipelineStatus && (
            <span className={`status-badge ${pipelineStatus.isRunning ? 'status-badge--running' : ''}`}>
              {pipelineStatus.isRunning ? '⟳ Running' : `${pipelineStatus.regions?.scored ?? 0} regions scored`}
            </span>
          )}
        </div>
      </header>

      <nav className="sidebar__tabs">
        <button className={`tab ${activeTab === 'overview' ? 'tab--active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'reports' ? 'tab--active' : ''}`} onClick={() => setActiveTab('reports')}>Reports</button>
        <button className={`tab ${activeTab === 'settings' ? 'tab--active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
      </nav>

      <div className="sidebar__content">
        {activeTab === 'overview' && (
          <div className="sidebar__section">
            <div className="control-panel">
              <button className="run-btn" onClick={runPipeline} disabled={isLoading}>
                {isLoading ? (<><span className="run-btn__spinner" /> Running Analysis...</>) : (<><span className="run-btn__icon">▶</span> Run Pipeline</>)}
              </button>
              {error && <div className="error-message">{error}</div>}
            </div>
            {selectedRegion && <div className="sidebar__widget"><RiskScoreCard score={selectedRegion.riskScore} regionName={selectedRegion.regionName} /></div>}
            <div className="sidebar__widget"><RiskRankings rankings={rankings} onSelectRegion={handleRegionSelect} selectedRegionId={selectedRegionId} maxDisplay={8} /></div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="sidebar__section">
            {selectedRegion ? (
              <>
                <div className="sidebar__widget"><CostProjections projections={selectedRegion.costProjections} regionName={selectedRegion.regionName} /></div>
                <div className="sidebar__widget"><AgentInsights conclusions={selectedRegion.agentConclusions} maxDisplay={5} /></div>
                <div className="sidebar__widget">
                  <div className="quick-stats">
                    <h3 className="quick-stats__title">Hazard Summary</h3>
                    <div className="quick-stats__grid">
                      <div className="quick-stat">
                        <span className="quick-stat__value">{selectedRegion.hazardSummary.totalHistoricalFires}</span>
                        <span className="quick-stat__label">Historical Fires</span>
                      </div>
                      <div className="quick-stat">
                        <span className="quick-stat__value">{(selectedRegion.hazardSummary.totalAreaBurnedHa / 1000).toFixed(1)}K</span>
                        <span className="quick-stat__label">Ha Burned</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="sidebar__empty"><p>Select a region to view detailed reports and projections</p></div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="sidebar__section">
            <div className="settings-panel">
              <h3 className="settings-panel__title">Pipeline Settings</h3>
              <div className="settings-group">
                <label className="settings-label"><span>Auto-refresh data</span><input type="checkbox" className="settings-toggle" /></label>
                <label className="settings-label"><span>Include historical data</span><input type="checkbox" className="settings-toggle" defaultChecked /></label>
                <label className="settings-label"><span>Historical years</span><select className="settings-select" defaultValue="10"><option value="5">5 years</option><option value="10">10 years</option><option value="20">20 years</option></select></label>
              </div>
              <div className="settings-group">
                <h4 className="settings-group__title">Data Sources</h4>
                <ul className="data-sources"><li>✓ BC Wildfire Service</li><li>✓ CWFIS (Canada)</li><li>✓ Vancouver Open Data</li><li>✓ BC Geographic Warehouse</li></ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .sidebar { width: 380px; height: 100vh; background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%); border-left: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; overflow: hidden; }
        .sidebar__header { padding: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
        .sidebar__title-group { margin-bottom: 8px; }
        .sidebar__title { font-size: 1.2rem; font-weight: 700; color: #f3f4f6; margin: 0; letter-spacing: -0.5px; }
        .sidebar__subtitle { font-size: 0.75rem; color: #6b7280; }
        .sidebar__status { margin-top: 8px; }
        .status-badge { display: inline-block; padding: 4px 10px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; font-size: 0.7rem; color: #10b981; }
        .status-badge--running { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); color: #60a5fa; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .sidebar__tabs { display: flex; padding: 0 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
        .tab { flex: 1; padding: 12px 8px; background: none; border: none; border-bottom: 2px solid transparent; color: #6b7280; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; }
        .tab:hover { color: #d1d5db; }
        .tab--active { color: #f3f4f6; border-bottom-color: #3b82f6; }
        .sidebar__content { flex: 1; overflow-y: auto; padding: 16px; }
        .sidebar__section { display: flex; flex-direction: column; gap: 16px; }
        .sidebar__empty { text-align: center; padding: 40px 20px; color: #6b7280; font-size: 0.875rem; }
        .control-panel { margin-bottom: 8px; }
        .run-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 12px; color: white; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .run-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3); }
        .run-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .run-btn__icon { font-size: 0.8rem; }
        .run-btn__spinner { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-message { margin-top: 8px; padding: 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #fca5a5; font-size: 0.8rem; }
        .quick-stats { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .quick-stats__title { font-size: 0.9rem; font-weight: 600; color: #f3f4f6; margin: 0 0 16px; }
        .quick-stats__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .quick-stat { text-align: center; padding: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; }
        .quick-stat__value { display: block; font-size: 1.5rem; font-weight: 700; color: #f59e0b; }
        .quick-stat__label { display: block; font-size: 0.7rem; color: #6b7280; margin-top: 4px; }
        .settings-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .settings-panel__title { font-size: 1rem; font-weight: 600; color: #f3f4f6; margin: 0 0 20px; }
        .settings-group { margin-bottom: 20px; }
        .settings-group__title { font-size: 0.8rem; color: #9ca3af; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .settings-label { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: #d1d5db; font-size: 0.85rem; }
        .settings-toggle { width: 40px; height: 20px; appearance: none; background: #374151; border-radius: 10px; cursor: pointer; position: relative; }
        .settings-toggle:checked { background: #3b82f6; }
        .settings-toggle::before { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform 0.2s ease; }
        .settings-toggle:checked::before { transform: translateX(20px); }
        .settings-select { padding: 6px 12px; background: #374151; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; color: #d1d5db; font-size: 0.8rem; }
        .data-sources { list-style: none; padding: 0; margin: 0; }
        .data-sources li { padding: 8px 0; color: #10b981; font-size: 0.8rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
      `}</style>
    </aside>
  );
}

export default RightSidebar;
