// Wraps the app in the PUBLIC demo build: preview timer, links to the full version and the
// Discord community, an access-code unlock, and the visitor's own AI key.
import React, { useEffect, useState } from 'react';
import { Clock, ShoppingBag, MessageCircle, KeyRound, Sparkles, X, Lock, ExternalLink } from 'lucide-react';
import { DEMO } from '../config/demo';
import { BRAND } from '../config/brand';
import { trialStatus, redeemCode } from './trial';
import { getBrowserAiKey, getBrowserAiModel, saveBrowserAi, OPEN_AI_KEY_EVENT } from './browserAi';

const fmt = (ms: number) => {
  const m = Math.floor(ms / 60_000), s = Math.floor((ms % 60_000) / 1000);
  if (m >= 60 * 24) { const d = Math.ceil(m / 1440); return `${d} day${d === 1 ? "" : "s"}`; }
  if (m >= 60) return `${Math.floor(m / 60)} h ${m % 60} min`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const linkBtn = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors';

export default function DemoShell({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState(() => trialStatus());
  const [showKey, setShowKey] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setStatus(trialStatus()), 1000);
    const open = () => setShowKey(true);
    window.addEventListener(OPEN_AI_KEY_EVENT, open);
    return () => { clearInterval(t); window.removeEventListener(OPEN_AI_KEY_EVENT, open); };
  }, []);

  if (status.expired) {
    return <Expired onUnlocked={() => setStatus(trialStatus())} />;
  }

  const lowTime = !status.unlocked && status.msLeft < 5 * 60_000;

  return (
    <>
      <div
        role="region"
        aria-label="Demo preview"
        className="relative z-50 bg-slate-950 text-white border-b border-teal-500/30"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 font-bold ${lowTime ? 'text-amber-300' : 'text-teal-300'}`} aria-live="polite">
            <Clock className="w-4 h-4" />
            {status.unlocked ? `Extended access: ${fmt(status.msLeft)} left` : `Free preview: ${fmt(status.msLeft)} left`}
          </span>
          <span className="text-slate-400 hidden md:inline">Fictional patients only · changes stay in this browser</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowKey(true)} className={`${linkBtn} bg-white/10 hover:bg-white/15 cursor-pointer`}>
              <Sparkles className="w-3.5 h-3.5" /> {getBrowserAiKey() ? 'AI key added' : 'Add AI key'}
            </button>
            <button type="button" onClick={() => setShowCode(true)} className={`${linkBtn} bg-white/10 hover:bg-white/15 cursor-pointer`}>
              <KeyRound className="w-3.5 h-3.5" /> Access code
            </button>
            <a href={DEMO.communityUrl} target="_blank" rel="noopener noreferrer" className={`${linkBtn} bg-indigo-500 hover:bg-indigo-400`}>
              <MessageCircle className="w-3.5 h-3.5" /> Join Discord for perks
            </a>
            <a href={DEMO.storeUrl} target="_blank" rel="noopener noreferrer" className={`${linkBtn} bg-teal-400 hover:bg-teal-300 text-slate-950`}>
              <ShoppingBag className="w-3.5 h-3.5" /> Get the full version
            </a>
          </div>
        </div>
      </div>
      {children}
      {showKey && <AiKeyDialog onClose={() => setShowKey(false)} />}
      {showCode && (
        <Modal title="Enter an access code" onClose={() => setShowCode(false)}>
          <CodeForm onUnlocked={() => { setStatus(trialStatus()); setShowCode(false); }} />
        </Modal>
      )}
    </>
  );
}

function Expired({ onUnlocked }: { onUnlocked: () => void }) {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <span className="inline-flex w-14 h-14 rounded-2xl bg-teal-500/15 text-teal-300 items-center justify-center"><Lock className="w-7 h-7" /></span>
          <h1 className="text-2xl font-extrabold">Your {DEMO.trialMinutes}-minute preview has ended</h1>
          <p className="text-slate-300 text-sm">Thanks for trying {BRAND.productName}. Want more time, or ready to run it in your own clinic?</p>
        </div>
        <div className="grid gap-3">
          <a href={DEMO.communityUrl} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-indigo-500 hover:bg-indigo-400 p-4 flex gap-3 items-start">
            <MessageCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span><span className="block font-bold">Request extended access on Discord</span>
              <span className="block text-sm text-indigo-100">Join the community and ask for an access code. Members also get early builds, discounts and setup help.</span></span>
            <ExternalLink className="w-4 h-4 ml-auto shrink-0" />
          </a>
          <a href={DEMO.storeUrl} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 p-4 flex gap-3 items-start">
            <ShoppingBag className="w-5 h-5 shrink-0 mt-0.5" />
            <span><span className="block font-bold">Get the full version on Gumroad</span>
              <span className="block text-sm text-teal-950/80">No time limit, staff accounts, your own database, and free 1.x updates.</span></span>
            <ExternalLink className="w-4 h-4 ml-auto shrink-0" />
          </a>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-sm font-bold mb-2">Already have an access code?</p>
          <CodeForm dark onUnlocked={onUnlocked} />
        </div>
      </div>
    </main>
  );
}

function CodeForm({ onUnlocked, dark }: { onUnlocked: () => void; dark?: boolean }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('');
    const ok = await redeemCode(code);
    setBusy(false);
    if (ok) onUnlocked(); else setMsg("That code didn't work. Check it, or ask for one on Discord.");
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="demo-access-code" className="sr-only">Access code</label>
        <input id="demo-access-code" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. CPM-XXXX-XXXX" autoComplete="off"
          className={`flex-1 min-w-0 rounded-lg px-3 py-2 text-sm font-mono uppercase border ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
        <button type="submit" disabled={busy || !code.trim()} className="rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 text-sm font-bold cursor-pointer">Unlock</button>
      </div>
      {msg && <p role="alert" className={`text-xs ${dark ? 'text-rose-300' : 'text-rose-700'}`}>{msg}</p>}
      <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>A code unlocks this browser for {DEMO.accessCodeDays} days.</p>
    </form>
  );
}

function AiKeyDialog({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState(getBrowserAiKey());
  const [model, setModel] = useState(getBrowserAiModel());
  const [saved, setSaved] = useState(false);
  return (
    <Modal title="Use your own AI key" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); saveBrowserAi(key, model); setSaved(true); }} className="space-y-3 text-sm">
        <p className="text-slate-600">The AI features (like the Code &amp; prompt auditor) run on your own Google Gemini key. Get a free key at{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">aistudio.google.com/apikey</a>.</p>
        <label className="block"><span className="block text-xs font-bold text-slate-700 mb-1">Gemini API key</span>
          <input type="password" value={key} onChange={e => { setKey(e.target.value); setSaved(false); }} autoComplete="off" placeholder="Paste your key"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono" /></label>
        <label className="block"><span className="block text-xs font-bold text-slate-700 mb-1">Model</span>
          <input value={model} onChange={e => { setModel(e.target.value); setSaved(false); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono" /></label>
        <p className="text-xs text-slate-500">Your key is saved only in this browser and sent directly to Google. It never reaches {BRAND.productName}'s developer. Don't use a key shared with other apps on a public computer.</p>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="submit" className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 font-bold cursor-pointer">Save</button>
          {getBrowserAiKey() && <button type="button" onClick={() => { saveBrowserAi('', ''); setKey(''); setSaved(false); }} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold cursor-pointer">Remove key</button>}
          {saved && <span role="status" className="text-emerald-700 text-xs font-semibold">Saved.</span>}
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/60 flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
