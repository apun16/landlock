'use client';

import { useEffect, useRef, useState } from 'react';

const features = [
  {
    icon: '🗺️',
    title: 'Multi-Hazard Mapping',
    description: 'Visualize wildfire, flood, and earthquake exposure across 1,600+ Canadian FSA regions with real-time data.',
    color: '#ef4444'
  },
  {
    icon: '🤖',
    title: '3-Agent AI Crew',
    description: 'Data Analyst, Insurance Risk Analyst, and Mitigation Strategist work together to provide comprehensive insights.',
    color: '#3b82f6'
  },
  {
    icon: '📊',
    title: 'Risk Scoring',
    description: 'Weighted multi-factor scoring from 0-100 with breakdowns by wildfire exposure, historical loss, and vulnerability.',
    color: '#f59e0b'
  },
  {
    icon: '💰',
    title: 'Cost Projections',
    description: 'Model insurance costs under baseline, moderate climate, and severe climate scenarios with confidence intervals.',
    color: '#10b981'
  },
  {
    icon: '📋',
    title: 'Automated Reports',
    description: 'Generate explainable risk reports with data sources, methodology, and actionable recommendations.',
    color: '#8b5cf6'
  },
  {
    icon: '⚡',
    title: 'Real-time Pipeline',
    description: '8-stage automation pipeline for data ingestion, validation, scoring, and report generation.',
    color: '#ec4899'
  }
];

const agents = [
  {
    name: 'Data Analyst',
    role: 'Quality Validator',
    description: 'Validates wildfire and zoning data quality, identifies gaps, and ensures data integrity before analysis.',
    avatar: '🔍'
  },
  {
    name: 'Insurance Risk Analyst',
    role: 'Risk Assessor',
    description: 'Assesses hazards using geospatial and historical patterns, calculates risk scores, and projects costs.',
    avatar: '📈'
  },
  {
    name: 'Mitigation Strategist',
    role: 'Action Planner',
    description: 'Develops risk reduction strategies, recommends mitigation actions, and estimates implementation costs.',
    avatar: '🛡️'
  }
];

export function Features() {
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);
  const [visibleAgents, setVisibleAgents] = useState<number[]>([]);
  const featuresRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = { threshold: 0.2, rootMargin: '0px 0px -50px 0px' };

    const featureObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          setVisibleFeatures((prev) => [...new Set([...prev, index])]);
        }
      });
    }, observerOptions);

    const agentObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          setVisibleAgents((prev) => [...new Set([...prev, index])]);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach((el) => featureObserver.observe(el));
    document.querySelectorAll('.agent-card').forEach((el) => agentObserver.observe(el));

    return () => { featureObserver.disconnect(); agentObserver.disconnect(); };
  }, []);

  return (
    <>
      <section id="features" className="features">
        <div className="features__inner">
          <div className="features__header">
            <span className="features__label">Capabilities</span>
            <h2 className="features__title">Everything you need for<br />urban risk intelligence</h2>
            <p className="features__subtitle">Comprehensive tools for analyzing, visualizing, and acting on hazard data</p>
          </div>

          <div ref={featuresRef} className="features__grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`feature-card ${visibleFeatures.includes(index) ? 'feature-card--visible' : ''}`}
                data-index={index}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="feature-card__icon" style={{ background: `${feature.color}15`, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className="feature-card__title">{feature.title}</h3>
                <p className="feature-card__desc">{feature.description}</p>
                <div className="feature-card__glow" style={{ background: feature.color }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="agents" className="agents">
        <div className="agents__inner">
          <div className="agents__header">
            <span className="agents__label">AI Crew</span>
            <h2 className="agents__title">Powered by Multi-Agent<br />Intelligence</h2>
            <p className="agents__subtitle">Three specialized AI agents collaborate to deliver comprehensive risk analysis</p>
          </div>

          <div ref={agentsRef} className="agents__grid">
            {agents.map((agent, index) => (
              <div 
                key={index}
                className={`agent-card ${visibleAgents.includes(index) ? 'agent-card--visible' : ''}`}
                data-index={index}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="agent-card__avatar">{agent.avatar}</div>
                <div className="agent-card__info">
                  <h3 className="agent-card__name">{agent.name}</h3>
                  <span className="agent-card__role">{agent.role}</span>
                </div>
                <p className="agent-card__desc">{agent.description}</p>
                <div className="agent-card__status">
                  <span className="agent-card__dot" />
                  <span>Ready</span>
                </div>
              </div>
            ))}
          </div>

          <div className="agents__flow">
            <div className="flow-line" />
            <div className="flow-steps">
              <div className="flow-step">
                <span className="flow-step__num">1</span>
                <span className="flow-step__text">Validate Data</span>
              </div>
              <div className="flow-step">
                <span className="flow-step__num">2</span>
                <span className="flow-step__text">Assess Risk</span>
              </div>
              <div className="flow-step">
                <span className="flow-step__num">3</span>
                <span className="flow-step__text">Plan Mitigation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="data" className="data-sources">
        <div className="data-sources__inner">
          <h2 className="data-sources__title">Trusted Data Sources</h2>
          <div className="data-sources__grid">
            <div className="source-badge">BC Wildfire Service</div>
            <div className="source-badge">CWFIS Canada</div>
            <div className="source-badge">Vancouver Open Data</div>
            <div className="source-badge">BC Geographic Warehouse</div>
            <div className="source-badge">Statistics Canada</div>
            <div className="source-badge">Natural Resources Canada</div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .features, .agents, .data-sources {
          padding: 120px 24px;
          position: relative;
        }

        .features { background: #09090b; }
        .agents { background: linear-gradient(180deg, #09090b 0%, #0f0f1a 100%); }
        .data-sources { background: #0f0f1a; padding: 80px 24px; }

        .features__inner, .agents__inner, .data-sources__inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .features__header, .agents__header {
          text-align: center;
          margin-bottom: 64px;
        }

        .features__label, .agents__label {
          display: inline-block;
          padding: 6px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 100px;
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.8rem;
          color: #fca5a5;
          margin-bottom: 20px;
        }

        .features__title, .agents__title {
          font-family: var(--font-charis), serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 700;
          color: #fafafa;
          line-height: 1.2;
          margin: 0 0 16px;
        }

        .features__subtitle, .agents__subtitle {
          font-family: var(--font-poppins), sans-serif;
          font-size: 1.1rem;
          color: #71717a;
          max-width: 500px;
          margin: 0 auto;
        }

        .features__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .feature-card {
          position: relative;
          padding: 32px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .feature-card--visible {
          opacity: 1;
          transform: translateY(0);
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-4px);
        }

        .feature-card__icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          font-size: 1.5rem;
          margin-bottom: 20px;
        }

        .feature-card__title {
          font-family: var(--font-poppins), sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #fafafa;
          margin: 0 0 12px;
        }

        .feature-card__desc {
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.95rem;
          color: #71717a;
          line-height: 1.6;
          margin: 0;
        }

        .feature-card__glow {
          position: absolute;
          bottom: -100px;
          right: -100px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          opacity: 0.05;
          filter: blur(60px);
          pointer-events: none;
        }

        .agents__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 60px;
        }

        .agent-card {
          padding: 32px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          opacity: 0;
          transform: translateY(30px) scale(0.95);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .agent-card--visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .agent-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
        }

        .agent-card__avatar {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 16px;
          font-size: 2rem;
          margin-bottom: 20px;
        }

        .agent-card__info { margin-bottom: 16px; }

        .agent-card__name {
          font-family: var(--font-poppins), sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: #fafafa;
          margin: 0 0 4px;
        }

        .agent-card__role {
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.85rem;
          color: #ef4444;
        }

        .agent-card__desc {
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.95rem;
          color: #71717a;
          line-height: 1.6;
          margin: 0 0 20px;
        }

        .agent-card__status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 100px;
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.75rem;
          color: #10b981;
        }

        .agent-card__dot {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .agents__flow {
          position: relative;
          padding: 40px 0;
        }

        .flow-line {
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), rgba(59, 130, 246, 0.3), rgba(16, 185, 129, 0.3), transparent);
        }

        .flow-steps {
          display: flex;
          justify-content: center;
          gap: 120px;
        }

        .flow-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .flow-step__num {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a2e;
          border: 2px solid rgba(239, 68, 68, 0.3);
          border-radius: 50%;
          font-family: var(--font-charis), serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #ef4444;
        }

        .flow-step__text {
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.9rem;
          color: #a1a1aa;
        }

        .data-sources__title {
          font-family: var(--font-poppins), sans-serif;
          font-size: 1rem;
          font-weight: 500;
          color: #71717a;
          text-align: center;
          margin: 0 0 32px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .data-sources__grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
        }

        .source-badge {
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 100px;
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.9rem;
          color: #a1a1aa;
          transition: all 0.2s ease;
        }

        .source-badge:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          color: #fafafa;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @media (max-width: 768px) {
          .features, .agents { padding: 80px 24px; }
          .flow-steps { gap: 40px; flex-wrap: wrap; }
          .flow-line { display: none; }
        }
      `}</style>
    </>
  );
}
