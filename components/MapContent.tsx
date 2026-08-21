"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Project } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabase/client";
import "leaflet/dist/leaflet.css";

// Status-based marker icon colors
const STATUS_COLORS = {
  "ON TRACK": "#10b981", // green
  "AT RISK": "#f59e0b", // orange
  DELAYED: "#ef4444", // red
};

// Create SVG icon for a specific status
const createStatusIcon = (L: any, status: string) => {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "#6b7280";
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    </svg>
  `;
  
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
  });
};

export default function MapContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [icons, setIcons] = useState<Record<string, any>>({});
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Available options
  const sectors = ["All", "Education", "Health", "Agriculture", "Transport"];
  const statuses = ["All", "On Track", "At Risk", "Delayed"];

  // Map display status to database status
  const statusMap: Record<string, string> = {
    "On Track": "ON TRACK",
    "At Risk": "AT RISK",
    "Delayed": "DELAYED"
  };

// Filter projects based on current filters
const filteredProjects = projects.filter((project) => {
  // Search filter
  const query = searchQuery.trim().toLowerCase();

  const matchesSearch =
    query === "" ||
    project.name?.toLowerCase().includes(query) ||
    project.project_code?.toLowerCase().includes(query) ||
    project.location?.toLowerCase().includes(query);

  // Sector filter
  const matchesSector =
    selectedSector === "All" || project.sector === selectedSector;

  // Status filter
  const targetStatus =
    statusMap[selectedStatus as keyof typeof statusMap];

  const matchesStatus =
    selectedStatus === "All" || project.status === targetStatus;

  return matchesSearch && matchesSector && matchesStatus;
});

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Initialize Leaflet on client side
        const L = await import("leaflet");

        // Create icons for each status
        const statusIcons = {
          "ON TRACK": createStatusIcon(L, "ON TRACK"),
          "AT RISK": createStatusIcon(L, "AT RISK"),
          DELAYED: createStatusIcon(L, "DELAYED"),
        };
        setIcons(statusIcons);

        setLoading(true);
        const supabase = getSupabaseClient();
        const { data, error: supabaseError } = await supabase
          .from("projects")
          .select("*")
          .not("latitude", "is", null)
          .not("longitude", "is", null);

          console.table(
  data?.map((project) => ({
    code: project.project_code,
    name: project.name,
    location: project.location,
    latitude: project.latitude,
    longitude: project.longitude,
  }))
);
        if (supabaseError) {
          throw supabaseError;
        }

        setProjects(data as Project[]);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 p-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error loading map</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <p className="text-gray-600 text-xs mt-2">
            Make sure Supabase environment variables are configured.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 font-semibold">Loading map...</p>
        </div>
      </div>
    );
  }

  // Calculate map center from projects
  const center: [number, number] =
    projects.length > 0
      ? [
          projects.reduce((sum, p) => sum + (p.latitude || 0), 0) /
            projects.length,
          projects.reduce((sum, p) => sum + (p.longitude || 0), 0) /
            projects.length,
        ]
      : [20.5937, 78.9629]; // Default to India center

  return (
    <div className="flex flex-col h-full w-full">
      {/* Filter Panel */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-md">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Project Name
            </label>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sector Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sector
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results Info */}
        <div className="text-xs text-gray-600 mt-2">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 overflow-hidden">
        <MapContainer
          center={center}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          />
          {Object.keys(icons).length > 0 &&
            filteredProjects.map(
              (project) =>
                project.latitude &&
                project.longitude && (
                  <Marker
                    key={project.id}
                    position={[project.latitude, project.longitude]}
                    icon={
                      icons[project.status as keyof typeof STATUS_COLORS] ||
                      icons["DELAYED"]
                    }
                  >
                    <Popup className="leaflet-popup">
                      <div className="p-3 min-w-72">
                        <h3 className="font-bold text-sm mb-2 text-black">
                          {project.name || "Unnamed Project"}
                        </h3>
                        <div className="text-xs text-gray-700 space-y-1.5">
                          <p>
                            <span className="font-semibold text-gray-900">
                              Project ID:
                            </span>{" "}
                            <span className="font-mono text-gray-600">
                              {project.project_code || "N/A"}
                            </span>
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">
                              Sector:
                            </span>{" "}
                            {project.sector || "Unspecified"}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">
                              Progress:
                            </span>{" "}
                            <span className="font-semibold text-blue-600">
                              {typeof project.progress === "number" ? `${project.progress}%` : "N/A"}
                            </span>
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">
                              Status:
                            </span>{" "}
                            <span
  className={`px-2 py-1 rounded text-xs font-semibold text-white ${
    project.status === "ON TRACK"
      ? "bg-green-500"
      : project.status === "AT RISK"
        ? "bg-orange-500"
        : project.status === "DELAYED"
          ? "bg-red-500"
          : "bg-gray-400"
  }`}
>
  {project.status || "Unknown"}
</span>
                          </p>
                          {project.location && (
                            <p>
                              <span className="font-semibold text-gray-900">
                                Location:
                              </span>{" "}
                              {project.location}
                            </p>
                          )}
                                            </div>
                    {project.id ? (
                      <a
                        href={`/projects/${project.id}`}
                        className="mt-3 block text-center bg-blue-600 text-white text-xs font-semibold py-2 px-3 rounded hover:bg-blue-700 transition-colors"
                      >
                        View Project
                      </a>
                    ) : (
                      <span className="mt-3 block text-center bg-gray-300 text-gray-600 text-xs font-semibold py-2 px-3 rounded cursor-not-allowed">
                        Project details unavailable
                      </span>
                    )}
                      </div>
                    </Popup>
                  </Marker>
                )
            )}
        </MapContainer>
      </div>
    </div>
  );
}
