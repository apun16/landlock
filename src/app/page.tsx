'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Hero, Navigation, Features } from '@/components/landing';

const HazardMap = dynamic(() => import('@/components/HazardMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-red-500" />
        <p className="text-zinc-400">Initializing map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [showMap, setShowMap] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const handleExplore = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowMap(true);
      setIsTransitioning(false);
    }, 600);
  };

  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowMap(false);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);
  };

  useEffect(() => {
    if (showMap) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMap]);

  if (showMap) {
    return (
      <div className={`map-view ${isTransitioning ? 'map-view--transitioning' : ''}`}>
        <button className="back-button" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Home</span>
        </button>
        <HazardMap />
        <style jsx>{`
          .map-view {
            position: fixed;
            inset: 0;
            z-index: 200;
            animation: fadeIn 0.6s ease-out;
          }
          .map-view--transitioning {
            animation: fadeOut 0.6s ease-out forwards;
          }
          .back-button {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: rgba(9, 9, 11, 0.9);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: #fafafa;
            font-family: var(--font-poppins), sans-serif;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .back-button:hover {
            background: rgba(39, 39, 42, 0.9);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateX(-2px);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(1.02); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeOut {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(0.98); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <main className={`landing ${isTransitioning ? 'landing--transitioning' : ''}`}>
      <Navigation onExplore={handleExplore} />
      <Hero onExplore={handleExplore} />
      <Features />
      
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="footer__logo">LandLock</span>
            <p className="footer__tagline">Understanding your urban risk exposure</p>
          </div>
          <div className="footer__links">
            <a href="#features">Features</a>
            <a href="#agents">AI Agents</a>
            <a href="#data">Data Sources</a>
          </div>
          <div className="footer__cta">
            <button onClick={handleExplore} className="footer__button">
              Launch App →
            </button>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2026 LandLock. Built for BC risk intelligence.</p>
        </div>
      </footer>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: #09090b;
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .landing--transitioning {
          opacity: 0;
          transform: scale(1.02);
        }
        .footer {
          padding: 80px 24px 32px;
          background: linear-gradient(180deg, #0f0f1a 0%, #09090b 100%);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .footer__inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .footer__logo {
          font-family: var(--font-charis), serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fafafa;
        }
        .footer__tagline {
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.9rem;
          color: #71717a;
          margin: 8px 0 0;
        }
        .footer__links {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer__links a {
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.9rem;
          color: #a1a1aa;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer__links a:hover {
          color: #fafafa;
        }
        .footer__button {
          padding: 14px 28px;
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
        .footer__button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(220, 38, 38, 0.3);
        }
        .footer__bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 24px;
          text-align: center;
        }
        .footer__bottom p {
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.85rem;
          color: #52525b;
          margin: 0;
        }
        @media (max-width: 768px) {
          .footer__inner {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .footer__links {
            flex-direction: row;
            justify-content: center;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </main>
  );
}
