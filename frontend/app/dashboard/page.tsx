"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatsCard from "@/components/StatsCard";
import MessageStatusBadge from "@/components/MessageStatusBadge";
import { 
  Users, 
  ShoppingBag, 
  Megaphone, 
  TrendingUp, 
  MessageCircle, 
  Smartphone, 
  Mail, 
  MessageSquare,
  BarChart3,
  Calendar,
  Activity
} from "lucide-react";

interface CampaignItem {
  id: string;
  name: string;
  status: string;
  channel: string;
  sent_at: string | null;
}

interface DashboardData {
  total_customers: number;
  total_orders: number;
  total_campaigns: number;
  total_messages: number;
  status_breakdown: Record<string, number>;
  total_attributed_orders: number;
  recent_campaigns: CampaignItem[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then((res) => setData(res as unknown as DashboardData))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageShell><Skeleton /></PageShell>;
  if (!data)   return <PageShell><p className="text-[#94a3b8] text-center py-12">Failed to load dashboard.</p></PageShell>;

  const deliveryRate = data.total_messages > 0
    ? Math.round(((data.status_breakdown["delivered"] ?? 0) / data.total_messages) * 100)
    : 0;

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f9]">Dashboard</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Overview of your shoppers, message channels, and campaign metrics</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.03] px-3 py-1.5 rounded-lg text-[#94a3b8] font-medium">
          <Activity className="w-3.5 h-3.5 text-[#7c6af7] animate-pulse" />
          <span>System active</span>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatsCard label="Customers" value={data.total_customers.toLocaleString()} icon={Users} />
        <StatsCard label="Orders" value={data.total_orders.toLocaleString()} icon={ShoppingBag} />
        <StatsCard label="Campaigns" value={data.total_campaigns.toLocaleString()} icon={Megaphone} />
        <StatsCard label="Attributed Orders" value={data.total_attributed_orders.toLocaleString()} icon={TrendingUp} accent />
      </div>

      {/* Message funnel + recent campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Message funnel */}
        <div className="glass-card rounded-2xl p-6 glow-purple border border-[#e2e8f0]/[0.03]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#7c6af7]" />
              <h2 className="text-sm font-semibold text-[#f1f5f9] tracking-wide uppercase">Message Funnel</h2>
            </div>
            <span className="text-xs bg-[#e2e8f0]/[0.02] text-[#94a3b8] border border-[#e2e8f0]/[0.04] px-2 py-1 rounded-md font-mono">{data.total_messages.toLocaleString()} total</span>
          </div>
          
          <div className="space-y-4">
            {["sent", "delivered", "opened", "read", "clicked", "failed"].map((status) => {
              const count = data.status_breakdown[status] ?? 0;
              const pct = data.total_messages > 0 ? (count / data.total_messages) * 100 : 0;
              return (
                <div key={status} className="group">
                  <div className="flex justify-between items-center mb-1.5">
                    <MessageStatusBadge status={status} />
                    <span className="text-[#94a3b8] text-xs font-mono tabular-nums">{count.toLocaleString()} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.03] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        status === "failed" ? "bg-gradient-to-r from-red-500/80 to-red-400/80" :
                        status === "clicked" ? "bg-gradient-to-r from-amber-500/80 to-amber-400/80" : 
                        "bg-gradient-to-r from-[#7c6af7] to-[#a89bf9]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-5 border-t border-[#e2e8f0]/[0.03] flex items-center justify-between">
            <span className="text-[#94a3b8] text-xs font-medium">Successful Delivery Rate</span>
            <span className="text-[#f1f5f9] text-sm font-bold tabular-nums bg-[#7c6af7]/15 px-2.5 py-1 rounded-lg border border-[#7c6af7]/20 text-[#a89bf9]">{deliveryRate}%</span>
          </div>
        </div>

        {/* Recent campaigns */}
        <div className="glass-card rounded-2xl p-6 border border-[#e2e8f0]/[0.03]">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-4 h-4 text-[#7c6af7]" />
            <h2 className="text-sm font-semibold text-[#f1f5f9] tracking-wide uppercase">Recent Campaigns</h2>
          </div>

          {data.recent_campaigns.length === 0 ? (
            <p className="text-[#64748b] text-sm py-12 text-center">No campaigns launched yet.</p>
          ) : (
            <div className="space-y-4">
              {data.recent_campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3.5 border border-[#e2e8f0]/[0.015] hover:border-[#e2e8f0]/[0.04] rounded-xl bg-[#e2e8f0]/[0.005] hover:bg-[#e2e8f0]/[0.015] transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5">
                    <ChannelIcon channel={c.channel} />
                    <div>
                      <p className="text-sm text-[#f1f5f9] font-semibold tracking-tight">{c.name}</p>
                      <p className="text-xs text-[#94a3b8] mt-0.5">
                        {c.sent_at
                          ? new Date(c.sent_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "Not launched"
                        }
                      </p>
                    </div>
                  </div>
                  <StatusPill status={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </PageShell>
  );
}

// ── Small helpers ──────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-6xl mx-auto space-y-2">{children}</div>;
}

function ChannelIcon({ channel }: { channel: string }) {
  const size = "w-4 h-4";
  switch (channel) {
    case "whatsapp":
      return (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shadow-inner shadow-emerald-500/5">
          <MessageCircle className={size} />
        </div>
      );
    case "sms":
      return (
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl shadow-inner shadow-blue-500/5">
          <Smartphone className={size} />
        </div>
      );
    case "email":
      return (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shadow-inner shadow-amber-500/5">
          <Mail className={size} />
        </div>
      );
    case "rcs":
      return (
        <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl shadow-inner shadow-indigo-500/5">
          <MessageSquare className={size} />
        </div>
      );
    default:
      return (
        <div className="p-2.5 bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded-xl shadow-inner shadow-gray-500/5">
          <Megaphone className={size} />
        </div>
      );
  }
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft:     "text-[#94a3b8] bg-[#e2e8f0]/[0.015] border-[#e2e8f0]/[0.03]",
    running:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    completed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${styles[status] ?? styles.draft}`}>
      {status === "running" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
      )}
      {status}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-9 w-48 bg-[#e2e8f0]/[0.02] rounded-lg" />
        <div className="h-4 w-96 bg-[#e2e8f0]/[0.015] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.03] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.03] rounded-2xl" />
        <div className="h-96 bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.03] rounded-2xl" />
      </div>
    </div>
  );
}