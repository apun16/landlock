'use client';

import { RiskRanking } from '@/lib/types/hazard';

interface RiskRankingsProps {
  rankings: RiskRanking[];
  onSelectRegion?: (regionId: string) => void;
  selectedRegionId?: string;
  maxDisplay?: number;
}

export function RiskRankings({ rankings, onSelectRegion, selectedRegionId, maxDisplay = 10 }: RiskRankingsProps) {
  const displayRankings = rankings.slice(0, maxDisplay);

  if (rankings.length === 0) {
    return (
      <div className="rankings rankings--empty">
        <h3 className="rankings__title">Risk Rankings</h3>
        <p className="rankings__empty-text">No regions scored yet. Run the pipeline to generate rankings.</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  const getCategoryColor = (score: number) => {
    if (score < 20) return '#10b981';
    if (score < 40) return '#f59e0b';
    if (score < 60) return '#f97316';
    if (score < 80) return '#ef4444';
    return '#dc2626';
  };

  const getTrendIcon = (trend: RiskRanking['trend']) => ({ increasing: '↑', decreasing: '↓', stable: '→' }[trend]);
  const getTrendColor = (trend: RiskRanking['trend']) => ({ increasing: '#ef4444', decreasing: '#10b981', stable: '#6b7280' }[trend]);

  return (
    <div className="rankings">
      <div className="rankings__header">
        <h3 className="rankings__title">Risk Rankings</h3>
        <span className="rankings__subtitle">{rankings.length} regions scored</span>
      </div>

      <div className="rankings__list">
        {displayRankings.map((ranking) => {
          const isSelected = ranking.regionId === selectedRegionId;
          const color = getCategoryColor(ranking.score);

          return (
            <button key={ranking.regionId} className={`ranking-item ${isSelected ? 'ranking-item--selected' : ''}`} onClick={() => onSelectRegion?.(ranking.regionId)}>
              <div className="ranking-item__rank">{ranking.rank}</div>
              <div className="ranking-item__info">
                <span className="ranking-item__name">{ranking.regionName}</span>
                <div className="ranking-item__trend" style={{ color: getTrendColor(ranking.trend) }}>
                  <span className="ranking-item__trend-icon">{getTrendIcon(ranking.trend)}</span>
                  <span className="ranking-item__trend-text">{ranking.trend}</span>
                </div>
              </div>
              <div className="ranking-item__score" style={{ color }}>
                <span className="ranking-item__score-value">{ranking.score}</span>
                <div className="ranking-item__score-bar" style={{ width: `${ranking.score}%`, background: color }} />
              </div>
            </button>
          );
        })}
      </div>

      {rankings.length > maxDisplay && (
        <div className="rankings__footer">
          <span>+{rankings.length - maxDisplay} more regions</span>
        </div>
      )}
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .rankings { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
  .rankings__header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
  .rankings__title { font-size: 1rem; font-weight: 600; color: #f3f4f6; margin: 0; }
  .rankings__subtitle { font-size: 0.75rem; color: #6b7280; }
  .rankings__empty-text { color: #9ca3af; font-size: 0.875rem; text-align: center; padding: 20px 0; }
  .rankings__list { display: flex; flex-direction: column; gap: 8px; }
  .ranking-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; cursor: pointer; transition: all 0.2s ease; width: 100%; text-align: left; }
  .ranking-item:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.1); transform: translateX(4px); }
  .ranking-item--selected { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }
  .ranking-item__rank { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.1); border-radius: 8px; font-size: 0.8rem; font-weight: 700; color: #d1d5db; }
  .ranking-item:nth-child(1) .ranking-item__rank { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1a1a2e; }
  .ranking-item:nth-child(2) .ranking-item__rank { background: linear-gradient(135deg, #9ca3af, #6b7280); color: #1a1a2e; }
  .ranking-item:nth-child(3) .ranking-item__rank { background: linear-gradient(135deg, #d97706, #92400e); color: white; }
  .ranking-item__info { flex: 1; min-width: 0; }
  .ranking-item__name { display: block; font-size: 0.875rem; font-weight: 500; color: #f3f4f6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ranking-item__trend { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; margin-top: 2px; }
  .ranking-item__trend-icon { font-size: 0.8rem; }
  .ranking-item__trend-text { text-transform: capitalize; }
  .ranking-item__score { text-align: right; min-width: 60px; }
  .ranking-item__score-value { display: block; font-size: 1rem; font-weight: 700; }
  .ranking-item__score-bar { height: 3px; border-radius: 1.5px; margin-top: 4px; transition: width 0.5s ease; }
  .rankings__footer { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center; font-size: 0.75rem; color: #6b7280; }
`;

export default RiskRankings;
