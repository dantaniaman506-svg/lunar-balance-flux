import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandHeader } from "@/components/brand-header";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { fxConfirm, fxTap } from "@/lib/feedback";
import { ArrowLeft, Trash2, Clock, Upload, Loader2, Sparkles, X } from "lucide-react";
import { PAIRS } from "@/lib/pip-value";

export const Route = createFileRoute("/_authenticated/journal/$id")({
  component: JournalForm,
});

/* ─── Types ─────────────────────────────────────────────── */
type Entry = {
  id?: string;
  date: string;
  day?: string | null;
  pair?: string | null;
  lot_size?: number | null;
  direction?: string | null;
  session?: string | null;
  bias?: string | null;
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
  psych_before?: string | null;
  psych_during?: string | null;
  psych_after?: string | null;
};

/* ─── Constants ─────────────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10);
const dayName = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });
const RR_OPTIONS = ["1:1", "1:1.5", "1:2", "1:2.5", "1:3", "1:4", "1:5"];
const PSYCH_OPTIONS = ["Calm", "Confident", "Disciplined", "Focused", "Anxious", "Fearful", "Greedy", "Impatient", "Unconfident", "Hesitant", "Revenge Mode", "Overconfident"];
const PAIR_SYMBOLS = PAIRS.map((p) => p.symbol);

/* ─── Psych helpers ─────────────────────────────────────── */
function parsePsych(val: string | null): { preset: string; notes: string } {
  if (!val) return { preset: "", notes: "" };
  const idx = val.indexOf("|");
  if (idx === -1) {
    return PSYCH_OPTIONS.includes(val) ? { preset: val, notes: "" } : { preset: "", notes: val };
  }
  return { preset: val.slice(0, idx), notes: val.slice(idx + 1) };
}
function combinePsych(preset: string, notes: string): string | null {
  if (!preset && !notes) return null;
  if (!preset) return notes;
  if (!notes) return preset;
  return `${preset}|${notes}`;
}

/* ─── AI Analysis ───────────────────────────────────────── */
async function analyzeTradeImage(file: File): Promise<Partial<Entry>> {
  const key = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!key) throw new Error("NO_KEY");

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this trading screenshot from TradingView or MT5. Return ONLY valid JSON (no markdown), with these keys (use null if not visible):
{"pair":"e.g. EUR/USD","direction":"Buy or Sell","entry_price":number,"exit_price":number,"sl_pips":number,"target_pips":number,"entry_time":"HH:MM 24h","close_time":"HH:MM 24h","date":"YYYY-MM-DD","session":"Asia or London or New York","result":"Win or Loss","rr":"e.g. 1:2","lot_size":number}`,
            },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}`, detail: "high" } },
          ],
        },
      ],
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? "AI request failed");
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  let text = data.choices[0].message.content.trim();
  text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(text) as Partial<Entry>;
}

/* ─── Main Component ────────────────────────────────────── */
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

  const [form, setForm] = useState<Entry>({
    date: today(),
    day: dayName(today()),
    result: "Win",
    direction: "Buy",
    session: "London",
    pair: "EUR/USD",
    rr: "1:2",
    bias: "Bullish",
  });

  // Psych state (3 separate before/during/after)
  const [psychBefore, setPsychBefore] = useState({ preset: "", notes: "" });
  const [psychDuring, setPsychDuring] = useState({ preset: "", notes: "" });
  const [psychAfter, setPsychAfter] = useState({ preset: "", notes: "" });

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasOpenAiKey = !!import.meta.env.VITE_OPENAI_API_KEY;

  // Load existing entry
  useEffect(() => {
    if (existing) {
      const e = existing as Entry;
      setForm(e);
      if (e.psych_before) setPsychBefore(parsePsych(e.psych_before));
      if (e.psych_during) setPsychDuring(parsePsych(e.psych_during));
      if (e.psych_after) setPsychAfter(parsePsych(e.psych_after));
    }
  }, [existing]);

  // Auto-calc hold time from entry/close times
  useEffect(() => {
    if (form.entry_time && form.close_time) {
      const [eh, em] = form.entry_time.split(":").map(Number);
      const [ch, cm] = form.close_time.split(":").map(Number);
      let diff = (ch * 60 + cm) - (eh * 60 + em);
      if (diff < 0) diff += 24 * 60;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      setForm((f) => ({ ...f, hold_time: h > 0 ? `${h}h ${m}m` : `${m}m` }));
    }
  }, [form.entry_time, form.close_time]);

  function upd<K extends keyof Entry>(k: K, v: Entry[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Result change → auto-sign PnL
  function handleResultChange(result: string) {
    setForm((prev) => {
      const next: Entry = { ...prev, result };
      const pnl = Number(prev.pnl_usd);
      if (result === "Breakeven") next.pnl_usd = 0;
      else if (result === "Loss" && pnl > 0) next.pnl_usd = -Math.abs(pnl);
      else if (result === "Win" && pnl < 0) next.pnl_usd = Math.abs(pnl);
      return next;
    });
  }

  // PnL input → enforce sign
  function handlePnlChange(raw: string) {
    let v = Number(raw);
    if (form.result === "Loss" && v > 0) v = -v;
    if (form.result === "Win" && v < 0) v = Math.abs(v);
    upd("pnl_usd", v);
  }

  // Image upload handler
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  async function runAiAnalysis() {
    if (!imageFile) return;
    setAnalyzing(true);
    fxTap();
    try {
      const result = await analyzeTradeImage(imageFile);
      setForm((prev) => {
        const next = { ...prev };
        if (result.pair && PAIR_SYMBOLS.includes(result.pair)) next.pair = result.pair;
        if (result.direction) next.direction = result.direction;
        if (result.entry_price) next.entry_price = result.entry_price;
        if (result.exit_price) next.exit_price = result.exit_price;
        if (result.sl_pips) next.sl_pips = result.sl_pips;
        if (result.target_pips) next.target_pips = result.target_pips;
        if (result.entry_time) next.entry_time = result.entry_time;
        if (result.close_time) next.close_time = result.close_time;
        if (result.date) { next.date = result.date; next.day = dayName(result.date); }
        if (result.session) next.session = result.session;
        if (result.result) next.result = result.result;
        if (result.rr) next.rr = result.rr;
        if (result.lot_size) next.lot_size = result.lot_size;
        return next;
      });
      toast.success("Trade data extracted — review and confirm the fields");
    } catch (err) {
      if (err instanceof Error && err.message === "NO_KEY") {
        toast.error("Add VITE_OPENAI_API_KEY to your Replit secrets to enable AI analysis");
      } else {
        toast.error(err instanceof Error ? err.message : "Analysis failed");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) throw new Error("no session");
      const payload = {
        ...form,
        day: form.date ? dayName(form.date) : form.day,
        pnl_usd: Number(form.pnl_usd) || 0,
        user_id: s.session.user.id,
        psych_before: combinePsych(psychBefore.preset, psychBefore.notes),
        psych_during: combinePsych(psychDuring.preset, psychDuring.notes),
        psych_after: combinePsych(psychAfter.preset, psychAfter.notes),
        // SSR-removed fields kept null for DB compat
        market_structure: null,
        setup_type: null,
        screenshot_before_url: null,
        screenshot_after_url: null,
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
      toast.success("Trade saved");
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
            <button
              onClick={() => { fxTap(); if (confirm("Delete this entry?")) del.mutate(); }}
              className="p-2 text-muted-foreground hover:text-destructive"
            >
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

        {/* ── AI Trade Analysis Upload ─────────────────────── */}
        <Section title="AI Trade Analysis">
          <div className="space-y-3">
            {/* Upload area */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3.5 text-left transition hover:border-primary/70 hover:bg-primary/10 active:scale-[0.99]"
            >
              <Upload className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-semibold text-foreground">Upload trade screenshot</div>
                <div className="text-xs text-muted-foreground">
                  {hasOpenAiKey ? "AI will auto-fill trade data from the image" : "Preview image · Add VITE_OPENAI_API_KEY to enable AI fill"}
                </div>
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

            {/* Preview + Analyze */}
            {imagePreviewUrl && (
              <div className="relative">
                <img src={imagePreviewUrl} alt="Trade screenshot" className="w-full rounded-xl border border-border object-cover max-h-64" />
                <button
                  onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
                {hasOpenAiKey && (
                  <button
                    onClick={runAiAnalysis}
                    disabled={analyzing}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00A2FF] to-[#3B82F6] py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,162,255,0.4)] transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {analyzing ? "Analyzing…" : "Analyze with AI"}
                  </button>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="rounded-xl border border-border/60 bg-input/50 px-3 py-3">
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                📸 For Best AI Results
              </div>
              <ul className="space-y-1 text-[11px] text-muted-foreground">
                <li><span className="text-foreground/70 font-medium">TradingView:</span> Full chart screenshot showing the pair header, timeframe, trade markers (entry/SL/TP), and price levels</li>
                <li><span className="text-foreground/70 font-medium">MT5:</span> Include the trade confirmation window with entry price, SL, TP, lot size, and direction clearly visible</li>
                <li><span className="text-foreground/70 font-medium">Tip:</span> Ensure date/time is visible in the screenshot for automatic time detection</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* ── Trade Details ────────────────────────────────── */}
        <Section title="Trade">
          <Grid>
            <F label="Date">
              <input
                type="date"
                value={form.date}
                onChange={(e) => upd("date", e.target.value)}
                className={`${inp} [color-scheme:dark]`}
              />
            </F>
            <F label="Pair">
              <select value={form.pair ?? "EUR/USD"} onChange={(e) => upd("pair", e.target.value)} className={inp}>
                {PAIRS.map((p) => (
                  <option key={p.symbol} value={p.symbol} className="bg-card">{p.label}</option>
                ))}
              </select>
            </F>
            <F label="Direction">
              <select value={form.direction ?? "Buy"} onChange={(e) => upd("direction", e.target.value)} className={inp}>
                <option className="bg-card">Buy</option>
                <option className="bg-card">Sell</option>
              </select>
            </F>
            <F label="Session">
              <select value={form.session ?? "London"} onChange={(e) => upd("session", e.target.value)} className={inp}>
                {["Asia", "London", "New York", "Overlap"].map((s) => (
                  <option key={s} className="bg-card">{s}</option>
                ))}
              </select>
            </F>
            <F label="Lot Size">
              <input
                type="number"
                step="0.01"
                value={form.lot_size ?? ""}
                onChange={(e) => upd("lot_size", Number(e.target.value))}
                className={inp}
              />
            </F>
            <F label="Result">
              <select
                value={form.result ?? "Win"}
                onChange={(e) => handleResultChange(e.target.value)}
                className={inp}
              >
                <option className="bg-card">Win</option>
                <option className="bg-card">Loss</option>
                <option className="bg-card">Breakeven</option>
              </select>
            </F>
            <F label={`P&L (${form.result === "Loss" ? "−" : form.result === "Win" ? "+" : "±"}$)`}>
              <input
                type="number"
                step="0.01"
                value={form.pnl_usd ?? ""}
                onChange={(e) => handlePnlChange(e.target.value)}
                placeholder={form.result === "Loss" ? "e.g. -20" : "e.g. 45"}
                className={inp}
              />
            </F>
            <F label="Risk : Reward">
              <select value={form.rr ?? "1:2"} onChange={(e) => upd("rr", e.target.value)} className={inp}>
                {RR_OPTIONS.map((r) => (
                  <option key={r} value={r} className="bg-card">{r}</option>
                ))}
              </select>
            </F>
          </Grid>
        </Section>

        {/* ── Setup ───────────────────────────────────────── */}
        <Section title="Setup">
          <Grid>
            <F label="Bias Before Trade">
              <select value={form.bias ?? "Bullish"} onChange={(e) => upd("bias", e.target.value)} className={inp}>
                <option className="bg-card">Bullish</option>
                <option className="bg-card">Bearish</option>
                <option className="bg-card">Neutral</option>
              </select>
            </F>
            <F label="Entry Price">
              <input type="number" step="0.00001" value={form.entry_price ?? ""} onChange={(e) => upd("entry_price", Number(e.target.value))} className={inp} />
            </F>
            <F label="Exit Price">
              <input type="number" step="0.00001" value={form.exit_price ?? ""} onChange={(e) => upd("exit_price", Number(e.target.value))} className={inp} />
            </F>
            <F label="Target (pips)">
              <input type="number" value={form.target_pips ?? ""} onChange={(e) => upd("target_pips", Number(e.target.value))} className={inp} />
            </F>
            <F label="Stop Loss (pips)">
              <input type="number" value={form.sl_pips ?? ""} onChange={(e) => upd("sl_pips", Number(e.target.value))} className={inp} />
            </F>
          </Grid>

          {/* Time pickers on their own row */}
          <div className="mt-2 grid grid-cols-3 gap-2">
            <TimeInput label="Entry Time" value={form.entry_time ?? ""} onChange={(v) => upd("entry_time", v)} />
            <TimeInput label="Close Time" value={form.close_time ?? ""} onChange={(v) => upd("close_time", v)} />
            <div className="rounded-xl border border-border bg-input px-3 py-2">
              <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Hold Time</div>
              <div className="text-sm font-medium text-muted-foreground">{form.hold_time || "—"}</div>
            </div>
          </div>
        </Section>

        {/* ── Reflection ──────────────────────────────────── */}
        <Section title="Reflection">
          <Fw label="Mistakes">
            <textarea rows={3} value={form.mistakes ?? ""} onChange={(e) => upd("mistakes", e.target.value)} className={inp} placeholder="What went wrong?" />
          </Fw>
          <Fw label="Lessons Learned">
            <textarea rows={3} value={form.lessons ?? ""} onChange={(e) => upd("lessons", e.target.value)} className={inp} placeholder="What will you do differently?" />
          </Fw>
        </Section>

        {/* ── Psychology ──────────────────────────────────── */}
        <Section title="Psychology">
          <PsychField
            label="Before the Trade"
            state={psychBefore}
            onChange={setPsychBefore}
          />
          <PsychField
            label="During the Trade"
            state={psychDuring}
            onChange={setPsychDuring}
          />
          <PsychField
            label="After the Trade"
            state={psychAfter}
            onChange={setPsychAfter}
          />
        </Section>

        {/* Save button */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-black/90 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="w-full rounded-full bg-gradient-to-r from-[#00A2FF] to-[#3B82F6] py-4 font-bold text-white shadow-[0_0_35px_rgba(0,162,255,0.55)] transition active:scale-[0.98] disabled:opacity-60"
            >
              {save.isPending ? "Saving…" : isNew ? "Save & update graph" : "Update entry"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Psychology Field ───────────────────────────────────── */
function PsychField({
  label,
  state,
  onChange,
}: {
  label: string;
  state: { preset: string; notes: string };
  onChange: (s: { preset: string; notes: string }) => void;
}) {
  function togglePreset(opt: string) {
    fxTap();
    onChange({
      ...state,
      preset: state.preset === opt ? "" : opt,
    });
  }

  return (
    <div className="rounded-xl border border-border bg-input px-3 py-3">
      <div className="mb-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {PSYCH_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => togglePreset(opt)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 ${
              state.preset === opt
                ? "bg-primary text-primary-foreground glow-blue"
                : "bg-border/60 text-muted-foreground hover:bg-border"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        value={state.notes}
        onChange={(e) => onChange({ ...state, notes: e.target.value })}
        placeholder="Additional notes… (optional)"
        className="mt-2.5 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
      />
    </div>
  );
}

/* ─── Time Input ─────────────────────────────────────────── */
function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-xl border border-border bg-input px-3 py-2">
      <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 shrink-0 text-primary/70" />
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-medium outline-none [color-scheme:dark]"
        />
      </div>
    </div>
  );
}

/* ─── Layout helpers ─────────────────────────────────────── */
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
