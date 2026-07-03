# Alpha Life — Trading Discipline App

Pure black + electric blue aesthetic (matching the Alpha Life habit-tracker screenshots), with the white wolf logo, mobile-first but responsive, subtle button sounds + haptic vibration on confirm/check actions.

## Backend (Lovable Cloud)

Enable Lovable Cloud for auth + database.

**Auth:** Email + password only (simple signup/login, no OAuth).

**Tables:**
- `profiles` — id (auth.users), name, experience, account_balance_usd, created_at
- `strategy_rules` — id, user_id, rule_text, sort_order (default strategy seeded on signup; max 15 rules)
- `daily_checklist` — id, user_id, date, rule_id, checked_at (one row per rule per day)
- `journal_entries` — id, user_id, date, day, pair, lot_size, direction (buy/sell), session, market_structure, bias, setup_type, entry_time, close_time, hold_time, entry_price, exit_price, target_pips, sl_pips, rr, result (win/loss), pnl_usd, mistakes, lessons, screenshot_before_url, screenshot_after_url, psych_before, psych_during, psych_after
- `settings` — id, user_id, currency_display (usd/inr), usd_to_inr_rate

RLS on all tables (user sees only own rows). Trigger auto-creates profile + seeds default 17 EUR/USD Asia Sweep rules on signup.

## Screens (routes)

1. **`/auth`** — Login / Signup toggle. Pure black, wolf logo top, electric blue CTA with glow.
2. **`/onboarding`** — 3 steps for new users: Name → Account Balance (USD) → Experience (Beginner/Intermediate/Advanced). Skips if already completed.
3. **`/`** (Home / Dashboard) — Greeting ("Good morning, {name}"), account balance USD with INR toggle, equity curve line chart (day-by-day, moves up on profit / down on loss, computed from journal P&L), streak / stats cards. Bottom nav: Home, Tasks, Journal, Money, Rules, Stats, Goals.
4. **`/tasks`** (Rules Checklist) — Today's strategy rules as blue-glow checklist items (styled like the habit tracker screenshot with time-free rows). Each check = sound + vibration. Below the checklist: **Position Size Calculator** card.
5. **`/journal`** — List of past entries + "New Entry" button opening the full journal form (all fields above + Psychology section). On save → recomputes today's P&L and updates dashboard graph.
6. **`/journal/$id`** — View / edit entry.
7. **`/settings`** — Edit account balance, currency toggle (USD/INR + rate), edit strategy rules (add/remove/reorder, max 15 custom + defaults shown), edit profile name, sign out.

## Position Size Calculator (on `/tasks`, directly under checklist)

Inputs: Account balance (prefilled from profile, editable), Risk % (1%, 2%, custom), Stop-loss pips, Pair dropdown (EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, NZD/USD, XAU/USD Gold, BTC/USD, ETH/USD, SOL/USD).

Output: **Lot size** (standard lots, 2 decimals) big and copyable with one-tap copy button. Formula uses per-pair pip value (JPY pairs pip=0.01, Gold pip=0.1, BTC pip=1, others=0.0001) → `lots = (balance × risk%) / (sl_pips × pip_value_per_lot)`.

Compact card, no wasted space.

## Confirm Bar

Sticky bottom "Confirm N checks" pill button with electric-blue glow (like screenshot 3) appears when unsaved checks exist. Tap → locks selection for the day + sound + vibration.

## Default Strategy Rules (seeded)

All 17 EUR/USD Asia Sweep rules from the prompt, one-liner each, editable in Settings (up to 15 custom rules total after defaults; user can delete defaults).

## Design System

- Background: pure `#000000`
- Surface: `#0a0a0a` with subtle blue glow borders (`box-shadow: 0 0 20px rgba(59,130,246,0.15)`)
- Primary (electric blue): `oklch(0.65 0.22 250)` ≈ `#3B82F6` → `#00A2FF` gradient
- Text: white / muted gray
- Font: Inter (body) + Space Grotesk (headings) — bold, spacious, "LEAD THE PACK" tracking-widest style
- Rounded 2xl cards, generous padding, glow on active/checked states
- Wolf logo (uploaded) shown in header via lovable-assets
- Sound: short click + confirm chime (Web Audio API generated tones, no external files)
- Vibration: `navigator.vibrate([10])` on check, `[20,40,20]` on confirm
- Fully responsive; mobile-first layout, works on laptop with max-width container

## Tech Notes

- TanStack Start routes under `_authenticated/` for all app screens; `/auth` and `/onboarding` public (onboarding gated by profile completeness check)
- TanStack Query for journal + checklist + rules
- Recharts for equity line chart
- Wolf logo uploaded via `lovable-assets create` from `/mnt/user-uploads/456f3345bc70bdcd6e05692446f9cff8.jpg`
- Sound + haptic helper in `src/lib/feedback.ts`

## Build Order

1. Enable Cloud + migrations (tables, RLS, trigger, seed rules)
2. Design tokens in `styles.css` (black + electric blue)
3. Auth pages + onboarding
4. Layout shell (header with wolf logo + greeting, bottom nav)
5. Rules checklist + confirm bar + sound/haptics
6. Position size calculator
7. Journal form + list
8. Dashboard equity chart + balance
9. Settings (balance, currency, custom rules)
