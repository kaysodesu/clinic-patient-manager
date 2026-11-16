// Sidebar / mobile menu built from src/config/navigation.ts
import React from 'react';
import { Lock } from 'lucide-react';
import { NAV_GROUPS, VIEWS, ViewId } from '../config/navigation';

// Element ids the guided tutorial points at (kept stable)
const NAV_ID: Partial<Record<ViewId, string>> = {
  secure_records: 'secure-records', patient_portal: 'patient-portal', it_support: 'it-support',
  diagnostic_database: 'diagnostic', code_audit: 'code-audit',
};

interface NavMenuProps {
  activeView: ViewId;
  onNavigate: (id: ViewId) => void;
  /** Sections that show a lock (sign-in or role needed) */
  lockedViews?: ViewId[];
  idPrefix: string;
}

export default function NavMenu({ activeView, onNavigate, lockedViews = [], idPrefix }: NavMenuProps) {
  return (
    <nav aria-label="Sections" className="flex flex-col gap-4 select-none">
      {NAV_GROUPS.map(group => {
        const items = VIEWS.filter(v => v.group === group && !v.hidden);
        if (!items.length) return null;
        return (
          <div key={group} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{group}</p>
            {items.map(v => {
              const active = activeView === v.id;
              const Icon = v.icon;
              const locked = lockedViews.includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  id={`${idPrefix}-nav-${NAV_ID[v.id] ?? v.id}`}
                  onClick={() => onNavigate(v.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold text-left transition-colors cursor-pointer ${
                    active ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span className="flex-1 truncate">{v.label}</span>
                  {locked && <Lock className="w-3.5 h-3.5 text-amber-400" aria-label="Locked" />}
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
