const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: () => request<DashboardData>("/api/dashboard"),

  // Customers
  getCustomers: () => request<Customer[]>("/api/customers"),

  // Segments
  getSegments: () => request<Segment[]>("/api/segments"),
  createSegment: (data: object) => request<Segment>("/api/segments", { method: "POST", body: JSON.stringify(data) }),
  aiGenerateSegment: (prompt: string) => request<Segment>("/api/segments/ai-generate", { method: "POST", body: JSON.stringify({ prompt }) }),

  // Campaigns
  getCampaigns: () => request<Campaign[]>("/api/campaigns"),
  getCampaign: (id: string) => request<Campaign>(`/api/campaigns/${id}`),
  createCampaign: (data: object) => request<Campaign>("/api/campaigns", { method: "POST", body: JSON.stringify(data) }),
  launchCampaign: (id: string) => request<Campaign>(`/api/campaigns/${id}/launch`, { method: "POST" }),
  getCampaignStats: (id: string) => request<CampaignStats>(`/api/campaigns/${id}/stats`),
  getCampaignMessages: (id: string) => request<Message[]>(`/api/campaigns/${id}/messages`),

  // Agent
  runAgent: (prompt: string) => request<AgentRun>("/api/agent/run", { method: "POST", body: JSON.stringify({ prompt }) }),
  getAgentRuns: () => request<AgentRun[]>("/api/agent/runs"),
};