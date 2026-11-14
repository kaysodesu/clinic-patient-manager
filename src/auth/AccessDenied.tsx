import React from 'react';
import { Lock } from 'lucide-react';

/** Shown in place of a section the signed-in role can't open. */
export function AccessDenied({ area, allowedRoles }: { area: string; allowedRoles: string }) {
  return (
    <div className="w-full max-w-lg mx-auto my-12 bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-3">
      <span className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center">
        <Lock className="w-6 h-6 text-slate-500" />
      </span>
      <h2 className="text-lg font-extrabold text-slate-900">{area} is restricted</h2>
      <p className="text-sm text-slate-600">
        Your role doesn't include this area. It's available to: <strong>{allowedRoles}</strong>.
      </p>
      <p className="text-xs text-slate-500">Ask your clinic administrator if you need access.</p>
    </div>
  );
}
