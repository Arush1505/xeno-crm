const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    queued:    { label: "Queued",    color: "text-[#666]    bg-[#1a1a1a]   border-[#2a2a2a]" },
    sent:      { label: "Sent",      color: "text-[#60a5fa] bg-[#1e2a3a]   border-[#2a3a4a]" },
    delivered: { label: "Delivered", color: "text-[#34d399] bg-[#1a2e28]   border-[#2a3e38]" },
    failed:    { label: "Failed",    color: "text-[#f87171] bg-[#2e1a1a]   border-[#3e2a2a]" },
    opened:    { label: "Opened",    color: "text-[#a78bfa] bg-[#231e35]   border-[#332e45]" },
    read:      { label: "Read",      color: "text-[#c084fc] bg-[#271e35]   border-[#372e45]" },
    clicked:   { label: "Clicked",   color: "text-[#f59e0b] bg-[#2e2510]   border-[#3e3520]" },
  };
  
  export default function MessageStatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] ?? { label: status, color: "text-[#666] bg-[#1a1a1a] border-[#2a2a2a]" };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  }