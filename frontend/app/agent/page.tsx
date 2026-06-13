"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Sparkles,
  History,
  Send,
  Terminal,
  AlertCircle,
  Bot,
  Activity
} from "lucide-react";

interface ActionLog {
  action: string;
  result: any;
  timestamp: string;
}

interface AgentRun {
  id: string;
  input_prompt: string;
  actions_taken: ActionLog[];
  result_summary: string;
  created_at: string;
}

export default function AgentPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("");

  // Poll status text updates for agent loading state
  useEffect(() => {
    if (!loading) return;
    const steps = [
      "Analyzing goal and formulating execution plan...",
      "Segmenting customer base via Gemini natural language parser...",
      "Generating high-impact personalized campaign messages...",
      "Provisioning marketing channels and drafting templates...",
      "Deploying campaign and dispatching real-time notifications...",
      "Analyzing results and writing execution summary..."
    ];
    let idx = 0;
    setStatusText(steps[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setStatusText(steps[idx]);
    }, 4500);
    return () => clearInterval(interval);
  }, [loading]);

  async function loadHistory(selectFirst = false) {
    try {
      const data = await api.getAgentRuns();
      const sorted = (data as unknown as AgentRun[]).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRuns(sorted);
      if (selectFirst && sorted.length > 0) {
        setActiveRun(sorted[0]);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load agent execution history.");
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadHistory(true);
  }, []);

  async function handleLaunch() {
    if (!prompt.trim()) {
      setError("Please input a campaign goal.");
      return;
    }
    setLoading(true);
    setError("");
    setActiveRun(null);
    try {
      const run = await api.runAgent(prompt);
      setPrompt("");
      await loadHistory(false);
      setActiveRun(run as unknown as AgentRun);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Agent execution failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f9] flex items-center gap-2.5">
            <Bot className="w-8 h-8 text-[#7c6af7]" />
            <span>AI Marketing Agent</span>
          </h1>
          <p className="text-[#94a3b8] text-sm mt-1">Autonomous campaign deployment. Describe your goals and let the AI execute segmenting, writing, and launching.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-4.5 py-3 rounded-xl mb-6">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Panel - Input + Execution Screen */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Goal Input Console */}
          <div className="glass-card rounded-2xl p-6 border border-[#e2e8f0]/[0.03] relative overflow-hidden bg-[#111115]">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#7c6af7]/5 blur-2xl pointer-events-none" />
            
            <h2 className="text-[#f1f5f9] font-bold text-base mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#7c6af7]" />
              <span>Agent Console</span>
            </h2>

            {/* Layout Box */}
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                rows={4}
                placeholder="e.g., Run a re-engagement campaign on WhatsApp for shoppers who bought perfumes at least twice, writing a friendly message with a 15% off code."
                className="w-full bg-[#070709] border border-[#e2e8f0]/[0.05] rounded-xl p-4 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/10 resize-none transition-all duration-200"
              />
              
              {/* Dedicated Button Action Row */}
              <div className="flex justify-end">
                <button
                  onClick={handleLaunch}
                  disabled={loading || !prompt.trim()}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md active:scale-95 cursor-pointer text-white
                    ${!prompt.trim() || loading 
                      ? "bg-[#1a1a24] text-[#4a4a5a] border border-white/[0.02] cursor-not-allowed" 
                      : "bg-[#7c6af7] hover:bg-[#6a58e5] hover:shadow-[#7c6af7]/20 hover:shadow-lg"
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <Activity className="w-4.5 h-4.5 animate-spin" />
                      <span>Executing Plan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Activate AI Agent</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Suggested Goals */}
            {!loading && (
              <div className="mt-5 pt-4 border-t border-white/[0.03] flex flex-wrap gap-2">
                <span className="text-[#64748b] text-[10px] uppercase font-bold tracking-wider pt-1.5 mr-1">Suggested:</span>
                {[
                  "Target beauty buyers who spent over ₹3000 on email",
                  "Launch a WhatsApp campaign to re-engage shoppers inactive for 60 days",
                  "Reach fashion segment users with a summer clearance offer"
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="text-[11px] px-2.5 py-1 bg-[#070709] border border-[#e2e8f0]/[0.03] hover:border-[#7c6af7]/40 text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Running Indicator Dashboard */}
          {loading && (
            <div className="glass-card rounded-2xl p-10 border border-[#7c6af7]/30 text-center space-y-6 glow-purple-lg flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#7c6af7]/10 flex items-center justify-center border border-[#7c6af7]/30 animate-pulse">
                  <Bot className="w-8 h-8 text-[#7c6af7]" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0c0d16] animate-ping" />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0c0d16]" />
              </div>
              <div className="space-y-2 max-w-sm">
                <p className="text-[#f1f5f9] font-bold tracking-tight text-lg">AI Agent Running</p>
                <p className="text-[#94a3b8] text-xs leading-relaxed animate-pulse">{statusText}</p>
              </div>
              <div className="w-48 h-1.5 bg-[#e2e8f0]/[0.02] border border-[#e2e8f0]/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#7c6af7] to-[#a89bf9] rounded-full w-2/3 animate-[pulse_1.5s_infinite]" />
              </div>
            </div>
          )}

          {/* Active Run Log Stepper */}
          {activeRun && !loading && (
            <div className="glass-card rounded-2xl border border-[#e2e8f0]/[0.03] overflow-hidden shadow-xl">
              {/* Card Header */}
              <div className="p-6 border-b border-[#e2e8f0]/[0.04] bg-[#e2e8f0]/[0.005]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] bg-[#7c6af7]/15 border border-[#7c6af7]/25 text-[#a89bf9] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      Completed Run
                    </span>
                    <h3 className="text-[#f1f5f9] font-extrabold tracking-tight text-base mt-2">"{activeRun.input_prompt}"</h3>
                  </div>
                  <span className="text-xs text-[#64748b] shrink-0 font-medium">
                    {new Date(activeRun.created_at).toLocaleString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>

              {/* Execution Steps */}
              <div className="p-6 space-y-6">
                <h4 className="text-[#94a3b8] text-xs font-semibold uppercase tracking-wider mb-4">Execution Steps</h4>
                
                <div className="relative border-l border-[#e2e8f0]/[0.06] pl-6 ml-3.5 space-y-6">
                  {activeRun.actions_taken.map((logItem, index) => (
                    <div key={index} className="relative group">
                      {/* Step Indicator Dot */}
                      <span className="absolute -left-9.5 top-0.5 w-7 h-7 rounded-full bg-[#7c6af7] border-4 border-[#0c0d16] flex items-center justify-center text-[10px] text-[#f1f5f9] font-bold shadow-[0_0_8px_#7c6af7]">
                        ✓
                      </span>
                      
                      <div className="space-y-2">
                        <p className="text-[#f1f5f9] font-bold text-sm tracking-tight capitalize">
                          {logItem.action.replace(/_/g, " ")}
                        </p>
                        <div className="bg-[#e2e8f0]/[0.005] border border-[#e2e8f0]/[0.03] p-4 rounded-xl text-xs text-[#cbd5e1] leading-relaxed font-mono overflow-x-auto">
                          {renderActionResult(logItem.action, logItem.result)}
                        </div>
                        <p className="text-[9.5px] text-[#64748b] font-medium font-mono">
                          {new Date(logItem.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit", second: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final Summary Box */}
                {activeRun.result_summary && (
                  <div className="mt-8 p-5 bg-gradient-to-r from-[#7c6af7]/10 to-transparent border border-[#7c6af7]/20 rounded-xl">
                    <h5 className="text-[#f1f5f9] font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[#a89bf9]">
                      <Sparkles className="w-4 h-4 text-[#9d8ffb] animate-pulse" />
                      <span>AI Run Summary</span>
                    </h5>
                    <p className="text-[#cbd5e1] text-sm leading-relaxed">{activeRun.result_summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Panel - History sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-[#e2e8f0]/[0.03] max-h-[600px] flex flex-col">
            <h2 className="text-[#f1f5f9] font-bold text-sm mb-4 flex items-center gap-2 shrink-0">
              <History className="w-4 h-4 text-[#7c6af7]" />
              <span>Execution History</span>
            </h2>

            {initialLoading ? (
              <div className="space-y-3 animate-pulse flex-1 overflow-y-auto">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-[#e2e8f0]/[0.015] border border-[#e2e8f0]/[0.03] rounded-xl" />
                ))}
              </div>
            ) : runs.length === 0 ? (
              <p className="text-[#64748b] text-xs text-center py-12 flex-1">No execution history found.</p>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {runs.map((r) => {
                  const isActive = activeRun?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => !loading && setActiveRun(r)}
                      disabled={loading}
                      className={`w-full text-left p-3.5 border rounded-xl transition-all duration-200 block cursor-pointer ${
                        isActive
                          ? "bg-[#7c6af7]/10 border-[#7c6af7]/40 shadow-[#7c6af7]/5 shadow-inner"
                          : "bg-[#e2e8f0]/[0.005] border-[#e2e8f0]/[0.03] hover:bg-[#e2e8f0]/[0.015] hover:border-[#e2e8f0]/[0.06]"
                      }`}
                    >
                      <p className={`text-xs font-bold truncate ${isActive ? "text-[#f1f5f9]" : "text-[#cbd5e1]"}`}>
                        "{r.input_prompt}"
                      </p>
                      <p className="text-[10px] text-[#64748b] mt-1.5 flex items-center justify-between">
                        <span>
                          {new Date(r.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short"
                          })}
                        </span>
                        <span className="font-semibold uppercase tracking-wider text-[8px] bg-[#e2e8f0]/0.02 px-1.5 py-0.5 rounded border border-[#e2e8f0]/[0.04]">
                          {r.actions_taken?.length ?? 0} actions
                        </span>
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Custom Action Logs Rendering ─────────────────────────────────────────

function renderActionResult(action: string, result: any) {
  if (!result) return "No details recorded.";

  switch (action) {
    case "plan":
      return (
        <div className="space-y-1">
          <p><span className="text-[#a89bf9]">Campaign:</span> {result.campaign_name}</p>
          <p><span className="text-[#a89bf9]">Target Segment:</span> {result.segment_prompt}</p>
          <p><span className="text-[#a89bf9]">Dispatch Channel:</span> <span className="uppercase">{result.channel}</span></p>
        </div>
      );
    case "segment_created":
      return (
        <div className="space-y-1">
          <p><span className="text-[#a89bf9]">ID:</span> {result.id}</p>
          <p><span className="text-[#a89bf9]">Name:</span> {result.name}</p>
          <p><span className="text-[#a89bf9]">Matched Customers:</span> {result.customer_count}</p>
          {result.filter_query && (
            <p><span className="text-[#a89bf9]">Filters:</span> {JSON.stringify(result.filter_query)}</p>
          )}
        </div>
      );
    case "message_generated":
      return (
        <div className="space-y-1">
          <p className="text-[#a89bf9]">Message Template:</p>
          <p className="italic text-gray-100 bg-[#070709] p-2.5 rounded-lg border border-white/[0.03] mt-1.5 font-sans whitespace-pre-wrap">
            "{result.template}"
          </p>
        </div>
      );
    case "campaign_created":
      return (
        <div className="space-y-1">
          <p><span className="text-[#a89bf9]">ID:</span> {result.id}</p>
          <p><span className="text-[#a89bf9]">Name:</span> {result.name}</p>
          <p><span className="text-[#a89bf9]">Channel:</span> <span className="uppercase">{result.channel}</span></p>
        </div>
      );
    case "campaign_launched":
      return (
        <div className="space-y-1 text-emerald-400 font-semibold">
          <p>✓ Campaign dispatched successfully!</p>
          <p>✓ Sent {result.messages_sent} personalized messages via API.</p>
        </div>
      );
    default:
      return typeof result === "object" ? JSON.stringify(result, null, 2) : String(result);
  }
}