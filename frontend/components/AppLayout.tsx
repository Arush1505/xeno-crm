"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c0d16] text-[#e2e8f0] flex flex-col md:flex-row relative">
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#121422]/90 backdrop-blur-md border-b border-[#e2e8f0]/[0.03] z-20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#e2e8f0]/0.04 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-[#f1f5f9] font-semibold text-lg tracking-tight">
            xeno <span className="text-[#7c6af7]">crm</span>
          </span>
        </div>
      </header>

      {/* Sidebar navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Mobile Sidebar backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-[#09090f]/60 backdrop-blur-sm z-20 transition-opacity duration-300"
        />
      )}

      {/* Main Content Area */}
      <main
        className={`
          flex-1 min-h-screen transition-all duration-300 ease-in-out p-6 md:p-10
          pt-22 md:pt-10 w-full overflow-x-hidden
          ${isCollapsed ? "md:ml-20" : "md:ml-56"}
        `}
      >
        {children}
      </main>
    </div>
  );
}
