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
        <span className="insights__count">{conclusions.length}</span>
      </h3>

      <div className="insights__list">
        {displayConclusions.map((conclusion, index) => (
          <div key={index} className="insight-item">
            <div className="insight-item__header">
              <span className="insight-item__agent">{conclusion.agentName}</span>
              <span className="insight-item__time">{formatTimestamp(conclusion.timestamp)}</span>
            </div>
            <p className="insight-item__conclusion">{conclusion.conclusion}</p>
            <div className="insight-item__meta">
              <div className="insight-item__confidence">
                <span className="insight-item__confidence-label">Confidence:</span>
                <div className="insight-item__confidence-bar">
                  <div className="insight-item__confidence-fill" style={{ width: `${conclusion.confidence * 100}%`, background: getConfidenceColor(conclusion.confidence) }} />
                </div>
                <span className="insight-item__confidence-value" style={{ color: getConfidenceColor(conclusion.confidence) }}>{Math.round(conclusion.confidence * 100)}%</span>
              </div>
            </div>
            {conclusion.dataSourcesCited.length > 0 && (
              <div className="insight-item__sources">
                <span className="insight-item__sources-label">Sources:</span>
                <div className="insight-item__sources-list">
                  {conclusion.dataSourcesCited.slice(0, 3).map((source, idx) => <span key={idx} className="insight-item__source-tag">{source}</span>)}
                  {conclusion.dataSourcesCited.length > 3 && <span className="insight-item__source-tag insight-item__source-tag--more">+{conclusion.dataSourcesCited.length - 3} more</span>}
                </div>
              </div>
            )}
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
  .insight-item { padding: 14px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05); border-left: 3px solid #3b82f6; }
  .insight-item__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .insight-item__agent { font-size: 0.75rem; font-weight: 600; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.5px; }
  .insight-item__time { font-size: 0.7rem; color: #6b7280; }
  .insight-item__conclusion { font-size: 0.85rem; color: #d1d5db; line-height: 1.5; margin: 0 0 12px; }
  .insight-item__meta { display: flex; gap: 16px; margin-bottom: 10px; }
  .insight-item__confidence { display: flex; align-items: center; gap: 6px; }
  .insight-item__confidence-label { font-size: 0.7rem; color: #6b7280; }
  .insight-item__confidence-bar { width: 60px; height: 4px; background: #374151; border-radius: 2px; overflow: hidden; }
  .insight-item__confidence-fill { height: 100%; transition: width 0.5s ease; }
  .insight-item__confidence-value { font-size: 0.7rem; font-weight: 600; }
  .insight-item__sources { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .insight-item__sources-label { font-size: 0.7rem; color: #6b7280; }
  .insight-item__sources-list { display: flex; gap: 4px; flex-wrap: wrap; }
  .insight-item__source-tag { padding: 2px 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px; font-size: 0.65rem; color: #9ca3af; }
  .insight-item__source-tag--more { color: #6b7280; font-style: italic; }
  .insights__footer { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center; }
  .insights__view-all { padding: 8px 16px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; color: #60a5fa; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; }
  .insights__view-all:hover { background: rgba(59, 130, 246, 0.25); }
`;

export default AgentInsights;
