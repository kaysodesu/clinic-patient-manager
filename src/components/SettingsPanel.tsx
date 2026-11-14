import React, { useState, useEffect } from 'react';
import { BRAND } from '../config/brand';
import { Patient, FAQItem, ChatMessage, ITEvent } from '../types';
import { initialFAQs } from '../data/mockPatients';
import { ClinicRole } from '../types';
import { 
  User, Shield, CreditCard, HelpCircle, MessageSquare, Mail, Phone, Settings, 
  LogOut, Save, CheckCircle, ArrowRight, CornerDownLeft, Sparkles, Heart, Sun, Volume2, KeyRound, Check, X,
  Download, Database
} from 'lucide-react';

interface SettingsPanelProps {
  activePatient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onLogOut: () => void;
  defaultTab?: 'profile' | 'account' | 'billing' | 'faq' | 'contact' | 'app';
  patientsListForSwitch?: Patient[];
  onSwitchActivePatient?: (id: string) => void;
  isAdmin?: boolean;
  role?: ClinicRole;
  appBrightness?: number;
  onChangeBrightness?: (val: number) => void;
  headerFontSize?: 'h3' | 'h4' | 'h5' | 'h6';
  onChangeHeaderFontSize?: (val: 'h3' | 'h4' | 'h5' | 'h6') => void;
  audioVolume?: number;
  onChangeAudioVolume?: (val: number) => void;
  audioPitch?: 'low' | 'medium' | 'high';
  onChangeAudioPitch?: (val: 'low' | 'medium' | 'high') => void;
  audioMute?: boolean;
  onChangeAudioMute?: (val: boolean) => void;
  fdbaUsers?: any[];
  onChangeFdbaUsers?: (val: any[]) => void;
  playBeep?: () => void;
  onLogITEvent?: (type: ITEvent['type'], details: string, author?: string, status?: ITEvent['status']) => void;
}

export default function SettingsPanel({ 
  activePatient, 
  onUpdatePatient, 
  onLogOut, 
  defaultTab = 'profile',
  patientsListForSwitch = [],
  onSwitchActivePatient,
  isAdmin = true,
  role = 'admin',
  appBrightness = 100,
  onChangeBrightness,
  headerFontSize = 'h3',
  onChangeHeaderFontSize,
  audioVolume = 80,
  onChangeAudioVolume,
  audioPitch = 'medium',
  onChangeAudioPitch,
  audioMute = false,
  onChangeAudioMute,
  fdbaUsers = [],
  onChangeFdbaUsers,
  playBeep,
  onLogITEvent
}: SettingsPanelProps) {
  
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'billing' | 'faq' | 'contact' | 'app'>(defaultTab);

  // Sync tab if parent overrides (e.g. from user dropdown clicks)
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // --- TAB STATE: MY PROFILE ---
  const [firstName, setFirstName] = useState(activePatient?.personalInfo?.firstName || '');
  const [lastName, setLastName] = useState(activePatient?.personalInfo?.lastName || '');
  const [phone, setPhone] = useState(activePatient?.personalInfo?.phone || '');
  const [email, setEmail] = useState(activePatient?.personalInfo?.email || '');
  const [address, setAddress] = useState(activePatient?.personalInfo?.address || '');
  const [city, setCity] = useState(activePatient?.personalInfo?.city || '');
  const [state, setState] = useState(activePatient?.personalInfo?.state || '');
  const [zipCode, setZipCode] = useState(activePatient?.personalInfo?.zipCode || '');
  const [occupation, setOccupation] = useState(activePatient?.employmentCoverage?.occupation || '');
  const [employer, setEmployer] = useState(activePatient?.employmentCoverage?.employerName || '');
  
  // Emergency variables
  const [emName, setEmName] = useState(activePatient?.emergencyContact?.fullName || '');
  const [emPhone, setEmPhone] = useState(activePatient?.emergencyContact?.phone || '');
  const [emRel, setEmRel] = useState(activePatient?.emergencyContact?.relationship || '');

  // Insurance variables
  const [provider, setProvider] = useState(activePatient?.insuranceBilling?.providerName || '');
  const [policy, setPolicy] = useState(activePatient?.insuranceBilling?.policyNo || '');
  const [group, setGroup] = useState(activePatient?.insuranceBilling?.groupNo || '');

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if active patient changes
  useEffect(() => {
    if (activePatient) {
      setFirstName(activePatient.personalInfo?.firstName || '');
      setLastName(activePatient.personalInfo?.lastName || '');
      setPhone(activePatient.personalInfo?.phone || '');
      setEmail(activePatient.personalInfo?.email || '');
      setAddress(activePatient.personalInfo?.address || '');
      setCity(activePatient.personalInfo?.city || '');
      setState(activePatient.personalInfo?.state || '');
      setZipCode(activePatient.personalInfo?.zipCode || '');
      setOccupation(activePatient.employmentCoverage?.occupation || '');
      setEmployer(activePatient.employmentCoverage?.employerName || '');
      setEmName(activePatient.emergencyContact?.fullName || '');
      setEmPhone(activePatient.emergencyContact?.phone || '');
      setEmRel(activePatient.emergencyContact?.relationship || '');
      setProvider(activePatient.insuranceBilling?.providerName || '');
      setPolicy(activePatient.insuranceBilling?.policyNo || '');
      setGroup(activePatient.insuranceBilling?.groupNo || '');
    }
  }, [activePatient]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    const updated: Patient = {
      ...activePatient,
      personalInfo: {
        ...activePatient.personalInfo,
        firstName,
        lastName,
        phone,
        email,
        address,
        city,
        state,
        zipCode
      },
      employmentCoverage: {
        ...activePatient.employmentCoverage,
        employerName: employer,
        occupation
      },
      emergencyContact: {
        ...activePatient.emergencyContact,
        fullName: emName,
        phone: emPhone,
        relationship: emRel
      },
      insuranceBilling: {
        ...activePatient.insuranceBilling,
        providerName: provider,
        policyNo: policy,
        groupNo: group
      }
    };

    onUpdatePatient(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };


  // --- TAB STATE: ACCOUNT SETTINGS ---
  const [twoFactor, setTwoFactor] = useState(true);
  const [smsReminders, setSmsReminders] = useState(true);
  const [emailInvoices, setEmailInvoices] = useState(true);
  const [patientPortalPasscode, setPatientPortalPasscode] = useState('••••••••');


  // --- TAB STATE: BILLING & PAYMENT ---
  const [savedCards, setSavedCards] = useState([
    { brand: 'Visa', last4: '4028', exp: '08/28', default: true },
    { brand: 'Mastercard', last4: '8812', exp: '11/27', default: false },
  ]);
  const [selectedInstAgreement, setSelectedInstAgreement] = useState(false);


  // --- TAB STATE: FAQ ---
  const [faqs, setFaqs] = useState<FAQItem[]>(initialFAQs);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);


  // --- TAB STATE: CONTACT CLINIC (LIVE CHAT) ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    { id: '1', sender: 'clinic', text: `Hello, ${activePatient?.personalInfo?.firstName || 'Valued Patient'}! I am the Portland Clinic virtual triage receptionist. How can I assist you with your records or billing questions today?`, timestamp: '09:00 AM' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailTicketSent, setEmailTicketSent] = useState(false);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const originalText = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // AI/clinical simulated response generator
    setTimeout(() => {
      let responseText = "Thank you for that message. I am passing these diagnostic notes to the triage supervisor. How else can I assist?";
      const msgLower = originalText.toLowerCase();

      if (msgLower.includes('billing') || msgLower.includes('invoice') || msgLower.includes('charge') || msgLower.includes('payment')) {
        responseText = `Registered medical copays are processed under the 'Billing Module' screen on the sidebar dashboard. Your standard copay for your carrier coverage is $${activePatient.insuranceBilling.copayAmount}. You can clear outstanding balances securely online.`;
      } else if (msgLower.includes('symptom') || msgLower.includes('hurt') || msgLower.includes('cough') || msgLower.includes('pain')) {
        responseText = `I have logged your symptom updates in your patient dossier. A clinical assistant will confirm diagnostic tests when you check in at our primary physical location today.`;
      } else if (msgLower.includes('insurance') || msgLower.includes('policy')) {
        responseText = `Our patient databases currently have you down for secondary billing with: ${activePatient.insuranceBilling.providerName}. Let me know if you would like to edit these policy digits.`;
      } else if (msgLower.includes('painless') || msgLower.includes('hello') || msgLower.includes('hi')) {
        responseText = `Hi! Let me know if you have questions about clinic scheduling, your active insurance deductible status, or prescription updates of OTC declarations.`;
      }

      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'clinic',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSendEmailTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTicketSent(true);
    setTimeout(() => {
      setEmailTicketSent(false);
      setEmailSubject('');
      setEmailMessage('');
    }, 4000);
  };


  // --- TAB STATE: APPLICATION SETTINGS ---
  const [appTheme, setAppTheme] = useState('Clean light');
  const [soundEffects, setSoundEffects] = useState(true);
  const [interfaceScale, setInterfaceScale] = useState('Comfortable Standard');

  // --- DATABASE SNAPSHOT BACKUP STATES ---
  const [dbStats, setDbStats] = useState({
    patients: 0,
    invoices: 0,
    visitations: 0,
    itEvents: 0,
    fdbaUsers: 0
  });

  const [backupStatus, setBackupStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    try {
      const p = localStorage.getItem('clinic_patients');
      const i = localStorage.getItem('clinic_invoices');
      const v = localStorage.getItem('clinic_visitation_records');
      const e = localStorage.getItem('clinic_it_events');
      const f = localStorage.getItem('clinic_fdba_permissions');

      setDbStats({
        patients: p ? JSON.parse(p).length : patientsListForSwitch.length,
        invoices: i ? JSON.parse(i).length : 0,
        visitations: v ? JSON.parse(v).length : 0,
        itEvents: e ? JSON.parse(e).length : 0,
        fdbaUsers: f ? JSON.parse(f).length : fdbaUsers.length
      });
    } catch (err) {
      console.warn("Failed to load db stats for backup panel", err);
    }
  }, [patientsListForSwitch, fdbaUsers, activeTab]);

  const handleExportData = () => {
    try {
      const p = localStorage.getItem('clinic_patients');
      const i = localStorage.getItem('clinic_invoices');
      const v = localStorage.getItem('clinic_visitation_records');
      const e = localStorage.getItem('clinic_it_events');
      const f = localStorage.getItem('clinic_fdba_permissions');

      const parsedPatients = p ? JSON.parse(p) : patientsListForSwitch;
      const parsedInvoices = i ? JSON.parse(i) : [];
      const parsedVisitations = v ? JSON.parse(v) : [];
      const parsedItEvents = e ? JSON.parse(e) : [];
      const parsedFdbaUsers = f ? JSON.parse(f) : fdbaUsers;

      const backupData = {
        backupMetadata: {
          facilityName: BRAND.facilityName,
          exportedAt: new Date().toISOString(),
          operatorRole: role,
          operatorName: activePatient ? `${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName}` : "Unknown Operator",
          operatorEmail: activePatient ? activePatient.personalInfo.email : "unknown@example.com",
          backupVersion: "1.0",
          stats: {
            patientsCount: parsedPatients.length,
            invoicesCount: parsedInvoices.length,
            visitationRecordsCount: parsedVisitations.length,
            itEventsCount: parsedItEvents.length,
            fdbaUsersCount: parsedFdbaUsers.length
          }
        },
        patients: parsedPatients,
        invoices: parsedInvoices,
        visitationRecords: parsedVisitations,
        itEvents: parsedItEvents,
        fdbaUsers: parsedFdbaUsers
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `cascade_clinic_backup_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupStatus('success');
      
      if (onLogITEvent) {
        onLogITEvent(
          'OTHER',
          `Manual clinic database backup snapshot downloaded successfully (${parsedPatients.length} patients, ${parsedInvoices.length} invoices, ${parsedVisitations.length} visits)`,
          undefined,
          'SUCCESS'
        );
      }

      if (playBeep) {
        playBeep();
      }

      setTimeout(() => setBackupStatus('idle'), 4500);
    } catch (error) {
      console.error("Export backup failed:", error);
      setBackupStatus('error');
      setTimeout(() => setBackupStatus('idle'), 4500);
    }
  };


  // Filtered FAQs
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div id="settings-panel-container" className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
      
      {/* Sidebar navigation */}
      <div className="bg-white rounded-2xl border border-slate-150 p-4 space-y-4 shadow-xs md:col-span-1">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 bg-teal-500 text-teal-950 font-bold flex items-center justify-center rounded-xl shrink-0">
            {activePatient ? `${activePatient.personalInfo?.firstName?.[0] || ''}${activePatient.personalInfo?.lastName?.[0] || ''}` : "U"}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-800 truncate">
              {activePatient ? `${activePatient.personalInfo?.firstName} ${activePatient.personalInfo?.lastName}` : "User Profile"}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 block truncate">{activePatient ? activePatient.id : "Loading..."}</span>
          </div>
        </div>

        <nav id="settings-nav-sidebar" className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'profile' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            My Patient Profile
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'account' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            Account Settings
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'billing' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            Billing & Payments
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'faq' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            Clinic Help & FAQ
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'contact' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            Contact & Live Chat
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('app')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'app' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Application Settings
          </button>
        </nav>

        {/* Patients quick switch simulator (Staff review benefit) */}
        {patientsListForSwitch.length > 0 && onSwitchActivePatient && (
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Demo Quick Swapper</span>
              {!isAdmin && (
                <span className="text-[9px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded font-bold border border-amber-100">Locked</span>
              )}
            </div>
            {isAdmin ? (
              <select
                value={activePatient.id}
                onChange={e => onSwitchActivePatient(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-205 rounded text-xs text-slate-700 bg-slate-50 font-sans cursor-pointer"
              >
                {patientsListForSwitch.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.personalInfo.firstName} {p.personalInfo.lastName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[10px] text-slate-500 leading-normal p-2 bg-slate-50 rounded border border-slate-150">
                🔒 Swapping demographic active files is restricted to <strong>Clinic Admins</strong>. Use role toggle to unlock.
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onLogOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-650 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log Out Session
          </button>
        </div>
      </div>

      {/* Main Settings Panel Body */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 md:p-8 shadow-xs md:col-span-3">
        
        {/* TAB 1: EDIT PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Personal Information Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage live records, contact details, emergency liason protocols.</p>
              </div>
              <User className="w-5 h-5 text-teal-600" />
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-150 px-4 py-3 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Dossier saved successfully and persisted locally!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Direct Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs font-sans"
                  />
                </div>
              </div>

              {/* Address details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Residential Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      maxLength={2}
                      className="w-full px-2 py-2 border border-slate-205 rounded-lg text-xs text-center uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Zip</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={e => setZipCode(e.target.value)}
                      className="w-full px-2 py-2 border border-slate-205 rounded-lg text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Career Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Occupation Title</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Active Employer Name</label>
                  <input
                    type="text"
                    value={employer}
                    onChange={e => setEmployer(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Emergency details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Emergency Liaison name</label>
                  <input
                    type="text"
                    value={emName}
                    onChange={e => setEmName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Liaison Contact Phone</label>
                  <input
                    type="tel"
                    value={emPhone}
                    onChange={e => setEmPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Liaison Relationship</label>
                  <input
                    type="text"
                    value={emRel}
                    onChange={e => setEmRel(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Primary Insurance Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Insurance Carrier</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Policy Contract Identifier</label>
                  <input
                    type="text"
                    value={policy}
                    onChange={e => setPolicy(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Carrier Group ID</label>
                  <input
                    type="text"
                    value={group}
                    onChange={e => setGroup(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Updated Patient Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: ACCOUNT SETTINGS */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Patient Account Toggles</h3>
                <p className="text-xs text-slate-500 mt-0.5">Control login factors, email subscriptions, SMS alerts.</p>
              </div>
              <Shield className="w-5 h-5 text-teal-600" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-150">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Multifactor Authorization (MFA)</span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block max-w-sm">Requires cell confirmation code check upon reviewing digital health results.</span>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={e => setTwoFactor(e.target.checked)}
                  className="w-4.5 h-4.5 text-teal-600 focus:ring-teal-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-150">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Symptom & Checklist Progress Text (SMS)</span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block max-w-sm">Allows the processing desk to trigger real-time updates regarding clinic wait durations.</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsReminders}
                  onChange={e => setSmsReminders(e.target.checked)}
                  className="w-4.5 h-4.5 text-teal-600 focus:ring-teal-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-150">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Automated Invoice Emails</span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block max-w-sm">Receive detailed electronic statements for deductibles, copay lines directly to inbox.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailInvoices}
                  onChange={e => setEmailInvoices(e.target.checked)}
                  className="w-4.5 h-4.5 text-teal-600 focus:ring-teal-500 rounded cursor-pointer"
                />
              </div>

              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-150 text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold block mb-1">Administrative Privity Note:</span>
                Medical data stored on this server is governed by standard clinical privacy safeguards and HIPAA compliance protocols. Changing authorization passcodes demands a physical identification evaluation at the clinical lobby counter.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BILLING & PAYMENT SETTINGS */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Billing Profile & Payment Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Edit saved transaction instruments, installment rules.</p>
              </div>
              <CreditCard className="w-5 h-5 text-teal-600" />
            </div>

            <div className="space-y-5">
              {/* Copay highlights */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Patient Copay Tier</span>
                  <strong className="text-xl text-teal-700">${activePatient.insuranceBilling.copayAmount} Copay Agreed</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Assigned Insurance Group</span>
                  <strong className="text-sm text-slate-800 block mt-1 truncate">{activePatient.insuranceBilling.providerName || 'Self-pay'}</strong>
                  <span className="text-[9px] text-slate-450 font-mono font-bold block">ID: {activePatient.insuranceBilling.policyNo}</span>
                </div>
              </div>

              {/* Cards block */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-3.5">Settlement Instruments on File</span>
                <div className="space-y-2">
                  {savedCards.map((card, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition-all font-sans">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-800 font-mono text-xs font-extrabold uppercase select-none">
                          {card.brand[0]}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{card.brand} ends in •••• {card.last4}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">Expires {card.exp}</span>
                        </div>
                      </div>
                      {card.default ? (
                        <span className="text-[9px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-150 select-none">Primary</span>
                      ) : (
                        <button type="button" className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer">Set Default</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Installment option */}
              <div className="flex items-start gap-3 p-4 bg-sky-50/70 border border-sky-150 rounded-xl">
                <input
                  type="checkbox"
                  id="install-agree"
                  checked={selectedInstAgreement}
                  onChange={e => setSelectedInstAgreement(e.target.checked)}
                  className="w-4.5 h-4.5 text-sky-600 focus:ring-sky-500 rounded mt-0.5 cursor-pointer animate-pulse"
                />
                <label htmlFor="install-agree" className="text-xs leading-relaxed text-sky-950 cursor-pointer">
                  <span className="font-bold block">Opt-in to Installment Terms Plan</span>
                  Automatically split patient out-of-pocket charges exceeding $500.00 into **3 recurring monthly billing cycles** at 0% interest rate.
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CLINIC FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Clinical Directory Guidance & FAQs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Search rules for deductibles, symptom checkins, and medical histories.</p>
              </div>
              <HelpCircle className="w-5 h-5 text-teal-600" />
            </div>

            {/* Q search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search queries: deductible, allergies, invoice..."
                value={faqSearch}
                onChange={e => setFaqSearch(e.target.value)}
                className="w-full px-4 py-2 border border-slate-250 rounded-xl text-xs"
              />
            </div>

            {/* Accordion list */}
            <div className="space-y-3.5">
              {filteredFaqs.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No matching clinic guideline matches query.</p>
              ) : (
                filteredFaqs.map(faq => {
                  const isExpanded = expandedFaq === faq.id;
                  return (
                    <div 
                      key={faq.id} 
                      className="border border-slate-205 rounded-xl overflow-hidden hover:border-slate-350 transition-all cursor-pointer bg-slate-50/20"
                      onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    >
                      <div className="p-4 flex items-center justify-between gap-3 select-none">
                        <div className="space-y-1">
                          <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                            faq.category === 'Billing' ? 'bg-amber-100 text-amber-800' :
                            faq.category === 'Insurance' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {faq.category}
                          </span>
                          <span className="text-xs font-bold text-slate-800 block leading-tight pt-1">{faq.question}</span>
                        </div>
                        <ArrowRight className={`w-4 h-4 text-slate-400 shrink-0 transition-all ${isExpanded ? 'rotate-90 text-teal-600' : ''}`} />
                      </div>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1.5 border-t border-slate-150 text-xs text-slate-650 leading-relaxed font-sans bg-white">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CONTACT CLINIC (LIVE CHAT & FORMS) */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Contact Desk / Live Receptionist</h3>
                <p className="text-xs text-slate-500 mt-0.5">Reach clinical operators immediately via live chat, secure email, or phone lines.</p>
              </div>
              <MessageSquare className="w-5 h-5 text-teal-600" />
            </div>

            {/* Grid for Contacts and Chat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Traditional phone / email */}
              <div className="space-y-4 md:col-span-1">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3 shadow-xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Portland Clinic Reception</span>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                    <strong>(555) 555-0100</strong>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate">reception@example.com</span>
                  </div>

                  <div className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-205">
                    <strong>Clinic Location Premises:</strong><br />
                    {BRAND.facilityName}, {BRAND.facilityAddress}
                  </div>
                </div>

                {/* Email Ticketer */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Submit Care Query Ticket</span>
                  
                  {emailTicketSent ? (
                    <div className="p-2.5 bg-teal-50 border border-teal-150 text-teal-800 text-[11px] font-semibold rounded-lg">
                      Clinic ticket received! An triage nurse will respond to your primary email address.
                    </div>
                  ) : (
                    <form onSubmit={handleSendEmailTicket} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={emailSubject}
                          onChange={e => setEmailSubject(e.target.value)}
                          placeholder="Subject of clinical help"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-250 bg-white rounded-lg"
                        />
                      </div>
                      <div>
                        <textarea
                          required
                          rows={2}
                          value={emailMessage}
                          onChange={e => setEmailMessage(e.target.value)}
                          placeholder="Type inquiry description..."
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-250 bg-white rounded-lg font-sans"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        File Electronic Inquiry
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Column: Virtual Assistant Live Chat */}
              <div className="md:col-span-2 border border-slate-150 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[350px] bg-white">
                <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-xs font-bold">Clinical virtual chatbot reception</span>
                  </div>
                  <span className="text-[10px] font-mono text-teal-400 uppercase">Live</span>
                </div>

                {/* Messages Body */}
                <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1 bg-slate-50">
                  {chatMessages.map(msg => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[85%] ${
                          isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div className={`p-3 rounded-2xl leading-relaxed font-sans ${
                          isUser 
                            ? 'bg-teal-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 border border-slate-205 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono mt-1">{msg.timestamp}</span>
                      </div>
                    );
                  })}
                  
                  {isTyping && (
                    <div className="flex gap-1 items-center bg-white border border-slate-200 px-3 py-2 rounded-xl max-w-[50px] text-center">
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-bounce" />
                    </div>
                  )}
                </div>

                {/* Input block */}
                <form onSubmit={handleSendChatMessage} className="p-2 border-t border-slate-150 bg-white flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    placeholder="Ask about copays, list symptoms..."
                    className="flex-1 px-3 py-2 text-xs border border-transparent focus:border-slate-250 focus:outline-none transition-all font-sans"
                  />
                  <button 
                    type="submit" 
                    className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all select-none cursor-pointer"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: APPLICATION SETTINGS */}
        {activeTab === 'app' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Application & Accessibility Presets</h3>
                <p className="text-xs text-slate-500 mt-0.5">Control console brightness overlays, header typography density, and audio synthesis chimes.</p>
              </div>
              <Settings className="w-5 h-5 text-teal-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Visual & Display Settings */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
                <h4 className="text-xs font-black font-mono uppercase tracking-widest text-slate-450 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Display & Headings Options</span>
                </h4>

                {/* Brightness Adjustment */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Console Display Brightness</span>
                    <span className="font-mono text-teal-600 font-extrabold">{appBrightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="55"
                    max="120"
                    value={appBrightness}
                    onChange={e => onChangeBrightness && onChangeBrightness(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <p className="text-[10px] text-slate-400">Updates visual contrast filters instantly across active views.</p>
                </div>

                {/* Header Font Size Adjustments */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-slate-700">Primary Header Font Size Scaling</label>
                  <select
                    value={headerFontSize}
                    onChange={e => onChangeHeaderFontSize && onChangeHeaderFontSize(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs transition-colors focus:ring-1 focus:ring-teal-500 outline-none"
                  >
                    <option value="h3">h3 - Standard Clinical Heading (1.25rem)</option>
                    <option value="h4">h4 - Medium Density Heading (1.125rem)</option>
                    <option value="h5">h5 - Compact Detail Heading (1.0rem)</option>
                    <option value="h6">h6 - Ultra-dense Header Scale (0.875rem)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">Dynamically overrides master system h3 tags from h3 to h6 range.</p>
                </div>
              </div>

              {/* Right Column: Audio Adjustments Engine */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
                <h4 className="text-xs font-black font-mono uppercase tracking-widest text-slate-450 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                  <span>Audio Feedback Synthesizer</span>
                </h4>

                {/* Mute Toggler */}
                <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-705 block">Mute System Chimes</span>
                    <span className="text-[10px] text-slate-400 block block">Instantly silences feedback audio.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioMute}
                    onChange={e => onChangeAudioMute && onChangeAudioMute(e.target.checked)}
                    className="w-4.5 h-4.5 text-teal-600 focus:ring-teal-500 rounded cursor-pointer accent-teal-600"
                  />
                </div>

                {/* Volume Slider */}
                <div className="space-y-2 opacity-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Synthesizer Volume Control</span>
                    <span className="font-mono text-emerald-600 font-extrabold">{audioVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    disabled={audioMute}
                    value={audioVolume}
                    onChange={e => onChangeAudioVolume && onChangeAudioVolume(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-505 disabled:opacity-30 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Pitch Scaler */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 align-bottom">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Feedback Pitch Frequency</label>
                    <select
                      disabled={audioMute}
                      value={audioPitch}
                      onChange={e => onChangeAudioPitch && onChangeAudioPitch(e.target.value as any)}
                      className="w-full px-2 py-1.5 border border-slate-250 bg-white rounded-xl text-xs outline-none disabled:opacity-35"
                    >
                      <option value="low">Low (180 Hz)</option>
                      <option value="medium">Medium (320 Hz)</option>
                      <option value="high">High (600 Hz)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={audioMute}
                      onClick={() => playBeep && playBeep()}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all disabled:opacity-35 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Test Beep Chime</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTRAL PORTION: MANUAL CLINIC DATABASE BACKUP EXPORTER */}
            <div className="border border-slate-200 bg-white rounded-3xl p-5 shadow-xs space-y-4">
              <div className="border-b pb-3 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-600" />
                    <span>Database Backups & Data Export</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate and download a comprehensive JSON snapshot of local records for manual offline archival.
                  </p>
                </div>
                <span className="text-[10px] font-bold tracking-wide py-1 px-2.5 rounded-full uppercase bg-teal-50 border border-teal-100 text-teal-700 font-mono">
                  Active Local Instance
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Patients</span>
                  <strong className="text-sm text-slate-800 font-mono">{dbStats.patients}</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Invoices</span>
                  <strong className="text-sm text-slate-800 font-mono">{dbStats.invoices}</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Visitations</span>
                  <strong className="text-sm text-slate-800 font-mono">{dbStats.visitations}</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">IT Log Events</span>
                  <strong className="text-sm text-slate-800 font-mono">{dbStats.itEvents}</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">FDBA Users</span>
                  <strong className="text-sm text-slate-800 font-mono">{dbStats.fdbaUsers}</strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-md">
                  Exporting consolidates active patient registers, billing invoices, visitation histories, and IT audit events into a standard JSON snapshot. Keep this file stored in a safe, secure offline storage location.
                </p>
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Generate & Download JSON Snapshot</span>
                  </button>
                </div>
              </div>

              {backupStatus === 'success' && (
                <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Manual backup download successfully initiated! Local clinic snapshot saved to your computer.</span>
                </div>
              )}

              {backupStatus === 'error' && (
                <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Export failed. Please check your browser permissions or storage allocation and retry.</span>
                </div>
              )}
            </div>

            {/* HIPAA COMPLIANCE & SECURE CLINICAL DEPLOYMENT GUIDELINE DISCLAIMER */}
            <div className="border border-teal-200 bg-teal-50/20 rounded-3xl p-5 shadow-xs space-y-4 text-left">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>HIPAA Compliance & Secure Clinical Deployment Notice</span>
                    <span className="text-[9px] font-bold tracking-wide py-0.5 px-2 rounded bg-teal-50 border border-teal-100 text-teal-700 uppercase">
                      Architecture Assessment
                    </span>
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    This software currently relies on <strong>local sandbox browser storage</strong> (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-teal-700 text-[11px]">localStorage</code>) and <strong>in-memory Express full-stack API simulation routes</strong> for data persistence. This layout is designed exclusively for demonstration, prototype development, buyer evaluations, and audit assessments.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    To transition this clinical system into live patient care environments or achieve complete regulatory certification, healthcare purchasers must establish the following HIPAA compliant infrastructure:
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc pt-1">
                    <li><strong>Secure Cloud Databases:</strong> Integrate durable, HIPAA-compliant storage layers like Google Cloud SQL with PostgreSQL, or Google Cloud Spanner, and Firestore.</li>
                    <li><strong>Encryption at Rest & In Transit:</strong> Configure full AES-256 database encryption-at-rest keys and strictly mandate TLS 1.3 encryption-in-transit across all server paths.</li>
                    <li><strong>Identity Management & BAA:</strong> Execute Business Associate Agreements (BAA) with all cloud hosting providers, and bind access to enterprise OAuth services.</li>
                    <li><strong>Clinical Auditing & Monitoring:</strong> Pipe Express logs directly to secure audit stores for long-term system trace integrity.</li>
                  </ul>
                  <div className="text-[10px] text-slate-400 pt-2 font-mono italic">
                    Reference Code Audit: HIPA_STRLG_2026_SANDBOX_STUB
                  </div>
                </div>
              </div>
            </div>

            {/* LOWER PORTION: FDBA SPECIFIC USER ROLE PERMISSION ASSIGNER */}
            <div className="border border-slate-200 bg-white rounded-3xl p-5 shadow-xs space-y-4">
              <div className="border-b pb-3 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>Administrator Directory & Role Permissions</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Define write permissions, deduplication, and export schemas for database administrator profiles.</p>
                </div>
                <span className="text-[10px] font-bold tracking-wide py-1 px-2 rounded-full uppercase bg-slate-100 border text-slate-650">
                  FDBA Restricted Controls
                </span>
              </div>

              {role === 'facility_database_administrator' ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl flex gap-2 w-full text-xs text-emerald-800">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Access Validated:</strong> You are authenticated with the title <strong>Facility Database Administrator</strong>. You hold priority clearance to edit or strip individual database administrators' permission flags.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fdbaUsers.map((user, uidx) => {
                      const allPerms = ["Update Diagnostic Codes", "Import Custom Codebooks", "De-duplicate Clinical Master", "Export Shared Directory"];
                      return (
                        <div key={user.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/30 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-xs text-slate-900 block font-bold">{user.name}</strong>
                              <span className="text-[10px] text-slate-450 font-mono italic">{user.email}</span>
                            </div>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-emerald-100/50 text-emerald-850 rounded">
                              {user.id}
                            </span>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-150">
                            <span className="text-[9px] text-slate-450 uppercase font-black tracking-wider block">Assigned Database Permissions</span>
                            <div className="grid grid-cols-1 gap-1.5">
                              {allPerms.map((perm, pidx) => {
                                const isChecked = user.permissions.includes(perm);
                                return (
                                  <label key={pidx} className="flex items-center gap-2 text-xs text-slate-705 p-1 hover:bg-slate-100 rounded-lg cursor-pointer transition select-none">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const updated = fdbaUsers.map(u => {
                                          if (u.id === user.id) {
                                            const hasPerm = u.permissions.includes(perm);
                                            const newPerms = hasPerm 
                                              ? u.permissions.filter((p: string) => p !== perm) 
                                              : [...u.permissions, perm];
                                            return { ...u, permissions: newPerms };
                                          }
                                          return u;
                                        });
                                        if (onChangeFdbaUsers) {
                                          onChangeFdbaUsers(updated);
                                          playBeep && playBeep();
                                        }
                                      }}
                                      className="w-4 h-4 text-emerald-600 rounded border-slate-350 accent-emerald-600"
                                    />
                                    <span>{perm}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-55 text-slate-650 p-6 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center text-center space-y-3.5">
                  <div className="w-11 h-11 bg-rose-50 border border-rose-100 text-rose-550 rounded-2xl flex items-center justify-center">
                    <Shield className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-1">
                    <strong className="text-xs text-rose-900 font-extrabold block uppercase tracking-tight">Console Lock: Database Admin Control Section</strong>
                    <span className="text-[11px] text-slate-450 block max-w-md leading-relaxed">
                      This manager allows adding and removing administrative database permissions from users with the title <strong>facility database administrator</strong> ONLY. Autoregister FDBA clearance code: <strong>9999</strong> via the Diagnostic Database panel to unlock.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
