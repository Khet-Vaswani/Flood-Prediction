"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert, Map, LayoutDashboard, LogIn, LogOut, PhoneCall } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    // Read user details from localStorage
    const updateAuth = () => {
      const token = localStorage.getItem("token");
      const name = localStorage.getItem("userName");
      const role = localStorage.getItem("userRole");
      if (token && name && role) {
        setUser({ name, role });
      } else {
        setUser(null);
      }
    };

    updateAuth();
    
    // Listen for storage events (e.g. login/logout in other tabs)
    window.addEventListener("storage", updateAuth);
    // Listen for custom login changes in same window
    window.addEventListener("auth-changed", updateAuth);

    return () => {
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("auth-changed", updateAuth);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    setUser(null);
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-white font-bold text-lg hover:text-blue-400 transition-colors">
              <ShieldAlert className="h-6 w-6 text-red-500 animate-pulse" />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent hidden sm:inline">
                Pak-Flood Response
              </span>
              <span className="sm:hidden text-white">PFR</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Link
              href="/map"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/map"
                  ? "bg-blue-600/25 text-blue-400 border border-blue-500/20"
                  : "text-gray-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Map className="h-4 w-4 mr-1.5" />
              GIS Map
            </Link>

            <Link
              href="/dashboard"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-blue-600/25 text-blue-400 border border-blue-500/20"
                  : "text-gray-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              Dashboard
            </Link>

            {/* Quick Emergency Phone Link */}
            <a
              href="tel:1122"
              className="flex items-center px-3 py-2 rounded-md text-sm font-semibold bg-red-600 hover:bg-red-700 text-white animate-bounce shadow-lg shadow-red-600/30 transition-all border border-red-500/20"
            >
              <PhoneCall className="h-3.5 w-3.5 mr-1" />
              <span>1122</span>
            </a>

            {/* User Account / Auth Actions */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
                <div className="hidden md:flex flex-col items-end leading-tight">
                  <span className="text-white text-xs font-semibold">{user.name}</span>
                  <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                    {user.role === "admin" ? "NDMA Admin" : user.role === "rescue_team" ? "Rescue/NGO" : "Citizen"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors border border-blue-500/20"
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
