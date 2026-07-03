import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandHeader } from "@/components/brand-header";
import { BottomNav } from "@/components/bottom-nav";
import { useState } from "react";
import { toast } from "sonner";
import { fxTap, fxConfirm } from "@/lib/feedback";
import { LogOut, Plus, X, GripVertical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

const MAX_RULES = 25;

function SettingsPage() {
  const qc = useQueryClient();
  const nav = useNavigate();

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

  const { data: rules } = useQuery({
    queryKey: ["rules"],
    queryFn: async () => {
      const { data } = await supabase.from("strategy_rules").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const [name, setName] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [newRule, setNewRule] = useState("");

  const displayName = name || profile?.name || "";
  const displayBalance = balance || String(profile?.account_balance_usd ?? "");
  const displayRate = rate || String(settings?.usd_to_inr_rate ?? "83.5");
  const currency = settings?.currency_display ?? "usd";

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) throw new Error("no session");
      await supabase.from("profiles").update({
        name: displayName.trim(),
        account_balance_usd: Number(displayBalance) || 0,
      }).eq("id", s.session.user.id);
      await supabase.from("user_settings").update({
        usd_to_inr_rate: Number(displayRate) || 83.5,
      }).eq("user_id", s.session.user.id);
    },
    onSuccess: () => {
      fxConfirm();
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const toggleCurrency = useMutation({
    mutationFn: async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return;
      await supabase.from("user_settings").update({
        currency_display: currency === "usd" ? "inr" : "usd",
      }).eq("user_id", s.session.user.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  const addRule = useMutation({
    mutationFn: async () => {
      if (!newRule.trim()) return;
      if ((rules?.length ?? 0) >= MAX_RULES) throw new Error(`Max ${MAX_RULES} rules`);
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return;
      const nextOrder = (rules?.[rules.length - 1]?.sort_order ?? 0) + 1;
      await supabase.from("strategy_rules").insert({
        user_id: s.session.user.id,
        rule_text: newRule.trim(),
        sort_order: nextOrder,
      });
    },
    onSuccess: () => { setNewRule(""); qc.invalidateQueries({ queryKey: ["rules"] }); fxTap(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const delRule = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("strategy_rules").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rules"] }),
  });

  async function signOut() {
    fxTap();
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen pb-24">
      <BrandHeader
        right={
          <button
            onClick={signOut}
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            <LogOut className="h-3 w-3" />Sign out
          </button>
        }
      />
      <main className="mx-auto max-w-3xl space-y-5 px-4 pt-6">
        <h2 className="font-display text-2xl font-bold">Settings</h2>

        {/* Profile */}
        <div className="rounded-3xl bg-card p-4 glow-blue-soft">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Profile</h3>
          <div className="space-y-2">
            <F label="Name">
              <input value={displayName} onChange={(e) => setName(e.target.value)} className={inp} />
            </F>
            <F label="Account Balance ($)">
              <input type="number" step="0.01" value={displayBalance} onChange={(e) => setBalance(e.target.value)} className={inp} />
            </F>
            <F label="USD → INR rate">
              <input type="number" step="0.01" value={displayRate} onChange={(e) => setRate(e.target.value)} className={inp} />
            </F>
            <F label="Default currency">
              <button onClick={() => toggleCurrency.mutate()} className="text-sm font-semibold text-primary">
                {currency.toUpperCase()} · tap to switch
              </button>
            </F>
          </div>
          <button
            onClick={() => saveProfile.mutate()}
            className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground glow-blue active:scale-[0.98]"
          >
            Save profile
          </button>
        </div>

        {/* Strategy Rules */}
        <div className="rounded-3xl bg-card p-4 glow-blue-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Strategy Rules</h3>
            <span className="text-[10px] text-muted-foreground">{rules?.length ?? 0} / {MAX_RULES}</span>
          </div>
          <div className="space-y-1.5">
            {(rules ?? []).map((r, i) => (
              <div key={r.id} className="flex items-center gap-2 rounded-xl border border-border bg-input px-3 py-2.5">
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="w-5 shrink-0 text-xs font-bold text-muted-foreground">{i + 1}</span>
                <span className="flex-1 text-sm">{r.rule_text}</span>
                <button onClick={() => delRule.mutate(r.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {(rules?.length ?? 0) < MAX_RULES && (
            <div className="mt-3 flex gap-2">
              <input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && newRule.trim() && addRule.mutate()}
                placeholder="Add a rule…"
                className="flex-1 rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => addRule.mutate()}
                className="flex items-center gap-1 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground glow-blue active:scale-95"
              >
                <Plus className="h-4 w-4" />Add
              </button>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

const inp = "w-full bg-transparent text-sm font-semibold outline-none";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-input px-3 py-2">
      <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
