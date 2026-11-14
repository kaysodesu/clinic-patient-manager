import React from 'react';
import { LogOut, ShieldCheck, Users, Settings2 } from 'lucide-react';
import { SessionUser } from './AuthGate';
import { ROLE_LABELS, can } from './permissions';

interface AccountPanelProps {
  user: SessionUser;
  compact?: boolean;
  onSignOut: () => void;
  onManageStaff: () => void;
  onOpenSetup: () => void;
}

/** Sidebar card showing who is signed in, their role, and account actions. */
export function AccountPanel({ user, compact, onSignOut, onManageStaff, onOpenSetup }: AccountPanelProps) {
  return (
    <div id="account-panel" className={`bg-slate-850 border border-slate-800 space-y-2.5 ${compact ? 'p-3 rounded-xl' : 'p-3.5 rounded-2xl'}`}>
      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Signed in
      </div>
      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
        <p className="text-sm font-bold text-white truncate">{user.name}</p>
        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
        <p className="text-[11px] text-teal-400 font-semibold mt-1">{ROLE_LABELS[user.role]}</p>
      </div>
      <div className="grid gap-1.5">
        {can(user.role, 'manageStaff') && (
          <button type="button" onClick={onOpenSetup} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-slate-200 hover:bg-slate-800 cursor-pointer">
            <Settings2 className="w-3.5 h-3.5" /> Setup & integrations
          </button>
        )}
        {can(user.role, 'manageStaff') && (
          <button type="button" onClick={onManageStaff} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-slate-200 hover:bg-slate-800 cursor-pointer">
            <Users className="w-3.5 h-3.5" /> Staff & access
          </button>
        )}
        <button type="button" onClick={onSignOut} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-slate-300 hover:bg-rose-950 hover:text-rose-200 cursor-pointer">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}
