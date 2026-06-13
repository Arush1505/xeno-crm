"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Plus,
  Megaphone,
  ChevronRight,
  Calendar,
  AlertCircle,
  MessageCircle,
  Smartphone,
  Mail,
  MessageSquare
} from "lucide-react";

interface Segment {
  id: string;
  name: string;
  customer_count?: number;
}

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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([api.getCampaigns(), api.getSegments()])
      .then(([c, s]) => { 
        setCampaigns(c as unknown as Campaign[]); 
        setSegments(s as unknown as Segment[]); 
      })
      .finally(() => setLoading(false));
  }, []);

  function onCreated(campaign: Campaign) {
    setCampaigns((prev) => [campaign, ...prev]);
    setShowForm(false);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f9]">Campaigns</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Create, launch, and monitor targeted marketing campaigns</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-[#7c6af7] hover:bg-[#6a58e5] text-[#f1f5f9] text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#7c6af7]/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass-card border border-[#7c6af7]/30 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#7c6af7]/10 blur-2xl pointer-events-none" />
          <CreateCampaignForm
            segments={segments}
            onCreated={onCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <Skeleton />
      ) : campaigns.length === 0 ? (
        <EmptyState onNew={() => setShowForm(true)} />
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="flex items-center justify-between bg-[#e2e8f0]/[0.005] hover:bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.03] hover:border-[#e2e8f0]/[0.08] rounded-2xl p-5 transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center gap-4.5">
                <ChannelIcon channel={c.channel} />
                <div>
                  <p className="text-[#f1f5f9] font-bold tracking-tight text-base group-hover:text-[#a89bf9] transition-colors">
                    {c.name}
                  </p>
                  <p className="text-[#94a3b8] text-xs mt-1.5 flex items-center gap-1.5">
                    <span className="font-semibold uppercase tracking-wider text-[10px] bg-[#e2e8f0]/0.02 px-2 py-0.5 rounded border border-[#e2e8f0]/[0.04]">{c.channel}</span>
                    <span>·</span>
                    <Calendar className="w-3.5 h-3.5 text-[#64748b]" />
                    <span>
                      {c.sent_at
                        ? `Sent ${new Date(c.sent_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                        : `Created ${new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                      }
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <StatusPill status={c.status} />
                <div className="p-1.5 rounded-lg bg-[#e2e8f0]/[0.02] border border-[#e2e8f0]/[0.05] text-[#64748b] group-hover:text-[#f1f5f9] group-hover:border-[#7c6af7]/30 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Create Campaign Form Component
// ─────────────────────────────────────────

function CreateCampaignForm({
  segments,
  onCreated,
  onCancel,
}: {
  segments: Segment[];
  onCreated: (c: Campaign) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    segment_id: "",
    channel: "whatsapp",
    message_template: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name || !form.segment_id || !form.message_template) {
      setError("Please fill in all fields before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const campaign = await api.createCampaign(form);
      onCreated(campaign as unknown as Campaign);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-[#f1f5f9] font-bold text-lg">Create New Campaign</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">Campaign Name</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g., Summer Fashion Drop"
            className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 transition-all duration-200"
          />
        </div>

        <div>
          <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">Target Segment</label>
          <select
            value={form.segment_id}
            onChange={(e) => set("segment_id", e.target.value)}
            className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 transition-all duration-200"
          >
            <option value="" className="bg-[#121422] text-[#f1f5f9]">Select an audience...</option>
            {segments.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#121422] text-[#f1f5f9]">
                {s.name} ({s.customer_count ?? 0} shoppers)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">Channel</label>
          <select
            value={form.channel}
            onChange={(e) => set("channel", e.target.value)}
            className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 transition-all duration-200"
          >
            <option value="whatsapp" className="bg-[#121422] text-[#f1f5f9]">💬 WHATSAPP</option>
            <option value="sms" className="bg-[#121422] text-[#f1f5f9]">📱 SMS</option>
            <option value="email" className="bg-[#121422] text-[#f1f5f9]">✉️ EMAIL</option>
            <option value="rcs" className="bg-[#121422] text-[#f1f5f9]">🔵 RCS</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">
          Message Template
        </label>
        <textarea
          value={form.message_template}
          onChange={(e) => set("message_template", e.target.value)}
          rows={3}
          placeholder="Hi {{name}}, we have an exclusive collection curated just for you. Use code D2C20 for 20% off!"
          className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 resize-none transition-all duration-200"
        />
        <p className="text-[#64748b] text-xs mt-2 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#64748b]" />
          <span>Use <code className="bg-[#e2e8f0]/0.02 border border-[#e2e8f0]/0.04 px-1 py-0.5 rounded text-[11px] font-mono text-[#f1f5f9]">{"{{name}}"}</code> to insert the customer's name dynamically at send time.</span>
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-50 text-[#f1f5f9] text-sm font-semibold rounded-xl transition-all shadow-md shadow-[#7c6af7]/10 active:scale-95 cursor-pointer"
        >
          <Megaphone className="w-4 h-4" />
          <span>{saving ? "Saving Campaign..." : "Save Campaign"}</span>
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-[#94a3b8] hover:text-[#f1f5f9] text-sm font-semibold transition-colors rounded-xl hover:bg-[#e2e8f0]/0.04"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Small Helpers
// ─────────────────────────────────────────

function ChannelIcon({ channel }: { channel: string }) {
  const size = "w-4 h-4";
  switch (channel) {
    case "whatsapp":
      return (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shadow-inner">
          <MessageCircle className={size} />
        </div>
      );
    case "sms":
      return (
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl shadow-inner">
          <Smartphone className={size} />
        </div>
      );
    case "email":
      return (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shadow-inner">
          <Mail className={size} />
        </div>
      );
    case "rcs":
      return (
        <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl shadow-inner">
          <MessageSquare className={size} />
        </div>
      );
    default:
      return (
        <div className="p-2.5 bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded-xl shadow-inner">
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

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-20 border border-dashed border-[#e2e8f0]/[0.04] rounded-2xl bg-[#e2e8f0]/[0.005]">
      <p className="text-[#64748b] text-sm mb-3.5">No campaigns have been created yet.</p>
      <button
        onClick={onNew}
        className="text-[#7c6af7] text-sm hover:text-[#9d8ffb] font-semibold flex items-center gap-1.5 mx-auto hover:underline"
      >
        <span>Create your first campaign</span>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.03] rounded-2xl" />
      ))}
    </div>
  );
}