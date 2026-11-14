// Shows first-run setup or sign-in until a staff member is signed in, then loads the clinic
// data and renders the app. The demo build (no server) skips this entirely.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { HeartPulse, Lock, Loader2 } from 'lucide-react';
import { BRAND } from '../config/brand';
import { ClinicRole } from '../types';
import { startSharedStorage } from '../sharedStorage';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Exclude<ClinicRole, 'patient'>;
}

interface AuthContextValue {
  user: SessionUser | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({ user: null, signOut: async () => {} });
export const useAuth = () => useContext(AuthContext);

type Phase = 'checking' | 'setup' | 'login' | 'loading-data' | 'ready' | 'offline';

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [user, setUser] = useState<SessionUser | null>(null);

  const enter = async (signedIn: SessionUser) => {
    setUser(signedIn);
    setPhase('loading-data');
    await startSharedStorage();
    setPhase('ready');
  };

  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(data => {
        if (data.user) enter(data.user);
        else setPhase(data.setupRequired ? 'setup' : 'login');
      })
      .catch(() => setPhase('offline'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    // Reload so no clinic data stays in memory after signing out
    window.location.reload();
  };

  if (phase === 'ready' && user) {
    return <AuthContext.Provider value={{ user, signOut }}>{children}</AuthContext.Provider>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-7 space-y-5">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-white" />
          </span>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">{BRAND.facilityName}</h1>
            <p className="text-xs text-slate-500">{BRAND.productName}</p>
          </div>
        </div>

        {(phase === 'checking' || phase === 'loading-data') && (
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> {phase === 'checking' ? 'Connecting…' : 'Loading clinic records…'}
          </p>
        )}
        {phase === 'offline' && (
          <p className="text-sm text-rose-700">Can't reach the clinic server. Check your connection and reload the page.</p>
        )}
        {phase === 'setup' && <SetupForm onDone={enter} />}
        {phase === 'login' && <LoginForm onDone={enter} />}
      </div>
    </div>
  );
}

function Field({ id, label, type = 'text', value, onChange, autoComplete }: {
  id: string; label: string; type?: string; value: string; onChange: (v: string) => void; autoComplete?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-bold text-slate-700">{label}</label>
      <input
        id={id} type={type} value={value} autoComplete={autoComplete} required
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
      />
    </div>
  );
}

function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
      {busy && <Loader2 className="w-4 h-4 animate-spin" />} {children}
    </button>
  );
}

function SetupForm({ onDone }: { onDone: (u: SessionUser) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("The two passwords don't match."); return; }
    setBusy(true); setError('');
    try { onDone((await postJson('/api/auth/setup', { name, email, password })).user); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">Set up your clinic</h2>
        <p className="text-sm text-slate-600">Create the administrator account. You can add the rest of your staff after signing in.</p>
      </div>
      <Field id="setup-name" label="Your name" value={name} onChange={setName} autoComplete="name" />
      <Field id="setup-email" label="Work email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field id="setup-password" label="Password (10+ characters)" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
      <Field id="setup-confirm" label="Confirm password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <SubmitButton busy={busy}>Create administrator account</SubmitButton>
    </form>
  );
}

function LoginForm({ onDone }: { onDone: (u: SessionUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { onDone((await postJson('/api/auth/login', { email, password })).user); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5"><Lock className="w-4 h-4" /> Staff sign in</h2>
        <p className="text-sm text-slate-600">Forgot your password? Ask your clinic administrator to reset your account.</p>
      </div>
      <Field id="login-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="username" />
      <Field id="login-password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <SubmitButton busy={busy}>Sign in</SubmitButton>
    </form>
  );
}
