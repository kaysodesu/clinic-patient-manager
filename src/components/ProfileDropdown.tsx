import React, { useState, useRef, useEffect } from 'react';
import { Patient } from '../types';
import { 
  User, Shield, CreditCard, HelpCircle, MessageSquare, Settings, 
  LogOut, ChevronDown 
} from 'lucide-react';

interface ProfileDropdownProps {
  activePatient: Patient | null;
  onSelectOption: (tab: 'profile' | 'account' | 'billing' | 'faq' | 'contact' | 'app') => void;
  onLogOut: () => void;
}

export default function ProfileDropdown({ activePatient, onSelectOption, onLogOut }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (tab: 'profile' | 'account' | 'billing' | 'faq' | 'contact' | 'app') => {
    onSelectOption(tab);
    setIsOpen(false);
  };

  return (
    <div id="profile-dropdown-wrapper" className="relative font-sans shrink-0" ref={dropdownRef}>
      <button
        type="button"
        id="profile-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 md:p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer select-none"
      >
        <div className="w-7 h-7 md:w-8 md:h-8 bg-teal-650 text-white font-extrabold flex items-center justify-center rounded-lg text-xs md:text-sm shrink-0 shadow-xs">
          {activePatient ? `${activePatient.personalInfo?.firstName?.[0] || ''}${activePatient.personalInfo?.lastName?.[0] || ''}` : "U"}
        </div>
        <div className="text-left hidden sm:block md:max-w-[120px]">
          <span className="text-xs font-bold text-slate-800 block truncate">
            {activePatient ? `${activePatient.personalInfo?.firstName} ${activePatient.personalInfo?.lastName}` : "User Profile"}
          </span>
          <span className="text-[9px] font-mono font-bold text-slate-450 block truncate">Active Patient</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div id="profile-dropdown-menu" className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-150 shadow-lg py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 border-b border-slate-100 mb-1.5">
            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Logged Session</span>
            <span className="text-xs font-extrabold text-slate-850 block mt-0.5 truncate">{activePatient?.personalInfo?.email || "unknown@example.com"}</span>
          </div>

          <button
            type="button"
            onClick={() => handleOptionClick('profile')}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition-all text-left cursor-pointer"
          >
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            My Profile
          </button>

          <button
            type="button"
            onClick={() => handleOptionClick('account')}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition-all text-left cursor-pointer"
          >
            <Shield className="w-4 h-4 text-slate-400 shrink-0" />
            Account Settings
          </button>

          <button
            type="button"
            onClick={() => handleOptionClick('billing')}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition-all text-left cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
            Billing & Payment Settings
          </button>

          <button
            type="button"
            onClick={() => handleOptionClick('faq')}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition-all text-left cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            FAQ Help Guide
          </button>

          <button
            type="button"
            onClick={() => handleOptionClick('contact')}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition-all text-left cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
            Contact Clinic (Live Chat)
          </button>

          <button
            type="button"
            onClick={() => handleOptionClick('app')}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition-all text-left cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            Application Settings
          </button>

          <div className="border-t border-slate-100 my-1.5 pt-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogOut();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-650 hover:bg-rose-50 transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              Log Out Representative
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
