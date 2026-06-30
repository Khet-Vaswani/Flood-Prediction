import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Navbar from "./components/Navbar";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Pak-Flood Response | AI Flood Prediction & Emergency Coordination",
  description: "AI-powered early warning, real-time crowdsourced reports, safety routing, and rescue coordination platform for flood monitoring in Pakistan.",
  keywords: "flood prediction, pakistan floods, NDMA, rescue 1122, disaster management, GIS mapping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Leaflet CSS styling injection */}
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${outfit.className} antialiased bg-[#090d16] text-slate-100 min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        {/* Global aesthetic footer */}
        <footer className="py-6 border-t border-white/5 bg-slate-950/60 backdrop-blur-md text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4">
            <p>© {new Date().getFullYear()} Pakistan National Disaster Response AI Framework. Under guidance of NDMA and PMD.</p>
            <p className="mt-1 text-gray-600">Equipped with Random Forest flood risk probability and real-time crowdsourced GIS tracking.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
