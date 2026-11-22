// Per-browser preview timer for the public demo.
// Note: this is a soft limit kept in the visitor's browser. It keeps casual visitors to a short
// preview; it is not security. The real app (sold on Gumroad) has no timer.
import { DEMO } from '../config/demo';

const KEY = 'cpm_demo_trial_v1';

interface TrialState { startedAt: number; unlockedUntil?: number }

function read(): TrialState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as TrialState;
      if (typeof s.startedAt === 'number') return s;
    }
  } catch { /* storage blocked: memory only */ }
  const fresh = { startedAt: Date.now() };
  write(fresh);
  return fresh;
}

function write(s: TrialState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ }
}

export function trialStatus(now = Date.now()) {
  const s = read();
  const trialEnds = s.startedAt + DEMO.trialMinutes * 60_000;
  const unlocked = !!s.unlockedUntil && s.unlockedUntil > now;
  const endsAt = unlocked ? s.unlockedUntil! : trialEnds;
  return { unlocked, endsAt, msLeft: Math.max(0, endsAt - now), expired: endsAt <= now };
}

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, '');

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Returns true and extends access when the code matches one of the configured hashes. */
export async function redeemCode(code: string): Promise<boolean> {
  const clean = normalizeCode(code);
  if (!clean || !crypto?.subtle) return false;
  const hash = await sha256Hex(clean);
  if (!DEMO.accessCodeHashes.includes(hash)) return false;
  const s = read();
  write({ ...s, unlockedUntil: Date.now() + DEMO.accessCodeDays * 86_400_000 });
  return true;
}
