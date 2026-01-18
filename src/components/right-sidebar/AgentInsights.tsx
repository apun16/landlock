'use client';

import { AgentConclusion } from '@/lib/types/hazard';

interface AgentInsightsProps {
  conclusions: AgentConclusion[];
  maxDisplay?: number;
}

export function AgentInsights({ conclusions, maxDisplay = 5 }: AgentInsightsProps) {
  const displayConclusions = conclusions.slice(-maxDisplay).reverse();

  if (conclusions.length === 0) {
    return (
      <div className="insights insights--empty">
        <h3 className="insights__title"><span className="insights__title-icon">🤖</span> Agent Insights</h3>
        <p className="insights__empty-text">No agent analysis available yet. Run the pipeline to generate insights.</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const formatTimestamp = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="insights">
      <h3 className="insights__title">
        <span className="insights__title-icon">🤖</span> Agent Insights
      </h3>

      <div className="insights__list">
        {displayConclusions.map((conclusion, index) => (
          <div key={index} className="insight-item">
            <div className="insight-item__header">
              <span className="insight-item__agent">{conclusion.agentName}</span>
            </div>
            <p className="insight-item__conclusion">{conclusion.conclusion}</p>

            <div className="insight-item__meta-vertical">
              <div className="insight-item__meta-row">
                <div className="insight-item__meta-label">Confidence:</div>
                <div className="insight-item__meta-value" style={{ color: getConfidenceColor(conclusion.confidence) }}>{Math.round(conclusion.confidence * 100)}%</div>
              </div>

              {conclusion.dataSourcesCited.length > 0 && (
                <div className="insight-item__meta-row">
                  <div className="insight-item__meta-label">Sources:</div>
                  <div className="insight-item__sources-list-plain">
                    {conclusion.dataSourcesCited.map((source, idx) => (
                      <div key={idx} className="insight-item__source-line">{source}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {conclusions.length > maxDisplay && (
        <div className="insights__footer">
          <button className="insights__view-all">View all {conclusions.length} insights</button>
        </div>
      )}
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .insights { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
  .insights__title { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 600; color: #f3f4f6; margin: 0 0 16px; }
  .insights__title-icon { font-size: 1.2rem; }
  .insights__count { margin-left: auto; padding: 2px 8px; background: rgba(59, 130, 246, 0.2); border-radius: 10px; font-size: 0.75rem; color: #60a5fa; }
  .insights__empty-text { color: #9ca3af; font-size: 0.875rem; text-align: center; padding: 20px 0; }
  .insights__list { display: flex; flex-direction: column; gap: 12px; }
  .insight-item { padding: 14px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05); }
  .insight-item__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .insight-item__agent { font-size: 0.9rem; font-weight: 700; color: #ffffff; }
  .insight-item__time { font-size: 0.75rem; color: #9ca3af; }
  .insight-item__conclusion { font-size: 0.95rem; color: #d1d5db; line-height: 1.5; margin: 0 0 12px; }
  .insight-item__meta-vertical { display: flex; flex-direction: column; gap: 8px; }
  .insight-item__meta-row { display: flex; gap: 8px; align-items: flex-start; }
  .insight-item__meta-label { font-size: 0.75rem; color: #9ca3af; min-width: 80px; }
  .insight-item__meta-value { font-size: 0.9rem; font-weight: 700; color: #ffffff; }
  .insight-item__sources-list-plain { display: flex; flex-direction: column; gap: 4px; }
  .insight-item__source-line { font-size: 0.85rem; color: #cbd5e1; }
  .insights__footer { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center; }
  .insights__view-all { padding: 8px 16px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; color: #60a5fa; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; }
  .insights__view-all:hover { background: rgba(59, 130, 246, 0.25); }
`;

export default AgentInsights;
