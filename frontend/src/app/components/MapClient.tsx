"use client";

import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import { ShieldAlert, Compass, Home, MapPin, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

interface MapElement {
  id: string;
  type: "report" | "shelter" | "alert";
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  severity?: string;
  capacity?: number;
  occupancy?: number;
  radius?: number;
  status?: string;
}

export default function MapClient() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  
  const [elements, setElements] = useState<MapElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<MapElement | null>(null);
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch reports, shelters, and alerts
  useEffect(() => {
    const fetchMapData = async () => {
      const allElements: MapElement[] = [];
      const token = localStorage.getItem("token") || "";

      try {
        // 1. Fetch reports
        const repResp = await fetch("http://localhost:8000/api/reports");
        if (repResp.ok) {
          const reports = await repResp.json();
          reports.forEach((r: { id: string; citizen_name?: string; description: string; latitude: number; longitude: number; severity: string; status: string }) => {
            allElements.push({
              id: r.id,
              type: "report",
              name: r.citizen_name || "Crowdsourced Incident",
              description: r.description,
              latitude: r.latitude,
              longitude: r.longitude,
              severity: r.severity,
              status: r.status
            });
          });
        }

        // 2. Fetch shelters
        const sheResp = await fetch("http://localhost:8000/api/shelters");
        if (sheResp.ok) {
          const shelters = await sheResp.json();
          shelters.forEach((s: { id: string; name: string; capacity: number; current_occupancy: number; latitude: number; longitude: number; status: string }) => {
            allElements.push({
              id: s.id,
              type: "shelter",
              name: s.name,
              description: `Shelter capacity: ${s.capacity} (Occupancy: ${s.current_occupancy})`,
              latitude: s.latitude,
              longitude: s.longitude,
              capacity: s.capacity,
              occupancy: s.current_occupancy,
              status: s.status
            });
          });
        }

        // 3. Fetch alerts
        const alResp = await fetch("http://localhost:8000/api/alerts/active");
        if (alResp.ok) {
          const alerts = await alResp.json();
          alerts.forEach((a: { id: string; title: string; message: string; latitude: number; longitude: number; radius_km: number; risk_level: string }) => {
            allElements.push({
              id: a.id,
              type: "alert",
              name: a.title,
              description: a.message,
              latitude: a.latitude,
              longitude: a.longitude,
              radius: a.radius_km,
              severity: a.risk_level
            });
          });
        }

        setElements(allElements);

      } catch (err) {
        console.error("MapClient: Error loading spatial elements from backend. Seeding fallback mock points.", err);
        // Fallback simulation seeds
        setElements([
          { id: "s1", type: "shelter", name: "Nowshera Govt High School Shelter", description: "Shelter Capacity: 500", latitude: 34.015, longitude: 71.972, capacity: 500, occupancy: 120, status: "open" },
          { id: "s2", type: "shelter", name: "Muzaffargarh Emergency Camp", description: "Shelter Capacity: 1000", latitude: 30.071, longitude: 71.189, capacity: 1000, occupancy: 450, status: "open" },
          { id: "r1", type: "report", name: "Chenab Overflow Area", description: "Crops and farms flooded completely.", latitude: 30.125, longitude: 71.121, severity: "high", status: "pending" },
          { id: "r2", type: "report", name: "Urban Street Overflow", description: "Water enters low-lying streets in Nowshera.", latitude: 34.020, longitude: 71.980, severity: "critical", status: "verified" },
          { id: "a1", type: "alert", name: "Kabul River Flood Warning", description: "Extreme river discharge. Immediate evacuation recommended.", latitude: 34.015, longitude: 71.972, radius: 15.0, severity: "red" }
        ]);
      }
    };

    fetchMapData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Map Center on Punjab/KP border coordinates
    const mapInstance = L.map(mapContainerRef.current, {
      center: [30.5, 71.5],
      zoom: 6,
      zoomControl: true
    });

    // Stunning CartoDB Dark Matter map tile layers
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CartoDB</a>',
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(mapInstance);

    // Track click event on map to extract coordinates
    mapInstance.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setClickCoords({
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5))
      });
    });

    const layerGroup = L.layerGroup().addTo(mapInstance);
    
    mapRef.current = mapInstance;
    layerGroupRef.current = layerGroup;
    setMapLoaded(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Refresh Markers on Map Elements change
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current || elements.length === 0) return;

    // Clear previous markers
    layerGroupRef.current.clearLayers();

    elements.forEach((el) => {
      // 1. Alert boundary circles
      if (el.type === "alert" && el.radius) {
        L.circle([el.latitude, el.longitude], {
          radius: el.radius * 1000, // convert km to meters
          color: el.severity === "red" ? "#ef4444" : "#f97316",
          fillColor: el.severity === "red" ? "#ef4444" : "#f97316",
          fillOpacity: 0.18,
          weight: 1.5,
          dashArray: "4, 6"
        })
        .addTo(layerGroupRef.current!)
        .bindPopup(`<strong>🚨 ${el.name}</strong><br/>${el.description}<br/>Radius: ${el.radius}km`);
      }

      // 2. Incident Pinpoints
      if (el.type === "report") {
        const markerColor = 
          el.status === "resolved" ? "#10b981" : 
          el.severity === "critical" ? "#ef4444" : 
          el.severity === "high" ? "#f97316" : "#3b82f6";
          
        L.circleMarker([el.latitude, el.longitude], {
          radius: 8,
          fillColor: markerColor,
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85
        })
        .addTo(layerGroupRef.current!)
        .bindPopup(`
          <strong>⚠️ Crowdsourced Report</strong><br/>
          <strong>Details:</strong> ${el.description}<br/>
          <strong>Severity:</strong> <span style="text-transform:uppercase; font-weight:bold; color:${markerColor}">${el.severity}</span><br/>
          <strong>Status:</strong> ${el.status}
        `)
        .on("click", () => {
          setSelectedElement(el);
        });
      }

      // 3. Relief Shelters
      if (el.type === "shelter") {
        const shelterColor = el.status === "full" ? "#f59e0b" : "#10b981";
        
        L.circleMarker([el.latitude, el.longitude], {
          radius: 10,
          fillColor: shelterColor,
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        })
        .addTo(layerGroupRef.current!)
        .bindPopup(`
          <strong>🏠 Relief Shelter: ${el.name}</strong><br/>
          <strong>Occupancy:</strong> ${el.occupancy} / ${el.capacity}<br/>
          <strong>Status:</strong> ${(el.status || "open").toUpperCase()}
        `)
        .on("click", () => {
          setSelectedElement(el);
        });
      }

    });

  }, [elements, mapLoaded]);

  // Center Map on a Selected Element
  const handleFocusElement = (el: MapElement) => {
    setSelectedElement(el);
    if (mapRef.current) {
      mapRef.current.setView([el.latitude, el.longitude], 12);
    }
  };

  return (
    <div className="flex-grow flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      
      {/* 1. Map Panel Container (Full width/height minus navbar) */}
      <div className="flex-grow relative h-[50vh] lg:h-auto min-h-[400px]">
        <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />
        
        {/* Custom compass indicator */}
        <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-lg text-[10px] text-gray-400 flex items-center space-x-1.5 pointer-events-none">
          <Compass className="h-3.5 w-3.5 text-blue-400 animate-spin" />
          <span>Click anywhere on map to retrieve latitude & longitude coordinates.</span>
        </div>
      </div>

      {/* 2. Interactive Sidebar Panel (Fixed width on large) */}
      <div className="w-full lg:w-[420px] bg-[#090d16] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col justify-between shrink-0 p-6 space-y-6 overflow-y-auto">
        
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Compass className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">GIS Disaster Mapping</h2>
          </div>

          {/* Map coordinate tracker picker */}
          {clickCoords ? (
            <div className="bg-slate-900/60 border border-blue-500/20 p-4 rounded-2xl space-y-2.5 animate-in zoom-in-95">
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                Target Map Point Selected
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-white">
                <div>Lat: <span className="text-gray-300 font-normal">{clickCoords.lat}</span></div>
                <div>Lng: <span className="text-gray-300 font-normal">{clickCoords.lng}</span></div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    localStorage.setItem("clickLat", clickCoords.lat.toString());
                    localStorage.setItem("clickLng", clickCoords.lng.toString());
                    // Redirect to dashboard with coords populated
                    window.location.href = "/dashboard";
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase transition-colors"
                >
                  Report Incident Here
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-white/5 p-4 rounded-2xl text-center text-xs text-gray-500 py-6">
              Click on the map area to select a coordinate target.
            </div>
          )}

          {/* Active elements search index */}
          <div className="space-y-3">
            <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              GIS Directory List ({elements.length} records)
            </span>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {elements.map((el) => (
                <button
                  key={el.id}
                  onClick={() => handleFocusElement(el)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
                    selectedElement?.id === el.id 
                      ? "bg-blue-600/10 border-blue-500/30 text-white" 
                      : "bg-slate-900/40 border-white/5 text-gray-300 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="truncate max-w-[80%] space-y-1">
                    <span className="font-semibold block truncate text-white">{el.name}</span>
                    <span className="text-[10px] text-gray-500 block truncate leading-none">
                      {el.type === "shelter" ? "🏠 Relief Camp" : el.type === "alert" ? "🚨 Flood Alert" : "⚠️ Crowd Report"}
                    </span>
                  </div>
                  <ChevronArrow type={el.type} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Detail Card for selected element */}
        {selectedElement && (
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4.5 space-y-3 animate-in slide-in-from-bottom-3">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-white text-sm">{selectedElement.name}</h3>
              <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                selectedElement.type === "shelter" ? "bg-emerald-500/10 text-emerald-400" :
                selectedElement.type === "alert" ? "bg-red-500/10 text-red-400" :
                "bg-blue-500/10 text-blue-400"
              }`}>
                {selectedElement.type}
              </span>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed">
              {selectedElement.description}
            </p>

            {selectedElement.type === "shelter" && selectedElement.capacity && (
              <div className="space-y-1 pt-1.5">
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Occupancy status</span>
                  <span className="font-bold text-emerald-400">{selectedElement.occupancy} / {selectedElement.capacity} Evacuees</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full"
                    style={{ width: `${(selectedElement.occupancy! / selectedElement.capacity!) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}

function ChevronArrow({ type }: { type: string }) {
  if (type === "alert") return <AlertTriangle className="h-4.5 w-4.5 text-red-500 animate-pulse" />;
  if (type === "shelter") return <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />;
  return <ArrowRight className="h-4 w-4 text-blue-400" />;
}
