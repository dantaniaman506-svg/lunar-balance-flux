import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandHeader } from "@/components/brand-header";
import { BottomNav } from "@/components/bottom-nav";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useState } from "react";
import { fxTap } from "@/lib/feedback";
import { Flame, TrendingUp, TrendingDown, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function HomePage() {
  const qc = useQueryClient();
  const [showInr, setShowInr] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", s.session.user.id).single();
      return data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return null;
      const { data } = await supabase.from("user_settings").select("*").eq("user_id", s.session.user.id).single();
      return data;
    },
  });

  const { data: journal } = useQuery({
    queryKey: ["journal-list"],
    queryFn: async () => {
      const { data } = await supabase.from("journal_entries").select("date,pnl_usd,result").order("date");
      return data ?? [];
    },
  });

  const startBalance = Number(profile?.account_balance_usd ?? 0);
  const rate = Number(settings?.usd_to_inr_rate ?? 83.5);

  const byDate = new Map<string, number>();
  (journal ?? []).forEach((r) => {
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + Number(r.pnl_usd ?? 0));
  });
  const sortedDates = [...byDate.keys()].sort();
  let running = startBalance;
  const equity = sortedDates.map((d) => {
    running += byDate.get(d) ?? 0;
    return { date: d.slice(5), balance: Number(running.toFixed(2)) };
  });
  if (equity.length === 0) equity.push({ date: "Start", balance: startBalance });

  const currentBalance = equity[equity.length - 1].balance;
  const totalPnl = currentBalance - startBalance;
  const totalTrades = (journal ?? []).length;
  const wins = (journal ?? []).filter((r) => r.result === "Win").length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const pnlPositive = totalPnl >= 0;

  const balanceDisplay = showInr
    ? `₹${(currentBalance * rate).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : `$${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen pb-24">
      <BrandHeader />
      <main className="mx-auto max-w-3xl px-4 pt-6">
        {/* Greeting */}
        <div className="mb-1 text-sm text-muted-foreground">{greeting()},</div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl font-bold">{profile?.name || "Wolf"} 🐺</h2>
          {/* Plan badge */}
          <div className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
            <Zap className="h-3 w-3 fill-primary text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Free Plan</span>
          </div>
        </div>

        {/* Balance card */}
        <div className="mt-5 rounded-3xl bg-card p-6 glow-blue">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Account Balance</span>
            <button
              onClick={() => { fxTap(); qc.invalidateQueries({ queryKey: ["settings"] }); setShowInr((v) => !v); }}
              className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary"
            >
              {showInr ? "INR" : "USD"}
            </button>
          </div>
          <div className="mt-3 font-display text-4xl font-bold">{balanceDisplay}</div>
          <div className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${pnlPositive ? "text-success" : "text-destructive"}`}>
            {pnlPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {pnlPositive ? "+" : ""}${totalPnl.toFixed(2)}
            <span className="font-normal text-muted-foreground">all time</span>
          </div>
        </div>

        {/* Equity chart */}
        <div className="mt-4 rounded-3xl bg-card p-4 glow-blue-soft">
          <div className="mb-3 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Equity Curve</span>
            <span className="text-[10px] text-muted-foreground">{equity.length} pts</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer>
              <AreaChart data={equity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00A2FF" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#00A2FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={42} />
                <Tooltip
                  contentStyle={{ background: "#0a0a0a", border: "1px solid #1e2b4a", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "#888" }}
                />
                <ReferenceLine y={startBalance} stroke="#3B82F6" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Area type="monotone" dataKey="balance" stroke="#00A2FF" strokeWidth={2.5} fill="url(#eq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-card p-4 glow-blue-soft">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trades</div>
            <div className="mt-1 font-display text-2xl font-bold">{totalTrades}</div>
          </div>
          <div className="rounded-2xl bg-card p-4 glow-blue-soft">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Win Rate</div>
            <div className="mt-1 font-display text-2xl font-bold">{winRate}%</div>
          </div>
          <div className="rounded-2xl bg-card p-4 glow-blue-soft">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Flame className="h-3 w-3" />On Track
            </div>
            <div className={`mt-1 font-display text-2xl font-bold ${pnlPositive ? "text-primary" : "text-muted-foreground"}`}>
              {pnlPositive ? "Yes" : "—"}
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
