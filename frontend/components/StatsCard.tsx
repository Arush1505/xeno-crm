import { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
  icon?: LucideIcon;
};

export default function StatsCard({ label, value, sub, accent = false, icon: Icon }: Props) {
  return (
    <div
      className={`
        rounded-xl p-6 transition-all duration-300 glass-card glass-card-hover relative overflow-hidden group
        ${accent ? "border-[#7c6af7]/30 bg-gradient-to-br from-[#7c6af7]/10 to-transparent" : ""}
      `}
    >
      {/* Decorative Glow */}
      {accent && (
        <div className="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-[#7c6af7]/20 blur-xl group-hover:bg-[#7c6af7]/30 transition-all duration-300" />
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#94a3b8] text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
          <p className={`text-3xl font-bold tabular-nums tracking-tight ${accent ? "text-[#9d8ffb]" : "text-[#f1f5f9]"}`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`
            p-2.5 rounded-lg border shrink-0 transition-colors duration-300
            ${accent 
              ? "bg-[#7c6af7]/20 border-[#7c6af7]/30 text-[#9d8ffb]" 
              : "bg-[#e2e8f0]/[0.01] border-[#e2e8f0]/[0.03] text-[#94a3b8] group-hover:text-[#7c6af7] group-hover:border-[#7c6af7]/30"
            }
          `}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {sub && <p className="text-[#64748b] text-xs mt-2">{sub}</p>}
    </div>
  );
}