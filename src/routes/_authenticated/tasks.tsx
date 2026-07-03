import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandHeader } from "@/components/brand-header";
import { BottomNav } from "@/components/bottom-nav";
import { Check, Copy, Lock, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { fxCheck, fxUncheck, fxConfirm, fxTap } from "@/lib/feedback";
import { PAIRS, calcLotSize } from "@/lib/pip-value";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function TasksPage() {
  const qc = useQueryClient();
  const [pending, setPending] = useState<Set<string>>(new Set());

  const { data: rules } = useQuery({
    queryKey: ["rules"],
    queryFn: async () => {
      const { data } = await supabase.from("strategy_rules").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: checks } = useQuery({
    queryKey: ["checks", todayStr()],
    queryFn: async () => {
      const { data } = await supabase.from("daily_checklist").select("*").eq("date", todayStr());
      return data ?? [];
    },
  });

  const checkedIds = useMemo(() => new Set((checks ?? []).map((c) => c.rule_id)), [checks]);

  function toggle(ruleId: string) {
    if (checkedIds.has(ruleId)) return; // locked once confirmed
    const next = new Set(pending);
    if (next.has(ruleId)) { next.delete(ruleId); fxUncheck(); }
    else { next.add(ruleId); fxCheck(); }
    setPending(next);
  }

  const confirmMut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("no user");
      const rows = [...pending].map((rule_id) => ({ user_id: u.user!.id, rule_id, date: todayStr() }));
      const { error } = await supabase.from("daily_checklist").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      fxConfirm();
      toast.success(`${pending.size} check${pending.size > 1 ? "s" : ""} locked in`);
      setPending(new Set());
      qc.invalidateQueries({ queryKey: ["checks"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="min-h-screen pb-40">
      <BrandHeader />
      <main className="mx-auto max-w-3xl px-4 pt-6">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-bold">Today's Rules</h2>
          <p className="text-xs text-muted-foreground">
            {checkedIds.size} / {rules?.length ?? 0} locked · {pending.size} pending
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-card glow-blue-soft">
          {(rules ?? []).map((rule, i) => {
            const isLocked = checkedIds.has(rule.id);
            const isPending = pending.has(rule.id);
            return (
              <button
                key={rule.id}
                onClick={() => toggle(rule.id)}
                disabled={isLocked}
                className={`flex w-full items-center gap-3 border-b border-border/60 px-4 py-3.5 text-left transition last:border-b-0 ${
                  isPending ? "bg-primary/10" : ""
                }`}
              >
                <div className="w-6 shrink-0 text-center text-xs font-bold text-muted-foreground">{i + 1}</div>
                <div className="flex-1">
                  <div className={`text-sm leading-snug ${isLocked ? "text-muted-foreground line-through" : isPending ? "text-primary font-medium" : "text-foreground"}`}>
                    {rule.rule_text}
                  </div>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  isLocked ? "bg-primary text-primary-foreground" :
                  isPending ? "bg-primary text-primary-foreground glow-blue" :
                  "border border-border text-muted-foreground"
                }`}>
                  {isLocked ? <Lock className="h-4 w-4" /> : isPending ? <Check className="h-4 w-4" /> : <Check className="h-4 w-4 opacity-30" />}
                </div>
              </button>
            );
          })}
          {(rules ?? []).length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No rules yet. Add some in Settings.</div>
          )}
        </div>

        <PositionCalculator />
      </main>

      {/* Sticky confirm bar */}
      {pending.size > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-50 px-4 pb-3">
          <div className="mx-auto max-w-3xl">
            <button
              onClick={() => confirmMut.mutate()}
              disabled={confirmMut.isPending}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-[oklch(0.75_0.18_230)] py-4 font-bold text-primary-foreground glow-blue-strong transition active:scale-[0.98]"
            >
              <Zap className="h-5 w-5 fill-current" />
              <span>Confirm {pending.size} check{pending.size > 1 ? "s" : ""}</span>
              <span className="text-xs opacity-80">· locks selection</span>
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function PositionCalculator() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("account_balance_usd").eq("id", u.user.id).single();
      return data;
    },
  });

  const [balance, setBalance] = useState<string>("");
  const [risk, setRisk] = useState<string>("1");
  const [slPips, setSlPips] = useState<string>("20");
  const [pairSym, setPairSym] = useState<string>("EUR/USD");

  const effBalance = Number(balance || profile?.account_balance_usd || 0);
  const pair = PAIRS.find((p) => p.symbol === pairSym) ?? PAIRS[0];
  const lots = calcLotSize({ balance: effBalance, riskPct: Number(risk), slPips: Number(slPips), pair });
  const riskUsd = effBalance * (Number(risk) / 100);

  async function copy() {
    fxTap();
    try {
      await navigator.clipboard.writeText(String(lots));
      toast.success(`Copied ${lots} lots`);
    } catch { toast.error("Copy failed"); }
  }

  return (
    <div className="mt-6 rounded-3xl bg-card p-5 glow-blue">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Position Size</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Calculator</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Balance ($)">
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder={String(profile?.account_balance_usd ?? 0)}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </Field>
        <Field label="Risk %">
          <div className="flex items-center gap-1">
            {["0.5", "1", "2"].map((v) => (
              <button
                key={v}
                onClick={() => { fxTap(); setRisk(v); }}
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${risk === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >{v}</button>
            ))}
            <input
              type="number"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </div>
        </Field>
        <Field label="Stop-loss (pips)">
          <input
            type="number"
            value={slPips}
            onChange={(e) => setSlPips(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          />
        </Field>
        <Field label="Pair">
          <select
            value={pairSym}
            onChange={(e) => { fxTap(); setPairSym(e.target.value); }}
            className="w-full bg-transparent text-sm font-semibold outline-none"
          >
            {PAIRS.map((p) => <option key={p.symbol} value={p.symbol} className="bg-card">{p.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/30">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Lot Size</div>
          <div className="font-display text-3xl font-bold text-primary">{lots.toFixed(2)}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">Risk: ${riskUsd.toFixed(2)}</div>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground glow-blue active:scale-95"
        >
          <Copy className="h-3.5 w-3.5" />Copy
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-input px-3 py-2">
      <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
