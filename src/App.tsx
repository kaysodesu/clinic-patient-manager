import { useState, useEffect, useRef } from 'react';
import { BRAND } from './config/brand';
import { Patient, Invoice, ClinicRole, VisitationRecord, ITEvent } from './types';
import { initialPatients, initialInvoices } from './data/mockPatients';
import { betaTestPatients, betaTestVisits, betaTestInvoices, betaScenarios } from './data/betaTestPatients';
import IntakeForm from './components/IntakeForm';
import BillingManager from './components/BillingManager';
import SettingsPanel from './components/SettingsPanel';
import PatientsDatabase from './components/PatientsDatabase';
import ProfileDropdown from './components/ProfileDropdown';
import AdminLockGate from './components/AdminLockGate';
import VisitationOverview from './components/VisitationOverview';
import PrescriptionManager from './components/PrescriptionManager';
import SecureRecordsManager from './components/SecureRecordsManager';
import MarketingHub from './components/MarketingHub';
import ITSupportPanel from './components/ITSupportPanel';
import ScanStation from './components/ScanStation';
import DiagnosticDatabase from './components/DiagnosticDatabase';
import PatientPortal from './components/PatientPortal';
import CodeAuditPanel from './components/CodeAuditPanel';
import { usePatientState } from './hooks/usePatientState';
import { useBillingState } from './hooks/useBillingState';
import { useVisitationState } from './hooks/useVisitationState';
import TutorialCenter from './components/TutorialCenter';
import { useAuth } from './auth/AuthGate';
import { AccountPanel } from './auth/AccountPanel';
import { StaffManager } from './auth/StaffManager';
import { IntegrationsPanel, fetchIntegrationStatus } from './auth/IntegrationsPanel';
import { AppSection } from './data/tutorialContent';
import NavMenu from './components/NavMenu';
import { viewMeta, ViewId } from './config/navigation';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
import { 
  Heart, Users, ClipboardList, CreditCard, ChevronRight, Menu, X, 
  HelpCircle, Settings, Bell, ScanLine, Clock, CalendarDays, KeyRound, CheckSquare, ShieldCheck, Stethoscope, Activity, MessageSquare, Terminal, Database
} from 'lucide-react';

export default function App() {
  // Signed-in staff get the role on their account. Only the demo build (no accounts) lets
  // visitors switch roles to preview each one.
  const { user, signOut } = useAuth();
  const [role, setRoleState] = useState<ClinicRole>(() => {
    if (user) return user.role;
    const saved = localStorage.getItem('clinic_role');
    return (saved as ClinicRole) || 'admin';
  });
  const setRole = (next: ClinicRole) => {
    if (!user) setRoleState(next);
  };
  const [showStaffManager, setShowStaffManager] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  // Administrators are prompted while the installation still needs its own database
  const [setupWarning, setSetupWarning] = useState<string | null>(null);
  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchIntegrationStatus().then(st => {
      if (st?.storage === 'memory') setSetupWarning('No database is connected yet, so records and accounts disappear when the server restarts.');
      else if (st && !st.sessionSecretSet) setSetupWarning('SESSION_SECRET is not set, so staff are signed out whenever the server restarts.');
      else setSetupWarning(null);
    });
  }, [user?.role, showIntegrations]);

  const [adminEditCount, setAdminEditCount] = useState<number>(() => {
    const saved = localStorage.getItem('clinic_admin_edit_count');
    return saved ? Number(saved) : 0;
  });

  const [teamLeadEditCount, setTeamLeadEditCount] = useState<number>(() => {
    const saved = localStorage.getItem('clinic_team_lead_edit_count');
    return saved ? Number(saved) : 0;
  });

  const isAdmin = role === 'admin' || role === 'team_lead' || role === 'ops_manager' || role === 'it_support';
  // Demo-only governance feature: limits edits per role until a supervisor signs off
  const quotaLockedOut = !user && ((role === 'admin' && adminEditCount >= 5) || (role === 'team_lead' && teamLeadEditCount >= 3));

  // Refactored modular state hooks
  const {
    patients,
    setPatients,
    activePatientId,
    setActivePatientId,
    activePatient,
    addPatient,
    updatePatient,
    handleMergePatients: mergePatientsInHook,
    isLoading: patientsLoading
  } = usePatientState(role);

  // Shown in place of screens that need a selected patient while the directory is empty
  const renderNoPatientsNotice = () => (
    <div className="max-w-xl mx-auto mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
      <Users className="w-10 h-10 mx-auto text-teal-400" />
      <h2 className="text-lg font-bold text-white">No patients registered yet</h2>
      <p className="text-sm text-slate-400">
        This screen works with a patient's records. Register the first patient through the intake portal to get started.
      </p>
      <button
        type="button"
        onClick={() => setActiveView('intake')}
        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold cursor-pointer"
      >
        Open new patient intake
      </button>
    </div>
  );

  const {
    invoices,
    setInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice
  } = useBillingState();

  const {
    visitationRecords,
    setVisitationRecords,
    addVisitation,
    deleteVisitation,
    progressNotes,
    addProgressNote,
    updateProgressNotes
  } = useVisitationState();

  const [itEvents, setItEvents] = useState<ITEvent[]>(() => {
    const saved = localStorage.getItem('clinic_it_events');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const logITEvent = (
    type: ITEvent['type'],
    details: string,
    author?: string,
    status: ITEvent['status'] = 'SUCCESS'
  ) => {
    const defaultAuthor = role === 'ops_manager' ? 'Ops Mgr (L3)' : role === 'team_lead' ? 'Team Lead (L2)' : role === 'admin' ? 'Admin (L1)' : role === 'it_support' ? 'IT Support (8888)' : 'Patient (Guest)';
    const newEvent: ITEvent = {
      id: `IT-EV-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      type,
      details,
      author: author || defaultAuthor,
      status
    };
    setItEvents(prev => {
      const updated = [newEvent, ...prev];
      localStorage.setItem('clinic_it_events', JSON.stringify(updated));
      return updated;
    });
  };

  const handleMergePatients = (masterId: string, dupeId: string) => {
    const masterPatient = patients.find(p => p.id === masterId);
    if (!masterPatient) return;

    // Delegate patient list updating, backend API logging, and state saving to our custom patient hook
    mergePatientsInHook(masterId, dupeId);

    // Update the associated invoice registry for the de-duplicated patient
    setInvoices(prev => prev.map(inv => {
      if (inv.patientId === dupeId) {
        return {
          ...inv,
          patientId: masterId,
          patientName: `${masterPatient.personalInfo.firstName} ${masterPatient.personalInfo.lastName}`
        };
      }
      return inv;
    }));

    // Update corresponding clinical visitation records
    setVisitationRecords(prev => prev.map(visit => {
      if (visit.patientId === dupeId) {
        return {
          ...visit,
          patientId: masterId,
          patientName: `${masterPatient.personalInfo.firstName} ${masterPatient.personalInfo.lastName}`
        };
      }
      return visit;
    }));
  };

  // Navigation states
  const [activeView, setActiveView] = useState<ViewId>('database');
  const [marketingTabSource, setMarketingTabSource] = useState<'marketing' | 'feedback'>('marketing');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'account' | 'billing' | 'faq' | 'contact' | 'app'>('profile');
  // The ID scanner starts collapsed so the patient list is the first thing staff see
  const [scannerOpen, setScannerOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('clinic_scanner_open') === 'true'; } catch { return false; }
  });
  const toggleScanner = (open: boolean) => {
    setScannerOpen(open);
    try { localStorage.setItem('clinic_scanner_open', String(open)); } catch { /* storage unavailable */ }
  };
  const [scannedIntakeData, setScannedIntakeData] = useState<Partial<Patient> | null>(null);
  
  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Time & date display
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Accessibility / User Settings
  const [appBrightness, setAppBrightness] = useState<number>(() => {
    const saved = localStorage.getItem('clinic_brightness');
    return saved ? Number(saved) : 100;
  });

  const [headerFontSize, setHeaderFontSize] = useState<'h3' | 'h4' | 'h5' | 'h6'>(() => {
    const saved = localStorage.getItem('clinic_header_font_size');
    return (saved as any) || 'h3';
  });

  const [audioVolume, setAudioVolume] = useState<number>(() => {
    const saved = localStorage.getItem('clinic_audio_volume');
    return saved ? Number(saved) : 80;
  });

  const [audioPitch, setAudioPitch] = useState<'low' | 'medium' | 'high'>(() => {
    const saved = localStorage.getItem('clinic_audio_pitch');
    return (saved as any) || 'medium';
  });

  const [audioMute, setAudioMute] = useState<boolean>(() => {
    const saved = localStorage.getItem('clinic_audio_mute');
    return saved === 'true';
  });

  // FDBA User Permissions State
  const [fdbaUsers, setFdbaUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('clinic_fdba_permissions');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "FDBA-1",
        name: "Sample Database Admin",
        email: "db.admin@example.com",
        active: true,
        permissions: ["Update Diagnostic Codes", "Import Custom Codebooks", "De-duplicate Clinical Master"]
      },
      {
        id: "FDBA-2",
        name: "David Sterling",
        email: "d.sterling@example.com",
        active: true,
        permissions: ["Update Diagnostic Codes", "Export Shared Directory"]
      }
    ];
  });

  // Safe Synth Beep player using AudioContext
  const playSynthBeep = () => {
    try {
      if (audioMute) return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      let freq = 320;
      if (audioPitch === 'low') freq = 180;
      else if (audioPitch === 'high') freq = 600;
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime((audioVolume / 100) * 0.1, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context beep was blocked by policy", e);
    }
  };

  // Persist states across browser refreshes
  useEffect(() => {
    localStorage.setItem('clinic_it_events', JSON.stringify(itEvents));
  }, [itEvents]);

  useEffect(() => {
    localStorage.setItem('clinic_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('clinic_admin_edit_count', String(adminEditCount));
  }, [adminEditCount]);

  useEffect(() => {
    localStorage.setItem('clinic_team_lead_edit_count', String(teamLeadEditCount));
  }, [teamLeadEditCount]);

  useEffect(() => {
    localStorage.setItem('clinic_brightness', String(appBrightness));
  }, [appBrightness]);

  useEffect(() => {
    localStorage.setItem('clinic_header_font_size', headerFontSize);
  }, [headerFontSize]);

  useEffect(() => {
    localStorage.setItem('clinic_audio_volume', String(audioVolume));
  }, [audioVolume]);

  useEffect(() => {
    localStorage.setItem('clinic_audio_pitch', audioPitch);
  }, [audioPitch]);

  useEffect(() => {
    localStorage.setItem('clinic_audio_mute', String(audioMute));
  }, [audioMute]);

  useEffect(() => {
    localStorage.setItem('clinic_fdba_permissions', JSON.stringify(fdbaUsers));
  }, [fdbaUsers]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Increment Edit counter
  const incrementEditCount = () => {
    if (role === 'admin') {
      setAdminEditCount(prev => {
        const next = prev + 1;
        if (next >= 5) {
          alert("⚠️ Clinical Edits limit reached (5/5). Your Admin Session is now locked out! Please enter Team Lead (Level 2) access credentials to unlock.");
        }
        return next;
      });
    } else if (role === 'team_lead') {
      setTeamLeadEditCount(prev => {
        const next = prev + 1;
        if (next >= 3) {
          alert("⚠️ Team Lead Edits limit reached (3/3). Your Session is locked! Please enter Ops Manager (Level 3) access credentials to unlock.");
        }
        return next;
      });
    }
  };

  // Callback: Add a new intake patient
  // Adds the fictional beta-test scenarios; anything already loaded is skipped
  const handleLoadBetaTestPatients = (silent = false) => {
    const existingIds = new Set(patients.map(p => p.id));
    const newPatients = betaTestPatients.filter(p => !existingIds.has(p.id));
    if (newPatients.length === 0) {
      if (!silent) alert('All 5 beta test patients are already loaded.');
      return;
    }
    const newIds = new Set(newPatients.map(p => p.id));
    setPatients(prev => [...prev, ...newPatients]);
    setVisitationRecords(prev => [
      ...prev,
      ...betaTestVisits.filter(v => newIds.has(v.patientId) && !prev.some(x => x.id === v.id)),
    ]);
    setInvoices(prev => [
      ...prev,
      ...betaTestInvoices.filter(inv => newIds.has(inv.patientId) && !prev.some(x => x.id === inv.id)),
    ]);
    if (!activePatient) setActivePatientId(newPatients[0].id);
    logITEvent('INTAKE_UPDATE', `Loaded ${newPatients.length} fictional beta test patient(s): ${newPatients.map(p => p.id).join(', ')}`);
    if (!silent) alert(
      `Loaded ${newPatients.length} beta test patient(s):\n\n` +
      newPatients.map(p => `• ${p.personalInfo.firstName} ${p.personalInfo.lastName} (${p.id}): ${betaScenarios[p.id]?.title}`).join('\n')
    );
  };

  // Demo link: start with the fictional practice patients already loaded
  const demoSeeded = useRef(false);
  useEffect(() => {
    if (!DEMO_MODE || patientsLoading || demoSeeded.current) return;
    demoSeeded.current = true;
    if (patients.length === 0) handleLoadBetaTestPatients(true);
  }, [patientsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Used by the tutorials to open a screen
  // Menu navigation (desktop sidebar and mobile drawer)
  const goTo = (id: ViewId) => {
    setMobileMenuOpen(false);
    if (id === 'marketing') setMarketingTabSource('marketing');
    if (id === 'settings') setActiveSettingsTab('profile');
    setActiveView(id);
  };
  const lockedViews: ViewId[] = [
    ...(role === 'patient' || quotaLockedOut ? ['database' as ViewId] : []),
    ...(quotaLockedOut ? ['visitation' as ViewId, 'intake' as ViewId] : []),
  ];

  const navigateToSection = (section: AppSection) => {
    setMobileMenuOpen(false);
    if (section === 'feedback') { setActiveView('marketing'); setMarketingTabSource('feedback'); return; }
    if (section === 'marketing') { setActiveView('marketing'); setMarketingTabSource('marketing'); return; }
    if (section === 'settings') { setActiveView('settings'); setActiveSettingsTab('profile'); return; }
    setActiveView(section);
  };

  const handleAddPatient = (newPatient: Patient) => {
    setPatients(prev => [newPatient, ...prev]);
    setActivePatientId(newPatient.id);
    setScannedIntakeData(null);
    
    // Automatically issue a copay invoice for this patient
    const todayStr = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const dueStr = due.toISOString().split('T')[0];

    const autoCopayInvoice: Invoice = {
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientId: newPatient.id,
      patientName: `${newPatient.personalInfo.firstName} ${newPatient.personalInfo.lastName}`,
      date: todayStr,
      dueDate: dueStr,
      amount: newPatient.insuranceBilling.copayAmount || 30.00,
      status: 'Pending',
      description: `Outpatient Copayment Intake - ${newPatient.currentVisit.department} Referral Checklist`
    };

    setInvoices(prev => [autoCopayInvoice, ...prev]);
    logITEvent('INTAKE_UPDATE', `Committed new patient intake record for ${newPatient.personalInfo.firstName} ${newPatient.personalInfo.lastName} (ID: ${newPatient.id}). Automatic copayment ledger invoice ${autoCopayInvoice.id} generated.`);
    setActiveView('database'); // Redirect to clinical dashboard index
  };

  // Callback: Mark absolute settling of invoice
  const handlePayInvoice = (
    invoiceId: string, 
    method: string, 
    paidAmount?: number, 
    isPartial?: boolean, 
    paymentPlanDeadline?: string,
    defaultCardUsed?: string,
    applyPenalty?: boolean
  ) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        if (applyPenalty) {
          return {
            ...inv,
            amount: inv.amount + 75,
            penaltyApplied: true,
            description: `${inv.description} (Includes $75 Penalty Fee: 25-day deadline missed)`
          };
        }

        if (isPartial && paidAmount !== undefined) {
          const originalAmount = inv.originalAmount || inv.amount;
          const currentPaidTotal = (inv.paidAmount || 0) + paidAmount;
          const remaining = originalAmount - currentPaidTotal;
          const isNowPaid = remaining <= 0.01;

          return {
            ...inv,
            originalAmount,
            paidAmount: currentPaidTotal,
            amount: isNowPaid ? 0 : remaining,
            status: isNowPaid ? 'Paid' : inv.status,
            paymentMethod: method,
            paymentDate: new Date().toISOString().split('T')[0],
            isPartial: !isNowPaid,
            paymentPlanDeadline,
            defaultCardUsed,
          };
        }

        return {
          ...inv,
          status: 'Paid',
          paymentMethod: method,
          paymentDate: new Date().toISOString().split('T')[0],
          isPartial: false,
          defaultCardUsed,
        };
      }
      return inv;
    }));
  };

  // Callback: Create standard customized billing ledger lines
  const handleCreateInvoice = (newInv: Omit<Invoice, 'id' | 'date'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const generated: Invoice = {
      ...newInv,
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: todayStr
    };
    setInvoices(prev => [generated, ...prev]);
  };

  // Callback: Edit/update patient records from Profile view
  const handleUpdatePatient = (updatedPatient: Patient) => {
    incrementEditCount();
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    logITEvent('PATIENT_PROFILE_UPDATE', `Modified patient demographic dossier for ${updatedPatient.personalInfo.firstName} ${updatedPatient.personalInfo.lastName} (ID: ${updatedPatient.id}). Attributes matching:phone, DOB, address updated.`);
  };

  // Callback: Progress status change list trigger
  const handleUpdatePatientStatus = (patientId: string, newStatus: Patient['status']) => {
    incrementEditCount();
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        logITEvent('PATIENT_STATUS_UPDATE', `Transitioned patient ID: ${patientId} status changed to "${newStatus}".`);
        return { ...p, status: newStatus };
      }
      return p;
    }));
  };

  // Callback: Add note logs to active dossier
  const handleAddPatientNote = (patientId: string, newNoteText: string) => {
    incrementEditCount();
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        logITEvent('NOTE_UPDATE', `Added clinical notes extension to dossier ${patientId}: "${newNoteText.length > 30 ? newNoteText.substring(0, 30) + '...' : newNoteText}"`);
        return { 
          ...p, 
          notes: p.notes ? `${p.notes} | ${newNoteText}` : newNoteText 
        };
      }
      return p;
    }));
  };

  // Callback: Commit a new visitation encounter note
  const handleAddVisitation = (visit: VisitationRecord) => {
    incrementEditCount();
    addVisitation(visit);
    logITEvent('VISITATION_UPDATE', `Dispatched clinical encounter note VIS-${visit.id} for diagnostic consultation: ${visit.patientName} under ${visit.doctorName}.`);
  };

  // Callback: Remove a visitation encounter note
  const handleDeleteVisitation = (visitId: string) => {
    incrementEditCount();
    deleteVisitation(visitId);
    logITEvent('VISITATION_UPDATE', `Deleted clinical encounter note entry reference VIS-${visitId} from medical archive ledger.`);
  };

  // Profile Navbar Dropdown routing
  const handleSelectDropdownTab = (tabName: typeof activeSettingsTab) => {
    setActiveSettingsTab(tabName);
    setActiveView('settings');
  };

  // Simulate Logout
  const handleSessionLogOut = () => {
    // Simply alerts or locks to a demo lock screen state
    const confirmed = window.confirm("Are you sure you want to end this clinical dashboard session?");
    if (confirmed) {
      alert("Demographic lock screen simulated. Refresh browser to recover or click swap active patient beneath the settings tab.");
    }
  };

  return (
    <>
    {DEMO_MODE && (
      <div className="bg-amber-400 text-amber-950 text-[11px] font-bold text-center py-1 px-4" style={{ paddingTop: 'calc(4px + env(safe-area-inset-top, 0px))' }}>
        Demo mode: fictional patients only. Your changes stay in this browser.
      </div>
    )}
    <div 
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans transition-all duration-300"
      style={{ filter: `brightness(${appBrightness}%)` }}
    >
      <style>{`
        h3, .h3-size-override {
          font-size: ${
            headerFontSize === 'h3' ? '1.25rem' :
            headerFontSize === 'h4' ? '1.125rem' :
            headerFontSize === 'h5' ? '1.0rem' :
            '0.875rem'
          } !important;
        }
      `}</style>
      
      {/* 1. SIDEBAR NAVIGATION FOR DESKTOP */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white shrink-0 flex-col border-r border-slate-800 p-5 sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          
          {/* Logo & Clinical Title */}
          <div className="flex items-center gap-3 px-1.5">
            <div className="p-2.5 bg-teal-500 rounded-xl text-teal-980 shadow-sm flex items-center justify-center">
              <Heart className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white leading-none">{BRAND.facilityName}</h1>
              <span className="text-[10px] text-teal-400 font-mono tracking-wider font-bold block mt-0.5">{[BRAND.tagline, BRAND.developerCredit].filter(Boolean).join(' · ')}</span>
            </div>
          </div>

          {/* Console Clearance Security Role Selector */}
          {user ? (
            <AccountPanel user={user} onSignOut={signOut} onManageStaff={() => setShowStaffManager(true)} onOpenSetup={() => setShowIntegrations(true)} />
          ) : (
          <div id="role-switcher" className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Clinic Access Status
              </span>
              <span className={`w-2 h-2 rounded-full ${
                role === 'ops_manager' ? 'bg-amber-400 animate-ping' :
                role === 'team_lead' ? 'bg-purple-400 animate-pulse' :
                role === 'admin' ? 'bg-emerald-400' : 'bg-slate-500'
              }`} />
            </div>

            {/* Current Active Badge Display */}
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-450 font-medium">Clearance Level:</span>
                {role === 'ops_manager' && <span className="text-amber-400 font-bold tracking-wide uppercase">Ops Mgr (L3)</span>}
                {role === 'team_lead' && <span className="text-purple-400 font-bold tracking-wide uppercase">Lead (L2)</span>}
                {role === 'admin' && <span className="text-teal-400 font-bold tracking-wide uppercase font-black">Admin (L1)</span>}
                {role === 'patient' && <span className="text-slate-400 font-bold tracking-wide uppercase">Patient (Guest)</span>}
              </div>
              
              {/* Edits tracking progress indicator */}
              <div className="pt-2 border-t border-slate-800 text-[10px]">
                {role === 'admin' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400 font-mono">
                      <span>Clinical Edits:</span>
                      <span className={adminEditCount >= 5 ? "text-rose-450 font-extrabold" : "text-emerald-450"}>
                        {adminEditCount}/5 used
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${Math.min((adminEditCount/5)*100, 100)}%` }}></div>
                    </div>
                    {adminEditCount >= 5 ? (
                      <p className="text-[9px] text-rose-400 font-bold">🔒 Limit Reached! Account Locked.</p>
                    ) : (
                      <p className="text-[8.5px] text-slate-500">Edit limit resets on Team Lead elevate.</p>
                    )}
                  </div>
                )}
                {role === 'team_lead' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400 font-mono">
                      <span>L2 Edits:</span>
                      <span className={teamLeadEditCount >= 3 ? "text-rose-450 font-extrabold" : "text-amber-400"}>
                        {teamLeadEditCount}/3 used
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-550 transition-all duration-300" style={{ width: `${Math.min((teamLeadEditCount/3)*100, 100)}%` }}></div>
                    </div>
                    {teamLeadEditCount >= 3 ? (
                      <p className="text-[9px] text-rose-400 font-bold">🔒 Lead Locked! Requires L3 code.</p>
                    ) : (
                      <p className="text-[8.5px] text-slate-500">Locked out at 3 edits.</p>
                    )}
                  </div>
                )}
                {role === 'ops_manager' && (
                  <p className="text-slate-400 text-center font-bold text-[9px] py-1 bg-amber-500/10 border border-amber-500/20 rounded">
                    ⚡ Unlimited All-Over Access Active
                  </p>
                )}
                {role === 'patient' && (
                  <p className="text-slate-450 text-center font-bold text-[9px] py-1 bg-slate-800 text-slate-400 rounded">
                    📄 Secure Entry-Only Access Mode
                  </p>
                )}
              </div>
            </div>

            {/* Bypass Switcher Matrix */}
            <div className="space-y-1.5 bg-slate-900/60 p-2 rounded-xl text-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Bypass Switcher Matrix</span>
              <div className="grid grid-cols-3 gap-1 text-[8px]">
                <button
                  type="button"
                  onClick={() => {
                    setRole('patient');
                    setAdminEditCount(0);
                    setTeamLeadEditCount(0);
                  }}
                  className={`py-1 text-center font-sans font-bold rounded transition-colors cursor-pointer ${
                    role === 'patient'
                      ? 'bg-amber-600 text-white font-extrabold shadow-3xs'
                      : 'text-slate-400 bg-slate-900 hover:text-white'
                  }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pin = prompt("Enter Level 1 Access Code (1111) for Admin:");
                    if (pin === '1111') {
                      setRole('admin');
                      setAdminEditCount(0);
                      alert("🔓 Verified. Clinic Admin Role Activated.");
                    } else if (pin !== null) {
                      alert("❌ Incorrect Access Code. Try '1111'.");
                      logITEvent('LOGIN_ERROR', `Bypass Matrix Switch: Invalid passcode entered for Admin (L1) with entry value: "${pin}".`, 'CONSOLE_MATRIX_BYPASS', 'ERROR');
                    }
                  }}
                  className={`py-1 text-center font-sans font-bold rounded transition-colors cursor-pointer ${
                    role === 'admin'
                      ? 'bg-teal-600 text-white font-extrabold shadow-3xs'
                      : 'text-slate-400 bg-slate-900 hover:text-white'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pin = prompt("Enter Level 2 Access Code (2222) for Team Lead:");
                    if (pin === '2222') {
                      setRole('team_lead');
                      setTeamLeadEditCount(0);
                      alert("🔓 Verified. Team Lead Role Activated.");
                    } else if (pin !== null) {
                      alert("❌ Incorrect Access Code. Try '2222'.");
                      logITEvent('LOGIN_ERROR', `Bypass Matrix Switch: Invalid passcode entered for Team Lead (L2) with entry value: "${pin}".`, 'CONSOLE_MATRIX_BYPASS', 'ERROR');
                    }
                  }}
                  className={`py-1 text-center font-sans font-bold rounded transition-colors cursor-pointer ${
                    role === 'team_lead'
                      ? 'bg-purple-700 text-white font-extrabold shadow-3xs'
                      : 'text-slate-400 bg-slate-900 hover:text-white'
                  }`}
                >
                  Lead
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pin = prompt("Enter Level 3 Access Code (3333) for Ops Manager:");
                    if (pin === '3333') {
                      setRole('ops_manager');
                      alert("🔓 Verified! Ops Manager All-Over Clearance Active.");
                    } else if (pin !== null) {
                      alert("❌ Incorrect Access Code. Try '3333'.");
                      logITEvent('LOGIN_ERROR', `Bypass Matrix Switch: Invalid passcode entered for Ops Manager (L3) with entry value: "${pin}".`, 'CONSOLE_MATRIX_BYPASS', 'ERROR');
                    }
                  }}
                  className={`py-1 text-center font-sans font-bold rounded transition-colors cursor-pointer ${
                    role === 'ops_manager'
                      ? 'bg-amber-550 text-slate-950 font-black shadow-3xs'
                      : 'text-slate-400 bg-slate-900 hover:text-white'
                  }`}
                >
                  Ops Mgr
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pin = prompt("Enter Level 4 Access Code (8888) for IT Support:");
                    if (pin === '8888') {
                      setRole('it_support');
                      alert("🔓 Verified! IT Support System Engineer Clearance Enabled.");
                    } else if (pin !== null) {
                      alert("❌ Incorrect Access Code. Try '8888'.");
                      logITEvent('LOGIN_ERROR', `Bypass Matrix Switch: Invalid passcode entered for IT Support (L4) with entry value: "${pin}".`, 'CONSOLE_MATRIX_BYPASS', 'ERROR');
                    }
                  }}
                  className={`py-1 text-center font-sans font-bold rounded transition-colors cursor-pointer ${
                    role === 'it_support'
                      ? 'bg-rose-700 text-white font-extrabold shadow-3xs text-[7.5px]'
                      : 'text-slate-400 bg-slate-900 hover:text-white'
                  }`}
                >
                  IT Eng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pin = prompt("Enter FDBA Access Code (9999) for Facility DB Admin:");
                    if (pin === '9999') {
                      setRole('facility_database_administrator');
                      alert("🔓 Verified. Facility Database Administrator (FDBA) Role Activated.");
                    } else if (pin !== null) {
                      alert("❌ Incorrect Access Code. Try '9999'.");
                      logITEvent('LOGIN_ERROR', `Bypass Matrix Switch: Invalid passcode entered for FDBA with entry value: "${pin}".`, 'CONSOLE_MATRIX_BYPASS', 'ERROR');
                    }
                  }}
                  className={`py-1 text-center font-sans font-bold rounded transition-colors cursor-pointer p-0.5 ${
                    role === 'facility_database_administrator'
                      ? 'bg-emerald-650 text-white font-extrabold shadow-3xs text-[7.5px]'
                      : 'text-slate-400 bg-slate-900 hover:text-white'
                  }`}
                >
                  FDBA
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Navigation Items */}
          <div id="sidebar-navigation-links" className="pt-2">
            <NavMenu idPrefix="desktop" activeView={activeView} onNavigate={goTo} lockedViews={lockedViews} />
          </div>
        </div>
      </aside>

      {/* 2. RESPONSIVE HEADER FOR MOBILE */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-850 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-teal-400 stroke-[2.5]" />
          <div>
            <h1 className="text-xs font-extrabold text-white leading-none">{BRAND.facilityName}</h1>
            <span className="text-[9px] text-slate-400 font-mono">{[BRAND.tagline, BRAND.developerCredit].filter(Boolean).join(' · ')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ProfileDropdown 
            activePatient={activePatient}
            onSelectOption={handleSelectDropdownTab}
            onLogOut={handleSessionLogOut}
          />
          <button 
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-350 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu Overlays */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-30 flex justify-end transition-all">
          <div className="w-64 h-screen sticky top-0 overflow-y-auto bg-slate-900 text-white p-5 space-y-6 animate-in slide-in-from-right duration-250">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Console Navigation</span>
              <button 
                type="button"
                onClick={() => setMobileMenuOpen(false)} 
                className="p-1 hover:bg-slate-800 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Accessibility Security Role Selector */}
            {user ? (
              <AccountPanel user={user} compact onSignOut={signOut} onManageStaff={() => { setShowStaffManager(true); setMobileMenuOpen(false); }} onOpenSetup={() => { setShowIntegrations(true); setMobileMenuOpen(false); }} />
            ) : (
            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2 select-none">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Access Status ({role === 'ops_manager' ? 'L3' : role === 'team_lead' ? 'L2' : role === 'admin' ? 'L1' : 'Guest'})</span>
                <span className={`w-2 h-2 rounded-full ${
                  role === 'ops_manager' ? 'bg-amber-400 animate-ping' :
                  role === 'team_lead' ? 'bg-purple-400' :
                  role === 'admin' ? 'bg-emerald-400' : 'bg-slate-500'
                }`} />
              </div>
              <div className="grid grid-cols-2 gap-1 text-[9px]">
                <button
                  type="button"
                  onClick={() => {
                    setRole('patient');
                    setAdminEditCount(0);
                    setTeamLeadEditCount(0);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1 text-center font-bold rounded ${
                    role === 'patient' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pin = prompt("Enter Level 1 Code (1111):");
                    if (pin === '1111') {
                      setRole('admin');
                      setAdminEditCount(0);
                      setMobileMenuOpen(false);
                    }
                  }}
                  className={`py-1 text-center font-bold rounded ${
                    role === 'admin' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pin = prompt("Enter Level 2 Code (2222):");
                    if (pin === '2222') {
                      setRole('team_lead');
                      setTeamLeadEditCount(0);
                      setMobileMenuOpen(false);
                    }
                  }}
                  className={`py-1 text-center font-bold rounded mt-1 col-span-2 ${
                    role === 'team_lead' ? 'bg-purple-700 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Team Lead (L2 / 2222)
                </button>
              </div>
            </div>
            )}

            <NavMenu idPrefix="mobile" activeView={activeView} onNavigate={goTo} lockedViews={lockedViews} />
          </div>
        </div>
      )}

      {/* 3. PRIMARY CONTENT PANEL */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar for desktop (Dossier search + notifications + clinical quick utilities) */}
        <div className="hidden md:flex bg-white px-6 py-4 border-b border-slate-150 items-center justify-between sticky top-0 z-10 shadow-3xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {viewMeta(activeView).title}
            </h2>
            <p className="text-xs text-slate-500">{viewMeta(activeView).description}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick alert indicator */}
            <div className="relative p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-slate-600 select-none">
              <Bell className="w-4 h-4" />
              <div className="w-2 h-2 bg-rose-500 rounded-full border border-white absolute right-1.5 top-1.5" />
            </div>

            {/* Profile Dropdown */}
            <ProfileDropdown 
              activePatient={activePatient}
              onSelectOption={handleSelectDropdownTab}
              onLogOut={handleSessionLogOut}
            />
          </div>
        </div>

        {/* Dynamic Inner Body rendering */}
        {setupWarning && (
          <div role="alert" className="mx-4 md:mx-8 mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex flex-wrap items-center justify-between gap-2">
            <span><strong>Finish setup:</strong> {setupWarning}</span>
            <button type="button" onClick={() => setShowIntegrations(true)} className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer">Open Setup & integrations</button>
          </div>
        )}

        <section id="application-view-frame" className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-6">
          
          {(() => {
            const isLockedOut = quotaLockedOut;
            const isViewGated = activeView !== 'settings' && (
              (role === 'patient' && activeView !== 'intake') ||
              isLockedOut
            );

            if (isViewGated) {
              return (
                <AdminLockGate 
                  currentRole={role}
                  isLockout={isLockedOut}
                  onUnlock={(unlockedRole) => {
                    setRole(unlockedRole);
                    if (unlockedRole === 'admin') setAdminEditCount(0);
                    if (unlockedRole === 'team_lead') setTeamLeadEditCount(0);
                  }} 
                  requestedSectionName={viewMeta(activeView).title}
                />
              );
            }

            return (
              <>
                {!isViewGated && role !== 'patient' && (activeView === 'database' || activeView === 'intake') && (
                  scannerOpen ? (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <button type="button" onClick={() => toggleScanner(false)} className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer">
                          <ScanLine className="w-3.5 h-3.5" /> Hide scanner
                        </button>
                      </div>
                      <ScanStation
                        patients={patients}
                        onSelectPatientId={(id) => setActivePatientId(id)}
                        onSetScannedIntakeData={(data) => setScannedIntakeData(data)}
                        onSetActiveView={(view) => setActiveView(view)}
                        onLogITEvent={logITEvent}
                      />
                    </div>
                  ) : (
                    <button type="button" id="open-scanner-btn" onClick={() => toggleScanner(true)}
                      className="w-full flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-left hover:border-teal-500 hover:bg-teal-50/40 transition-colors cursor-pointer">
                      <ScanLine className="w-5 h-5 text-teal-600 shrink-0" />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-slate-900">Scan an ID or wristband</span>
                        <span className="block text-xs text-slate-500">Open the scanner to look up a patient or prefill intake from an ID.</span>
                      </span>
                      <span className="text-xs font-bold text-teal-700">Open scanner</span>
                    </button>
                  )
                )}

                {activeView === 'database' && (
                  <PatientsDatabase 
                    patients={patients}
                    onSelectPatient={id => setActivePatientId(id)}
                    onUpdateStatus={handleUpdatePatientStatus}
                    onAddNote={handleAddPatientNote}
                    onInitiateIntake={() => setActiveView('intake')}
                    onLoadTestPatients={role !== 'patient' ? () => handleLoadBetaTestPatients() : undefined}
                    selectedPatientId={activePatientId}
                  />
                )}

                {activeView === 'intake' && (
                  <IntakeForm 
                    onAddPatient={handleAddPatient} 
                    onCancel={() => {
                      setScannedIntakeData(null);
                      setActiveView('database');
                    }} 
                    initialData={scannedIntakeData || undefined}
                  />
                )}

                {activeView === 'billing' && (
                  <BillingManager 
                    patients={patients}
                    invoices={invoices}
                    onPayInvoice={handlePayInvoice}
                    onCreateInvoice={handleCreateInvoice}
                  />
                )}

                {activeView === 'visitation' && (
                  <VisitationOverview 
                    patients={patients}
                    selectedPatientId={activePatientId}
                    onSelectPatient={(id) => setActivePatientId(id)}
                    visitationRecords={visitationRecords}
                    onAddVisitation={handleAddVisitation}
                    onDeleteVisitation={handleDeleteVisitation}
                    isAdmin={isAdmin}
                    role={role}
                    onSetRole={setRole}
                    progressNotes={progressNotes}
                    onUpdateProgressNotes={updateProgressNotes}
                  />
                )}

                {activeView === 'prescriptions' && (
                  <PrescriptionManager 
                    patients={patients}
                    selectedPatientId={activePatientId}
                    onSelectPatient={(id) => setActivePatientId(id)}
                    role={role}
                  />
                )}

                {activeView === 'secure_records' && (
                  <SecureRecordsManager 
                    patients={patients}
                    selectedPatientId={activePatientId}
                    onSelectPatient={(id) => setActivePatientId(id)}
                    visitationRecords={visitationRecords}
                    role={role}
                    onLogITEvent={logITEvent}
                  />
                )}

                {activeView === 'marketing' && !activePatient && renderNoPatientsNotice()}
                {activeView === 'marketing' && activePatient && (
                  <MarketingHub
                    patients={patients}
                    selectedPatientId={activePatientId}
                    onSelectPatient={(id) => setActivePatientId(id)}
                    visitationRecords={visitationRecords}
                    role={role}
                  />
                )}

                {activeView === 'it_support' && (
                  <ITSupportPanel 
                    patients={patients}
                    itEvents={itEvents}
                    onLogITEvent={logITEvent}
                    onMergePatients={handleMergePatients}
                    role={role}
                    onSetRole={setRole}
                  />
                )}

                {activeView === 'diagnostic_database' && (
                  <DiagnosticDatabase 
                    role={role}
                    onSetRole={setRole}
                    onLogITEvent={logITEvent}
                    playBeep={playSynthBeep}
                  />
                )}

                {activeView === 'patient_portal' && !activePatient && renderNoPatientsNotice()}
                {activeView === 'patient_portal' && activePatient && (
                  <PatientPortal
                    activePatient={activePatient}
                    onUpdatePatient={handleUpdatePatient}
                    visitationRecords={visitationRecords}
                    onLogITEvent={logITEvent}
                  />
                )}

                {activeView === 'code_audit' && (
                  <CodeAuditPanel 
                    onLogITEvent={logITEvent}
                    playBeep={playSynthBeep}
                  />
                )}
              </>
            );
          })()}

          {activeView === 'settings' && !activePatient && renderNoPatientsNotice()}
          {activeView === 'settings' && activePatient && (
            <SettingsPanel
              activePatient={activePatient}
              onUpdatePatient={handleUpdatePatient}
              onLogOut={handleSessionLogOut}
              defaultTab={activeSettingsTab}
              patientsListForSwitch={patients}
              onSwitchActivePatient={id => setActivePatientId(id)}
              isAdmin={isAdmin}
              role={role}
              appBrightness={appBrightness}
              onChangeBrightness={setAppBrightness}
              headerFontSize={headerFontSize}
              onChangeHeaderFontSize={setHeaderFontSize}
              audioVolume={audioVolume}
              onChangeAudioVolume={setAudioVolume}
              audioPitch={audioPitch}
              onChangeAudioPitch={setAudioPitch}
              audioMute={audioMute}
              onChangeAudioMute={setAudioMute}
              fdbaUsers={fdbaUsers}
              onChangeFdbaUsers={setFdbaUsers}
              playBeep={playSynthBeep}
              onLogITEvent={logITEvent}
            />
          )}

        </section>

      </main>

    </div>

    {/* Outside the brightness filter so fixed positioning works */}
    <TutorialCenter onNavigate={navigateToSection} demoMode={DEMO_MODE} />
    {showStaffManager && <StaffManager onClose={() => setShowStaffManager(false)} />}
    {showIntegrations && <IntegrationsPanel onClose={() => setShowIntegrations(false)} />}
    </>
  );
}
