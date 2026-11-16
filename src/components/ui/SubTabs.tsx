// Segmented sub-navigation used inside pages (same look everywhere).
import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SubTab<T extends string> { id: T; label: string; icon?: LucideIcon }

interface Props<T extends string> {
  tabs: SubTab<T>[];
  active: T;
  onChange: (id: T) => void;
  label: string; // accessible name, e.g. "Secure records views"
}

export default function SubTabs<T extends string>({ tabs, active, onChange, label }: Props<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 select-none">
      {tabs.map(t => {
        const on = t.id === active;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              on ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
