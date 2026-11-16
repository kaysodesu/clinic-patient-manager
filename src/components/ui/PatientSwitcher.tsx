// Slim bar for choosing which patient a page is working on. Shared by clinical pages.
import React from 'react';
import { UserRound } from 'lucide-react';
import { Patient } from '../../types';

interface Props {
  patients: Patient[];
  selectedId: string;
  onSelect: (id: string) => void;
  children?: React.ReactNode; // optional actions on the right
}

export default function PatientSwitcher({ patients, selectedId, onSelect, children }: Props) {
  const p = patients.find(x => x.id === selectedId);
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
      <span className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0"><UserRound className="w-5 h-5" /></span>
      <div className="min-w-0">
        <label htmlFor="page-patient-switcher" className="block text-[11px] font-semibold text-slate-500">Patient</label>
        <select
          id="page-patient-switcher"
          value={selectedId}
          onChange={e => onSelect(e.target.value)}
          className="max-w-full text-sm font-semibold text-slate-900 bg-transparent border-0 p-0 pr-6 focus:ring-0 cursor-pointer"
        >
          {patients.length === 0 && <option value="">No patients yet</option>}
          {patients.map(x => (
            <option key={x.id} value={x.id}>{x.personalInfo.lastName}, {x.personalInfo.firstName} · {x.id}</option>
          ))}
        </select>
      </div>
      {p && (
        <span className="text-xs text-slate-500 hidden sm:inline">
          DOB {p.personalInfo.dateOfBirth || 'n/a'}{p.personalInfo.gender ? ` · ${p.personalInfo.gender}` : ''}
        </span>
      )}
      {children && <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
