'use client';

import { useEffect, useState } from 'react';

interface HeroProps {
  onExplore: () => void;
}

export function Hero({ onExplore }: HeroProps) {
  const [time, setTime] = useState('');
  const [coords] = useState({ lat: '50.6745° N', lon: '120.3273° W' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().slice(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero">
      <div className="hero__topo" />
      
      <div className="hero__grid">
        <div className="hero__meta">
          <div className="hero__meta-item">
            <span className="hero__meta-label">COORDINATES</span>
            <span className="hero__meta-value">{coords.lat}</span>
            <span className="hero__meta-value">{coords.lon}</span>
          </div>
          <div className="hero__meta-item">
            <span className="hero__meta-label">TIMESTAMP</span>
            <span className="hero__meta-value">{time}</span>
          </div>
          <div className="hero__meta-item">
            <span className="hero__meta-label">STATUS</span>
            <span className="hero__meta-value hero__meta-value--active">● OPERATIONAL</span>
          </div>
        </div>

        <div className="hero__main">
          <div className="hero__tag">RISK INTELLIGENCE SYSTEM</div>
          
          <h1 className="hero__title">
            <span>LAND</span>
            <span className="hero__title-accent">LOCK</span>
          </h1>
          
          <p className="hero__desc">
            Geospatial wildfire risk assessment for British Columbia. 
            Multi-agent analysis of hazard exposure, insurance implications, 
            and mitigation strategies.
          </p>

          <div className="hero__data">
            <div className="hero__data-row">
              <span className="hero__data-key">coverage</span>
              <span className="hero__data-dots" />
              <span className="hero__data-val">1,647 FSA regions</span>
            </div>
            <div className="hero__data-row">
              <span className="hero__data-key">analysis</span>
              <span className="hero__data-dots" />
              <span className="hero__data-val">3 autonomous agents</span>
            </div>
            <div className="hero__data-row">
              <span className="hero__data-key">data_sources</span>
              <span className="hero__data-dots" />
              <span className="hero__data-val">BC Gov, CWFIS, StatsCan</span>
            </div>
          </div>

          <button className="hero__btn" onClick={onExplore}>
            <span className="hero__btn-text">INITIALIZE SYSTEM</span>
            <span className="hero__btn-icon">→</span>
          </button>
        </div>

        <div className="hero__sidebar">
          <div className="hero__risk-levels">
            <div className="hero__risk-title">RISK CLASSIFICATION</div>
            <div className="hero__risk-item">
              <span className="hero__risk-bar hero__risk-bar--5" />
              <span>EXTREME</span>
            </div>
            <div className="hero__risk-item">
              <span className="hero__risk-bar hero__risk-bar--4" />
              <span>HIGH</span>
            </div>
            <div className="hero__risk-item">
              <span className="hero__risk-bar hero__risk-bar--3" />
              <span>MODERATE</span>
            </div>
            <div className="hero__risk-item">
              <span className="hero__risk-bar hero__risk-bar--2" />
              <span>LOW</span>
            </div>
            <div className="hero__risk-item">
              <span className="hero__risk-bar hero__risk-bar--1" />
              <span>MINIMAL</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero {
          min-height: 100vh;
          position: relative;
          background: var(--background);
          overflow: hidden;
        }

        .hero__topo {
          position: absolute;
          inset: 0;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cpath d='M0 200 Q100 150 200 200 T400 200' fill='none' stroke='%23c4a35a' stroke-width='0.5'/%3E%3Cpath d='M0 180 Q100 130 200 180 T400 180' fill='none' stroke='%23c4a35a' stroke-width='0.5'/%3E%3Cpath d='M0 220 Q100 170 200 220 T400 220' fill='none' stroke='%23c4a35a' stroke-width='0.5'/%3E%3Cpath d='M0 160 Q100 110 200 160 T400 160' fill='none' stroke='%23c4a35a' stroke-width='0.5'/%3E%3Cpath d='M0 240 Q100 190 200 240 T400 240' fill='none' stroke='%23c4a35a' stroke-width='0.5'/%3E%3C/svg%3E");
          background-size: 400px 400px;
        }

        .hero__grid {
          display: grid;
          grid-template-columns: 200px 1fr 180px;
          min-height: 100vh;
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
        }

        .hero__meta {
          padding: 80px 24px;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .hero__meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hero__meta-label {
          font-size: 10px;
          color: var(--muted);
          letter-spacing: 0.15em;
        }

        .hero__meta-value {
          font-size: 12px;
          color: var(--foreground);
        }

        .hero__meta-value--active {
          color: #4ade80;
        }

        .hero__main {
          padding: 120px 64px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .hero__tag {
          font-size: 11px;
          letter-spacing: 0.2em;
          color: var(--accent);
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
          display: inline-block;
        }

        .hero__title {
          font-size: clamp(48px, 10vw, 96px);
          font-weight: 400;
          letter-spacing: -0.03em;
          margin: 0 0 32px;
          line-height: 0.9;
        }

        .hero__title span {
          display: block;
        }

        .hero__title-accent {
          color: var(--accent);
        }

        .hero__desc {
          font-size: 14px;
          color: var(--muted);
          max-width: 480px;
          margin-bottom: 48px;
          line-height: 1.8;
        }

        .hero__data {
          margin-bottom: 48px;
          padding: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
        }

        .hero__data-row {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px dashed var(--border);
          font-size: 12px;
        }

        .hero__data-row:last-child {
          border-bottom: none;
        }

        .hero__data-key {
          color: var(--accent-dim);
          min-width: 120px;
        }

        .hero__data-dots {
          flex: 1;
          height: 1px;
          background: repeating-linear-gradient(90deg, var(--border) 0, var(--border) 2px, transparent 2px, transparent 6px);
          margin: 0 12px;
        }

        .hero__data-val {
          color: var(--foreground);
        }

        .hero__btn {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          padding: 16px 32px;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: inherit;
          font-size: 12px;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: all 0.2s ease;
          width: fit-content;
        }

        .hero__btn:hover {
          background: var(--accent);
          color: var(--background);
        }

        .hero__btn-icon {
          font-size: 18px;
          transition: transform 0.2s ease;
        }

        .hero__btn:hover .hero__btn-icon {
          transform: translateX(4px);
        }

        .hero__sidebar {
          padding: 80px 24px;
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .hero__risk-levels {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hero__risk-title {
          font-size: 10px;
          letter-spacing: 0.15em;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .hero__risk-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--muted);
        }

        .hero__risk-bar {
          width: 24px;
          height: 8px;
        }

        .hero__risk-bar--5 { background: #dc2626; }
        .hero__risk-bar--4 { background: #f97316; }
        .hero__risk-bar--3 { background: #eab308; }
        .hero__risk-bar--2 { background: #22c55e; }
        .hero__risk-bar--1 { background: #3b82f6; }

        @media (max-width: 1024px) {
          .hero__grid {
            grid-template-columns: 1fr;
          }
          .hero__meta {
            display: none;
          }
          .hero__sidebar {
            display: none;
          }
          .hero__main {
            padding: 100px 32px;
          }
        }
      `}</style>
    </section>
  );
}
