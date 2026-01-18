'use client';

import { useEffect, useRef, useState } from 'react';

const features = [
  {
    id: '01',
    title: 'HAZARD MAPPING',
    desc: 'Wildfire, flood, and earthquake visualization across 1,647 FSA regions',
  },
  {
    id: '02', 
    title: 'AGENT ANALYSIS',
    desc: 'Three autonomous agents collaborate for comprehensive risk assessment',
  },
  {
    id: '03',
    title: 'RISK SCORING',
    desc: 'Multi-factor weighted scoring from 0-100 with detailed breakdowns',
  },
  {
    id: '04',
    title: 'COST MODELING',
    desc: 'Insurance projections under baseline, moderate, and severe scenarios',
  },
  {
    id: '05',
    title: 'REPORT GENERATION',
    desc: 'Automated reports with methodology, sources, and recommendations',
  },
  {
    id: '06',
    title: 'DATA PIPELINE',
    desc: '8-stage automation for ingestion, validation, and scoring',
  },
];

const agents = [
  { name: 'DATA_ANALYST', status: 'validates data quality and completeness' },
  { name: 'RISK_ANALYST', status: 'calculates insurance risk scores' },
  { name: 'STRATEGIST', status: 'develops mitigation recommendations' },
];

export function Features({ onExplore }: { onExplore: () => void }) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          setVisibleItems((prev) => [...new Set([...prev, index])]);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.feature-item').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="features">
      <div className="features__grid">
        <aside className="features__sidebar">
          <div className="features__label">SYSTEM MODULES</div>
          <div className="features__count">06</div>
        </aside>

        <main className="features__main">
          <div className="features__list">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className={`feature-item ${visibleItems.includes(index) ? 'feature-item--visible' : ''}`}
                data-index={index}
              >
                <span className="feature-item__id">{feature.id}</span>
                <div className="feature-item__content">
                  <h3 className="feature-item__title">{feature.title}</h3>
                  <p className="feature-item__desc">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <div className="agents-section">
        <div className="agents__header">
          <span className="agents__label">AGENT CREW</span>
          <div className="agents__line" />
        </div>
        
        <div className="agents__list">
          {agents.map((agent, i) => (
            <div key={agent.name} className="agent-row">
              <span className="agent-row__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="agent-row__name">{agent.name}</span>
              <span className="agent-row__dots" />
              <span className="agent-row__status">{agent.status}</span>
            </div>
          ))}
        </div>

        <button className="features__cta" onClick={onExplore}>
          <span>LAUNCH INTERFACE</span>
          <span className="features__cta-arrow">→</span>
        </button>
      </div>

      <style jsx>{`
        .features {
          background: var(--background);
          border-top: 1px solid var(--border);
          padding: 0;
        }

        .features__grid {
          display: grid;
          grid-template-columns: 200px 1fr;
          max-width: 1400px;
          margin: 0 auto;
        }

        .features__sidebar {
          padding: 64px 24px;
          border-right: 1px solid var(--border);
          position: sticky;
          top: 0;
          height: fit-content;
        }

        .features__label {
          font-size: 10px;
          letter-spacing: 0.15em;
          color: var(--muted);
          margin-bottom: 16px;
        }

        .features__count {
          font-size: 64px;
          font-weight: 300;
          color: var(--accent);
          line-height: 1;
        }

        .features__main {
          padding: 64px;
        }

        .features__list {
          display: flex;
          flex-direction: column;
        }

        .feature-item {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 24px;
          padding: 32px 0;
          border-bottom: 1px solid var(--border);
          opacity: 0;
          transform: translateX(-20px);
          transition: all 0.5s ease;
        }

        .feature-item--visible {
          opacity: 1;
          transform: translateX(0);
        }

        .feature-item__id {
          font-size: 12px;
          color: var(--accent-dim);
          padding-top: 4px;
        }

        .feature-item__title {
          font-size: 16px;
          font-weight: 400;
          color: var(--foreground);
          margin: 0 0 8px;
          letter-spacing: 0.05em;
        }

        .feature-item__desc {
          font-size: 13px;
          color: var(--muted);
          margin: 0;
          line-height: 1.6;
        }

        .agents-section {
          max-width: 1400px;
          margin: 0 auto;
          padding: 64px;
          border-top: 1px solid var(--border);
        }

        .agents__header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 48px;
        }

        .agents__label {
          font-size: 10px;
          letter-spacing: 0.15em;
          color: var(--accent);
          white-space: nowrap;
        }

        .agents__line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .agents__list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 48px;
        }

        .agent-row {
          display: flex;
          align-items: center;
          padding: 16px 0;
          font-size: 12px;
        }

        .agent-row__num {
          width: 32px;
          color: var(--muted);
        }

        .agent-row__name {
          color: var(--foreground);
          letter-spacing: 0.1em;
          min-width: 140px;
        }

        .agent-row__dots {
          flex: 1;
          height: 1px;
          background: repeating-linear-gradient(90deg, var(--border) 0, var(--border) 2px, transparent 2px, transparent 8px);
          margin: 0 24px;
        }

        .agent-row__status {
          color: var(--muted);
          text-transform: lowercase;
        }

        .features__cta {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          padding: 20px 40px;
          background: var(--accent);
          border: none;
          color: var(--background);
          font-family: inherit;
          font-size: 12px;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .features__cta:hover {
          background: var(--foreground);
        }

        .features__cta-arrow {
          font-size: 18px;
          transition: transform 0.2s ease;
        }

        .features__cta:hover .features__cta-arrow {
          transform: translateX(4px);
        }

        @media (max-width: 1024px) {
          .features__grid {
            grid-template-columns: 1fr;
          }
          .features__sidebar {
            display: none;
          }
          .features__main {
            padding: 48px 24px;
          }
          .agents-section {
            padding: 48px 24px;
          }
        }

        @media (max-width: 640px) {
          .agent-row__dots {
            display: none;
          }
          .agent-row {
            flex-wrap: wrap;
            gap: 8px;
          }
          .agent-row__status {
            width: 100%;
            padding-left: 32px;
          }
        }
      `}</style>
    </section>
  );
}
