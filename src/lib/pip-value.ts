export type Pair = {
  symbol: string;
  label: string;
  pipSize: number;      // price per pip
  pipValuePerLot: number; // USD value of 1 pip per 1 standard lot (approx)
};

export const PAIRS: Pair[] = [
  { symbol: "EUR/USD", label: "EUR/USD", pipSize: 0.0001, pipValuePerLot: 10 },
  { symbol: "GBP/USD", label: "GBP/USD", pipSize: 0.0001, pipValuePerLot: 10 },
  { symbol: "AUD/USD", label: "AUD/USD", pipSize: 0.0001, pipValuePerLot: 10 },
  { symbol: "NZD/USD", label: "NZD/USD", pipSize: 0.0001, pipValuePerLot: 10 },
  { symbol: "USD/CAD", label: "USD/CAD", pipSize: 0.0001, pipValuePerLot: 7.5 },
  { symbol: "USD/CHF", label: "USD/CHF", pipSize: 0.0001, pipValuePerLot: 11 },
  { symbol: "USD/JPY", label: "USD/JPY", pipSize: 0.01, pipValuePerLot: 6.7 },
  { symbol: "EUR/JPY", label: "EUR/JPY", pipSize: 0.01, pipValuePerLot: 6.7 },
  { symbol: "GBP/JPY", label: "GBP/JPY", pipSize: 0.01, pipValuePerLot: 6.7 },
  { symbol: "XAU/USD", label: "Gold (XAU/USD)", pipSize: 0.1, pipValuePerLot: 10 },
  { symbol: "XAG/USD", label: "Silver (XAG/USD)", pipSize: 0.01, pipValuePerLot: 50 },
  { symbol: "BTC/USD", label: "Bitcoin (BTC/USD)", pipSize: 1, pipValuePerLot: 1 },
  { symbol: "ETH/USD", label: "Ethereum (ETH/USD)", pipSize: 0.1, pipValuePerLot: 1 },
  { symbol: "SOL/USD", label: "Solana (SOL/USD)", pipSize: 0.01, pipValuePerLot: 1 },
];

export function calcLotSize({ balance, riskPct, slPips, pair }: { balance: number; riskPct: number; slPips: number; pair: Pair }): number {
  if (!balance || !riskPct || !slPips) return 0;
  const riskUsd = balance * (riskPct / 100);
  const lots = riskUsd / (slPips * pair.pipValuePerLot);
  return Math.max(0, Number(lots.toFixed(2)));
}
