import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { Check, Crown, Zap } from "lucide-react";
import { fxConfirm } from "@/lib/feedback";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/plan")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: PlanPage,
});

const FREE_FEATURES = [
  "Daily strategy rules checklist (up to 25 rules)",
  "Position size calculator",
  "Full trade journal with AI analysis",
  "Equity curve dashboard",
  "Psychology mood tracking",
  "USD ↔ INR balance toggle",
  "Rule unlock & recheck",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Advanced win-rate analytics",
  "Multi-account tracking",
  "Export journal to PDF",
  "Cloud backup across devices",
  "Priority support",
];

function PlanPage() {
  const navigate = useNavigate();

  function startFree() {
    fxConfirm();
    navigate({ to: "/home" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 h-16 w-16 overflow-hidden rounded-full ring-2 ring-primary/40 glow-blue">
          <img src="/wolf-logo.png" alt="" className="h-full w-full object-cover" />
        </div>
        <h1 className="font-display text-3xl font-bold">Choose Your Plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">Start free. Upgrade when you're ready.</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Free plan */}
        <div className="rounded-3xl bg-card p-6 glow-blue ring-2 ring-primary/50">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 fill-primary text-primary" />
                <span className="font-display text-xl font-bold">Free</span>
              </div>
              <p className="mt-0.5 font-display text-2xl font-bold">
                $0<span className="text-sm font-normal text-muted-foreground">/forever</span>
              </p>
            </div>
            <span className="rounded-full bg-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              Your plan
            </span>
          </div>
          <ul className="mb-6 space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={startFree}
            className="w-full rounded-full bg-gradient-to-r from-[#00A2FF] to-[#3B82F6] py-3.5 font-bold text-white shadow-[0_0_35px_rgba(0,162,255,0.55)] transition active:scale-[0.98]"
          >
            Get Started Free →
          </button>
        </div>

        {/* Pro plan */}
        <div className="rounded-3xl bg-card p-6 glow-blue-soft opacity-65">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <span className="font-display text-xl font-bold">Pro</span>
              </div>
              <p className="mt-0.5 font-display text-2xl font-bold">
                $9<span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
            </div>
            <span className="rounded-full bg-yellow-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              Coming Soon
            </span>
          </div>
          <ul className="mb-6 space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <button
            disabled
            className="w-full cursor-not-allowed rounded-full bg-muted py-3.5 font-bold text-muted-foreground"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
