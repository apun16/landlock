'use client';

import { RiskScore } from '@/lib/types/hazard';

interface RiskScoreCardProps {
  score: RiskScore | null;
  regionName: string;
  compact?: boolean;
}

export function RiskScoreCard({ score, regionName, compact = false }: RiskScoreCardProps) {
  if (!score) {
    return (
      <div className="risk-card risk-card--empty">
        <div className="risk-card__header">
          <h3 className="risk-card__title">{regionName}</h3>
          <span className="risk-card__badge risk-card__badge--pending">Pending Analysis</span>
        </div>
        <p className="risk-card__empty-text">Run pipeline to generate risk assessment</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const categoryColors: Record<string, string> = { low: '#10b981', moderate: '#f59e0b', high: '#f97316', very_high: '#ef4444', extreme: '#dc2626' };
  const categoryLabels: Record<string, string> = { low: 'Low Risk', moderate: 'Moderate', high: 'High Risk', very_high: 'Very High', extreme: 'Extreme' };
  const color = categoryColors[score.category] || '#6b7280';

  return (
    <div className="risk-card" style={{ '--risk-color': color } as React.CSSProperties}>
      <div className="risk-card__header">
        <h3 className="risk-card__title">{regionName}</h3>
        <span className="risk-card__badge" style={{ backgroundColor: color }}>{categoryLabels[score.category]}</span>
      </div>

      <div className="risk-card__gauge">
        <svg viewBox="0 0 120 60" className="risk-card__gauge-svg">
          <path d="M10 55 A 50 50 0 0 1 110 55" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
          <path d="M10 55 A 50 50 0 0 1 110 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score.overallScore / 100) * 157} 157`} className="risk-card__gauge-fill" />
          <text x="60" y="48" textAnchor="middle" className="risk-card__gauge-value">{score.overallScore}</text>
          <text x="60" y="58" textAnchor="middle" className="risk-card__gauge-label">/100</text>
        </svg>
      </div>

      <div className="risk-card__confidence">
        <span className="risk-card__confidence-label">Confidence:</span>
        <div className="risk-card__confidence-bar">
          <div className="risk-card__confidence-fill" style={{ width: `${score.confidence * 100}%` }} />
        </div>
        <span className="risk-card__confidence-value">{Math.round(score.confidence * 100)}%</span>
      </div>

      {!compact && (
        <>
          <div className="risk-card__components">
            <h4 className="risk-card__components-title">Risk Components</h4>
            <ComponentBar label="Wildfire Exposure" value={score.components.wildfireExposure} color="#ef4444" />
            <ComponentBar label="Historical Loss" value={score.components.historicalLoss} color="#f97316" />
            <ComponentBar label="Vulnerability" value={score.components.vulnerabilityIndex} color="#eab308" />
            <ComponentBar label="Climate Factor" value={score.components.climateProjection} color="#3b82f6" />
            <ComponentBar label="Mitigation" value={score.components.mitigationFactor} color="#10b981" inverted />
          </div>
          <div className="risk-card__validity">
            <span>Valid until: {new Date(score.validUntil).toLocaleDateString()}</span>
          </div>
        </>
      )}
      <style jsx>{styles}</style>
    </div>
  );
}

function ComponentBar({ label, value, color, inverted = false }: { label: string; value: number; color: string; inverted?: boolean }) {
  const displayValue = inverted ? 100 - value : value;
  return (
    <div className="component-bar">
      <div className="component-bar__header">
        <span className="component-bar__label">{label}</span>
        <span className="component-bar__value">{value}</span>
      </div>
      <div className="component-bar__track">
        <div className="component-bar__fill" style={{ width: `${displayValue}%`, background: color }} />
      </div>
      <style jsx>{componentStyles}</style>
    </div>
  );
}

const styles = `
  .risk-card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
  .risk-card--empty { opacity: 0.7; }
  .risk-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .risk-card__title { font-size: 1.1rem; font-weight: 600; color: #f3f4f6; margin: 0; }
  .risk-card__badge { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.5px; }
  .risk-card__badge--pending { background: #6b7280; }
  .risk-card__empty-text { color: #9ca3af; font-size: 0.875rem; text-align: center; padding: 20px 0; }
  .risk-card__gauge { display: flex; justify-content: center; margin: 8px 0 16px; }
  .risk-card__gauge-svg { width: 140px; height: 70px; }
  .risk-card__gauge-fill { transition: stroke-dasharray 1s ease-out; }
  .risk-card__gauge-value { font-size: 24px; font-weight: 700; fill: var(--risk-color); }
  .risk-card__gauge-label { font-size: 10px; fill: #9ca3af; }
  .risk-card__confidence { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .risk-card__confidence-label { font-size: 0.75rem; color: #9ca3af; }
  .risk-card__confidence-bar { flex: 1; height: 4px; background: #374151; border-radius: 2px; overflow: hidden; }
  .risk-card__confidence-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); transition: width 0.5s ease; }
  .risk-card__confidence-value { font-size: 0.75rem; color: #d1d5db; font-weight: 500; }
  .risk-card__components { margin-top: 16px; }
  .risk-card__components-title { font-size: 0.8rem; color: #9ca3af; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; }
  .risk-card__validity { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.75rem; color: #6b7280; text-align: right; }
`;

const componentStyles = `
  .component-bar { margin-bottom: 10px; }
  .component-bar__header { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .component-bar__label { font-size: 0.75rem; color: #d1d5db; }
  .component-bar__value { font-size: 0.75rem; color: #9ca3af; font-weight: 500; }
  .component-bar__track { height: 6px; background: #374151; border-radius: 3px; overflow: hidden; }
  .component-bar__fill { height: 100%; border-radius: 3px; transition: width 0.8s ease-out; }
`;

export default RiskScoreCard;
