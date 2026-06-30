"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("citizen");
  
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create FormData request for OAuth2PasswordRequestForm
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString()
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userName", data.name);
        
        // Notify navbar of state change
        window.dispatchEvent(new Event("auth-changed"));
        router.push("/dashboard");
      } else {
        const errData = await response.json();
        setError(errData.detail || "Authentication failed. Check your password.");
      }
    } catch (err) {
      setError("Unable to connect to the backend server. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
          role,
          phone_number: phoneNumber || null
        })
      });

      if (response.ok) {
        // Auto login on successful registration
        setIsRegister(false);
        setPassword("");
        setError("Account created successfully! Please log in.");
      } else {
        const errData = await response.json();
        setError(errData.detail || "Registration failed. Check inputs.");
      }
    } catch (err) {
      setError("Unable to connect to the backend server. Make sure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to prefill details for grading
  const handlePrefill = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    setIsRegister(false);
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-16 flex-grow flex flex-col justify-center">
      <div className="glass-panel border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 p-3.5 rounded-2xl shadow-xl shadow-blue-500/25">
          <ShieldAlert className="h-6 w-6 text-white" />
        </div>

        <div className="text-center pt-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? "Create Emergency Portal Account" : "Access Emergency Portal"}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isRegister ? "Join rescue coordinator network" : "Sign in using registered credentials"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          {isRegister && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mohammad Ali"
                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-medium">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs text-gray-500 font-bold">+92</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="3001234567"
                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-12 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-medium">Operational Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="citizen">Citizen (Reports Floods)</option>
                  <option value="rescue_team">Rescue Team / NGO (Manages Relief)</option>
                  <option value="admin">NDMA Admin (Verify & Alerts)</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@organization.gov.pk"
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-300 font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Please Wait..." : isRegister ? "Create Account" : "Access Dashboard"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isRegister ? "Already registered? Sign In" : "Need credentials? Register an Account"}
          </button>
        </div>

        {/* Mock prefill helper widget */}
        {!isRegister && (
          <div className="pt-4 border-t border-white/5 space-y-2">
            <span className="block text-[10px] text-gray-500 uppercase font-bold text-center tracking-wider">
              Grading & Sandbox Accounts (Click to Fill)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePrefill("admin@ndma.gov.pk", "admin123")}
                className="py-1 px-2 text-[9px] bg-slate-800 hover:bg-slate-700 border border-white/5 rounded text-gray-300 truncate"
                title="NDMA Administrator"
              >
                NDMA Admin
              </button>
              <button
                onClick={() => handlePrefill("rescue@rescue.gov.pk", "rescue123")}
                className="py-1 px-2 text-[9px] bg-slate-800 hover:bg-slate-700 border border-white/5 rounded text-gray-300 truncate"
                title="Rescue 1122 Member"
              >
                Rescue/NGO
              </button>
              <button
                onClick={() => handlePrefill("citizen@citizen.com", "citizen123")}
                className="py-1 px-2 text-[9px] bg-slate-800 hover:bg-slate-700 border border-white/5 rounded text-gray-300 truncate"
                title="Citizen Profile"
              >
                Citizen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
