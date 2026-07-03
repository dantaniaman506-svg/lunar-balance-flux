// Sound + haptic feedback for button interactions
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(freq: number, duration = 0.08, type: OscillatorType = "sine", gain = 0.08) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + duration);
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(pattern); } catch { /* noop */ }
  }
}

export function fxCheck() {
  tone(880, 0.06, "sine", 0.06);
  vibrate(10);
}

export function fxUncheck() {
  tone(440, 0.05, "sine", 0.04);
  vibrate(6);
}

export function fxConfirm() {
  tone(660, 0.08, "sine", 0.08);
  setTimeout(() => tone(990, 0.12, "sine", 0.08), 80);
  vibrate([20, 40, 20]);
}

export function fxTap() {
  tone(520, 0.04, "triangle", 0.04);
  vibrate(5);
}
