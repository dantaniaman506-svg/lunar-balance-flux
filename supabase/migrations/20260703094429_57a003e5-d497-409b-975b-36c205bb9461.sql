
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  experience TEXT,
  account_balance_usd NUMERIC NOT NULL DEFAULT 0,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- strategy_rules
CREATE TABLE public.strategy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategy_rules TO authenticated;
GRANT ALL ON public.strategy_rules TO service_role;
ALTER TABLE public.strategy_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rules" ON public.strategy_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- daily_checklist
CREATE TABLE public.daily_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.strategy_rules ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, rule_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_checklist TO authenticated;
GRANT ALL ON public.daily_checklist TO service_role;
ALTER TABLE public.daily_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own checks" ON public.daily_checklist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- journal_entries
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  day TEXT,
  pair TEXT,
  lot_size NUMERIC,
  direction TEXT,
  session TEXT,
  market_structure TEXT,
  bias TEXT,
  setup_type TEXT,
  entry_time TEXT,
  close_time TEXT,
  hold_time TEXT,
  entry_price NUMERIC,
  exit_price NUMERIC,
  target_pips NUMERIC,
  sl_pips NUMERIC,
  rr TEXT,
  result TEXT,
  pnl_usd NUMERIC NOT NULL DEFAULT 0,
  mistakes TEXT,
  lessons TEXT,
  screenshot_before_url TEXT,
  screenshot_after_url TEXT,
  psych_before TEXT,
  psych_during TEXT,
  psych_after TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal" ON public.journal_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_settings
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  currency_display TEXT NOT NULL DEFAULT 'usd',
  usd_to_inr_rate NUMERIC NOT NULL DEFAULT 83.5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_journal_updated BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- signup trigger: seed profile, settings, default strategy rules
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  default_rules TEXT[] := ARRAY[
    'Mark Asia, London, and New York session highs/lows with a session range indicator.',
    'On the 4H chart, check structure: HH+HL = bullish bias, LH+LL = bearish bias.',
    'Wait for the Asia session to close.',
    'If bias is bearish, wait for price to sweep the Asia session high.',
    'If bias is bullish, wait for price to sweep the Asia session low.',
    'If no sweep happens, skip the trade for the day.',
    'On the 5-minute chart, wait for a break of structure in the bias direction.',
    'Enter the trade right after the break of structure candle closes.',
    'For shorts, place stop loss just above the recent swing high.',
    'For longs, place stop loss just below the recent swing low.',
    'Set target at 1:2 risk-reward minimum.',
    'Risk no more than 2% of account per trade.',
    'Move stop loss to breakeven once price hits 1:1.',
    'Only take entries within the first hour after Asia close / London open.',
    'Exit or stop watching the trade by your fixed cutoff time, win or lose.'
  ];
  i INTEGER;
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  FOR i IN 1..array_length(default_rules, 1) LOOP
    INSERT INTO public.strategy_rules (user_id, rule_text, sort_order)
    VALUES (NEW.id, default_rules[i], i);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
