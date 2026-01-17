'use client';

import { CostProjection } from '@/lib/types/hazard';

interface CostProjectionsProps {
  projections: CostProjection[];
  regionName?: string;
}

export function CostProjections({ projections, regionName }: CostProjectionsProps) {
  if (projections.length === 0) {
    return (
      <div className="projections projections--empty">
        <h3 className="projections__title">Cost Projections</h3>
        <p className="projections__empty-text">No projections available. Run risk analysis to generate projections.</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const scenarioConfig: Record<string, { label: string; color: string; icon: string }> = {
    baseline: { label: 'Baseline', color: '#3b82f6', icon: '📊' },
    moderate_climate: { label: 'Moderate Climate', color: '#f59e0b', icon: '🌡️' },
    severe_climate: { label: 'Severe Climate', color: '#ef4444', icon: '🔥' },
    development_growth: { label: 'Development Growth', color: '#8b5cf6', icon: '🏗️' }
  };

  const maxValue = Math.max(...projections.map(p => p.confidenceInterval.upper));

  return (
    <div className="projections">
      <div className="projections__header">
        <h3 className="projections__title">Cost Projections</h3>
        {regionName && <span className="projections__region">{regionName}</span>}
      </div>
      <div className="projections__note"><span>10-year projected annual loss</span></div>

      <div className="projections__list">
        {projections.map((projection) => {
          const config = scenarioConfig[projection.scenario] || { label: projection.scenario, color: '#6b7280', icon: '📈' };
          const barWidth = (projection.projectedAnnualLoss / maxValue) * 100;
          const lowerWidth = (projection.confidenceInterval.lower / maxValue) * 100;
          const upperWidth = (projection.confidenceInterval.upper / maxValue) * 100;

          return (
            <div key={projection.scenario} className="projection-item">
              <div className="projection-item__header">
                <span className="projection-item__icon">{config.icon}</span>
                <span className="projection-item__label">{config.label}</span>
                <span className="projection-item__value" style={{ color: config.color }}>{formatCurrency(projection.projectedAnnualLoss)}/yr</span>
              </div>
              <div className="projection-item__bar-container">
                <div className="projection-item__confidence-range" style={{ left: `${lowerWidth}%`, width: `${upperWidth - lowerWidth}%`, background: `${config.color}20` }} />
                <div className="projection-item__bar" style={{ width: `${barWidth}%`, background: config.color }} />
              </div>
              <div className="projection-item__details">
                <span className="projection-item__range">Range: {formatCurrency(projection.confidenceInterval.lower)} - {formatCurrency(projection.confidenceInterval.upper)}</span>
                {projection.mitigationSavings && <span className="projection-item__savings">Potential savings: {formatCurrency(projection.mitigationSavings)}</span>}
              </div>
              <div className="projection-item__drivers">
                {projection.keyDrivers.slice(0, 2).map((driver, idx) => <span key={idx} className="projection-item__driver-tag">{driver}</span>)}
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .projections { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
  .projections__header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
  .projections__title { font-size: 1rem; font-weight: 600; color: #f3f4f6; margin: 0; }
  .projections__region { font-size: 0.75rem; color: #6b7280; }
  .projections__note { font-size: 0.7rem; color: #9ca3af; margin-bottom: 16px; }
  .projections__empty-text { color: #9ca3af; font-size: 0.875rem; text-align: center; padding: 20px 0; }
  .projections__list { display: flex; flex-direction: column; gap: 16px; }
  .projection-item { padding: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05); }
  .projection-item__header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .projection-item__icon { font-size: 1rem; }
  .projection-item__label { flex: 1; font-size: 0.85rem; font-weight: 500; color: #d1d5db; }
  .projection-item__value { font-size: 0.9rem; font-weight: 700; }
  .projection-item__bar-container { position: relative; height: 8px; background: #374151; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
  .projection-item__confidence-range { position: absolute; top: 0; height: 100%; border-radius: 4px; }
  .projection-item__bar { position: relative; height: 100%; border-radius: 4px; transition: width 0.8s ease-out; }
  .projection-item__details { display: flex; justify-content: space-between; font-size: 0.7rem; color: #6b7280; margin-bottom: 8px; }
  .projection-item__savings { color: #10b981; }
  .projection-item__drivers { display: flex; gap: 6px; flex-wrap: wrap; }
  .projection-item__driver-tag { padding: 2px 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px; font-size: 0.65rem; color: #9ca3af; }
`;

export default CostProjections;
