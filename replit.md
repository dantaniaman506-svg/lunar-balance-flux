# Alpha Life — Trading Discipline App

Mobile-first trading discipline Vite SPA. Stack: React 19 + TanStack Router, Supabase (auth + DB), Tailwind CSS v4, shadcn/ui.

## Running the app

```bash
bun run dev        # dev server → http://localhost:5000
bun run build      # production build → dist/
```

Workflow: **Start application** (`bun run dev`, port 5000).

## Stack

| Layer | Tech |
|---|---|
| Framework | Vite SPA (pure client-side, no SSR) |
| Routing | TanStack Router (file-based, SPA mode) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (Radix UI) |
| Backend/Auth/DB | Supabase (email+password auth, PostgreSQL + RLS) |
| Package manager | Bun |

## Project structure

```
index.html          ← SPA entry point
src/
  main.tsx          ← React DOM render
  router.tsx        ← TanStack Router setup
  routes/
    __root.tsx      ← Root layout (QueryClientProvider, auth listener)
    index.tsx       ← Redirects to /home
    auth.tsx        ← Login / signup (redirects to /home if already logged in)
    onboarding.tsx  ← 3-step new-user onboarding → /plan
    plan.tsx        ← Pricing page (Free + Pro Coming Soon) → /home
    _authenticated/ ← Auth-guarded routes
      route.tsx     ← Guard: no session → /auth, not onboarded → /onboarding
      home.tsx      ← Dashboard (equity curve, stats, Free Plan badge)
      tasks.tsx     ← Daily rules checklist + position size calculator
      journal/
        index.tsx   ← Trade list
        $id.tsx     ← Journal form (AI upload, dropdowns, time picker, psych presets)
      settings.tsx  ← Profile, rules (max 25), currency toggle
  components/
    brand-header.tsx   ← Sticky top bar with wolf logo
    bottom-nav.tsx     ← Fixed bottom navigation
  integrations/supabase/
    client.ts       ← Supabase client (SPA, no process.env)
    types.ts        ← Auto-generated DB types
  lib/
    pip-value.ts    ← PAIRS list + lot size calculator
    feedback.ts     ← Audio/haptic tap/confirm effects
supabase/migrations/ ← Applied to Supabase project
public/
  wolf-logo.png    ← White wolf logo image
```

## Key features

- **Daily rules checklist** — check/confirm/lock rules; long-press a locked rule to unlock it
- **18 default strategy rules** (EUR/USD Asia Sweep) seeded on signup, up to 25 total
- **Position size calculator** — pair dropdown, risk%, SL pips → lot size
- **Journal form** — pair/R:R/bias dropdowns, clock time picker, auto-signed PnL, auto-calculated hold time, psychology mood chips + notes, AI trade photo analysis (optional)
- **AI trade analysis** — upload TradingView/MT5 screenshot → GPT-4o auto-fills trade fields
- **Equity curve** — area chart built from journal P&L entries
- **Plan page** — Free plan (active) + Pro coming soon; shown once after onboarding
- **Persistent login** — Supabase session persisted in localStorage; no re-login on refresh
- **Plan badge** on dashboard

## Environment variables

Set in Replit env vars:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key

Optional (for AI trade analysis):
- `VITE_OPENAI_API_KEY` — GPT-4o Vision key. **Note:** `VITE_*` vars are bundled into the client JS and visible in DevTools. Since this is a personal app, use a rate-limited/scoped OpenAI key.

## User preferences

- Keep existing stack and structure — do not migrate without explicit request.
- Rules max: 25 (DB has no hard limit; enforced in UI only).
- AI trade analysis is optional — app fully works without an OpenAI key.
