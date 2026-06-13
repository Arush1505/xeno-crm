"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  Megaphone,
  Bot,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles
} from "lucide-react";

const links = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/customers",  label: "Customers",  icon: Users },
  { href: "/segments",   label: "Segments",   icon: Layers },
  { href: "/campaigns",  label: "Campaigns",  icon: Megaphone },
  { href: "/agent",      label: "AI Agent",   icon: Bot, accent: true },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-[#121422]/95 border-r border-[#e2e8f0]/[0.03] 
        flex flex-col z-30 transition-all duration-300 ease-in-out backdrop-blur-md
        /* Desktop */
        ${isCollapsed ? "md:w-20" : "md:w-56"}
        /* Mobile */
        ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Header (Logo + Toggle Button) */}
      <div className={`px-4 py-5 border-b border-[#e2e8f0]/[0.03] flex items-center justify-between`}>
        {/* Logo */}
        <div className={`flex items-center gap-2 transition-all duration-300 ${isCollapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100"}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c6af7] to-[#9d8ffb] flex items-center justify-center shadow-lg shadow-[#7c6af7]/20 shrink-0">
            <Sparkles className="w-4 h-4 text-[#f1f5f9] animate-pulse" />
          </div>
          <span className="text-[#f1f5f9] font-bold text-lg tracking-tight truncate pl-1">
            xeno<span className="text-[#7c6af7] font-semibold">crm</span>
          </span>
        </div>

        {isCollapsed && (
          <div className="hidden md:flex w-full justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c6af7] to-[#9d8ffb] flex items-center justify-center shadow-lg shrink-0">
              <Sparkles className="w-4 h-4 text-[#f1f5f9]" />
            </div>
          </div>
        )}

        {/* Toggle / Close Buttons */}
        <div className="flex items-center gap-1">
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-[#94a3b8] hover:text-[#f1f5f9] p-1 rounded-md hover:bg-[#e2e8f0]/0.04 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex text-[#94a3b8] hover:text-[#f1f5f9] p-1.5 rounded-lg hover:bg-[#e2e8f0]/0.04 transition-colors border border-[#e2e8f0]/[0.03]"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative group
                ${isCollapsed ? "md:justify-center md:px-2" : ""}
                ${active
                  ? "bg-[#7c6af7]/10 text-[#f1f5f9] font-medium border border-[#7c6af7]/20 glow-purple"
                  : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#e2e8f0]/[0.02]"
                }
              `}
              title={isCollapsed ? link.label : ""}
            >
              <Icon className={`
                w-4.5 h-4.5 shrink-0 transition-colors duration-200
                ${active ? "text-[#7c6af7]" : "text-[#94a3b8] group-hover:text-[#f1f5f9]"}
                ${link.accent && !active ? "text-[#9d8ffb] animate-pulse" : ""}
              `} />
              
              <span 
                className={`
                  transition-all duration-300 overflow-hidden whitespace-nowrap
                  ${isCollapsed ? "md:w-0 md:opacity-0 md:pointer-events-none" : "w-auto opacity-100"}
                `}
              >
                {link.label}
              </span>

              {/* Glowing active indicator line */}
              {active && !isCollapsed && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#7c6af7] shadow-[0_0_8px_#7c6af7]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`px-4 py-4 border-t border-[#e2e8f0]/[0.03] flex items-center justify-between text-xs text-[#64748b]`}>
        {isCollapsed ? (
          <div className="w-full text-center font-bold text-[#7c6af7]">X</div>
        ) : (
          <>
            <span className="truncate">Xeno Mini CRM</span>
            <span className="text-[10px] bg-[#e2e8f0]/0.02 text-[#94a3b8] border border-[#e2e8f0]/[0.03] px-1.5 py-0.5 rounded-md font-mono shrink-0">v1.1</span>
          </>
        )}
      </div>
    </aside>
  );
}