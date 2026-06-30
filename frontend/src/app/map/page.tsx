"use client";

import dynamic from "next/dynamic";

// Dynamically import MapClient component with SSR disabled to prevent "window is not defined" error
const MapClient = dynamic(() => import("@/app/components/MapClient"), { 
  ssr: false,
  loading: () => (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#090d16] text-gray-400">
      <div className="animate-spin inline-block h-8 w-8 border-3 border-current border-t-transparent text-blue-500 rounded-full mb-3"></div>
      <p className="text-sm font-medium">Initializing Spatial GIS Interfaces...</p>
    </div>
  )
});

export default function MapPage() {
  return <MapClient />;
}
