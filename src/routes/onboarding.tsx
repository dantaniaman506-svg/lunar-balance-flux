import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fxTap, fxConfirm } from "@/lib/feedback";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    const { data: p } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", data.session.user.id)
      .maybeSingle();
    if (p?.onboarded) throw redirect({ to: "/home" });
  },
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [experience, setExperience] = useState("");
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("No session");
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          account_balance_usd: Number(balance) || 0,
          experience,
          onboarded: true,
        })
        .eq("id", sessionData.session.user.id);
      if (error) throw error;
      fxConfirm();
      navigate({ to: "/plan" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const next = () => { fxTap(); setStep((s) => s + 1); };
  const canNext =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && Number(balance) >= 0 && balance !== "") ||
    (step === 2 && experience.length > 0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center">
          <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-primary/40 glow-blue">
            <img src="/wolf-logo.png" className="h-full w-full object-cover" alt="" />
          </div>
        </div>
        <div className="mb-6 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 w-8 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <div className="rounded-3xl bg-card p-6 glow-blue-soft">
          {step === 0 && (
            <>
              <h2 className="font-display text-2xl font-bold">What's your name?</h2>
              <p className="mt-1 text-sm text-muted-foreground">We'll greet you every day.</p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canNext && next()}
                className="mt-6 w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="Your name"
              />
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="font-display text-2xl font-bold">Account balance</h2>
              <p className="mt-1 text-sm text-muted-foreground">Trading capital in USD. Editable later.</p>
              <div className="mt-6 flex items-center rounded-xl border border-border bg-input px-4">
                <span className="text-lg text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full bg-transparent px-2 py-3 text-lg outline-none"
                  placeholder="1000"
                />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="font-display text-2xl font-bold">Your experience?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Helps us tune your defaults.</p>
              <div className="mt-6 space-y-2">
                {["Beginner", "Intermediate", "Advanced"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { fxTap(); setExperience(opt); }}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      experience === opt
                        ? "border-primary bg-primary/10 text-primary glow-blue-soft"
                        : "border-border bg-input text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            disabled={!canNext || saving}
            onClick={step === 2 ? finish : next}
            className="mt-8 w-full rounded-full bg-gradient-to-r from-[#00A2FF] to-[#3B82F6] py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(0,162,255,0.5)] transition active:scale-[0.98] disabled:opacity-40"
          >
            {saving ? "..." : step === 2 ? "Continue to Plans" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
