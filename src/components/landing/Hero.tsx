'use client';

import { useEffect, useState } from 'react';

interface HeroProps {
  onExplore: () => void;
}

export function Hero({ onExplore }: HeroProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="hero">
      <div className="hero__bg">
        <div className="hero__gradient" style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }} />
        <div className="hero__grid" />
        <div className="hero__noise" />
      </div>

      <div className="hero__content hero__content--visible">
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          <span>AI-Powered Risk Intelligence</span>
        </div>

        <h1 className="hero__title">
          <span className="hero__title-line">Understand Your</span>
          <span className="hero__title-accent">Urban Risk</span>
        </h1>

        <p className="hero__subtitle">
          Analyze wildfire exposure, insurance risks, and development patterns across Canada. 
          Make informed decisions with multi-agent AI analysis.
        </p>

        <div className="hero__actions">
          <button className="hero__cta" onClick={onExplore}>
            <span>Explore Map</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <a href="#features" className="hero__secondary">
            Learn More
          </a>
        </div>

        <div className="hero__stats">
          <div className="hero__stat">
            <span className="hero__stat-value">1,600+</span>
            <span className="hero__stat-label">FSA Regions</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-value">5</span>
            <span className="hero__stat-label">Risk Levels</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-value">3</span>
            <span className="hero__stat-label">AI Agents</span>
          </div>
        </div>
      </div>

      <button className="hero__scroll" onClick={onExplore}>
        <span>Scroll to explore</span>
        <div className="hero__scroll-indicator">
          <div className="hero__scroll-dot" />
        </div>
      </button>

      <style jsx>{`
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 80px 24px 40px;
        }

        .hero__bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .hero__gradient {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at 30% 20%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 60%);
          transition: transform 0.3s ease-out;
        }

        .hero__grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
        }

        .hero__noise {
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }

        .hero__content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 900px;
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero__content--visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 100px;
          font-size: 0.8rem;
          color: #fca5a5;
          margin-bottom: 32px;
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .hero__badge-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .hero__title {
          font-family: var(--font-charis), serif;
          font-size: clamp(3rem, 8vw, 6rem);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin: 0 0 24px;
        }

        .hero__title-line {
          display: block;
          color: #fafafa;
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        .hero__title-accent {
          display: block;
          background: linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #ef4444 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: fadeInUp 0.8s ease-out 0.4s both, gradientShift 8s ease-in-out infinite;
        }

        .hero__subtitle {
          font-family: var(--font-poppins), sans-serif;
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: #a1a1aa;
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto 40px;
          animation: fadeInUp 0.8s ease-out 0.5s both;
        }

        .hero__actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 60px;
          animation: fadeInUp 0.8s ease-out 0.6s both;
        }

        .hero__cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: var(--font-poppins), sans-serif;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .hero__cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px rgba(220, 38, 38, 0.3);
        }

        .hero__cta svg {
          transition: transform 0.3s ease;
        }

        .hero__cta:hover svg {
          transform: translateX(4px);
        }

        .hero__secondary {
          padding: 16px 32px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: #d1d5db;
          font-family: var(--font-poppins), sans-serif;
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .hero__secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .hero__stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          animation: fadeInUp 0.8s ease-out 0.7s both;
        }

        .hero__stat {
          text-align: center;
        }

        .hero__stat-value {
          display: block;
          font-family: var(--font-charis), serif;
          font-size: 2rem;
          font-weight: 700;
          color: #fafafa;
        }

        .hero__stat-label {
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.8rem;
          color: #71717a;
        }

        .hero__stat-divider {
          width: 1px;
          height: 40px;
          background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }

        .hero__scroll {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          color: #71717a;
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.3s ease;
          animation: fadeIn 1s ease-out 1s both;
        }

        .hero__scroll:hover {
          color: #a1a1aa;
        }

        .hero__scroll-indicator {
          width: 24px;
          height: 40px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          justify-content: center;
          padding-top: 8px;
        }

        .hero__scroll-dot {
          width: 4px;
          height: 8px;
          background: #ef4444;
          border-radius: 2px;
          animation: scrollBounce 2s ease-in-out infinite;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(12px); opacity: 0.3; }
        }

        @media (max-width: 768px) {
          .hero__stats { flex-wrap: wrap; gap: 24px; }
          .hero__stat-divider { display: none; }
          .hero__actions { flex-direction: column; width: 100%; }
          .hero__cta, .hero__secondary { width: 100%; justify-content: center; }
        }
      `}</style>
    </section>
  );
}
