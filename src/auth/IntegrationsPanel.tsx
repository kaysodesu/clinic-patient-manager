// Administrator window: what still needs setting up on this installation, and the clinic's own
// AI key. Keys are stored on the clinic's server and never sent back to the browser in full.
import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Loader2, KeyRound } from 'lucide-react';

export interface IntegrationStatus {
  storage: 'postgres' | 'memory';
  sessionSecretSet: boolean;
  gemini: { configured: boolean; source?: 'environment' | 'app'; hint?: string };
}

export async function fetchIntegrationStatus(): Promise<IntegrationStatus | null> {
  try {
    const res = await fetch('/api/settings/integrations');
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function Item({ ok, title, children }: { ok: boolean; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 p-3 border border-slate-200 rounded-xl">
      {ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
      <div className="min-w-0 space-y-1 text-sm text-slate-700">
        <p className="font-bold text-slate-900">{title}</p>
        {children}
      </div>
    </li>
  );
}

const code = 'px-1 py-0.5 rounded bg-slate-100 font-mono text-[12px] text-slate-800';

export function IntegrationsPanel({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);

  useEffect(() => { fetchIntegrationStatus().then(setStatus); }, []);

  const saveKey = async (value: string | null) => {
    setBusy(true); setMessage(null);
    try {
      const res = await fetch('/api/settings/integrations', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ geminiApiKey: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the key.');
      setKeyInput('');
      setMessage({ text: value ? 'AI key saved. The AI Code Auditor is now on.' : 'AI key removed.', tone: 'ok' });
      setStatus(await fetchIntegrationStatus());
    } catch (err) {
      setMessage({ text: (err as Error).message, tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="integrations-title" onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="integrations-title" className="text-lg font-extrabold text-slate-900">Setup & integrations</h2>
            <p className="text-xs text-slate-500">Your clinic's own database and keys. Nothing here is shared with the software's seller.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!status ? (
          <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking this installation…</p>
        ) : (
          <ul className="space-y-2">
            <Item ok={status.storage === 'postgres'} title={status.storage === 'postgres' ? 'Database connected' : 'No database connected: records are temporary'}>
              {status.storage === 'postgres' ? (
                <p>Patient records and staff accounts are saved in your Postgres database.</p>
              ) : (
                <p>Everything is kept in memory and <strong>disappears when the server restarts</strong>. Create a Postgres database
                  (for example a free one at neon.tech), then set <span className={code}>DATABASE_URL</span> in your hosting
                  provider's environment settings or in the <span className={code}>.env</span> file, and restart.</p>
              )}
            </Item>
            <Item ok={status.sessionSecretSet} title={status.sessionSecretSet ? 'Session secret set' : 'Session secret missing'}>
              {status.sessionSecretSet ? (
                <p>Staff stay signed in across restarts.</p>
              ) : (
                <p>Staff are signed out whenever the server restarts. Set <span className={code}>SESSION_SECRET</span> to a long random
                  string (the README shows a one-line command to make one). Render's blueprint sets it for you.</p>
              )}
            </Item>
            <Item ok={status.gemini.configured} title={status.gemini.configured ? 'AI key connected' : 'AI key not set (optional)'}>
              <p>Powers the AI Code & Prompt Auditor. Use your own key from Google AI Studio (aistudio.google.com → Get API key). Usage is billed to your Google account.</p>
              {status.gemini.configured && (
                <p className="text-xs text-slate-500">
                  Key ending {status.gemini.hint} · {status.gemini.source === 'environment' ? 'set in the server environment' : 'saved in this app'}
                </p>
              )}
              {status.gemini.source !== 'environment' && (
                <form className="flex flex-wrap gap-2 pt-1" onSubmit={e => { e.preventDefault(); saveKey(keyInput); }}>
                  <label htmlFor="gemini-key" className="sr-only">Gemini API key</label>
                  <input id="gemini-key" type="password" autoComplete="off" value={keyInput} onChange={e => setKeyInput(e.target.value)}
                    placeholder={status.gemini.configured ? 'Paste a new key to replace it' : 'Paste your Gemini API key'}
                    className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600" />
                  <button type="submit" disabled={busy || !keyInput.trim()} className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer">
                    <KeyRound className="w-4 h-4" /> Save key
                  </button>
                  {status.gemini.configured && (
                    <button type="button" disabled={busy} onClick={() => saveKey(null)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer">
                      Remove
                    </button>
                  )}
                </form>
              )}
            </Item>
          </ul>
        )}

        {message && (
          <p role="status" className={`text-sm px-3 py-2 rounded-lg ${message.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{message.text}</p>
        )}
      </div>
    </div>
  );
}
