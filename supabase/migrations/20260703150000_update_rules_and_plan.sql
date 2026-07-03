-- Update handle_new_user with all 18 strategy rules (replaces existing 15-rule version)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  default_rules TEXT[] := ARRAY[
    'Mark Asia, London, and New York session highs/lows with a session range indicator.',
    'On the 4H chart, check structure: higher highs + higher lows = bullish bias, lower highs + lower lows = bearish bias.',
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
    'Exit or stop watching the trade by your fixed cutoff time, win or lose.',
    'Never trade against the 4H bias.',
    'Trade EUR/USD as the primary pair; Gold is optional but less reliable.',
    'Backtest the strategy for at least 2-3 months before using real money.'
  ];
  i INTEGER;
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  FOR i IN 1..array_length(default_rules, 1) LOOP
    INSERT INTO public.strategy_rules (user_id, rule_text, sort_order)
    VALUES (NEW.id, default_rules[i], i);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
