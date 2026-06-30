"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, Send, MapPin, Radio, Activity, CheckCircle, Clock, 
  HelpCircle, Trash, AlertTriangle, Plus, Users, Home, PhoneCall 
} from "lucide-react";

interface Report {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: string;
  status: string;
  created_at: string;
  citizen_name?: string;
  rescue_task?: {
    status: string;
    assigned_team_name?: string;
  };
}

interface Shelter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  status: string;
  contact_number?: string;
}

interface RescueTeam {
  id: string;
  full_name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string>("citizen");
  const [userName, setUserName] = useState<string>("");
  
  // App data states
  const [reports, setReports] = useState<Report[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // Citizen report form states
  const [repDesc, setRepDesc] = useState("");
  const [repLat, setRepLat] = useState(34.01);
  const [repLng, setRepLng] = useState(71.97);
  const [repSeverity, setRepSeverity] = useState("high");

  // Admin alert form states
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [alertRisk, setAlertRisk] = useState("orange");
  const [alertLat, setAlertLat] = useState(34.01);
  const [alertLng, setAlertLng] = useState(71.97);
  const [alertRadius, setAlertRadius] = useState(15.0);

  // Admin shelter form states
  const [sheName, setSheName] = useState("");
  const [sheLat, setSheLat] = useState(34.01);
  const [sheLng, setSheLng] = useState(71.97);
  const [sheCap, setSheCap] = useState(500);

  // ML Retraining states
  const [retrainFile, setRetrainFile] = useState<File | null>(null);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainMetrics, setRetrainMetrics] = useState<{
    accuracy: number;
    samples_trained: number;
    feature_importances: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("userRole");
    const savedName = localStorage.getItem("userName");

    if (!savedToken) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    setRole(savedRole || "citizen");
    setUserName(savedName || "User");

    // Fetch initial datasets
    fetchDashboardData(savedToken);
  }, []);

  const fetchDashboardData = async (authToken: string) => {
    setLoading(true);
    try {
      // 1. Fetch reports
      const repResp = await fetch("http://localhost:8000/api/reports", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (repResp.ok) {
        const data = await repResp.json();
        setReports(data);
      }

      // 2. Fetch shelters
      const sheResp = await fetch("http://localhost:8000/api/shelters", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (sheResp.ok) {
        const data = await sheResp.json();
        setShelters(data);
      }

      // 3. For admins/rescue, mock list of rescue team members for dropdown assignment
      const mockRescueList: RescueTeam[] = [
        { id: "1", full_name: "Rescue Team Alpha (Nowshera)" },
        { id: "2", full_name: "Rescue Team Beta (Peshawar)" },
        { id: "3", full_name: "Al-Khidmat Foundation Group" },
        { id: "4", full_name: "Edhi Rescue Unit A" }
      ];
      setRescueTeams(mockRescueList);

    } catch (err) {
      console.error("Dashboard: Error fetching live data. Falling back to local states.", err);
      // Fallback local mock states
      setReports([
        { id: "1", description: "Muzaffargarh: River bank breach flooding adjacent crops.", latitude: 30.125, longitude: 71.121, severity: "high", status: "pending", created_at: "2026-06-20T12:00:00Z" },
        { id: "2", description: "Water overflowing into Nowshera Kalan streets.", latitude: 34.020, longitude: 71.980, severity: "critical", status: "verified", created_at: "2026-06-20T11:45:00Z", citizen_name: "Mohammad Ali" }
      ]);
      setShelters([
        { id: "1", name: "Nowshera Government Degree College Shelter", latitude: 34.015, longitude: 71.972, capacity: 500, current_occupancy: 120, status: "open" },
        { id: "2", name: "Muzaffargarh Emergency Relief Camp", latitude: 30.071, longitude: 71.189, capacity: 1000, current_occupancy: 450, status: "open" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // --- Citizen Submit Report ---
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repDesc.trim()) return;

    try {
      const response = await fetch("http://localhost:8000/api/reports/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          description: repDesc,
          latitude: repLat,
          longitude: repLng,
          severity: repSeverity
        })
      });

      if (response.ok) {
        setMsg({ text: "Flood incident reported successfully! Redirecting to GIS map...", type: "success" });
        setRepDesc("");
        // Reload
        setTimeout(() => {
          fetchDashboardData(token!);
          setMsg({ text: "", type: "" });
        }, 1500);
      } else {
        setMsg({ text: "Error submitting report to backend.", type: "error" });
      }
    } catch (err) {
      // Local push fallback
      const newRep: Report = {
        id: Math.random().toString(),
        description: repDesc,
        latitude: repLat,
        longitude: repLng,
        severity: repSeverity,
        status: "pending",
        created_at: new Date().toISOString()
      };
      setReports([newRep, ...reports]);
      setMsg({ text: "Report simulated locally (Backend offline).", type: "success" });
      setRepDesc("");
    }
  };

  // --- Admin Broadcast Alert ---
  const handleAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim()) return;

    try {
      const response = await fetch("http://localhost:8000/api/alerts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: alertTitle,
          message: alertMsg,
          risk_level: alertRisk,
          latitude: alertLat,
          longitude: alertLng,
          radius_km: alertRadius
        })
      });

      if (response.ok) {
        setMsg({ text: "Emergency alert broadcast successfully!", type: "success" });
        setAlertTitle("");
        setAlertMsg("");
      } else {
        setMsg({ text: "Error publishing alert.", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Alert published locally (Mock response).", type: "success" });
      setAlertTitle("");
      setAlertMsg("");
    }
  };

  // --- Admin Register Shelter ---
  const handleShelterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheName.trim()) return;

    try {
      const response = await fetch("http://localhost:8000/api/shelters/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: sheName,
          latitude: sheLat,
          longitude: sheLng,
          capacity: sheCap,
          current_occupancy: 0,
          status: "open"
        })
      });

      if (response.ok) {
        setMsg({ text: "Relief shelter registered successfully!", type: "success" });
        setSheName("");
        fetchDashboardData(token!);
      } else {
        setMsg({ text: "Error registering shelter.", type: "error" });
      }
    } catch (err) {
      const newShe: Shelter = {
        id: Math.random().toString(),
        name: sheName,
        latitude: sheLat,
        longitude: sheLng,
        capacity: sheCap,
        current_occupancy: 0,
        status: "open"
      };
      setShelters([...shelters, newShe]);
      setMsg({ text: "Shelter registered locally (Mock response).", type: "success" });
      setSheName("");
    }
  };

  // --- Admin ML Retraining Submit ---
  const handleRetrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retrainFile || !token) return;

    setRetrainLoading(true);
    const formData = new FormData();
    formData.append("file", retrainFile);

    try {
      const response = await fetch("http://localhost:8000/api/predict/retrain", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setRetrainMetrics(data);
        setMsg({ text: "AI Flood Model retrained successfully with custom CSV!", type: "success" });
      } else {
        const errData = await response.json();
        setMsg({ text: errData.detail || "Error retraining model.", type: "error" });
      }
    } catch (err) {
      setRetrainMetrics({
        accuracy: 94.2,
        samples_trained: 1500,
        feature_importances: {
          "Rainfall": 45.2,
          "Elevation": 24.8,
          "River Distance": 18.5,
          "Soil Moisture": 11.5
        }
      });
      setMsg({ text: "Retraining simulated (local fallback metrics applied).", type: "success" });
    } finally {
      setRetrainLoading(false);
    }
  };

  // --- Verify / Resolve Reports (Admin or Rescue Role) ---
  const handleVerifyReport = async (reportId: string, statusVal: string, assignId?: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/reports/${reportId}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: statusVal,
          assign_team_id: assignId || "1" // Default mock team id
        })
      });

      if (response.ok) {
        setMsg({ text: `Report status updated to ${statusVal}!`, type: "success" });
        fetchDashboardData(token!);
      } else {
        setMsg({ text: "Failed to update incident.", type: "error" });
      }
    } catch (err) {
      // Offline fallback
      setReports(reports.map(r => r.id === reportId ? { ...r, status: statusVal } : r));
      setMsg({ text: "Status updated (Local simulation).", type: "success" });
    }
  };

  // --- Rescue Team Update Occupancy ---
  const handleUpdateOccupancy = async (shelterId: string, diff: number) => {
    const s = shelters.find(sh => sh.id === shelterId);
    if (!s) return;
    const nextOcc = Math.max(0, Math.min(s.capacity, s.current_occupancy + diff));

    try {
      const response = await fetch(`http://localhost:8000/api/shelters/${shelterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          current_occupancy: nextOcc,
          status: nextOcc >= s.capacity ? "full" : "open"
        })
      });

      if (response.ok) {
        fetchDashboardData(token!);
      }
    } catch (err) {
      // Local fallback
      setShelters(shelters.map(sh => sh.id === shelterId ? { ...sh, current_occupancy: nextOcc, status: nextOcc >= sh.capacity ? "full" : "open" } : sh));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow">
      
      {/* Header Panel */}
      <div className="glass-panel border-white/5 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">Disaster Coordination Node</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome back, {userName}</h1>
          <p className="text-xs text-gray-400 mt-1">
            System privileges active for role: <span className="text-emerald-400 uppercase font-bold tracking-wider">{role}</span>
          </p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => fetchDashboardData(token!)} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-white/5 transition-all"
          >
            Refresh Node
          </button>
        </div>
      </div>

      {/* Messaging Alert Banner */}
      {msg.text && (
        <div className={`p-4 rounded-2xl text-xs text-center border font-medium ${
          msg.type === "success" ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" : "bg-red-950/20 border-red-500/20 text-red-400"
        }`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          <div className="animate-spin inline-block h-6 w-6 border-2 border-current border-t-transparent text-blue-500 rounded-full mb-2"></div>
          <p>Syncing coordination databases...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ================= CITIZEN DASHBOARD (12 columns) ================= */}
          {role === "citizen" && (
            <>
              {/* Submit Incident Report (Left on large) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-panel border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
                    <Send className="h-5 w-5 text-blue-400" />
                    <h3 className="text-base font-bold text-white">Report Flood Incident</h3>
                  </div>

                  <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-gray-400 font-medium">Describe coordinates details & water level</label>
                      <textarea
                        required
                        rows={3}
                        value={repDesc}
                        onChange={(e) => setRepDesc(e.target.value)}
                        placeholder="e.g. Kabul River level rising rapidly. Ground floors of nearby homes in Nowshera are completely submerged."
                        className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-gray-400 font-medium">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={repLat}
                          onChange={(e) => setRepLat(Number(e.target.value))}
                          className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-gray-400 font-medium">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={repLng}
                          onChange={(e) => setRepLng(Number(e.target.value))}
                          className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 font-medium">Water/Hazard Severity</label>
                      <select
                        value={repSeverity}
                        onChange={(e) => setRepSeverity(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="low">Low (Road logging / passable)</option>
                        <option value="medium">Medium (Residential blocks flooded)</option>
                        <option value="high">High (Evacuation required)</option>
                        <option value="critical">Critical (Immediate rescue needed)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold uppercase tracking-wider transition-colors"
                    >
                      Broadcast Distress Report
                    </button>
                  </form>
                </div>
              </div>

              {/* Citizen Personal Alert Feed & Shelters (Right on large) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Submitted Reports tracking */}
                <div className="glass-panel border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Activity className="h-5 w-5 text-indigo-400 mr-2" />
                    Your Distress Reports & Status
                  </h3>
                  <div className="divide-y divide-white/5 text-xs">
                    {reports.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">No reports submitted yet.</p>
                    ) : (
                      reports.map((rep) => (
                        <div key={rep.id} className="py-3.5 flex justify-between items-start">
                          <div className="space-y-1.5 max-w-[70%]">
                            <p className="text-slate-200 leading-relaxed">{rep.description}</p>
                            <div className="flex gap-2 text-[10px] text-gray-500">
                              <span>Lat: {rep.latitude} Lng: {rep.longitude}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize ${
                              rep.status === "verified" ? "bg-amber-500/10 text-amber-400" :
                              rep.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" :
                              "bg-slate-800 text-gray-400"
                            }`}>
                              {rep.status}
                            </span>
                            {rep.rescue_task && (
                              <span className="text-[9px] text-emerald-400 flex items-center">
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                {rep.rescue_task.status === "assigned" ? "Rescuers Dispatched" : "Completed"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Nearest Shelter registry */}
                <div className="glass-panel border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Home className="h-5 w-5 text-emerald-400 mr-2" />
                    Nearest Relief Shelters
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {shelters.map((shelter) => (
                      <div key={shelter.id} className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-white truncate max-w-[75%]">{shelter.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            shelter.status === "open" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {shelter.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span>Capacity: {shelter.capacity}</span>
                          <span>Occupied: {shelter.current_occupancy}</span>
                        </div>
                        {/* Occupancy bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${(shelter.current_occupancy / shelter.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ================= NDMA ADMIN DASHBOARD (12 columns) ================= */}
          {role === "admin" && (
            <>
              {/* Left Side: Verify Reports & Action Queue */}
              <div className="lg:col-span-7 space-y-6">
                <div className="glass-panel border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Radio className="h-5 w-5 text-amber-500 mr-2" />
                    Incoming Crowdsourced Alerts (Verify Queue)
                  </h3>
                  <div className="divide-y divide-white/5 text-xs">
                    {reports.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">No incident reports requiring attention.</p>
                    ) : (
                      reports.map((rep) => (
                        <div key={rep.id} className="py-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-100">{rep.citizen_name || "Citizen"}</p>
                              <span className="text-[10px] text-gray-500">Report coordinates: {rep.latitude}, {rep.longitude}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                              rep.severity === "critical" ? "bg-red-500/10 text-red-400" :
                              rep.severity === "high" ? "bg-amber-500/10 text-amber-400" :
                              "bg-blue-500/10 text-blue-400"
                            }`}>
                              {rep.severity} severity
                            </span>
                          </div>
                          
                          <p className="text-gray-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                            {rep.description}
                          </p>

                          {rep.status === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVerifyReport(rep.id, "verified")}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
                              >
                                Verify & Dispatch Rescue
                              </button>
                              <button
                                onClick={() => handleVerifyReport(rep.id, "rejected")}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-400 rounded text-[11px]"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-gray-500">
                                Verified by Operations Team. Status: <strong className="text-emerald-400">{rep.status}</strong>
                              </span>
                              {rep.status === "verified" && (
                                <button
                                  onClick={() => handleVerifyReport(rep.id, "resolved")}
                                  className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 rounded"
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Broadcast Alerts & Shelters Control */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Broadcast early warning */}
                <div className="glass-panel border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                    <Plus className="h-5 w-5 text-red-500" />
                    <h3 className="text-base font-bold text-white">Broadcast Regional Alert</h3>
                  </div>

                  <form onSubmit={handleAlertSubmit} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-gray-400 font-medium">Alert Title</label>
                      <input
                        type="text"
                        required
                        value={alertTitle}
                        onChange={(e) => setAlertTitle(e.target.value)}
                        placeholder="e.g. River Kabul High Flood Warning"
                        className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 font-medium">Broadcast Alert Message</label>
                      <textarea
                        required
                        rows={2}
                        value={alertMsg}
                        onChange={(e) => setAlertMsg(e.target.value)}
                        placeholder="Advise evacuation and list safe zones..."
                        className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-gray-400 font-medium">Risk Level</label>
                        <select
                          value={alertRisk}
                          onChange={(e) => setAlertRisk(e.target.value)}
                          className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="red">Red (Critical Evacuation)</option>
                          <option value="orange">Orange (Vulnerable Warning)</option>
                          <option value="yellow">Yellow (Alert Watch)</option>
                          <option value="green">Green (Safe/Normal)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-gray-400 font-medium">Danger Radius (km)</label>
                        <input
                          type="number"
                          required
                          value={alertRadius}
                          onChange={(e) => setAlertRadius(Number(e.target.value))}
                          className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold uppercase tracking-wider transition-colors"
                    >
                      Publish Hazard Alert
                    </button>
                  </form>
                </div>

                {/* Create Shelter Form */}
                <div className="glass-panel border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                    <Plus className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-base font-bold text-white">Register Relief Shelter</h3>
                  </div>

                  <form onSubmit={handleShelterSubmit} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-gray-400 font-medium">Shelter Name</label>
                      <input
                        type="text"
                        required
                        value={sheName}
                        onChange={(e) => setSheName(e.target.value)}
                        placeholder="Nowshera Government High School"
                        className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-gray-400 font-medium">Max Capacity</label>
                        <input
                          type="number"
                          required
                          value={sheCap}
                          onChange={(e) => setSheCap(Number(e.target.value))}
                          className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-gray-400 font-medium">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={sheLat}
                          onChange={(e) => setSheLat(Number(e.target.value))}
                          className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold uppercase tracking-wider transition-colors"
                    >
                      Save Shelter Register
                    </button>
                  </form>
                </div>

                {/* AI ML Model Retraining Panel */}
                <div className="glass-panel border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                    <Activity className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">AI ML Training Center</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Upload a custom dataset (CSV format) containing historical records to retrain the Random Forest model on-the-fly.
                  </p>

                  <form onSubmit={handleRetrainSubmit} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-gray-400 font-medium">Select Training Data (CSV)</label>
                      <input
                        type="file"
                        accept=".csv"
                        required
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setRetrainFile(e.target.files[0]);
                          }
                        }}
                        className="w-full bg-slate-900/60 border border-white/5 rounded-xl p-2 text-white file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer file:cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-gray-500 pt-0.5">
                      <span>Expected schema: 5 columns:</span>
                      <code className="text-indigo-400 bg-slate-950 px-1 py-0.5 rounded">rainfall_24h_mm, elevation_m, river_distance_km, soil_moisture, flooded</code>
                    </div>

                    <button
                      type="submit"
                      disabled={retrainLoading}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {retrainLoading ? "Executing Retraining..." : "Retrain AI Classifier"}
                    </button>
                  </form>

                  {retrainMetrics && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-in zoom-in-95">
                      <h4 className="text-xs font-bold text-white flex justify-between">
                        <span>Retrained Model Metrics</span>
                        <span className="text-emerald-400">{retrainMetrics.accuracy}% Accuracy</span>
                      </h4>
                      <div className="text-[10px] text-gray-400">
                        Samples trained: <span className="text-white font-medium">{retrainMetrics.samples_trained}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wider">Feature Importances</span>
                        {Object.entries(retrainMetrics.feature_importances).map(([feature, val]) => (
                          <div key={feature} className="space-y-1">
                            <div className="flex justify-between text-[10px] text-gray-300">
                              <span>{feature}</span>
                              <span className="font-semibold text-indigo-400">{val}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full transition-all duration-500"
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}

          {/* ================= RESCUE TEAM & NGO DASHBOARD (12 columns) ================= */}
          {role === "rescue_team" && (
            <>
              {/* Incident Coordination Tasks Queue */}
              <div className="lg:col-span-7 space-y-6">
                <div className="glass-panel border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Users className="h-5 w-5 text-emerald-400 mr-2" />
                    Emergency Dispatch Worklist
                  </h3>
                  <div className="divide-y divide-white/5 text-xs">
                    {reports.filter(r => r.status === "verified").length === 0 ? (
                      <p className="text-gray-500 text-center py-6">No verified dispatch orders at this time.</p>
                    ) : (
                      reports.filter(r => r.status === "verified").map((rep) => (
                        <div key={rep.id} className="py-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-100">{rep.citizen_name || "Rescue Dispatch"}</p>
                              <span className="text-[10px] text-gray-500">GIS Coordinate: {rep.latitude}, {rep.longitude}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                              Active Task
                            </span>
                          </div>

                          <p className="text-gray-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                            {rep.description}
                          </p>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVerifyReport(rep.id, "resolved")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                            >
                              Mark Safe & Resolved
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Shelter Capacity updates */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-panel border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Home className="h-5 w-5 text-indigo-400 mr-2" />
                    Relief Shelter Capacity Control
                  </h3>
                  <p className="text-xs text-gray-400">
                    Adjust shelter occupancies dynamically as new evacuees arrive at the relief camps.
                  </p>

                  <div className="space-y-4 text-xs">
                    {shelters.map((shelter) => (
                      <div key={shelter.id} className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-white">{shelter.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            shelter.status === "open" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {shelter.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-[11px] text-gray-300">
                          <span>Occupancy: {shelter.current_occupancy} / {shelter.capacity}</span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleUpdateOccupancy(shelter.id, -10)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px]"
                            >
                              -10
                            </button>
                            <button
                              onClick={() => handleUpdateOccupancy(shelter.id, 10)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px]"
                            >
                              +10
                            </button>
                          </div>
                        </div>

                        {/* Occupancy bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full transition-all duration-300"
                            style={{ width: `${(shelter.current_occupancy / shelter.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
}
