import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fxTap } from "@/lib/feedback";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    fxTap();

    try {
      if (mode === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (signUpData.session) {
          // Email confirmation is OFF in Supabase → logged in instantly
          navigate({ to: "/onboarding" });
          return;
        }

        // Session is null → Supabase still has "Confirm email" ON
        // Try signing in anyway (works if user already exists / confirmed)
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!retryError && retryData.session) {
          navigate({ to: "/onboarding" });
          return;
        }

        // Account created but email not confirmed yet
        toast.error(
          "⚠️ Supabase pe 'Confirm email' ON hai. Supabase Dashboard → Authentication → Providers → Email → 'Confirm email' toggle OFF karo.",
          { duration: 10000 }
        );
      } else {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          // Give a clear Hindi+English message for common errors
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error(
              "Email confirm nahi hai. Supabase Dashboard → Authentication → Providers → Email → 'Confirm email' OFF karo.",
              { duration: 10000 }
            );
          } else if (
            error.message.toLowerCase().includes("invalid") ||
            error.message.toLowerCase().includes("credentials")
          ) {
            toast.error("Email ya password galat hai.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.session) {
          navigate({ to: "/home" });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kuch galat hua, dobara try karo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 h-20 w-20 overflow-hidden rounded-full bg-black ring-2 ring-primary/40 glow-blue">
            <img src="/wolf-logo.png" alt="Alpha Life" className="h-full w-full object-cover" />
          </div>
          <h1 className="font-display text-3xl font-bold">Alpha Life</h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Lead the Pack
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-6 glow-blue-soft">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="you@wolf.pack"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-[#00A2FF] to-[#3B82F6] py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(0,162,255,0.5)] transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="block w-full text-center text-xs text-muted-foreground hover:text-primary"
          >
            {mode === "login" ? "New here? Create account" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
