# Alpha Life — Trading Discipline App

A mobile-first trading discipline app built with TanStack Start (SSR), React 19, Supabase (auth + database), and Tailwind CSS v4. Pure black + electric blue aesthetic.

## Running the app

```bash
bun run dev
```

The dev server runs on **port 5000** (configured in `vite.config.ts`). Workflow: **Start application**.

## Stack

- **Framework**: TanStack Start (SSR) + TanStack Router (file-based routing)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui (Radix UI primitives)
- **Backend/Auth/DB**: Supabase (email+password auth, PostgreSQL with RLS)
- **Package manager**: Bun
- **Build**: Vite 8 via `@lovable.dev/vite-tanstack-config`

## Project structure

```
src/
  routes/          # File-based routes (TanStack Router)
    __root.tsx     # Root layout
    index.tsx      # Dashboard / home
    _authenticated/ # Auth-gated routes
    auth.tsx       # Login / signup
    onboarding.tsx # New-user onboarding (3 steps)
  integrations/
    supabase/      # Supabase client + auth helpers
  components/      # Reusable UI components
  hooks/           # Custom React hooks
  lib/             # Utilities, error page
supabase/
  migrations/      # Database migrations (run via Supabase CLI)
```

## Key routes

| Route | Description |
|-------|-------------|
| `/auth` | Login / signup (email + password) |
| `/onboarding` | New-user onboarding (name, balance, experience) |
| `/` | Dashboard — greeting, equity curve, stats |
| `/tasks` | Daily rule checklist + position size calculator |
| `/journal` | Trade journal list + entry form |
| `/settings` | Profile, rules, currency, account balance |

## Environment variables

Set in Replit Secrets / env vars:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
- `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` — server-side equivalents
- `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` — project ID

## User preferences

- Keep existing stack and structure — do not migrate or restructure without explicit request.
