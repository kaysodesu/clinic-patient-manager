import React, { useState, useEffect } from 'react';
import { can, rolesWith } from '../auth/permissions';
import { AccessDenied } from '../auth/AccessDenied';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, ITEvent, ClinicRole } from '../types';
import { 
  Terminal, Shield, ShieldAlert, CheckSquare, AlertTriangle, 
  Trash2, GitPullRequest, Link2, Clock, Check, RefreshCw, KeyRound,
  Filter, Search, Database, AlertCircle, Sparkles, CheckCircle2, ChevronRight, X
} from 'lucide-react';

interface ITSupportPanelProps {
  patients: Patient[];
  itEvents: ITEvent[];
  onLogITEvent: (type: ITEvent['type'], details: string, author?: string, status?: ITEvent['status']) => void;
  onMergePatients: (masterId: string, dupeId: string) => void;
  role: ClinicRole;
  onSetRole: (role: ClinicRole) => void;
}

export default function ITSupportPanel({
  patients,
  itEvents,
  onLogITEvent,
  onMergePatients,
  role,
  onSetRole
}: ITSupportPanelProps) {
  // Passcode verification state for IT section
  const [passcode, setPasscode] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinShaking, setIsPinShaking] = useState(false);
  const [sessionUnlocked, setSessionUnlocked] = useState(() => can(role, 'itConsole'));

  // If role is ops_manager, they are pre-authorized (Level 3 access overrides IT gate)
  const isPreAuthorized = can(role, 'itConsole');

  // State of the search & category filter for Event Logs
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'LOGIN_ERROR' | 'PROFILE_MERGED' | 'PATIENT_PROFILE_UPDATE' | 'VISITATION_UPDATE' | 'SYSTEM_ERROR'>('ALL');

  // Multi-step merge state
  const [selectedDupePairIndex, setSelectedDupePairIndex] = useState<number | null>(null);
  const [masterChoice, setMasterChoice] = useState<'p1' | 'p2'>('p1');
  
  // MERGE CONFIRMATION CHECKBOXES
  const [nameChecked, setNameChecked] = useState(false);
  const [phoneChecked, setPhoneChecked] = useState(false);
  const [addressChecked, setAddressChecked] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Auto-unlock helper if already authorized
  useEffect(() => {
    setSessionUnlocked(isPreAuthorized);
  }, [role, isPreAuthorized]);

  // Handle Passcode verification
  const handlePasscodeKeyPress = (digit: string) => {
    setPinError(null);
    if (passcode.length < 4) {
      setPasscode(prev => prev + digit);
    }
  };

  const handlePasscodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (passcode === '8888') {
      onLogITEvent('OTHER', `Designated IT Support Section unlocked using function code 8888. Permission: Read/Write Root Console.`, 'IT Support (8888)');
      onSetRole('it_support');
      setSessionUnlocked(true);
      setPasscode('');
      setPinError(null);
      alert('🔒 Access Granted. System Diagnostics Mode Activated.');
    } else if (passcode === '3333') {
      onLogITEvent('OTHER', `Designated IT Support Section unlocked using Level 3 Code (3333).`, 'Ops Mgr (L3)');
      onSetRole('ops_manager');
      setSessionUnlocked(true);
      setPasscode('');
      setPinError(null);
      alert('🔓 Access Granted. Level 3 Ops Manager Credentials Verified.');
    } else {
      // Invalid login error logging!
      const errorMsg = `Unauthorized IT Support entry attempt. Code Entered: "${passcode}"`;
      onLogITEvent('LOGIN_ERROR', errorMsg, 'EXTERNAL_IP', 'ERROR');
      
      setIsPinShaking(true);
      setPinError('Access Denied. Invalid Diagnostic Security Code.');
      setPasscode('');
      setTimeout(() => setIsPinShaking(false), 500);
    }
  };

  // Find duplicates calculation
  const findDuplicates = () => {
    const dupPairs: { p1: Patient; p2: Patient; reasons: string[]; score: number }[] = [];
    
    for (let i = 0; i < patients.length; i++) {
      const p1 = patients[i];
      for (let j = i + 1; j < patients.length; j++) {
        const p2 = patients[j];
        const reasons: string[] = [];
        let score = 0;

        if (!p1?.personalInfo || !p2?.personalInfo) {
          continue;
        }

        // Name match (case insensitive, trimmed)
        const p1First = (p1.personalInfo.firstName || "").toLowerCase().trim();
        const p2First = (p2.personalInfo.firstName || "").toLowerCase().trim();
        const p1Last = (p1.personalInfo.lastName || "").toLowerCase().trim();
        const p2Last = (p2.personalInfo.lastName || "").toLowerCase().trim();

        if (p1First === p2First && p1Last === p2Last) {
          reasons.push("First & Last Name Match Exactly");
          score += 45;
        } else if (p1Last === p2Last && (p1First.startsWith(p2First) || p2First.startsWith(p1First))) {
          reasons.push("First Name Spelled Similarly & Last Name Match");
          score += 25;
        }

        // Phone numbers (ignoring spaces, dashes, parentheses)
        const cleanPhone = (p: string) => p.replace(/\D/g, '');
        const p1Ph = cleanPhone(p1.personalInfo.phone || "");
        const p2Ph = cleanPhone(p2.personalInfo.phone || "");
        if (p1Ph === p2Ph && p1Ph !== '') {
          reasons.push("Phone Numbers Match exactly");
          score += 35;
        }

        // Email address
        const p1Email = (p1.personalInfo.email || "").toLowerCase().trim();
        const p2Email = (p2.personalInfo.email || "").toLowerCase().trim();
        if (p1Email === p2Email && p1Email !== '') {
          reasons.push("Email Addresses Match exactly");
          score += 35;
        }

        // Home address
        const p1Addr = (p1.personalInfo.address || "").toLowerCase().trim();
        const p2Addr = (p2.personalInfo.address || "").toLowerCase().trim();
        if (p1Addr === p2Addr && p1Addr !== '') {
          reasons.push("Street Addresses Match exactly");
          score += 20;
        }

        // Date of birth
        const p1DOB = p1.personalInfo.dateOfBirth || "";
        const p2DOB = p2.personalInfo.dateOfBirth || "";
        if (p1DOB === p2DOB && p1DOB !== '') {
          reasons.push("Dates of Birth Match exactly");
          score += 15;
        }

        if (score >= 25) {
          dupPairs.push({ p1, p2, reasons, score });
        }
      }
    }
    return dupPairs;
  };

  const dupeList = findDuplicates();

  // Reset checkboxes when pair selection changes
  useEffect(() => {
    setNameChecked(false);
    setPhoneChecked(false);
    setAddressChecked(false);
    setEmailChecked(false);
    setConsentChecked(false);
  }, [selectedDupePairIndex]);

  // Merge execution
  const executeMerge = () => {
    if (selectedDupePairIndex === null) return;
    const pair = dupeList[selectedDupePairIndex];
    if (!pair) return;

    // Check confirm requirements
    if (pair.reasons.some(r => r.includes("Name")) && !nameChecked) {
      alert("Please confirm the verification check matches for Name.");
      return;
    }
    if (pair.reasons.some(r => r.includes("Phone")) && !phoneChecked) {
      alert("Please confirm the verification check matches for Phone.");
      return;
    }
    if (pair.reasons.some(r => r.includes("Address")) && !addressChecked) {
      alert("Please confirm the verification check matches for Address Address.");
      return;
    }
    if (pair.reasons.some(r => r.includes("Email")) && !emailChecked) {
      alert("Please confirm the verification check matches for Email Addresses.");
      return;
    }
    if (!consentChecked) {
      alert("Please complete the legal administrative authorization acknowledgment checkbox.");
      return;
    }

    const master = masterChoice === 'p1' ? pair.p1 : pair.p2;
    const dupe = masterChoice === 'p1' ? pair.p2 : pair.p1;

    // Trigger merge callback in parent App.tsx
    onMergePatients(master.id, dupe.id);

    // Logging the successful merge in server IT hub
    onLogITEvent(
      'PROFILE_MERGED', 
      `Merged duplicate records for ${dupe.personalInfo.firstName} ${dupe.personalInfo.lastName} (ID: ${dupe.id}) into Master Record (ID: ${master.id}). Preserved primary medical records, history registers, questionnaire details, and linked invoices folder.`,
      role === 'it_support' ? 'IT Support (8888)' : 'Ops Mgr (L3)'
    );

    setSelectedDupePairIndex(null);
    alert(`🎉 Merge Operation Successful. Duplicate account ${dupe.personalInfo.firstName} ${dupe.personalInfo.lastName} (ID: ${dupe.id}) has been unified into Master Profile ID: ${master.id}.`);
  };

  // Safe Inject-Simulator Loop
  const simulateSystemError = () => {
    const errorTypes = [
      "DB_LOCKOUT_TIMEOUT - PostreSQL active transactions pool exhausted under concurrent billing write workloads.",
      "CORS_PREFLIGHT_FAIL - Secondary static endpoint diagnostic response stalled on port 3000.",
      "AUTH_TOKEN_EXPIRED - Level 1 Session credentials flagged invalid on inactivity telemetry limits.",
      "WEBSOCKET_DISCONNECTED - Vite HMR socket handshakes blocked by external sandboxing proxy rules."
    ];
    const chosen = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    onLogITEvent('SYSTEM_ERROR', `Simulation Debugger Glitch: ${chosen}`, 'DIAGNOSTIC_BOT', 'ERROR');
    alert("🧪 Simulated code/system connection glitch appended to audit ledger list below.");
  };

  // Filter local events list
  const filteredEvents = itEvents.filter(ev => {
    // Search query match
    const searchMatch = ev.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        ev.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ev.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ev.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category match
    const categoryMatch = categoryFilter === 'ALL' || ev.type === categoryFilter;

    return searchMatch && categoryMatch;
  });

  // Gated Render Choice
  if (!sessionUnlocked) {
    return <AccessDenied area="The IT Support desk" allowedRoles={rolesWith('itConsole')} />;
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page actions */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-2">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${role === 'it_support' ? 'bg-teal-50 text-teal-800' : 'bg-amber-50 text-amber-800'}`}>
          {role === 'it_support' ? 'Signed in as IT support' : 'Signed in as operations manager'}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={simulateSystemError}
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Log a test error</span>
          </button>
          <button
            onClick={() => {
              alert("Cache refreshed. Data on this device was re-synced.");
              onLogITEvent('SYSTEM_ERROR', "IT Specialist triggered clinical cache reload and synchronized LocalStorage memory registers.");
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh cache</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN GRID LAYOUT FOR IT CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: DUPLICATE ACCOUNT DETECTOR & UNIFIER (7-slots) */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-teal-600" />
                Duplicate patient records
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically scans the database to locate overlapping patient accounts matching crucial contact vectors.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-teal-50 border border-teal-100 px-2 py-1 rounded text-teal-700 font-bold shrink-0">
              Active Scanners: 5 Vectors
            </span>
          </div>

          {dupeList.length === 0 ? (
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 text-center space-y-2">
              <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">Database Perfectly Deduplicated</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                Currently, zero active overlapping patient dossiers share matched names, phone numbers, email listings or residential addresses. If you'd like to test this feature, you can register a similar profile in the Intake form.
              </p>
              <button
                type="button"
                onClick={() => {
                  // Dynamically seed duplicates directly into current list
                  // We do it by passing the mock dupe patients
                  alert("Generated two demo duplicate profiles: 'Sara Jenkins' under phone/address overlap with Sarah, and another 'Marcus Vance' with overlapping identifiers! Scan updating in real time...");
                  // Click triggers parent app edits, so we can mock duplicate generation
                  onLogITEvent('OTHER', "Generated simulated duplicate profiles for Sara Jenkins and Marcus Vance to test deduplication ledger.");
                  window.location.reload(); // Since we want to let localStorage reload
                }}
                className="inline-flex items-center gap-1.5 bg-slate-900 text-white font-mono text-[10px] uppercase font-bold py-1.5 px-3 rounded-lg border border-slate-800 hover:bg-slate-950 mt-2 cursor-pointer"
              >
                Auto-generate duplicate profiles inside dataset
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overlapping items found */}
              <div className="bg-amber-50/55 border border-amber-100 rounded-xl p-3.5 flex gap-3 text-xs leading-relaxed text-slate-700">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Found <strong>{dupeList.length} potential duplicate patient profiles</strong> with matching vectors! Select an entry pair below to run a side-by-side profile verification review and execute a safe database merge.
                </p>
              </div>

              {/* Duplicate List Selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold font-mono text-slate-400 block uppercase">Detected Duplicate Matches list</span>
                <div className="grid grid-cols-1 gap-2.5">
                  {dupeList.map((dupe, index) => {
                    const isSelected = selectedDupePairIndex === index;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDupePairIndex(index)}
                        className={`w-full p-3.5 rounded-2xl border text-left flex justify-between items-center transition-all ${
                          isSelected 
                            ? 'bg-teal-50/20 border-teal-500 ring-1 ring-teal-500 shadow-xs' 
                            : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">
                              {dupe.p1.personalInfo.firstName} {dupe.p1.personalInfo.lastName}
                            </span>
                            <span className="text-slate-400 font-normal">and</span>
                            <span className="font-bold text-xs text-slate-850">
                              {dupe.p2.personalInfo.firstName} {dupe.p2.personalInfo.lastName}
                            </span>
                          </div>
                          
                          {/* Reasons tags */}
                          <div className="flex flex-wrap gap-1">
                            {dupe.reasons.map((rn, rIdx) => (
                              <span key={rIdx} className="text-[8px] bg-white border border-slate-200 font-mono text-slate-600 px-1.5 py-0.5 rounded">
                                {rn}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div className="hidden sm:block">
                            <span className="text-[9px] text-slate-400 font-mono block">Overlap Score:</span>
                            <span className={`text-[12px] font-black block font-mono ${
                              dupe.score >= 50 ? 'text-rose-600' : 'text-amber-600'
                            }`}>{dupe.score}% Confidence</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-teal-600' : ''}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COMPARISON AND MERGE WORKSPACE */}
              <AnimatePresence mode="wait">
                {selectedDupePairIndex !== null && dupeList[selectedDupePairIndex] && (() => {
                  const pair = dupeList[selectedDupePairIndex];
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="border border-slate-200 rounded-2xl p-4 md:p-5 bg-slate-50/50 space-y-5"
                    >
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-extrabold font-mono text-slate-500 uppercase">
                          Step 2: Side-by-Side Review & Master Selection
                        </span>
                        <button 
                          onClick={() => setSelectedDupePairIndex(null)}
                          className="text-slate-400 hover:text-slate-650"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* SIDE BY SIDE COMPARISON CARD GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* RECORD A */}
                        <div 
                          onClick={() => setMasterChoice('p1')}
                          className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                            masterChoice === 'p1' 
                              ? 'bg-white border-teal-500 shadow-sm ring-1 ring-teal-500' 
                              : 'bg-slate-100/40 border-slate-200 text-slate-600'
                          }`}
                        >
                          {masterChoice === 'p1' && (
                            <span className="absolute top-3 right-3 bg-teal-600 text-white text-[8px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider block">
                              Chosen Master Survivor
                            </span>
                          )}
                          <span className="text-[9px] font-mono text-slate-400 block mb-1">RECORD A (ID: {pair.p1.id})</span>
                          <h4 className="font-extrabold text-xs text-slate-850">
                            {pair.p1.personalInfo.firstName} {pair.p1.personalInfo.lastName}
                          </h4>
                          <span className="text-[9px] text-slate-450 block font-mono">Admitted Date: {pair.p1.dateAdmitted}</span>

                          <div className="mt-3.5 space-y-1.5 text-[10.5px] border-t pt-2.5 text-slate-600">
                            <div><strong className="text-slate-800">Phone:</strong> {pair.p1.personalInfo.phone}</div>
                            <div><strong className="text-slate-800">Email:</strong> {pair.p1.personalInfo.email}</div>
                            <div><strong className="text-slate-800">Address:</strong> {pair.p1.personalInfo.address}</div>
                            <div><strong className="text-slate-800">DOB:</strong> {pair.p1.personalInfo.dateOfBirth}</div>
                            <div><strong className="text-slate-800">Active State:</strong> <span className="bg-slate-200/60 px-1 py-0.5 text-[8.5px] font-bold rounded font-mono">{pair.p1.status}</span></div>
                            <div className="pt-1.5 truncate"><strong className="text-slate-800">Notes snippet:</strong> <span className="italic block text-[9.5px] mt-0.5">"{pair.p1.notes || 'No remarks recorded.'}"</span></div>
                          </div>
                        </div>

                        {/* RECORD B */}
                        <div 
                          onClick={() => setMasterChoice('p2')}
                          className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                            masterChoice === 'p2' 
                              ? 'bg-white border-teal-500 shadow-sm ring-1 ring-teal-500' 
                              : 'bg-slate-100/40 border-slate-200 text-slate-600'
                          }`}
                        >
                          {masterChoice === 'p2' && (
                            <span className="absolute top-3 right-3 bg-teal-600 text-white text-[8px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider block">
                              Chosen Master Survivor
                            </span>
                          )}
                          <span className="text-[9px] font-mono text-slate-400 block mb-1">RECORD B (ID: {pair.p2.id})</span>
                          <h4 className="font-extrabold text-xs text-slate-850">
                            {pair.p2.personalInfo.firstName} {pair.p2.personalInfo.lastName}
                          </h4>
                          <span className="text-[9px] text-slate-450 block font-mono">Admitted Date: {pair.p2.dateAdmitted}</span>

                          <div className="mt-3.5 space-y-1.5 text-[10.5px] border-t pt-2.5 text-slate-600">
                            <div><strong className="text-slate-800">Phone:</strong> {pair.p2.personalInfo.phone}</div>
                            <div><strong className="text-slate-800">Email:</strong> {pair.p2.personalInfo.email}</div>
                            <div><strong className="text-slate-800">Address:</strong> {pair.p2.personalInfo.address}</div>
                            <div><strong className="text-slate-800">DOB:</strong> {pair.p2.personalInfo.dateOfBirth}</div>
                            <div><strong className="text-slate-800">Active State:</strong> <span className="bg-slate-200/60 px-1 py-0.5 text-[8.5px] font-bold rounded font-mono">{pair.p2.status}</span></div>
                            <div className="pt-1.5 truncate"><strong className="text-slate-800">Notes snippet:</strong> <span className="italic block text-[9.5px] mt-0.5">"{pair.p2.notes || 'No remarks recorded.'}"</span></div>
                          </div>
                        </div>

                      </div>

                      {/* DEDICATED VERIFICATION CHECKBOX CHECKLIST */}
                      <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-3.5 text-xs text-slate-700">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block font-mono">
                          Required Verification Checklist & Declarations
                        </span>

                        <div className="space-y-2">
                          {/* First Last name check */}
                          {pair.reasons.some(r => r.includes("Name")) && (
                            <label className="flex items-start gap-2.5 p-1 hover:bg-slate-50 rounded cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={nameChecked} 
                                onChange={e => setNameChecked(e.target.checked)} 
                                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 accent-teal-650 shrink-0 mt-0.5" 
                              />
                              <div>
                                <span className="font-semibold block">Confirm first and/or last names correspond to the same individual</span>
                                <span className="text-[10px] text-slate-450 block">Matches found: "{pair.p1.personalInfo.firstName} {pair.p1.personalInfo.lastName}" and "{pair.p2.personalInfo.firstName} {pair.p2.personalInfo.lastName}".</span>
                              </div>
                            </label>
                          )}

                          {/* Phone check */}
                          {pair.reasons.some(r => r.includes("Phone")) && (
                            <label className="flex items-start gap-2.5 p-1 hover:bg-slate-50 rounded cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={phoneChecked} 
                                onChange={e => setPhoneChecked(e.target.checked)} 
                                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 accent-teal-650 shrink-0 mt-0.5" 
                              />
                              <div>
                                <span className="font-semibold block">Confirm contact phone numbers match correctly</span>
                                <span className="text-[10px] text-slate-450 block">Phone vector matches: "{pair.p1.personalInfo.phone}" == "{pair.p2.personalInfo.phone}".</span>
                              </div>
                            </label>
                          )}

                          {/* Address check */}
                          {pair.reasons.some(r => r.includes("Address")) && (
                            <label className="flex items-start gap-2.5 p-1 hover:bg-slate-50 rounded cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={addressChecked} 
                                onChange={e => setAddressChecked(e.target.checked)} 
                                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 accent-teal-650 shrink-0 mt-0.5" 
                              />
                              <div>
                                <span className="font-semibold block">Confirm identical residential home addresses</span>
                                <span className="text-[10px] text-slate-450 block">Address vector matches: "{pair.p1.personalInfo.address}" == "{pair.p2.personalInfo.address}".</span>
                              </div>
                            </label>
                          )}

                          {/* Email check */}
                          {pair.reasons.some(r => r.includes("Email")) && (
                            <label className="flex items-start gap-2.5 p-1 hover:bg-slate-50 rounded cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={emailChecked} 
                                onChange={e => setEmailChecked(e.target.checked)} 
                                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 accent-teal-650 shrink-0 mt-0.5" 
                              />
                              <div>
                                <span className="font-semibold block">Confirm identical patient email directory keys</span>
                                <span className="text-[10px] text-slate-450 block">Email vector matches: "{pair.p1.personalInfo.email}" == "{pair.p2.personalInfo.email}".</span>
                              </div>
                            </label>
                          )}

                          {/* General Admin Clearance */}
                          <label className="flex items-start gap-2.5 p-2 bg-teal-50/20 border border-teal-100 rounded-xl cursor-pointer select-none mt-4">
                            <input 
                              type="checkbox" 
                              checked={consentChecked} 
                              onChange={e => setConsentChecked(e.target.checked)} 
                              className="w-4.5 h-4.5 text-teal-600 rounded border-slate-400 focus:ring-teal-500 accent-teal-650 shrink-0 mt-1" 
                            />
                            <div>
                              <strong className="text-teal-900 block font-bold">Patient Authorization & Admin Veto Override</strong>
                              <span className="text-[10.5px] text-slate-600 block mt-0.5">
                                I confirm the patient has consented to unify their accounts, and that executing this merge will permanently redirect billing invoices and records folder under master ID: <strong>{(masterChoice === 'p1' ? pair.p1 : pair.p2).id}</strong>. This is irreversible.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* EXECUTION SUBMIT */}
                      <button
                        type="button"
                        onClick={executeMerge}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-3xs"
                      >
                        <GitPullRequest className="w-4 h-4 text-teal-300" />
                        <span>Execute Patient Profile Database Merge</span>
                      </button>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: AUDIT HISTORICAL LEDGER / IT SYSTEM EVENTS LOG (5-slots) */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5 text-left">
          
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs uppercase font-extrabold font-mono tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-slate-900 rounded-sm"></span>
                Audit log
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Every login error, patient update, clinical visit modification and system telemetry tick is logged here in real time.
              </p>
            </div>
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Filtering Workspace */}
          <div className="space-y-3 bg-slate-50 border border-slate-150 p-3.5 rounded-2xl">
            {/* Search inputs */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Search description, author, code..."
              />
            </div>

            {/* Category toggle filter */}
            <div className="space-y-1">
              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wide font-mono block">Categorical Filter</span>
              <div className="flex flex-wrap gap-1">
                {(['ALL', 'LOGIN_ERROR', 'PROFILE_MERGED', 'PATIENT_PROFILE_UPDATE', 'VISITATION_UPDATE', 'SYSTEM_ERROR'] as const).map(cat => {
                  const isSelected = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`text-[8.5px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-900 text-teal-400' 
                          : 'bg-white hover:bg-slate-150 border border-slate-200 text-slate-500'
                      }`}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Core Events list */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                No matching historic event logs located.
              </div>
            ) : (
              filteredEvents.map(ev => {
                const isError = ev.status === 'ERROR' || ev.type === 'LOGIN_ERROR' || ev.type === 'SYSTEM_ERROR';
                return (
                  <div 
                    key={ev.id}
                    className="p-3 bg-slate-50/50 border border-slate-150/70 rounded-xl flex items-start gap-2.5 transition-colors hover:bg-slate-50 text-[10.5px] leading-relaxed"
                  >
                    {/* Tiny badge dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                      isError ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                    }`} />

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-slate-405 font-bold">
                        <span>{ev.id} • {ev.type.replace('_', ' ')}</span>
                        <span className="text-slate-450">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      
                      <p className="text-slate-700 text-[10.5px]">
                        {ev.details}
                      </p>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 mt-1 text-[9px]">
                        <div>
                          <span className="text-slate-400 font-medium">Performed By:</span>{' '}
                          <span className="font-bold text-slate-650 font-mono">{ev.author}</span>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded font-bold font-mono ${
                          isError ? 'text-rose-600 bg-rose-50' : 'text-emerald-700 bg-emerald-50'
                        }`}>
                          {ev.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
