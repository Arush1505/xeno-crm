"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import MessageStatusBadge from "@/components/MessageStatusBadge";
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Play,
  Activity,
  MessageCircle,
  Smartphone,
  Mail,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  Clock,
  Sparkles,
  Megaphone
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  segment_id: string;
  channel: string;
  message_template: string;
  status: string;
  created_at: string;
  sent_at: string | null;
}

interface CampaignStats {
  campaign_id: string;
  name: string;
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
  attributed_orders: number;
}

interface Message {
  id: string;
  campaign_id: string;
  customer_id: string;
  channel: string;
  content: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  read_at: string | null;
  clicked_at: string | null;
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [campaign,  setCampaign]  = useState<Campaign | null>(null);
  const [stats,     setStats]     = useState<CampaignStats | null>(null);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error,     setError]     = useState("");

  async function load() {
    try {
      const [c, s, m] = await Promise.all([
        api.getCampaign(id),
        api.getCampaignStats(id),
        api.getCampaignMessages(id),
      ]);
      setCampaign(c as unknown as Campaign);
      setStats(s as unknown as CampaignStats);
      setMessages(m as unknown as Message[]);
    } catch (e: unknown) {
      console.error(e);
      setError("Failed to load campaign data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  // Poll stats every 4s while campaign is running
  useEffect(() => {
    if (campaign?.status !== "running") return;
    const interval = setInterval(async () => {
      try {
        const [s, m] = await Promise.all([
          api.getCampaignStats(id),
          api.getCampaignMessages(id),
        ]);
        setStats(s as unknown as CampaignStats);
        setMessages(m as unknown as Message[]);
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [campaign?.status, id]);

  async function handleLaunch() {
    setLaunching(true);
    setError("");
    try {
      const updated = await api.launchCampaign(id);
      setCampaign(updated as unknown as Campaign);
      // Refresh statistics and logs
      const [s, m] = await Promise.all([
        api.getCampaignStats(id),
        api.getCampaignMessages(id),
      ]);
      setStats(s as unknown as CampaignStats);
      setMessages(m as unknown as Message[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Campaign launch failed.");
    } finally {
      setLaunching(false);
    }
  }

  if (loading)   return <Shell><Skeleton /></Shell>;
  if (!campaign) return <Shell><p className="text-[#94a3b8] text-center py-12">Campaign not found.</p></Shell>;

  return (
    <Shell>
      {/* Back navigation */}
      <button
        onClick={() => router.push("/campaigns")}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] hover:text-[#f1f5f9] mb-6 transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Campaigns</span>
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
        <div className="flex items-start gap-4">
          <ChannelIcon channel={campaign.channel} large />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f9]">{campaign.name}</h1>
            <p className="text-[#94a3b8] text-sm mt-1.5 flex items-center gap-1.5">
              <span className="font-semibold uppercase tracking-wider text-[10px] bg-[#e2e8f0]/0.02 px-2 py-0.5 rounded border border-[#e2e8f0]/[0.04]">{campaign.channel}</span>
              <span>·</span>
              <Calendar className="w-3.5 h-3.5 text-[#64748b]" />
              <span>
                {campaign.sent_at
                  ? `Launched ${new Date(campaign.sent_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                  : "Draft (not launched)"
                }
              </span>
            </p>
          </div>
        </div>

        <div>
          {campaign.status === "draft" && (
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-50 text-[#f1f5f9] text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#7c6af7]/20 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-[#f1f5f9]" />
              <span>{launching ? "Launching..." : "Launch Campaign"}</span>
            </button>
          )}

          {campaign.status === "running" && (
            <span className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Running
            </span>
          )}

          {campaign.status === "completed" && (
            <span className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" />
              Completed
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-4.5 py-3 rounded-xl mb-6">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Side: Mock Screen Preview & Basic Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-[#e2e8f0]/[0.03]">
            <h2 className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-4">Message Preview</h2>
            <PhonePreview channel={campaign.channel} template={campaign.message_template} />
          </div>
        </div>

        {/* Right Side: Delivery stats & messages logs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Stats Box */}
          {stats && (
            <div className="glass-card rounded-2xl p-6 border border-[#e2e8f0]/[0.03] glow-purple">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Delivery Stats</h2>
                <span className="text-[10px] uppercase font-bold tracking-wide text-[#a89bf9] bg-[#7c6af7]/15 border border-[#7c6af7]/25 px-2 py-0.5 rounded">
                  {stats.total} total
                </span>
              </div>
              <div className="grid grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
                {(["sent","delivered","failed","opened","read","clicked"] as const).map((s) => (
                  <StatBox key={s} label={s} value={stats[s]} total={stats.total} />
                ))}
              </div>
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-[#7c6af7]/15 to-transparent border border-[#7c6af7]/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#a89bf9]" />
                  <span className="text-xs font-semibold text-[#f1f5f9]">Attributed Orders</span>
                </div>
                <span className="text-base font-extrabold text-[#9d8ffb] tabular-nums bg-[#0c0d16]/30 px-3 py-1 rounded-lg border border-[#e2e8f0]/[0.03]">
                  {stats.attributed_orders}
                </span>
              </div>
            </div>
          )}

          {/* Message log */}
          {messages.length > 0 && (
            <div className="glass-card rounded-2xl border border-[#e2e8f0]/[0.03] overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-[#e2e8f0]/[0.04] bg-[#e2e8f0]/[0.005]">
                <h2 className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">
                  Recipients Log ({messages.length} shopper{messages.length > 1 ? "s" : ""})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-[#e2e8f0]/[0.04] bg-[#e2e8f0]/[0.005]">
                      <th className="px-5 py-3 text-[#64748b] text-xs font-semibold uppercase">Customer ID</th>
                      <th className="px-5 py-3 text-[#64748b] text-xs font-semibold uppercase">Content</th>
                      <th className="px-5 py-3 text-[#64748b] text-xs font-semibold uppercase">Status</th>
                      <th className="px-5 py-3 text-[#64748b] text-xs font-semibold uppercase">Last Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]/[0.02]">
                    {messages.map((msg) => (
                      <MessageRow key={msg.id} msg={msg} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────
// Phone Preview Mockup Component
// ─────────────────────────────────────────

function PhonePreview({ channel, template }: { channel: string; template: string }) {
  const displayTemplate = template.replace(/\{\{name\}\}/g, "Arush");
  
  return (
    <div className="w-full max-w-[290px] mx-auto border border-[#e2e8f0]/[0.06] bg-[#121422]/80 rounded-[32px] p-3 shadow-2xl relative overflow-hidden">
      {/* Notch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#1e2030] rounded-full z-10 flex items-center justify-center">
        <div className="w-12 h-1 bg-[#e2e8f0]/0.10 rounded-full" />
      </div>
      
      {/* Screen */}
      <div className="bg-[#0b0c12] rounded-[24px] pt-8 pb-3 px-2.5 min-h-[300px] flex flex-col justify-between border border-[#e2e8f0]/[0.03]">
        {/* App Header */}
        <div className="flex items-center gap-2 border-b border-[#e2e8f0]/[0.04] pb-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#7c6af7] to-[#9d8ffb] flex items-center justify-center text-[9px] text-[#f1f5f9] font-extrabold shadow-sm shrink-0">X</div>
          <div>
            <p className="text-[10px] font-bold text-[#f1f5f9] leading-tight">Xeno CRM Brand</p>
            <p className="text-[7.5px] text-emerald-400 font-medium tracking-wide">● Online</p>
          </div>
        </div>
        
        {/* Bubble */}
        <div className="flex-1 flex flex-col justify-start">
          <div className={`p-2.5 rounded-2xl text-[11px] leading-relaxed max-w-[90%] shadow-md ${
            channel === "whatsapp" 
              ? "bg-[#0b291d] text-emerald-100 border border-emerald-500/10 rounded-tl-none mr-auto text-left"
              : channel === "email"
                ? "bg-[#1c1e2f] text-[#cbd5e1] border border-[#e2e8f0]/[0.04] rounded-tl-none mr-auto text-left"
                : "bg-[#e2e8f0]/[0.03] text-[#cbd5e1] border border-[#e2e8f0]/[0.03] rounded-tl-none mr-auto text-left"
          }`}>
            <p className="whitespace-pre-wrap">{displayTemplate}</p>
            <span className="text-[8px] text-[#64748b] mt-1 block text-right">Just now</span>
          </div>
        </div>
        
        {/* Text Area mimic */}
        <div className="mt-3 bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.03] rounded-full px-3 py-1.5 flex items-center justify-between text-[9px] text-[#94a3b8]">
          <span>Type a message...</span>
          <div className="w-4.5 h-4.5 rounded-full bg-[#7c6af7] flex items-center justify-center text-[#f1f5f9] text-[8px] font-bold">→</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Message Row & Stepper Progress
// ─────────────────────────────────────────

const STATUS_ORDER = ["queued", "sent", "delivered", "opened", "read", "clicked"];

function MessageRow({ msg }: { msg: Message }) {
  const [expanded, setExpanded] = useState(false);

  const lastUpdated = msg.clicked_at ?? msg.read_at ?? msg.opened_at
    ?? msg.delivered_at ?? msg.sent_at;

  return (
    <>
      <tr
        onClick={() => setExpanded((p) => !p)}
        className="border-b border-[#e2e8f0]/[0.02] last:border-0 hover:bg-[#e2e8f0]/[0.01] cursor-pointer transition-colors"
      >
        <td className="px-5 py-3.5 text-[#a89bf9] text-xs font-mono font-semibold">{msg.customer_id.slice(0, 8)}…</td>
        <td className="px-5 py-3.5 text-[#94a3b8] text-xs max-w-xs truncate">{msg.content}</td>
        <td className="px-5 py-3.5"><MessageStatusBadge status={msg.status} /></td>
        <td className="px-5 py-3.5 text-[#64748b] text-xs">
          {lastUpdated
            ? new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
            : "—"
          }
        </td>
      </tr>

      {/* Expanded progress tracking */}
      {expanded && (
        <tr className="bg-[#e2e8f0]/[0.003]">
          <td colSpan={4} className="px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4.5 overflow-x-auto py-2">
              {STATUS_ORDER.map((s, i) => {
                const tsMap: Record<string, string | null> = {
                  queued:    msg.sent_at,
                  sent:      msg.sent_at,
                  delivered: msg.delivered_at,
                  opened:    msg.opened_at,
                  read:      msg.read_at,
                  clicked:   msg.clicked_at,
                };
                const reached = isStatusReached(msg.status, s);
                const ts = tsMap[s];
                const active = msg.status === s;

                return (
                  <div key={s} className="flex items-center gap-3.5 shrink-0">
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold transition-all duration-300
                        ${reached 
                          ? "bg-[#7c6af7] text-white shadow-[0_0_8px_#7c6af7]" 
                          : "bg-[#e2e8f0]/0.04 border border-[#e2e8f0]/0.08 text-[#64748b]"
                        }
                        ${active ? "ring-4 ring-[#7c6af7]/20 scale-110" : ""}
                      `}>
                        {reached ? "✓" : i + 1}
                      </div>
                      <p className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wide ${reached ? "text-gray-300" : "text-[#64748b]"}`}>
                        {s}
                      </p>
                      {ts && reached && (
                        <p className="text-[8.5px] text-[#64748b] mt-0.5">
                          {new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    {i < STATUS_ORDER.length - 1 && (
                      <div className={`hidden sm:block w-8 h-0.5 mb-5 rounded-full ${reached ? "bg-[#7c6af7]/40" : "bg-[#e2e8f0]/0.04]"}`} />
                    )}
                  </div>
                );
              })}

              {msg.status === "failed" && (
                <span className="flex items-center gap-1.5 ml-4 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Delivery failed
                </span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function isStatusReached(current: string, check: string): boolean {
  const idx = STATUS_ORDER.indexOf(current);
  const checkIdx = STATUS_ORDER.indexOf(check);
  if (current === "failed") return check === "queued" || check === "sent";
  return checkIdx <= idx;
}

// ─────────────────────────────────────────
// Small UI Elements
// ─────────────────────────────────────────

function ChannelIcon({ channel, large = false }: { channel: string; large?: boolean }) {
  const size = large ? "w-5 h-5" : "w-4 h-4";
  const padding = large ? "p-3 rounded-2xl" : "p-2.5 rounded-xl";
  switch (channel) {
    case "whatsapp":
      return (
        <div className={`${padding} bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0`}>
          <MessageCircle className={size} />
        </div>
      );
    case "sms":
      return (
        <div className={`${padding} bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0`}>
          <Smartphone className={size} />
        </div>
      );
    case "email":
      return (
        <div className={`${padding} bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0`}>
          <Mail className={size} />
        </div>
      );
    case "rcs":
      return (
        <div className={`${padding} bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0`}>
          <MessageSquare className={size} />
        </div>
      );
    default:
      return (
        <div className={`${padding} bg-gray-500/10 border border-gray-500/20 text-gray-400 shrink-0`}>
          <Megaphone className={size} />
        </div>
      );
  }
}

function StatBox({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bg-[#e2e8f0]/[0.005] border border-[#e2e8f0]/[0.02] rounded-xl p-3 text-center hover:bg-[#e2e8f0]/[0.015] hover:border-[#e2e8f0]/[0.04] transition-all duration-200">
      <p className="text-[#f1f5f9] text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="text-[#94a3b8] text-[9.5px] uppercase font-bold tracking-wider mt-1.5 leading-none">{label}</p>
      <p className="text-[#64748b] text-[9px] mt-1 leading-none">{pct}%</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-6xl mx-auto">{children}</div>;
}

// Keep Skeleton using relative color variables
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-[#e2e8f0]/[0.02] rounded-lg" />
      <div className="flex items-center justify-between">
        <div className="h-12 w-72 bg-[#e2e8f0]/[0.02] rounded-lg" />
        <div className="h-10 w-36 bg-[#e2e8f0]/[0.02] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 h-[360px] bg-[#e2e8f0]/[0.02] rounded-2xl" />
        <div className="lg:col-span-7 space-y-6">
          <div className="h-44 bg-[#e2e8f0]/[0.02] rounded-2xl" />
          <div className="h-56 bg-[#e2e8f0]/[0.02] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
