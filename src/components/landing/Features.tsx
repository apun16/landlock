'use client';

import { useEffect, useRef, useState } from 'react';

const features = [
  {
    title: 'Multi-Hazard Mapping',
    description: 'Visualize wildfire, flood, and earthquake exposure across 1,600+ Canadian FSA regions with real-time data.',
  },
  {
    title: '3-Agent AI Crew',
    description: 'Data Analyst, Insurance Risk Analyst, and Mitigation Strategist work together to provide comprehensive insights.',
  },
  {
    title: 'Risk Scoring',
    description: 'Weighted multi-factor scoring from 0-100 with breakdowns by wildfire exposure, historical loss, and vulnerability.',
  },
  {
    title: 'Cost Projections',
    description: 'Model insurance costs under baseline, moderate climate, and severe climate scenarios with confidence intervals.',
  },
  {
    title: 'Automated Reports',
    description: 'Generate explainable risk reports with data sources, methodology, and actionable recommendations.',
  },
  {
    title: 'Real-time Pipeline',
    description: '8-stage automation pipeline for data ingestion, validation, scoring, and report generation.',
  }
];

export function Features({ onExplore }: { onExplore: () => void }) {
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);
  const featuresRef = useRef<HTMLDivElement>(null);

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

    document.querySelectorAll('.feature-card').forEach((el) => featureObserver.observe(el));

    return () => { featureObserver.disconnect(); };
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
          
          <div className="ai-section__media"> 
            <div className="media-container">
              <div className="media-placeholder" onClick={onExplore} > 
                <img className="media-placeholder__image" src="/images/feature-media.jpg" alt="Feature media" />
                <div className="media-placeholder__overlay"> 
                  <div className="media-placeholder__play"> 
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"> 
                      <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /> 
                      <rect x="2" y="6" width="20" height="12" /> 
                      </svg> 
                      </div> 
                      <p>Click to explore map</p> 
                      </div> 
                      <div className="media-placeholder__border" /> </div> 
                      </div> 
          </div>

          <div ref={featuresRef} className="features__grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`feature-card ${visibleFeatures.includes(index) ? 'feature-card--visible' : ''}`}
                data-index={index}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <h3 className="feature-card__title">{feature.title}</h3>
                <p className="feature-card__desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
              .ai-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 32px;
          background: #000000;
          overflow: hidden;
        }

        .ai-section__bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .ai-section__grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 100px 100px;
          opacity: 0.4;
        }

        .ai-section__shapes {
          position: absolute;
          inset: 0;
        }

        .shape {
          position: absolute;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .shape--1 {
          top: 10%;
          right: 10%;
          width: 300px;
          height: 300px;
          border-left: none;
          border-bottom: none;
        }

        .shape--2 {
          bottom: 20%;
          left: 15%;
          width: 200px;
          height: 200px;
          border-right: none;
          border-top: none;
        }

        .ai-section__inner {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          width: 100%;
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ai-section__inner--visible {
          opacity: 1;
          transform: translateY(0);
        }

        .ai-section__title {
          font-family: var(--font-charis), serif;
          font-size: clamp(3rem, 8vw, 6rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.04em;
          color: #ffffff;
          margin: 0 0 80px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .ai-section__title-line {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.3em;
          letter-spacing: 0.2em;
        }

        .ai-section__media {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          margin-bottom: 24px;
        }

        .media-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
        }

        .media-placeholder {
          position: relative;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          opacity: 1;
          transform: none;
        }

        .ai-section__inner--visible .media-placeholder {
          animation: fadeInScale 1s ease-out 0.3s both;
        }

        .media-placeholder:hover {
          border-color: rgba(255, 255, 255, 0.2);
          transform: scale(1.02);
        }

        .media-placeholder__image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.55) contrast(1.05);
          z-index: 0;
        }

        .media-placeholder__overlay {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
        }

        .media-placeholder:hover .media-placeholder__overlay {
          color: rgba(255, 255, 255, 0.9);
        }

        .media-placeholder__play {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .media-placeholder:hover .media-placeholder__play {
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.1);
        }

        .media-placeholder__overlay p {
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.9rem;
          margin: 0;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .media-placeholder__border {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          pointer-events: none;
        }

        .media-placeholder__border::before,
        .media-placeholder__border::after {
          content: '';
          position: absolute;
          width: 40px;
          height: 40px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .media-placeholder__border::before {
          top: 20px;
          left: 20px;
          border-right: none;
          border-bottom: none;
        }

        .media-placeholder__border::after {
          bottom: 20px;
          right: 20px;
          border-left: none;
          border-top: none;
        }

        @keyframes fadeInScale {
          from { 
            opacity: 0; 
            transform: scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }

        @media (max-width: 768px) {
          .ai-section {
            padding: 80px 24px;
          }
          .ai-section__title {
            margin-bottom: 48px;
            gap: 12px;
          }
          .shape {
            display: none;
          }
        }
        .features, .agents, .data-sources {
          padding: 60px 24px;
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
          border-radius: 0;
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
