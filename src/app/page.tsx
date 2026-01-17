'use client';

import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues with Leaflet
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
  return <HazardMap />;
}
