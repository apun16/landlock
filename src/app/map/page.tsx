"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LeftSidebar } from '@/components/left-sidebar';
import { RightSidebar } from '@/components/right-sidebar';

const HazardMap = dynamic(() => import('@/components/HazardMap'), { ssr: false });

export default function MapPage() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>();

  const handleRegionSelect = (regionId: string) => {
    setSelectedRegionId(regionId);
    setLeftSidebarOpen(true);
    setRightSidebarOpen(true);
  };

  const handlePostalSearch = (regionId?: string) => {
    if (regionId) setSelectedRegionId(regionId);
    setLeftSidebarOpen(true);
    setRightSidebarOpen(true);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="app">
      <div className={`panel panel--left ${leftSidebarOpen ? 'panel--open' : ''}`}>
        {leftSidebarOpen && <LeftSidebar selectedRegionId={selectedRegionId} />}
        <button className="panel__toggle panel__toggle--left" onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}>{leftSidebarOpen ? '‹' : '›'}</button>
      </div>

      <div className="map-area">
        <HazardMap onPostalSearch={handlePostalSearch} />
      </div>

      <div className={`panel panel--right ${rightSidebarOpen ? 'panel--open' : ''}`}>
        <button className="panel__toggle panel__toggle--right" onClick={() => setRightSidebarOpen(!rightSidebarOpen)}>{rightSidebarOpen ? '›' : '‹'}</button>
        {rightSidebarOpen && <RightSidebar selectedRegionId={selectedRegionId} onRegionSelect={handleRegionSelect} />}
      </div>

      <style jsx>{`
        .app { position: fixed; inset: 0; display: flex; background: var(--background); }
        .panel { position: relative; height: 100vh; width: 0; transition: width 0.3s ease; z-index: 100; }
        .panel--open { width: 360px; }
        .panel__toggle { position: absolute; top: 50%; transform: translateY(-50%); width: 20px; height: 48px; background: var(--surface); border: 1px solid var(--border); color: var(--muted); font-size: 14px; cursor: pointer; z-index: 101; }
        .panel__toggle--left { right: -20px; border-left: none; }
        .panel__toggle--right { left: -20px; border-right: none; }
        .map-area { flex: 1; height: 100vh; min-width: 0; }
      `}</style>
    </div>
  );
}
