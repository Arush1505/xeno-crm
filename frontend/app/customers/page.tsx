"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Search, X, Calendar, User, Mail, Phone } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    api.getCustomers()
      .then((res) => setCustomers(res as unknown as Customer[]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q)  ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#f1f5f9]">Customers</h1>
        <p className="text-[#94a3b8] text-sm mt-1">
          {loading ? "Loading shoppers..." : `${customers.length.toLocaleString()} shoppers in your database`}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-6 group">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] transition-colors group-focus-within:text-[#7c6af7]">
          <Search className="w-4.5 h-4.5" />
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shoppers by name, email, or phone number..."
          className="w-full bg-[#121422]/80 border border-[#e2e8f0]/[0.03] focus:border-[#7c6af7] focus:ring-2 focus:ring-[#7c6af7]/20 rounded-xl pl-11 pr-10 py-3 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none transition-all duration-200"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#e2e8f0]/0.04 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#e2e8f0]/[0.04] rounded-2xl bg-[#e2e8f0]/[0.005]">
          <p className="text-[#64748b] text-sm">
            {search ? `No customers matching "${search}"` : "No customers found. Populate database using your backend seed script."}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-[#e2e8f0]/[0.03] shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#e2e8f0]/[0.03] bg-[#e2e8f0]/[0.005]">
                  <th className="px-6 py-4 text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Shopper</th>
                  <th className="px-6 py-4 text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Email Address</th>
                  <th className="px-6 py-4 text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-4 text-[#94a3b8] text-xs font-semibold uppercase tracking-wider">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]/[0.02]">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-[#e2e8f0]/[0.01] transition-colors duration-150"
                  >
                    {/* Avatar + Name */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <span className="text-[#f1f5f9] font-medium text-sm tracking-tight">{c.name}</span>
                      </div>
                    </td>
                    
                    {/* Email */}
                    <td className="px-6 py-4.5 text-[#cbd5e1]">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#64748b]" />
                        <span className="truncate max-w-[200px]">{c.email}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4.5 text-[#94a3b8] font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#64748b]" />
                        <span>{c.phone}</span>
                      </div>
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4.5 text-[#94a3b8] text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#64748b]" />
                        <span>
                          {new Date(c.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {search && (
            <div className="px-6 py-3 bg-[#e2e8f0]/[0.005] border-t border-[#e2e8f0]/[0.03]">
              <p className="text-[#64748b] text-xs font-medium">
                Showing {filtered.length} of {customers.length} shopper records
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Avatar Component
// ─────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Deterministic colors with modern gradient schemes
  const gradients = [
    "from-indigo-500/20 to-[#7c6af7]/20 text-indigo-300 border-indigo-500/20",
    "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/20",
    "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/20",
    "from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/20",
    "from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/20",
  ];
  const gradient = gradients[name.charCodeAt(0) % gradients.length];

  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-tr border flex items-center justify-center text-xs font-semibold shrink-0 shadow-inner ${gradient}`}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────
// Skeleton Component
// ─────────────────────────────────────────

function Skeleton() {
  return (
    <div className="glass-card border border-[#e2e8f0]/[0.03] rounded-2xl overflow-hidden animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4.5 border-b border-[#e2e8f0]/[0.02] last:border-0">
          <div className="w-8 h-8 bg-[#e2e8f0]/[0.015] rounded-full" />
          <div className="h-4.5 bg-[#e2e8f0]/[0.015] rounded w-36" />
          <div className="h-4.5 bg-[#e2e8f0]/[0.015] rounded w-48 ml-auto" />
          <div className="h-4.5 bg-[#e2e8f0]/[0.015] rounded w-28" />
        </div>
      ))}
    </div>
  );
}