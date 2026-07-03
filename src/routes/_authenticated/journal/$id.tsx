import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandHeader } from "@/components/brand-header";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fxConfirm, fxTap } from "@/lib/feedback";
import { ArrowLeft, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/journal/$id")({
  component: JournalForm,
});

type Entry = {
  id?: string;
  date: string;
  day?: string | null;
  pair?: string | null;
  lot_size?: number | null;
  direction?: string | null;
  session?: string | null;
  market_structure?: string | null;
  bias?: string | null;
  setup_type?: string | null;
  entry_time?: string | null;
  close_time?: string | null;
  hold_time?: string | null;
  entry_price?: number | null;
  exit_price?: number | null;
  target_pips?: number | null;
  sl_pips?: number | null;
  rr?: string | null;
  result?: string | null;
  pnl_usd?: number | null;
  mistakes?: string | null;
  lessons?: string | null;
  screenshot_before_url?: string | null;
  screenshot_after_url?: string | null;
  psych_before?: string | null;
  psych_during?: string | null;
  psych_after?: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);
const dayName = (d: string) => new Date(d).toLocaleDateString("en-US", { weekday: "long" });

function JournalForm() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["journal", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data } = await supabase.from("journal_entries").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<Entry>({ date: today(), day: dayName(today()), result: "Win", direction: "Buy", session: "London" });

  useEffect(() => {
    if (existing) setForm(existing as Entry);
  }, [existing]);

  function upd<K extends keyof Entry>(k: K, v: Entry[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("no user");
      const payload = {
        ...form,
        day: form.date ? dayName(form.date) : form.day,
        pnl_usd: Number(form.pnl_usd) || 0,
        user_id: u.user.id,
      };
      if (isNew) {
        const { error } = await supabase.from("journal_entries").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("journal_entries").update(payload).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      fxConfirm();
      toast.success("Journal saved");
      qc.invalidateQueries({ queryKey: ["journal-list"] });
      qc.invalidateQueries({ queryKey: ["journal-list-full"] });
      nav({ to: "/journal" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (isNew) return;
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["journal-list"] });
      qc.invalidateQueries({ queryKey: ["journal-list-full"] });
      nav({ to: "/journal" });
    },
  });

  return (
    <div className="min-h-screen pb-32">
      <BrandHeader
        right={
          !isNew ? (
            <button onClick={() => { fxTap(); if (confirm("Delete this entry?")) del.mutate(); }} className="p-2 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />
      <main className="mx-auto max-w-3xl px-4 pt-4">
        <button onClick={() => nav({ to: "/journal" })} className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <h2 className="font-display text-2xl font-bold">{isNew ? "New Trade" : "Edit Trade"}</h2>

        <Section title="Trade">
          <Grid>
            <F label="Date"><input type="date" value={form.date} onChange={(e) => upd("date", e.target.value)} className={inp} /></F>
            <F label="Pair"><input value={form.pair ?? ""} onChange={(e) => upd("pair", e.target.value)} className={inp} placeholder="EUR/USD" /></F>
            <F label="Direction">
              <select value={form.direction ?? "Buy"} onChange={(e) => upd("direction", e.target.value)} className={inp}>
                <option className="bg-card">Buy</option><option className="bg-card">Sell</option>
              </select>
            </F>
            <F label="Session">
              <select value={form.session ?? "London"} onChange={(e) => upd("session", e.target.value)} className={inp}>
                {["Asia", "London", "New York", "Overlap"].map((s) => <option key={s} className="bg-card">{s}</option>)}
              </select>
            </F>
            <F label="Lot Size"><input type="number" step="0.01" value={form.lot_size ?? ""} onChange={(e) => upd("lot_size", Number(e.target.value))} className={inp} /></F>
            <F label="Result">
              <select value={form.result ?? "Win"} onChange={(e) => upd("result", e.target.value)} className={inp}>
                <option className="bg-card">Win</option><option className="bg-card">Loss</option><option className="bg-card">Breakeven</option>
              </select>
            </F>
            <F label="P&L ($)"><input type="number" step="0.01" value={form.pnl_usd ?? ""} onChange={(e) => upd("pnl_usd", Number(e.target.value))} className={inp} placeholder="e.g. 45 or -20" /></F>
            <F label="Risk : Reward"><input value={form.rr ?? ""} onChange={(e) => upd("rr", e.target.value)} className={inp} placeholder="1:2" /></F>
          </Grid>
        </Section>

        <Section title="Setup">
          <Grid>
            <F label="Market Structure"><input value={form.market_structure ?? ""} onChange={(e) => upd("market_structure", e.target.value)} className={inp} placeholder="HH+HL / LH+LL" /></F>
            <F label="Bias Before Trade"><input value={form.bias ?? ""} onChange={(e) => upd("bias", e.target.value)} className={inp} placeholder="Bullish / Bearish" /></F>
            <F label="Setup Type"><input value={form.setup_type ?? ""} onChange={(e) => upd("setup_type", e.target.value)} className={inp} placeholder="Asia Sweep / BOS" /></F>
            <F label="Entry Time"><input value={form.entry_time ?? ""} onChange={(e) => upd("entry_time", e.target.value)} className={inp} placeholder="09:45" /></F>
            <F label="Close Time"><input value={form.close_time ?? ""} onChange={(e) => upd("close_time", e.target.value)} className={inp} placeholder="10:30" /></F>
            <F label="Hold Time"><input value={form.hold_time ?? ""} onChange={(e) => upd("hold_time", e.target.value)} className={inp} placeholder="45m" /></F>
            <F label="Entry Price"><input type="number" step="0.00001" value={form.entry_price ?? ""} onChange={(e) => upd("entry_price", Number(e.target.value))} className={inp} /></F>
            <F label="Exit Price"><input type="number" step="0.00001" value={form.exit_price ?? ""} onChange={(e) => upd("exit_price", Number(e.target.value))} className={inp} /></F>
            <F label="Target (pips)"><input type="number" value={form.target_pips ?? ""} onChange={(e) => upd("target_pips", Number(e.target.value))} className={inp} /></F>
            <F label="Stop Loss (pips)"><input type="number" value={form.sl_pips ?? ""} onChange={(e) => upd("sl_pips", Number(e.target.value))} className={inp} /></F>
          </Grid>
        </Section>

        <Section title="Reflection">
          <Fw label="Mistakes"><textarea rows={3} value={form.mistakes ?? ""} onChange={(e) => upd("mistakes", e.target.value)} className={inp} /></Fw>
          <Fw label="Lessons Learned"><textarea rows={3} value={form.lessons ?? ""} onChange={(e) => upd("lessons", e.target.value)} className={inp} /></Fw>
          <Fw label="Screenshot Before (URL)"><input value={form.screenshot_before_url ?? ""} onChange={(e) => upd("screenshot_before_url", e.target.value)} className={inp} /></Fw>
          <Fw label="Screenshot After (URL)"><input value={form.screenshot_after_url ?? ""} onChange={(e) => upd("screenshot_after_url", e.target.value)} className={inp} /></Fw>
        </Section>

        <Section title="Psychology">
          <Fw label="Before the trade"><textarea rows={2} value={form.psych_before ?? ""} onChange={(e) => upd("psych_before", e.target.value)} className={inp} /></Fw>
          <Fw label="During the trade"><textarea rows={2} value={form.psych_during ?? ""} onChange={(e) => upd("psych_during", e.target.value)} className={inp} /></Fw>
          <Fw label="After the trade"><textarea rows={2} value={form.psych_after ?? ""} onChange={(e) => upd("psych_after", e.target.value)} className={inp} /></Fw>
        </Section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-black/90 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="w-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.75_0.18_230)] py-4 font-bold text-primary-foreground glow-blue-strong active:scale-[0.98]"
            >
              {save.isPending ? "Saving..." : isNew ? "Save & update graph" : "Update entry"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const inp = "w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/50";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-3xl bg-card p-4 glow-blue-soft">
      <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-primary">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-input px-3 py-2">
      <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
function Fw({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-input px-3 py-2">
      <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
