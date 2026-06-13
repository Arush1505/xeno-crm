type DashboardData = {
    total_customers: number;
    total_orders: number;
    total_campaigns: number;
    total_messages: number;
    status_breakdown: Record<string, number>;
    total_attributed_orders: number;
    recent_campaigns: {
      id: string;
      name: string;
      status: string;
      channel: string;
      sent_at: string | null;
    }[];
  };
  
  type Customer = {
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
  };
  
  type Segment = {
    id: string;
    name: string;
    description: string | null;
    filter_query: Record<string, unknown> | null;
    created_by_ai: boolean;
    created_at: string;
    customer_count: number | null;
  };
  
  type Campaign = {
    id: string;
    name: string;
    segment_id: string;
    channel: "whatsapp" | "sms" | "email" | "rcs";
    message_template: string;
    status: "draft" | "running" | "completed";
    created_at: string;
    sent_at: string | null;
  };
  
  type CampaignStats = {
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
  };
  
  type Message = {
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
  };
  
  type AgentRun = {
    id: string;
    input_prompt: string;
    actions_taken: { action: string; result: unknown; timestamp: string }[] | null;
    result_summary: string | null;
    created_at: string;
  };