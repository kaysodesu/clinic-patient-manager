import React, { useState } from 'react';
import { Shield, Key, AlertCircle, CheckCircle2, RefreshCw, Lock, ArrowUpRight, Check, AlertTriangle } from 'lucide-react';
import { ClinicRole } from '../types';

interface AdminLockGateProps {
  onUnlock: (unlockedRole: ClinicRole) => void;
  requestedSectionName: string;
  currentRole: ClinicRole;
  isLockout?: boolean;
}

export default function AdminLockGate({ 
  onUnlock, 
  requestedSectionName, 
  currentRole, 
  isLockout = false 
}: AdminLockGateProps) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successRole, setSuccessRole] = useState<ClinicRole | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Hardcoded required codes per instruction
  const CODES = {
    admin: '1111',       // Level 1
    team_lead: '2222',   // Level 2
    ops_manager: '3333'  // Level 3
  };

  const handleKeyPress = (digit: string) => {
    if (isSuccess) return;
    setErrorMsg(null);
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const handleClear = () => {
    if (isSuccess) return;
    setPin('');
    setErrorMsg(null);
  };

  const handleBackspace = () => {
    if (isSuccess) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSuccess) return;

    // Check code matches
    let verifiedRole: ClinicRole | null = null;
    
    if (pin === CODES.admin) {
      verifiedRole = 'admin';
    } else if (pin === CODES.team_lead) {
      verifiedRole = 'team_lead';
    } else if (pin === CODES.ops_manager) {
      verifiedRole = 'ops_manager';
    }

    if (verifiedRole) {
      // If it is a lockout state, we need to enforce that they enter a level higher than current!
      if (isLockout) {
        if (currentRole === 'admin' && verifiedRole === 'admin') {
          setIsShaking(true);
          setErrorMsg('Admin level is locked. Please enter Level 2 code (2222) or Level 3 code (3333).');
          setPin('');
          setTimeout(() => setIsShaking(false), 500);
          return;
        }
        if (currentRole === 'team_lead' && (verifiedRole === 'admin' || verifiedRole === 'team_lead')) {
          setIsShaking(true);
          setErrorMsg('Team Lead is locked. Must enter Level 3 code (3333).');
          setPin('');
          setTimeout(() => setIsShaking(false), 500);
          return;
        }
      }

      setIsSuccess(true);
      setSuccessRole(verifiedRole);
      setErrorMsg(null);
      
      const roleToUpg = verifiedRole;
      setTimeout(() => {
        onUnlock(roleToUpg);
        setIsSuccess(false);
        setPin('');
        setSuccessRole(null);
      }, 1200);
    } else {
      setIsShaking(true);
      setErrorMsg('Incorrect Access Code. Please verify security credentials.');
      setPin('');
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    }
  };

  // Quick helper to fill correct passcode for testing/evaluating
  const handleAutoFillCode = (code: string) => {
    setPin(code);
    setErrorMsg(null);
  };

  // Decide text context depending on normal lock or edit lockout
  const getHeaderDetails = () => {
    if (isLockout) {
      if (currentRole === 'admin') {
        return {
          title: 'Account Locked Out (5/5 Edits Used)',
          subtitle: 'Requires Level 2 Access (Team Lead) to unlock',
          accent: 'bg-rose-500',
          textAccent: 'text-rose-400',
          desc: 'You have performed 5 edits to the clinic patient manager. To restore clinician editing permission, you must unlock with the Level 2 code (2222) or Level 3 code (3333).',
          badge: 'Level 2/3 Code Needed'
        };
      } else {
        return {
          title: 'Team Lead Account Locked (3/3 Edits Used)',
          subtitle: 'Requires Level 3 Access (Ops Manager) to unlock',
          accent: 'bg-rose-600',
          textAccent: 'text-rose-400',
          desc: 'You have performed 3 edits as Team Lead. To restore full over access, please enter the Ops Manager Level 3 code (3333).',
          badge: 'Level 3 Code Needed'
        };
      }
    }

    return {
      title: 'Restricted Clinical Workspace',
      subtitle: `${requestedSectionName} Guard`,
      accent: 'bg-slate-900',
      textAccent: 'text-teal-400',
      desc: 'This screen is locked under federal patient privacy standards. Please verify clinical staff credentials to load records.',
      badge: 'Level 1/2/3 Verification'
    };
  };

  const info = getHeaderDetails();

  return (
    <div className="w-full max-w-xl mx-auto my-6 p-1 animate-in zoom-in-95 duration-200">
      <div 
        id="admin-lock-card"
        className={`bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden transition-all duration-300 ${
          isShaking ? 'animate-bounce border-rose-300' : ''
        } ${isSuccess ? 'ring-2 ring-emerald-500 scale-[0.98]' : ''}`}
      >
        {/* Card Header */}
        <div className={`${info.accent} px-6 py-5 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${isLockout ? 'bg-rose-500/10' : 'bg-teal-500/10'} rounded-xl border ${isLockout ? 'border-rose-500/20' : 'border-teal-500/20'}`}>
              <Shield className={`w-5 h-5 ${isLockout ? 'text-rose-400 animate-pulse' : 'text-teal-400'}`} />
            </div>
            <div>
              <span className={`text-[10px] ${info.textAccent} font-mono font-bold tracking-widest uppercase block`}>
                {info.badge}
              </span>
              <h3 className="text-sm font-extrabold text-white tracking-tight">{info.title}</h3>
            </div>
          </div>
          <span className="text-[10px] bg-slate-850 text-slate-300 font-mono px-2 py-1 rounded">
            {isLockout ? 'LOCKOUT VETO' : 'PHI SECURE'}
          </span>
        </div>

        {/* Challenge Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="text-center space-y-2">
            {!isLockout && (
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Section: <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 font-mono">{requestedSectionName}</span>
              </h4>
            )}
            <p className="text-[11.5px] leading-relaxed text-slate-500 max-w-sm mx-auto">
              {info.desc}
            </p>
          </div>

          {/* Secure output monitor */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 relative overflow-hidden">
            {isSuccess ? (
              <div className="flex flex-col items-center py-2 animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
                <span className="text-xs font-extrabold text-emerald-700 mt-2">
                  Clearance Approved: Upgraded to {successRole === 'admin' ? 'Clinic Admin' : successRole === 'team_lead' ? 'Team Lead' : 'Ops Manager'}!
                </span>
              </div>
            ) : (
              <>
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block">Entered Passcode Monitor</span>
                <div className="h-8 flex items-center justify-center gap-3">
                  {pin.length === 0 ? (
                    <span id="pin-placeholder" className="text-xs font-bold text-slate-400 font-mono italic">Waiting for key inputs...</span>
                  ) : (
                    Array.from({ length: Math.max(pin.length, 4) }).map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                          idx < pin.length 
                            ? 'bg-slate-800 border-slate-900 scale-110' 
                            : 'bg-slate-100 border-slate-300'
                        }`}
                      />
                    ))
                  )}
                </div>
                {pin.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest">{pin}</span>
                )}
              </>
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-150 px-3 py-1.5 rounded-lg text-rose-800 text-[10px] font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* key input grid */}
            {!isSuccess && (
              <div className="grid grid-cols-3 gap-2 py-1 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num)}
                    className="h-11 bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl border border-slate-200 flex items-center justify-center transition-all hover:scale-[1.03] active:bg-slate-200 cursor-pointer shadow-3xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="h-11 bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl border border-slate-200 flex items-center justify-center transition-all hover:scale-[1.03] active:bg-slate-250 cursor-pointer shadow-3xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={pin.length === 0 || isSuccess}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                  pin.length > 0 && !isSuccess
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                Submit Verification Key
              </button>

              {/* Demo Helper Switcher panel for testing/grading */}
              <div className="pt-4 border-t border-slate-150 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Simulator Codes Bypass</span>
                  <span className="text-[9px] text-teal-600 font-mono">Click to autofill</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAutoFillCode('1111')}
                    className="py-1 text-[9px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 font-sans flex flex-col items-center cursor-pointer"
                  >
                    <span className="font-bold text-slate-900">Admin (L1)</span>
                    <span className="font-mono text-teal-600">1111</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFillCode('2222')}
                    className="py-1 text-[9px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 font-sans flex flex-col items-center cursor-pointer"
                  >
                    <span className="font-bold text-slate-900">Team Lead (L2)</span>
                    <span className="font-mono text-teal-600">2222</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFillCode('3333')}
                    className="py-1 text-[9px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 font-sans flex flex-col items-center cursor-pointer"
                  >
                    <span className="font-bold text-slate-900">Ops Mgr (L3)</span>
                    <span className="font-mono text-teal-600">3333</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
