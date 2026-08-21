"use client";

import dynamic from "next/dynamic";

// Lazy load the entire map content to avoid SSR issues
const MapContent = dynamic(() => import("./MapContent"), { ssr: false });

export default function GISMap() {
  return (
    <div className="w-full h-full">
      <MapContent />
    </div>
  );
}
