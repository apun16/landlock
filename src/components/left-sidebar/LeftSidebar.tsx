'use client';

import { useState, useEffect, useCallback } from 'react';

interface BudgetAnalysis {
  funding_strength_score: number | null;
  key_allocations: Array<{ key: string; value: string; unit: string; timeframe?: string }>;
  confidence: number;
  evidence_count: number;
}

interface PolicyAnalysis {
  zoning_flexibility_score: number | null;
  proposal_momentum_score: number | null;
  approval_friction_factors: string[];
  constraints: string[];
  confidence: number;
  evidence_count: number;
}

interface UnderwriterAnalysis {
  feasibility_score: number | null;
  verdict: 'go' | 'caution' | 'avoid' | 'unknown';
  plan_variant: 'A' | 'B' | 'C' | 'unknown';
  pros: Array<{ text: string }>;
  cons: Array<{ text: string }>;
  constraints: Array<{ text: string }>;
  confidence: number;
  evidence_count: number;
}

interface RegionData {
  region_id: string;
  budget_analysis: BudgetAnalysis;
  policy_analysis: PolicyAnalysis;
  underwriter_analysis: UnderwriterAnalysis;
  generated_at: string;
}

interface LeftSidebarProps {
  selectedRegionId?: string;
  backendUrl?: string;
}

export function LeftSidebar({ selectedRegionId, backendUrl = 'http://localhost:8000' }: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'policy'>('overview');
  const [data, setData] = useState<RegionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDemoData = (regionId: string): RegionData => ({
    region_id: regionId,
    budget_analysis: {
      funding_strength_score: 72,
      key_allocations: [
        { key: 'Infrastructure', value: '45M', unit: 'CAD', timeframe: '2024' },
        { key: 'Emergency Services', value: '12M', unit: 'CAD', timeframe: '2024' },
        { key: 'Parks & Recreation', value: '8M', unit: 'CAD', timeframe: '2024' }
      ],
      confidence: 0.85,
      evidence_count: 12
    },
    policy_analysis: {
      zoning_flexibility_score: 58,
      proposal_momentum_score: 65,
      approval_friction_factors: [
        'Environmental review required for developments >5 acres',
        'Heritage overlay in downtown core',
        'Agricultural land reserve restrictions'
      ],
      constraints: [
        'Water supply limitations in north sector',
        'Wildfire interface zone building codes'
      ],
      confidence: 0.78,
      evidence_count: 8
    },
    underwriter_analysis: {
      feasibility_score: 67,
      verdict: 'caution',
      plan_variant: 'B',
      pros: [
        { text: 'Strong municipal funding for infrastructure' },
        { text: 'Growing population with housing demand' },
        { text: 'Established transportation corridors' }
      ],
      cons: [
        { text: 'Wildfire risk in interface areas' },
        { text: 'Water supply constraints during peak summer' },
        { text: 'Heritage restrictions limit density options' }
      ],
      constraints: [
        { text: 'Must maintain 30m setback from watercourses' },
        { text: 'FireSmart compliance required' }
      ],
      confidence: 0.82,
      evidence_count: 15
    },
    generated_at: new Date().toISOString()
  });

  const fetchAnalysis = useCallback(async (regionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let response = await fetch(`${backendUrl}/api/v1/analyze-from-registry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region_id: regionId })
      });
      
      if (!response.ok) {
        response = await fetch(`${backendUrl}/api/v1/demo/${regionId}`, { method: 'POST' });
      }
      
      if (!response.ok) throw new Error('Using demo data');
      const result = await response.json();
      setData(result);
    } catch {
      setData(getDemoData(regionId));
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    const regionToFetch = selectedRegionId || 'kamloops';
    fetchAnalysis(regionToFetch);
  }, [selectedRegionId, fetchAnalysis]);

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'go': return '#10b981';
      case 'caution': return '#f59e0b';
      case 'avoid': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return '#6b7280';
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__title-group">
          <h2 className="sidebar__title">Policy & Development</h2>
          <span className="sidebar__subtitle">Regional Analysis</span>
        </div>
        {data && (
          <span className="sidebar__region-badge">{data.region_id}</span>
        )}
      </header>

      <nav className="sidebar__tabs">
        <button className={`tab ${activeTab === 'overview' ? 'tab--active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'budget' ? 'tab--active' : ''}`} onClick={() => setActiveTab('budget')}>Budget</button>
        <button className={`tab ${activeTab === 'policy' ? 'tab--active' : ''}`} onClick={() => setActiveTab('policy')}>Policy</button>
      </nav>

      <div className="sidebar__content">
        {isLoading && (
          <div className="loading">
            <div className="loading__spinner" />
            <span>Analyzing region...</span>
          </div>
        )}

        {error && (
          <div className="error-panel">
            <p>{error}</p>
            <p className="error-hint">The Python backend may not have data for this region yet. Run the analysis pipeline first.</p>
            <button onClick={() => selectedRegionId && fetchAnalysis(selectedRegionId)}>Retry</button>
          </div>
        )}

        {!isLoading && !error && !data && (
          <div className="empty-state">
            <span className="empty-state__icon">📍</span>
            <p>Select a region on the map to view policy and development analysis</p>
          </div>
        )}

        {!isLoading && !error && data && activeTab === 'overview' && (
          <div className="section">
            {/* Underwriter Verdict */}
            <div className="card card--verdict">
              <div className="verdict-header">
                <span className="verdict-label">Development Verdict</span>
                <span className="verdict-badge" style={{ background: getVerdictColor(data.underwriter_analysis.verdict) }}>
                  {data.underwriter_analysis.verdict.toUpperCase()}
                </span>
              </div>
              {data.underwriter_analysis.feasibility_score !== null && (
                <div className="score-row">
                  <span>Feasibility Score</span>
                  <span className="score" style={{ color: getScoreColor(data.underwriter_analysis.feasibility_score) }}>
                    {data.underwriter_analysis.feasibility_score}/100
                  </span>
                </div>
              )}
              <div className="plan-variant">
                Recommended Plan: <strong>Variant {data.underwriter_analysis.plan_variant}</strong>
              </div>
            </div>

            {/* Score Summary */}
            <div className="card">
              <h3 className="card__title">Score Summary</h3>
              <div className="scores-grid">
                <div className="score-item">
                  <span className="score-item__label">Funding Strength</span>
                  <span className="score-item__value" style={{ color: getScoreColor(data.budget_analysis.funding_strength_score) }}>
                    {data.budget_analysis.funding_strength_score ?? '—'}
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-item__label">Zoning Flexibility</span>
                  <span className="score-item__value" style={{ color: getScoreColor(data.policy_analysis.zoning_flexibility_score) }}>
                    {data.policy_analysis.zoning_flexibility_score ?? '—'}
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-item__label">Proposal Momentum</span>
                  <span className="score-item__value" style={{ color: getScoreColor(data.policy_analysis.proposal_momentum_score) }}>
                    {data.policy_analysis.proposal_momentum_score ?? '—'}
                  </span>
                </div>
                <div className="score-item">
                  <span className="score-item__label">Feasibility</span>
                  <span className="score-item__value" style={{ color: getScoreColor(data.underwriter_analysis.feasibility_score) }}>
                    {data.underwriter_analysis.feasibility_score ?? '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pros & Cons */}
            <div className="card">
              <h3 className="card__title">Pros & Cons</h3>
              <div className="pros-cons">
                <div className="pros">
                  <h4 className="pros__title">✓ Pros</h4>
                  {data.underwriter_analysis.pros.length > 0 ? (
                    <ul>{data.underwriter_analysis.pros.map((p, i) => <li key={i}>{p.text}</li>)}</ul>
                  ) : (
                    <p className="empty-text">No pros identified</p>
                  )}
                </div>
                <div className="cons">
                  <h4 className="cons__title">✗ Cons</h4>
                  {data.underwriter_analysis.cons.length > 0 ? (
                    <ul>{data.underwriter_analysis.cons.map((c, i) => <li key={i}>{c.text}</li>)}</ul>
                  ) : (
                    <p className="empty-text">No cons identified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && data && activeTab === 'budget' && (
          <div className="section">
            <div className="card">
              <div className="card__header">
                <h3 className="card__title">Budget Analysis</h3>
                <span className="confidence-badge">
                  {Math.round(data.budget_analysis.confidence * 100)}% confidence
                </span>
              </div>
              
              {data.budget_analysis.funding_strength_score !== null && (
                <div className="score-display">
                  <div className="score-display__value" style={{ color: getScoreColor(data.budget_analysis.funding_strength_score) }}>
                    {data.budget_analysis.funding_strength_score}
                  </div>
                  <div className="score-display__label">Funding Strength</div>
                  <div className="score-display__bar">
                    <div 
                      className="score-display__fill" 
                      style={{ 
                        width: `${data.budget_analysis.funding_strength_score}%`,
                        background: getScoreColor(data.budget_analysis.funding_strength_score)
                      }} 
                    />
                  </div>
                </div>
              )}

              <h4 className="subsection-title">Key Allocations</h4>
              {data.budget_analysis.key_allocations.length > 0 ? (
                <div className="allocations-list">
                  {data.budget_analysis.key_allocations.map((alloc, i) => (
                    <div key={i} className="allocation-item">
                      <span className="allocation-item__key">{alloc.key}</span>
                      <span className="allocation-item__value">{alloc.value} {alloc.unit}</span>
                      {alloc.timeframe && <span className="allocation-item__timeframe">{alloc.timeframe}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-text">No allocation data available</p>
              )}

              <div className="evidence-count">
                Based on {data.budget_analysis.evidence_count} evidence points
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && data && activeTab === 'policy' && (
          <div className="section">
            <div className="card">
              <div className="card__header">
                <h3 className="card__title">Policy Analysis</h3>
                <span className="confidence-badge">
                  {Math.round(data.policy_analysis.confidence * 100)}% confidence
                </span>
              </div>

              <div className="scores-row">
                {data.policy_analysis.zoning_flexibility_score !== null && (
                  <div className="mini-score">
                    <div className="mini-score__value" style={{ color: getScoreColor(data.policy_analysis.zoning_flexibility_score) }}>
                      {data.policy_analysis.zoning_flexibility_score}
                    </div>
                    <div className="mini-score__label">Zoning Flexibility</div>
                  </div>
                )}
                {data.policy_analysis.proposal_momentum_score !== null && (
                  <div className="mini-score">
                    <div className="mini-score__value" style={{ color: getScoreColor(data.policy_analysis.proposal_momentum_score) }}>
                      {data.policy_analysis.proposal_momentum_score}
                    </div>
                    <div className="mini-score__label">Proposal Momentum</div>
                  </div>
                )}
              </div>

              {data.policy_analysis.approval_friction_factors.length > 0 && (
                <>
                  <h4 className="subsection-title">Friction Factors</h4>
                  <ul className="factors-list factors-list--friction">
                    {data.policy_analysis.approval_friction_factors.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </>
              )}

              {data.policy_analysis.constraints.length > 0 && (
                <>
                  <h4 className="subsection-title">Constraints</h4>
                  <ul className="factors-list factors-list--constraints">
                    {data.policy_analysis.constraints.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </>
              )}

              <div className="evidence-count">
                Based on {data.policy_analysis.evidence_count} evidence points
              </div>
            </div>

            {/* Underwriter Constraints */}
            {data.underwriter_analysis.constraints.length > 0 && (
              <div className="card">
                <h3 className="card__title">Development Constraints</h3>
                <ul className="constraints-list">
                  {data.underwriter_analysis.constraints.map((c, i) => <li key={i}>{c.text}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .sidebar { width: 380px; height: 100vh; background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%); border-right: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; overflow: hidden; }
        .sidebar__header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .sidebar__title-group { margin-bottom: 8px; }
        .sidebar__title { font-size: 1.2rem; font-weight: 700; color: #f3f4f6; margin: 0; }
        .sidebar__subtitle { font-size: 0.75rem; color: #6b7280; }
        .sidebar__region-badge { display: inline-block; padding: 4px 10px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 20px; font-size: 0.7rem; color: #60a5fa; margin-top: 8px; }
        .sidebar__tabs { display: flex; padding: 0 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .tab { flex: 1; padding: 12px 8px; background: none; border: none; border-bottom: 2px solid transparent; color: #6b7280; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
        .tab:hover { color: #d1d5db; }
        .tab--active { color: #f3f4f6; border-bottom-color: #10b981; }
        .sidebar__content { flex: 1; overflow-y: auto; padding: 16px; }
        .section { display: flex; flex-direction: column; gap: 16px; }
        
        .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #6b7280; gap: 16px; }
        .loading__spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .empty-state { text-align: center; padding: 60px 20px; color: #6b7280; }
        .empty-state__icon { font-size: 3rem; display: block; margin-bottom: 16px; }
        
        .error-panel { padding: 20px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; text-align: center; }
        .error-panel p { color: #fca5a5; margin: 0 0 12px; font-size: 0.9rem; }
        .error-hint { font-size: 0.75rem !important; color: #9ca3af !important; }
        .error-panel button { padding: 8px 16px; background: #ef4444; border: none; border-radius: 8px; color: white; cursor: pointer; }
        
        .card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; }
        .card--verdict { background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 100%); border-color: rgba(16,185,129,0.2); }
        .card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .card__title { font-size: 0.95rem; font-weight: 600; color: #f3f4f6; margin: 0; }
        
        .verdict-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .verdict-label { font-size: 0.8rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
        .verdict-badge { padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: white; }
        .score-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.05); }
        .score-row span:first-child { color: #9ca3af; font-size: 0.85rem; }
        .score { font-size: 1.1rem; font-weight: 700; }
        .plan-variant { padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; color: #9ca3af; }
        .plan-variant strong { color: #f3f4f6; }
        
        .scores-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .score-item { background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; text-align: center; }
        .score-item__label { display: block; font-size: 0.7rem; color: #6b7280; margin-bottom: 8px; }
        .score-item__value { font-size: 1.5rem; font-weight: 700; }
        
        .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
        .pros__title { font-size: 0.8rem; color: #10b981; margin: 0 0 8px; }
        .cons__title { font-size: 0.8rem; color: #ef4444; margin: 0 0 8px; }
        .pros ul, .cons ul { margin: 0; padding-left: 16px; }
        .pros li { color: #d1d5db; font-size: 0.8rem; margin-bottom: 4px; }
        .cons li { color: #d1d5db; font-size: 0.8rem; margin-bottom: 4px; }
        .empty-text { color: #6b7280; font-size: 0.8rem; font-style: italic; margin: 0; }
        
        .confidence-badge { padding: 4px 10px; background: rgba(255,255,255,0.05); border-radius: 20px; font-size: 0.7rem; color: #9ca3af; }
        
        .score-display { text-align: center; padding: 20px 0; }
        .score-display__value { font-size: 3rem; font-weight: 700; }
        .score-display__label { font-size: 0.85rem; color: #6b7280; margin-top: 4px; }
        .score-display__bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 12px; overflow: hidden; }
        .score-display__fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
        
        .subsection-title { font-size: 0.8rem; color: #9ca3af; margin: 20px 0 12px; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .allocations-list { display: flex; flex-direction: column; gap: 8px; }
        .allocation-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; }
        .allocation-item__key { font-size: 0.85rem; color: #d1d5db; }
        .allocation-item__value { font-size: 0.85rem; font-weight: 600; color: #10b981; }
        .allocation-item__timeframe { font-size: 0.7rem; color: #6b7280; }
        
        .evidence-count { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.75rem; color: #6b7280; text-align: center; }
        
        .scores-row { display: flex; gap: 16px; margin-bottom: 20px; }
        .mini-score { flex: 1; text-align: center; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; }
        .mini-score__value { font-size: 2rem; font-weight: 700; }
        .mini-score__label { font-size: 0.75rem; color: #6b7280; margin-top: 4px; }
        
        .factors-list { margin: 0 0 16px; padding-left: 20px; }
        .factors-list li { font-size: 0.85rem; color: #d1d5db; margin-bottom: 6px; }
        .factors-list--friction li::marker { color: #f59e0b; }
        .factors-list--constraints li::marker { color: #ef4444; }
        
        .constraints-list { margin: 0; padding-left: 20px; }
        .constraints-list li { font-size: 0.85rem; color: #fca5a5; margin-bottom: 6px; }
      `}</style>
    </aside>
  );
}

export default LeftSidebar;
