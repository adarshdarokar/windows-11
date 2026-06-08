/**
 * Tiny synthesized UI sounds via WebAudio. No assets needed.
 * Respects a localStorage "win11-mute" flag.
 */
let ctx = null;
const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  return ctx;
};

const muted = () => {
  try { return localStorage.getItem("win11-mute") === "1"; } catch { return false; }
};

const sysVolume = () => {
  try {
    const v = parseInt(localStorage.getItem("win11-volume") ?? "60", 10);
    if (Number.isFinite(v)) return Math.max(0, Math.min(100, v)) / 100;
  } catch {}
  return 0.6;
};

export const setMuted = (v) => {
  try { localStorage.setItem("win11-mute", v ? "1" : "0"); } catch {}
};
export const isMuted = () => muted();

function tone({ freq = 600, duration = 0.08, type = "sine", gain = 0.05, freq2 }) {
  if (muted()) return;
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freq2) osc.frequency.exponentialRampToValueAtTime(freq2, t + duration);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain * sysVolume(), t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export const sounds = {
  open:  () => tone({ freq: 520, freq2: 880, duration: 0.12, type: "sine",     gain: 0.04 }),
  close: () => tone({ freq: 700, freq2: 320, duration: 0.10, type: "sine",     gain: 0.04 }),
  click: () => tone({ freq: 1200,             duration: 0.04, type: "triangle", gain: 0.025 }),
  start: () => tone({ freq: 660, freq2: 990, duration: 0.10, type: "triangle", gain: 0.04 }),
};
