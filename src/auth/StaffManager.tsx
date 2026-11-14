// Administrator window: add staff, change roles, reset passwords, remove accounts.
import React, { useEffect, useState } from 'react';
import { X, UserPlus, KeyRound, Trash2, Loader2 } from 'lucide-react';
import { ROLE_LABELS, ROLE_DESCRIPTIONS, STAFF_ROLES, StaffRole } from './permissions';
import { useAuth } from './AuthGate';

interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  createdAt: string;
  lastLoginAt?: string;
}

async function api(url: string, method = 'GET', body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600';

export function StaffManager({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffAccount[] | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'team_lead' as StaffRole, password: '' });
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const load = () => api('/api/auth/users').then(setStaff).catch(err => setMessage({ text: err.message, tone: 'error' }));
  useEffect(() => { load(); }, []);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setMessage(null);
    try { await action(); setMessage({ text: success, tone: 'ok' }); await load(); }
    catch (err) { setMessage({ text: (err as Error).message, tone: 'error' }); }
    finally { setBusy(false); }
  };

  const addStaff = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await api('/api/auth/users', 'POST', form);
      setForm({ name: '', email: '', role: 'team_lead', password: '' });
    }, `Added ${form.name}. Share the temporary password with them privately.`);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="staff-title" onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="staff-title" className="text-lg font-extrabold text-slate-900">Staff & access</h2>
            <p className="text-xs text-slate-500">Each person signs in with their own email and password. Their role decides what they can open.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {message && (
          <p role="status" className={`text-sm px-3 py-2 rounded-lg ${message.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {message.text}
          </p>
        )}

        {/* Current staff */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          {staff === null ? (
            <p className="p-4 text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading staff…</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Role</th><th className="text-left p-3">Last sign-in</th><th className="p-3"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map(s => (
                  <tr key={s.id} className="align-top">
                    <td className="p-3">
                      <span className="block font-semibold text-slate-900">{s.name}{s.id === user?.id && <span className="ml-1 text-[11px] text-slate-400">(you)</span>}</span>
                      <span className="block text-xs text-slate-500">{s.email}</span>
                    </td>
                    <td className="p-3">
                      <label className="sr-only" htmlFor={`role-${s.id}`}>Role for {s.name}</label>
                      <select id={`role-${s.id}`} value={s.role} disabled={busy}
                        onChange={e => run(() => api(`/api/auth/users/${s.id}`, 'PATCH', { role: e.target.value }), `${s.name} is now ${ROLE_LABELS[e.target.value as StaffRole]}.`)}
                        className="text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white">
                        {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-xs text-slate-500 tabular-nums">{s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : 'Never'}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button type="button" onClick={() => { setResetFor(s.id); setResetPassword(''); setConfirmRemove(null); }}
                          className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 cursor-pointer">
                          <KeyRound className="w-3 h-3" /> Reset password
                        </button>
                        {s.id !== user?.id && (
                          confirmRemove === s.id ? (
                            <button type="button" disabled={busy}
                              onClick={() => run(() => api(`/api/auth/users/${s.id}`, 'DELETE'), `Removed ${s.name}.`).then(() => setConfirmRemove(null))}
                              className="px-2 py-1 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer">
                              Confirm remove
                            </button>
                          ) : (
                            <button type="button" onClick={() => { setConfirmRemove(s.id); setResetFor(null); }}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center gap-1 cursor-pointer">
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )
                        )}
                      </div>
                      {resetFor === s.id && (
                        <form className="mt-2 flex gap-1.5" onSubmit={e => {
                          e.preventDefault();
                          run(() => api(`/api/auth/users/${s.id}`, 'PATCH', { password: resetPassword }), `Password reset for ${s.name}. Share it with them privately.`).then(() => setResetFor(null));
                        }}>
                          <label className="sr-only" htmlFor={`reset-${s.id}`}>New temporary password</label>
                          <input id={`reset-${s.id}`} type="text" value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                            placeholder="New temporary password (10+)" className={inputClass + ' text-xs'} />
                          <button type="submit" disabled={busy} className="px-2.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer">Save</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add staff */}
        <form onSubmit={addStaff} className="border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Add a staff member</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="staff-name" className="text-xs font-bold text-slate-700">Name</label>
              <input id="staff-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label htmlFor="staff-email" className="text-xs font-bold text-slate-700">Work email</label>
              <input id="staff-email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label htmlFor="staff-role" className="text-xs font-bold text-slate-700">Role</label>
              <select id="staff-role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as StaffRole })} className={inputClass + ' bg-white'}>
                {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <p className="text-[11px] text-slate-500">{ROLE_DESCRIPTIONS[form.role]}</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="staff-password" className="text-xs font-bold text-slate-700">Temporary password (10+ characters)</label>
              <input id="staff-password" type="text" required minLength={10} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} />
            </div>
          </div>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-bold cursor-pointer">
            Add staff member
          </button>
        </form>
      </div>
    </div>
  );
}
