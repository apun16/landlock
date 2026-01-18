'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Hero, Navigation, Features } from '@/components/landing';
import { LeftSidebar } from '@/components/left-sidebar';
import { RightSidebar } from '@/components/right-sidebar';

const HazardMap = dynamic(() => import('@/components/HazardMap'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="map-loading__content">
        <div className="map-loading__spinner" />
        <span>INITIALIZING</span>
      </div>
      <style jsx>{`
        .map-loading {
          display: flex;
          height: 100vh;
          width: 100%;
          align-items: center;
          justify-content: center;
          background: var(--background);
        }
        .map-loading__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          font-size: 10px;
          letter-spacing: 0.2em;
          color: var(--muted);
        }
        .map-loading__spinner {
          width: 24px;
          height: 24px;
          border: 1px solid var(--border);
          border-top-color: var(--accent);
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  ),
});

export default function Home() {
  const [showMap, setShowMap] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>();

  const handleExplore = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowMap(true);
      setIsTransitioning(false);
    }, 400);
  };

  const handleRegionSelect = (regionId: string) => {
    setSelectedRegionId(regionId);
  };

  const handlePostalSearch = (regionId?: string) => {
    if (regionId) setSelectedRegionId(regionId);
    setLeftSidebarOpen(true);
    setRightSidebarOpen(true);
  };

  useEffect(() => {
    document.body.style.overflow = showMap ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMap]);

  if (showMap) {
    return (
      <div className={`app ${isTransitioning ? 'app--out' : ''}`}>
        <div className={`panel panel--left ${leftSidebarOpen ? 'panel--open' : ''}`}>
          {leftSidebarOpen && <LeftSidebar selectedRegionId={selectedRegionId} />}
          <button className="panel__toggle panel__toggle--left" onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}>
            {leftSidebarOpen ? '‹' : '›'}
          </button>
        </div>

        <div className="map-area">
          <HazardMap onPostalSearch={handlePostalSearch} />
        </div>

        <div className={`panel panel--right ${rightSidebarOpen ? 'panel--open' : ''}`}>
          <button className="panel__toggle panel__toggle--right" onClick={() => setRightSidebarOpen(!rightSidebarOpen)}>
            {rightSidebarOpen ? '›' : '‹'}
          </button>
          {rightSidebarOpen && <RightSidebar selectedRegionId={selectedRegionId} onRegionSelect={handleRegionSelect} />}
        </div>

        <style jsx>{`
          .app {
            position: fixed;
            inset: 0;
            display: flex;
            background: var(--background);
            animation: fadeIn 0.4s ease;
          }
          .app--out {
            animation: fadeOut 0.4s ease forwards;
          }

          .panel {
            position: relative;
            height: 100vh;
            width: 0;
            transition: width 0.3s ease;
            z-index: 100;
          }
          .panel--open { width: 360px; }

          .panel__toggle {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 48px;
            background: var(--surface);
            border: 1px solid var(--border);
            color: var(--muted);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 101;
          }
          .panel__toggle:hover {
            color: var(--foreground);
            border-color: var(--accent-dim);
          }
          .panel__toggle--left {
            right: -20px;
            border-left: none;
          }
          .panel__toggle--right {
            left: -20px;
            border-right: none;
          }

          .map-area {
            flex: 1;
            height: 100vh;
            min-width: 0;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }

          @media (max-width: 1024px) {
            .panel--open { width: 320px; }
          }
          @media (max-width: 768px) {
            .panel--open {
              position: absolute;
              width: 100%;
              max-width: 360px;
            }
            .panel--left { left: 0; }
            .panel--right { right: 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <main className={`landing ${isTransitioning ? 'landing--out' : ''}`}>
      <Navigation onExplore={handleExplore} />
      <Hero onExplore={handleExplore} />
      <Features onExplore={handleExplore} />
      
      <footer className="footer">
        <div className="footer__grid">
          <div className="footer__col">
            <span className="footer__label">PROJECT</span>
            <span className="footer__value">LANDLOCK v2.4.1</span>
          </div>
          <div className="footer__col">
            <span className="footer__label">COVERAGE</span>
            <span className="footer__value">British Columbia, Canada</span>
          </div>
          <div className="footer__col">
            <span className="footer__label">BUILD</span>
            <span className="footer__value">2026.01</span>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: var(--background);
          transition: opacity 0.4s ease;
        }
        .landing--out {
          opacity: 0;
        }

        .footer {
          padding: 48px 24px;
          border-top: 1px solid var(--border);
        }

        .footer__grid {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          gap: 48px;
        }

        .footer__col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .footer__label {
          font-size: 9px;
          letter-spacing: 0.15em;
          color: var(--muted);
        }

        .footer__value {
          font-size: 12px;
          color: var(--foreground);
        }

        @media (max-width: 640px) {
          .footer__grid {
            flex-direction: column;
            gap: 24px;
          }
        }
      `}</style>
    </main>
  );
}
