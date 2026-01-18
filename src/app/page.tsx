'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Hero, Navigation, Features } from '@/components/landing';
import { LeftSidebar } from '@/components/left-sidebar';
import { RightSidebar } from '@/components/right-sidebar';

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
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>();

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

  const handleRegionSelect = (regionId: string) => {
    setSelectedRegionId(regionId);
  };

  const handlePostalSearch = (regionId?: string) => {
    if (regionId) setSelectedRegionId(regionId);
    setLeftSidebarOpen(true);
    setRightSidebarOpen(true);
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
      <div className={`app-layout ${isTransitioning ? 'app-layout--transitioning' : ''}`}>
        
        <div className={`sidebar-container sidebar-container--left ${leftSidebarOpen ? 'sidebar-container--open' : ''}`}>
          {leftSidebarOpen && <LeftSidebar selectedRegionId={selectedRegionId} />}
          <button 
            className="sidebar-toggle sidebar-toggle--left" 
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            title={leftSidebarOpen ? 'Hide Policy Panel' : 'Show Policy Panel'}
          >
            {leftSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        
        <div className="map-container">
          
          <HazardMap onPostalSearch={handlePostalSearch} />
        </div>

        
        <div className={`sidebar-container sidebar-container--right ${rightSidebarOpen ? 'sidebar-container--open' : ''}`}>
          <button 
            className="sidebar-toggle sidebar-toggle--right" 
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            title={rightSidebarOpen ? 'Hide Risk Panel' : 'Show Risk Panel'}
          >
            {rightSidebarOpen ? '▶' : '◀'}
          </button>
          {rightSidebarOpen && <RightSidebar selectedRegionId={selectedRegionId} onRegionSelect={handleRegionSelect} />}
        </div>

        <style jsx>{`
          .app-layout {
            position: fixed;
            inset: 0;
            display: flex;
            background: #09090b;
            animation: fadeIn 0.6s ease-out;
          }
          .app-layout--transitioning {
            animation: fadeOut 0.6s ease-out forwards;
          }

          .sidebar-container {
            position: relative;
            height: 100vh;
            transition: width 0.3s ease, margin 0.3s ease;
            z-index: 100;
          }
          .sidebar-container--left {
            width: 0;
          }
          .sidebar-container--left.sidebar-container--open {
            width: 380px;
          }
          .sidebar-container--right {
            width: 0;
          }
          .sidebar-container--right.sidebar-container--open {
            width: 380px;
          }

          .sidebar-toggle {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 24px;
            height: 48px;
            background: rgba(9, 9, 11, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #a1a1aa;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 101;
          }
          .sidebar-toggle:hover {
            background: rgba(39, 39, 42, 0.95);
            color: #fafafa;
          }
          .sidebar-toggle--left {
            right: -24px;
            border-radius: 0 8px 8px 0;
            border-left: none;
          }
          .sidebar-toggle--right {
            left: -24px;
            border-radius: 8px 0 0 8px;
            border-right: none;
          }

          .map-container {
            flex: 1;
            position: relative;
            height: 100vh;
            min-width: 0;
          }

          .map-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: linear-gradient(180deg, rgba(9, 9, 11, 0.95) 0%, rgba(9, 9, 11, 0.8) 70%, transparent 100%);
            pointer-events: none;
          }
          .map-header > * {
            pointer-events: auto;
          }

          .back-button {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            background: rgba(9, 9, 11, 0.9);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #fafafa;
            font-family: var(--font-poppins), sans-serif;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .back-button:hover {
            background: rgba(39, 39, 42, 0.9);
            border-color: rgba(255, 255, 255, 0.2);
          }

          .map-title {
            font-family: var(--font-charis), serif;
            font-size: 1.3rem;
            font-weight: 700;
            color: #fafafa;
            margin: 0;
          }

          .map-actions {
            display: flex;
            gap: 8px;
          }

          .panel-toggle {
            padding: 10px 16px;
            background: rgba(9, 9, 11, 0.9);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #6b7280;
            font-family: var(--font-poppins), sans-serif;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .panel-toggle:hover {
            background: rgba(39, 39, 42, 0.9);
            color: #a1a1aa;
          }
          .panel-toggle--active {
            background: rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.3);
            color: #10b981;
          }
          .panel-toggle--active:hover {
            background: rgba(16, 185, 129, 0.25);
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }

          @media (max-width: 1200px) {
            .sidebar-container--left.sidebar-container--open,
            .sidebar-container--right.sidebar-container--open {
              width: 320px;
            }
          }

          @media (max-width: 900px) {
            .sidebar-container--left.sidebar-container--open {
              position: absolute;
              left: 0;
              width: 100%;
              max-width: 380px;
            }
            .sidebar-container--right.sidebar-container--open {
              position: absolute;
              right: 0;
              width: 100%;
              max-width: 380px;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <main className={`landing ${isTransitioning ? 'landing--transitioning' : ''}`}>
      <Navigation onExplore={handleExplore} />
      <Hero onExplore={handleExplore} />
      <Features onExplore={handleExplore} />
      
      <footer className="footer">
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
          background: #020205);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 20px;
        }
        .footer__bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 24px;
          text-align: center;
        }
        .footer__bottom p {
          font-family: var(--font-poppins), sans-serif;
          font-size: 0.95rem;
          color: #8a8a99;
          margin: 0;
        }
      `}</style>
    </main>
  );
}
