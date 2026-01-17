'use client';

import { useEffect, useState, useRef, useCallback, FormEvent } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { processHeatMapData, getExposureColor, HeatMapDataPoint, FSAData, searchFSA } from '@/lib/fsaCoordinates';

interface HeatMapJsonData {
  groupDetail: {
    label: string;
    description: string;
    link?: string;
  };
  observations: FSAData[];
}

export default function HazardMap() {
  const mapRef = useRef<L.Map | null>(null);
  const dataRef = useRef<HeatMapDataPoint[]>([]);
  const highlightRef = useRef<L.CircleMarker | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<HeatMapDataPoint | null>(null);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  // Load and process data
  useEffect(() => {
    fetch('/HeatMapData.json')
      .then(res => res.json())
      .then((json: HeatMapJsonData) => {
        const processed = processHeatMapData(json.observations);
        dataRef.current = processed;
        setDataVersion(v => v + 1);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load heatmap data:', err);
        setLoading(false);
      });
  }, []);

  // Callback ref for map container - ensures element exists before initializing
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !mapRef.current) {
      const map = L.map(node, {
        center: [56.0, -96.0], // Center of Canada
        zoom: 4,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark themed tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Ensure map renders correctly after container is ready
      setTimeout(() => {
        map.invalidateSize();
        setMapReady(true);
      }, 100);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add data points to map - use dataVersion instead of data array to avoid dependency size issues
  useEffect(() => {
    const data = dataRef.current;
    if (!mapRef.current || data.length === 0 || !mapReady) return;

    const map = mapRef.current;
    
    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Filter data if filter is active
    const displayData = filterLevel !== null 
      ? data.filter(d => d.exposure === filterLevel)
      : data;

    // Add circles for each FSA
    displayData.forEach((point) => {
      const circle = L.circleMarker([point.lat, point.lng], {
        radius: 6 + point.exposure * 2,
        fillColor: point.color,
        color: point.color,
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.6,
      });

      circle.bindTooltip(
        `<div class="text-xs">
          <strong>FSA: ${point.fsa}</strong><br/>
          Exposure: ${point.exposure}/5<br/>
          Cluster: ${point.cluster}
        </div>`,
        { className: 'custom-tooltip' }
      );

      circle.on('click', () => {
        setSelectedPoint(point);
      });

      circle.addTo(map);
    });
  }, [dataVersion, filterLevel, mapReady]);

  // Search handler
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchError('');
    
    if (!searchQuery.trim()) return;
    
    const result = searchFSA(searchQuery, dataRef.current);
    
    if (result) {
      // Zoom to the location
      if (mapRef.current) {
        mapRef.current.setView([result.lat, result.lng], 10, { animate: true });
        
        // Remove previous highlight
        if (highlightRef.current) {
          mapRef.current.removeLayer(highlightRef.current);
        }
        
        // Add highlight circle
        highlightRef.current = L.circleMarker([result.lat, result.lng], {
          radius: 25,
          fillColor: '#ffffff',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.2,
        }).addTo(mapRef.current);
        
        // Pulse animation effect
        let opacity = 1;
        const pulse = setInterval(() => {
          opacity = opacity === 1 ? 0.4 : 1;
          if (highlightRef.current) {
            highlightRef.current.setStyle({ opacity, fillOpacity: opacity * 0.2 });
          }
        }, 500);
        
        // Stop pulsing after 3 seconds
        setTimeout(() => {
          clearInterval(pulse);
          if (highlightRef.current) {
            highlightRef.current.setStyle({ opacity: 0.8, fillOpacity: 0.15 });
          }
        }, 3000);
      }
      
      setSelectedPoint(result);
    } else {
      setSearchError(`No results found for "${searchQuery}"`);
    }
  };

  const exposureLevels = [
    { level: 1, label: 'Low', desc: 'Low exposure to all disasters' },
    { level: 2, label: 'Medium-Low', desc: 'Medium exposure to 1+ disasters' },
    { level: 3, label: 'Medium', desc: 'High exposure to 1 disaster' },
    { level: 4, label: 'Medium-High', desc: 'High exposure to 2 disasters' },
    { level: 5, label: 'High', desc: 'High exposure to 3+ disasters' },
  ];

  const clusterInfo: Record<string, string> = {
    'A': 'Higher exposure & higher indebtedness',
    'B': 'Moderate exposure & limited credit access',
    'C': 'Lower exposure & lower financial vulnerabilities',
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-red-500" />
          <p className="text-zinc-400" style={{ fontFamily: 'var(--font-poppins)' }}>
            Loading hazard data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-zinc-950">
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-transparent px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 
              className="text-2xl font-bold text-white md:text-3xl"
              style={{ fontFamily: 'var(--font-charis)' }}
            >
              Canada Multi-Hazard Exposure Map
            </h1>
            <p 
              className="mt-1 text-sm text-zinc-400"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Forward Sortation Areas colored by natural disaster exposure risk
            </p>
          </div>
          
          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError('');
                }}
                placeholder="Search postal code (e.g. M5H, V6B)"
                className="h-10 w-64 rounded-lg border border-zinc-700 bg-zinc-900/90 px-4 pr-10 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                style={{ fontFamily: 'var(--font-poppins)' }}
              />
              <svg 
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              className="h-10 rounded-lg bg-zinc-800 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Search
            </button>
          </form>
        </div>
        {searchError && (
          <p 
            className="mt-2 text-right text-sm text-red-400"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {searchError}
          </p>
        )}
      </div>

      {/* Legend Panel */}
      <div className="absolute bottom-6 left-6 z-10 rounded-xl border border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-sm">
        <h3 
          className="mb-3 text-sm font-semibold text-white"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Exposure Level
        </h3>
        <div className="flex flex-col gap-2">
          {exposureLevels.map(({ level, label }) => (
            <button
              key={level}
              onClick={() => setFilterLevel(filterLevel === level ? null : level)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all ${
                filterLevel === level 
                  ? 'bg-zinc-800 ring-1 ring-zinc-600' 
                  : 'hover:bg-zinc-900'
              }`}
            >
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: getExposureColor(level) }}
              />
              <span 
                className="text-xs text-zinc-300"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                {level} - {label}
              </span>
            </button>
          ))}
        </div>
        {filterLevel !== null && (
          <button
            onClick={() => setFilterLevel(null)}
            className="mt-3 w-full rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Show All
          </button>
        )}
      </div>

      {/* Stats Panel */}
      <div className="absolute bottom-6 right-6 z-10 rounded-xl border border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-sm">
        <h3 
          className="mb-3 text-sm font-semibold text-white"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Statistics
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {exposureLevels.map(({ level }) => {
            const count = dataRef.current.filter(d => d.exposure === level).length;
            return (
              <div key={level} className="text-center">
                <div
                  className="mx-auto mb-1 h-3 w-3 rounded-full"
                  style={{ backgroundColor: getExposureColor(level) }}
                />
                <p className="text-lg font-bold text-white">{count}</p>
                <p className="text-[10px] text-zinc-500">Level {level}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-400">
            Total FSAs: <span className="font-semibold text-white">{dataRef.current.length}</span>
          </p>
        </div>
      </div>

      {/* Selected Point Details */}
      {selectedPoint && (
        <div className="absolute right-6 top-24 z-10 w-72 rounded-xl border border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 
                className="text-lg font-bold text-white"
                style={{ fontFamily: 'var(--font-charis)' }}
              >
                FSA: {selectedPoint.fsa}
              </h3>
              <p className="text-xs text-zinc-500">Forward Sortation Area</p>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-zinc-900 p-3">
              <div
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: selectedPoint.color }}
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  Exposure Level {selectedPoint.exposure}
                </p>
                <p className="text-xs text-zinc-400">
                  {exposureLevels.find(e => e.level === selectedPoint.exposure)?.desc}
                </p>
              </div>
            </div>
            
            <div className="rounded-lg bg-zinc-900 p-3">
              <p className="text-xs font-medium text-zinc-400">Financial Cluster</p>
              <p className="mt-1 text-sm font-semibold text-white">
                Cluster {selectedPoint.cluster}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {clusterInfo[selectedPoint.cluster]}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-900 p-3">
              <p className="text-xs font-medium text-zinc-400">Coordinates</p>
              <p className="mt-1 text-sm text-zinc-300">
                {selectedPoint.lat.toFixed(4)}°N, {Math.abs(selectedPoint.lng).toFixed(4)}°W
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom tooltip styles */}
      <style jsx global>{`
        .custom-tooltip {
          background: rgba(9, 9, 11, 0.95) !important;
          border: 1px solid rgba(63, 63, 70, 0.8) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          color: #fafafa !important;
          font-family: var(--font-poppins), sans-serif !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }
        .custom-tooltip::before {
          border-top-color: rgba(63, 63, 70, 0.8) !important;
        }
        .leaflet-container {
          background: #09090b !important;
        }
      `}</style>
    </div>
  );
}
