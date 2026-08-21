import { Metadata } from "next";
import GISMap from "@/components/Map";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GIS Infrastructure Map",
  description: "Interactive map of infrastructure projects",
};

export default function MapPage() {
  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm z-10">
        <h1 className="text-2xl font-bold text-gray-800">
          GIS Infrastructure Map
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Interactive map showing project locations and status
        </p>
      </header>
      <div className="flex-1 overflow-hidden">
        <GISMap />
      </div>
    </div>
  );
}
