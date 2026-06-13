"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Sparkles, 
  Plus, 
  Layers, 
  Settings, 
  AlertCircle, 
  Calendar, 
  Tag, 
  Clock, 
  ShoppingCart, 
  Coins, 
  UserCheck 
} from "lucide-react";

interface Segment {
  id: string;
  name: string;
  description?: string;
  filter_query?: Record<string, unknown>;
  created_by_ai: boolean;
  created_at: string;
  customer_count?: number;
}

const FILTER_LABELS: Record<string, string> = {
  category:      "Category",
  sub_category:  "Sub-category",
  inactive_days: "Inactive Days",
  min_orders:    "Min Orders",
  min_spend:     "Min Spend",
};

export default function SegmentsPage() {
  const [segments,    setSegments]    = useState<Segment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [aiMode,      setAiMode]      = useState(true);

  useEffect(() => {
    api.getSegments()
      .then((res) => setSegments(res as unknown as Segment[]))
      .finally(() => setLoading(false));
  }, []);

  function onCreated(segment: Segment) {
    setSegments((prev) => [segment, ...prev]);
    setShowForm(false);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f9]">Segments</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Carve out precise target audiences from your shopper base</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-[#7c6af7] hover:bg-[#6a58e5] text-[#f1f5f9] text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#7c6af7]/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Segment</span>
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass-card border border-[#7c6af7]/30 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden">
          {/* Top backdrop glow */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#7c6af7]/10 blur-2xl pointer-events-none" />
          
          {/* Sliding Pill Switch */}
          <div className="flex items-center bg-[#070709] border border-[#e2e8f0]/[0.03] rounded-xl p-1 w-fit mb-6">
            <button
              onClick={() => setAiMode(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                aiMode 
                  ? "bg-[#7c6af7] text-[#f1f5f9] shadow-md shadow-[#7c6af7]/10" 
                  : "text-[#94a3b8] hover:text-[#f1f5f9]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI GENERATE</span>
            </button>
            <button
              onClick={() => setAiMode(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                !aiMode 
                  ? "bg-[#e2e8f0]/0.08 text-[#f1f5f9]" 
                  : "text-[#94a3b8] hover:text-[#f1f5f9]"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>MANUAL FILTER</span>
            </button>
          </div>

          {aiMode
            ? <AISegmentForm onCreated={onCreated} onCancel={() => setShowForm(false)} />
            : <ManualSegmentForm onCreated={onCreated} onCancel={() => setShowForm(false)} />
          }
        </div>
      )}

      {/* List */}
      {loading ? (
        <Skeleton />
      ) : segments.length === 0 ? (
        <EmptyState onNew={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {segments.map((seg) => (
            <SegmentCard key={seg.id} segment={seg} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Segment Card Component
// ─────────────────────────────────────────

function SegmentCard({ segment }: { segment: Segment }) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-[#e2e8f0]/[0.03] hover:border-[#e2e8f0]/[0.07] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden bg-gradient-to-b from-[#e2e8f0]/[0.005] to-transparent">
      {/* Accent glow on card hover */}
      <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-[#7c6af7]/5 blur-3xl pointer-events-none group-hover:bg-[#7c6af7]/10 transition-all duration-500" />
      
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {/* AI badge */}
            {segment.created_by_ai ? (
              <span className="flex items-center gap-1.5 text-[10px] tracking-wider px-2 py-0.5 rounded-md border text-[#a89bf9] bg-[#7c6af7]/10 border-[#7c6af7]/30 shrink-0 font-bold uppercase">
                <Sparkles className="w-3 h-3 text-[#9d8ffb] animate-pulse" />
                AI
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] tracking-wider px-2 py-0.5 rounded-md border text-[#94a3b8] bg-[#e2e8f0]/[0.015] border-[#e2e8f0]/[0.04] shrink-0 font-bold uppercase">
                <Settings className="w-3 h-3 text-[#64748b]" />
                Manual
              </span>
            )}
            
            <div>
              <p className="text-[#f1f5f9] font-bold tracking-tight text-base group-hover:text-[#a89bf9] transition-colors">{segment.name}</p>
              {segment.description && (
                <p className="text-[#94a3b8] text-xs mt-1.5 leading-relaxed">{segment.description}</p>
              )}
            </div>
          </div>

          {/* Customer count */}
          <div className="text-right shrink-0 ml-4 bg-[#7c6af7]/5 border border-[#7c6af7]/10 px-3 py-1.5 rounded-xl">
            <p className="text-[#f1f5f9] font-extrabold text-base tabular-nums tracking-tight">
              {(segment.customer_count ?? 0).toLocaleString()}
            </p>
            <p className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-wider mt-0.5">Shoppers</p>
          </div>
        </div>

        {/* Filter chips */}
        {segment.filter_query && Object.keys(segment.filter_query).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {Object.entries(segment.filter_query).map(([key, val]) => (
              <span
                key={key}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.04] rounded-lg text-[#94a3b8] font-medium"
              >
                <FilterIcon type={key} />
                <span>
                  {FILTER_LABELS[key] ?? key}:{" "}
                  <span className="text-[#f1f5f9] font-semibold">{key === "min_spend" ? `₹${val}` : String(val)}</span>
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[#64748b] text-xs mt-6 pt-4 border-t border-[#e2e8f0]/[0.03]">
        <Calendar className="w-3.5 h-3.5" />
        <span>
          Created {new Date(segment.created_at).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

function FilterIcon({ type }: { type: string }) {
  const size = "w-3.5 h-3.5 text-[#64748b]";
  switch (type) {
    case "category":
    case "sub_category":
      return <Tag className={size} />;
    case "inactive_days":
      return <Clock className={size} />;
    case "min_orders":
      return <ShoppingCart className={size} />;
    case "min_spend":
      return <Coins className={size} />;
    default:
      return <Layers className={size} />;
  }
}

// ─────────────────────────────────────────
// AI Form Component
// ─────────────────────────────────────────

function AISegmentForm({
  onCreated,
  onCancel,
}: {
  onCreated: (s: Segment) => void;
  onCancel: () => void;
}) {
  const [prompt,   setPrompt]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const EXAMPLES = [
    "Fashion buyers who haven't ordered in 30 days",
    "High value customers who spent more than ₹5000",
    "Customers who bought perfumes at least twice",
    "Sports buyers inactive for 45 days",
  ];

  async function handleGenerate() {
    if (!prompt.trim()) { setError("Describe the audience you want to target."); return; }
    setLoading(true);
    setError("");
    try {
      const segment = await api.aiGenerateSegment(prompt);
      onCreated(segment as unknown as Segment);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">
          Describe your Target Shoppers
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g., Fashion shoppers who haven't placed an order in the last 30 days..."
          className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 resize-none transition-all duration-200"
        />
      </div>

      {/* Example Prompts */}
      <div>
        <p className="text-[#64748b] text-xs font-medium mb-2.5">Suggested Prompts:</p>
        <div className="flex flex-wrap gap-2.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="text-xs px-3 py-1.5 bg-[#070709] border border-[#e2e8f0]/[0.03] hover:border-[#7c6af7]/40 text-[#94a3b8] hover:text-[#a89bf9] rounded-xl transition-all duration-200"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3.5 pt-2">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-50 text-[#f1f5f9] text-sm font-semibold rounded-xl transition-all shadow-md shadow-[#7c6af7]/10 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? "Generating Segment..." : "Generate Segment"}</span>
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
// Manual Form Component
// ─────────────────────────────────────────

function ManualSegmentForm({
  onCreated,
  onCancel,
}: {
  onCreated: (s: Segment) => void;
  onCancel: () => void;
}) {
  const [name,         setName]         = useState("");
  const [description,  setDescription]  = useState("");
  const [category,     setCategory]     = useState("");
  const [subCategory,  setSubCategory]  = useState("");
  const [inactiveDays, setInactiveDays] = useState("");
  const [minOrders,    setMinOrders]    = useState("");
  const [minSpend,     setMinSpend]     = useState("");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Segment name is required."); return; }

    const filter_query: Record<string, unknown> = {};
    if (category)     filter_query.category      = category;
    if (subCategory)  filter_query.sub_category  = subCategory;
    if (inactiveDays) filter_query.inactive_days = parseInt(inactiveDays);
    if (minOrders)    filter_query.min_orders    = parseInt(minOrders);
    if (minSpend)     filter_query.min_spend     = parseFloat(minSpend);

    setSaving(true);
    setError("");
    try {
      const segment = await api.createSegment({ name, description, filter_query, created_by_ai: false });
      onCreated(segment as unknown as Segment);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">Segment Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Lapsed Sports Shoppers"
            className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 transition-all duration-200"
          />
        </div>
        <div>
          <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional context about this segment"
            className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 transition-all duration-200"
          />
        </div>
        <div>
          <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 transition-all duration-200"
          >
            <option value="" className="bg-[#121422] text-[#f1f5f9]">Any Category</option>
            {["Fashion", "Sports", "Beauty", "Food", "Home"].map((c) => (
              <option key={c} value={c} className="bg-[#121422] text-[#f1f5f9]">{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">Sub-category</label>
          <input
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            placeholder="e.g., Running Shoes"
            className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 transition-all duration-200"
          />
        </div>
        <div>
          <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">Inactive Days</label>
          <input
            type="number"
            value={inactiveDays}
            onChange={(e) => setInactiveDays(e.target.value)}
            placeholder="e.g., 30 (idle shopper)"
            className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 transition-all duration-200"
          />
        </div>
        <div>
          <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">Min Orders Placed</label>
          <input
            type="number"
            value={minOrders}
            onChange={(e) => setMinOrders(e.target.value)}
            placeholder="e.g., 2"
            className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 transition-all duration-200"
          />
        </div>
        <div>
          <label className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider block mb-2">Min Spend (₹)</label>
          <input
            type="number"
            value={minSpend}
            onChange={(e) => setMinSpend(e.target.value)}
            placeholder="e.g., 5000"
            className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 transition-all duration-200"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#7c6af7] hover:bg-[#6a58e5] disabled:opacity-50 text-[#f1f5f9] text-sm font-semibold rounded-xl transition-all shadow-md shadow-[#7c6af7]/10 active:scale-95 cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          <span>{saving ? "Saving Segment..." : "Save Segment"}</span>
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
// Empty State Component
// ─────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-20 border border-dashed border-[#e2e8f0]/[0.04] rounded-2xl bg-[#e2e8f0]/[0.005]">
      <p className="text-[#64748b] text-sm mb-3.5">No segments have been defined yet.</p>
      <button 
        onClick={onNew} 
        className="text-[#7c6af7] text-sm hover:text-[#9d8ffb] font-semibold flex items-center gap-1.5 mx-auto hover:underline"
      >
        <span>Create your first segment</span>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Skeleton Component
// ─────────────────────────────────────────

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-44 bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.03] rounded-2xl" />
      ))}
    </div>
  );
}