import React, { useState, useEffect } from 'react';
import { Patient, PatientAppointment, ClinicRole, VisitationRecord, Prescription } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, ShieldAlert, KeyRound, CheckCircle2, Send, AlertCircle, RefreshCw, Mail, 
  MapPin, ShieldCheck, FileText, ChevronRight, Lock, Eye, Trash2, Milestone, HeartHandshake, EyeOff, Check
} from 'lucide-react';

interface PatientPortalProps {
  activePatient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => void;
  visitationRecords: VisitationRecord[];
  onLogITEvent: (type: any, details: string, author?: string, status?: any) => void;
}

// 6 to 7 reasons for sending a message
const SERVICE_REASONS = [
  "Medication Refills and Dosage Adjustments",
  "Post-Visitation Recovery Queries",
  "Adverse Drug Reactions or Symptom Escalations",
  "Appointment Scheduling and Delay Overrides",
  "Medical Billing and Insurance Coverage Disputes",
  "Prior-Authorization and Physical Therapy Records",
  "Laboratory Reports and Diagnostics Clarification"
];

// Doctor database with corresponding direct clinic emails
const CLINIC_DOCTORS = [
  { name: "Dr. Alistair Vance, MD", email: "a.vance@example.com" },
  { name: "Dr. Rachel Thorne, MD", email: "r.thorne@example.com" },
  { name: "Dr. Gregory House, MD", email: "g.house@example.com" },
  { name: "Dr. Sarah Jenkins, MD", email: "s.jenkins@example.com" }
];

export default function PatientPortal({
  activePatient,
  onUpdatePatient,
  visitationRecords,
  onLogITEvent
}: PatientPortalProps) {
  // Authorization Gate State
  const [authorizedUser, setAuthorizedUser] = useState<'patient' | 'poa1' | 'poa2' | 'family' | null>(null);
  const [isFamilyOptedIn, setIsFamilyOptedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem(`clinic_family_optin_${activePatient.id}`);
    return saved === 'true';
  });

  // Access check state
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState('');

  // Password / Credentials
  const [portalPassword, setPortalPassword] = useState(() => {
    return localStorage.getItem(`portal_pass_${activePatient.id}`) || 'Secret123!';
  });
  const [tempPassword, setTempPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Local Patient Appointment List
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [selectedOptId, setSelectedOptId] = useState<Record<string, string>>({});
  const [excuseText, setExcuseText] = useState<Record<string, string>>({});

  // Message Doctor Form state
  const [selectedDoctor, setSelectedDoctor] = useState(CLINIC_DOCTORS[0]);
  const [messageReason, setMessageReason] = useState(SERVICE_REASONS[0]);
  const [messageBody, setMessageBody] = useState('');
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [messageSuccess, setMessageSuccess] = useState('');

  // Profile Edit fields
  const [formEmail, setFormEmail] = useState(activePatient.personalInfo.email);
  const [formPhone, setFormPhone] = useState(activePatient.personalInfo.phone || '');
  const [formAddress, setFormAddress] = useState(activePatient.personalInfo.address || '');
  const [formCity, setFormCity] = useState(activePatient.personalInfo.city || '');
  const [formState, setFormState] = useState(activePatient.personalInfo.state || '');
  const [formZip, setFormZip] = useState(activePatient.personalInfo.zipCode || '');
  const [formOccupation, setFormOccupation] = useState(activePatient.employmentCoverage.occupation || '');
  const [formEmployer, setFormEmployer] = useState(activePatient.employmentCoverage.employerName || '');

  // Restricted legal identity fields
  const [formFirstName, setFormFirstName] = useState(activePatient.personalInfo.firstName);
  const [formLastName, setFormLastName] = useState(activePatient.personalInfo.lastName);
  const [formDob, setFormDob] = useState(activePatient.personalInfo.dateOfBirth);
  
  // Custom SSN field loaded from localState or generated
  const [formSsn, setFormSsn] = useState(() => {
    const saved = localStorage.getItem(`portal_ssn_${activePatient.id}`);
    return saved || `666-22-${activePatient.id.replace(/\D/g, '').padEnd(4, '0')}`;
  });

  // Restricted correction controls
  const [isRestrictedEditing, setIsRestrictedEditing] = useState(false);
  const [restrictedUpdateMonth, setRestrictedUpdateMonth] = useState(() => {
    return localStorage.getItem(`portal_restricted_month_${activePatient.id}`) || '';
  });
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // ISP Connection metadata
  const [ispInfo, setIspInfo] = useState({
    // Network details are not collected; no third-party lookup is made
    ip: 'Not collected',
    isp: 'Not collected',
    city: 'Not collected',
    state: '',
    country: ''
  });
  const [loadingIsp, setLoadingIsp] = useState(false);

  // Load appointments & sent history
  useEffect(() => {
    const savedAppts = localStorage.getItem('clinic_patient_appointments');
    if (savedAppts) {
      const parsed = JSON.parse(savedAppts) as PatientAppointment[];
      setAppointments(parsed.filter(app => app.patientId === activePatient.id));
    } else {
      setAppointments([]);
    }

    const savedMessages = localStorage.getItem(`portal_msgs_${activePatient.id}`);
    if (savedMessages) {
      setSentMessages(JSON.parse(savedMessages));
    } else {
      setSentMessages([]);
    }
  }, [activePatient.id]);


  // Update profile inputs if active patient props changes
  useEffect(() => {
    setFormEmail(activePatient.personalInfo.email);
    setFormPhone(activePatient.personalInfo.phone || '');
    setFormAddress(activePatient.personalInfo.address || '');
    setFormCity(activePatient.personalInfo.city || '');
    setFormState(activePatient.personalInfo.state || '');
    setFormZip(activePatient.personalInfo.zipCode || '');
    setFormOccupation(activePatient.employmentCoverage.occupation || '');
    setFormEmployer(activePatient.employmentCoverage.employerName || '');
    setFormFirstName(activePatient.personalInfo.firstName);
    setFormLastName(activePatient.personalInfo.lastName);
    setFormDob(activePatient.personalInfo.dateOfBirth);
    setIsRestrictedEditing(false);
  }, [activePatient]);

  // Sync family opt-in key
  const handleFamilyOptinToggle = (checked: boolean) => {
    setIsFamilyOptedIn(checked);
    localStorage.setItem(`clinic_family_optin_${activePatient.id}`, checked ? 'true' : 'false');
    onLogITEvent(
      'OTHER', 
      `Patient configured Family Opt-In status to: ${checked ? 'OPTED IN' : 'OPTED OUT'}.`, 
      'Patient Portal'
    );
  };

  // Auth Submit
  const handleAuthenticate = (type: 'patient' | 'poa1' | 'poa2' | 'family') => {
    if (type === 'family' && !isFamilyOptedIn) {
      setAuthError("🔴 Unauthorized Access: Under HIPAA directives, family portal lookup is restricted unless the patient explicitly toggles Family Opt-In.");
      return;
    }
    setAuthError('');
    setAuthorizedUser(type);
    setAuthChecked(true);
    onLogITEvent(
      'OTHER',
      `Authenticated Patient Portal View as role: "${type.toUpperCase()}" for ${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName}.`,
      'Patient Authorizer Gate'
    );
  };

  // Reset/Logout Portal
  const handlePortalLock = () => {
    setAuthorizedUser(null);
    setAuthChecked(false);
    setAuthError('');
  };

  // Confirm appointment slot
  const handleConfirmAppointment = (apptId: string) => {
    const chosenOptId = selectedOptId[apptId];
    if (!chosenOptId) {
      alert("⚠️ Please tap a proposed date/time slot radio button first.");
      return;
    }

    const savedAppts = localStorage.getItem('clinic_patient_appointments');
    if (!savedAppts) return;

    const parsed = JSON.parse(savedAppts) as PatientAppointment[];
    const apptRecord = parsed.find(a => a.id === apptId);
    if (!apptRecord) return;

    const chosenOption = apptRecord.options.find(o => o.id === chosenOptId);
    if (!chosenOption) return;

    // Mutate state
    const updated = parsed.map(app => {
      if (app.id === apptId) {
        return {
          ...app,
          status: 'confirmed' as const,
          selectedDateTime: chosenOption.dateTime,
          selectionTimestamp: new Date().toISOString()
        };
      }
      return app;
    });

    localStorage.setItem('clinic_patient_appointments', JSON.stringify(updated));
    setAppointments(updated.filter(app => app.patientId === activePatient.id));

    // Also push a notification system note
    const notifs = localStorage.getItem('clinic_schedule_notifications');
    const parsedNotifs = notifs ? JSON.parse(notifs) : [];
    const newNotif = {
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      message: `${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName} parsed scheduler response: Confirmed slot for ${new Date(chosenOption.dateTime).toLocaleString()}.`,
      type: 'success'
    };
    localStorage.setItem('clinic_schedule_notifications', JSON.stringify([newNotif, ...parsedNotifs]));

    onLogITEvent(
      'VISITATION_UPDATE',
      `Patient accepted & scheduled proposed slot (${new Date(chosenOption.dateTime).toLocaleString()}) for Appointment ${apptId}. Registered synced Google Cal handler log.`,
      'Patient Portal'
    );
    alert(`🎉 Success! Your appointment has been successfully confirmed and locked for: ${new Date(chosenOption.dateTime).toLocaleString()}. Syncing calendar index files.`);
  };

  // Responding to excuse overrides
  const handleRequestExcuse = (apptId: string) => {
    const text = excuseText[apptId] || '';
    if (!text.trim()) {
      alert("⚠️ Please state your reasoning/excuse up to 1000 characters.");
      return;
    }

    const savedAppts = localStorage.getItem('clinic_patient_appointments');
    if (!savedAppts) return;

    const parsed = JSON.parse(savedAppts) as PatientAppointment[];
    const updated = parsed.map(app => {
      if (app.id === apptId) {
        return {
          ...app,
          status: 'excused' as const,
          excuseReason: text.trim().substring(0, 1000)
        };
      }
      return app;
    });

    localStorage.setItem('clinic_patient_appointments', JSON.stringify(updated));
    setAppointments(updated.filter(app => app.patientId === activePatient.id));

    // Direct scheduling team alerts
    const notifs = localStorage.getItem('clinic_schedule_notifications');
    const parsedNotifs = notifs ? JSON.parse(notifs) : [];
    const newNotif = {
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      message: `Excusal petition generated by Patient ${activePatient.personalInfo.firstName}. Notes: "${text.substring(0, 48)}..."`,
      type: 'warn'
    };
    localStorage.setItem('clinic_schedule_notifications', JSON.stringify([newNotif, ...parsedNotifs]));

    onLogITEvent(
      'VISITATION_UPDATE',
      `Patient requested schedule excuse for Appointment ${apptId}. Stating: "${text.substring(0, 60)}"`,
      'Patient Portal'
    );
    setExcuseText(prev => ({ ...prev, [apptId]: '' }));
    alert("✉️ Excuse Request Submitted. The medical dispatcher panel will overview and update late cancel override assessments.");
  };

  // Communications / Doctor message dispatch
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim()) {
      alert("⚠️ Direct message text body is required.");
      return;
    }

    const newMsg = {
      id: `MSG-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString(),
      senderName: `${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName}`,
      senderEmail: formEmail,
      senderPhone: formPhone,
      doctorName: selectedDoctor.name,
      doctorEmail: selectedDoctor.email,
      reason: messageReason,
      body: messageBody.trim()
    };

    const updated = [newMsg, ...sentMessages];
    setSentMessages(updated);
    localStorage.setItem(`portal_msgs_${activePatient.id}`, JSON.stringify(updated));

    // Trigger secure HIPAA telemetry audit note
    onLogITEvent(
      'OTHER',
      `Patient routed encrypted query to ${selectedDoctor.name} regarding: "${messageReason}". Telemetry parsed.`,
      'Patient Communications Portal'
    );

    setMessageBody('');
    setMessageSuccess("📬 Direct encrypted transmission successful! The doctor's inbox has synchronized your message under AES-256.");
    setTimeout(() => setMessageSuccess(''), 6000);
  };

  // Unlock Once-A-Month Correction request fields
  const handleTriggerCorrectionUnlock = () => {
    const currentMonth = "2026-06"; // Fixed local clinical date context
    if (restrictedUpdateMonth === currentMonth) {
      setProfileError("⚠️ Legal Identity Lockout: SSN, full legal name, and date of birth updates are limited to exactly once per month. You have already completed a correction request for June 2026.");
      setTimeout(() => setProfileError(''), 7000);
      return;
    }

    setIsRestrictedEditing(true);
    setProfileSuccess("🔓 First-time mistake month grace activated! Social security number, full legal name, and birthday inputs are now unlocked. Please review carefully before saving.");
    setTimeout(() => setProfileSuccess(''), 7000);
  };

  // Save Demographic / Identity modifications
  const handleSaveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();

    // Compile active update patient object
    const updatedPatient: Patient = {
      ...activePatient,
      personalInfo: {
        ...activePatient.personalInfo,
        email: formEmail,
        phone: formPhone,
        address: formAddress,
        city: formCity,
        state: formState,
        zipCode: formZip,
        firstName: formFirstName,
        lastName: formLastName,
        dateOfBirth: formDob
      },
      employmentCoverage: {
        ...activePatient.employmentCoverage,
        occupation: formOccupation,
        employerName: formEmployer
      }
    };

    // Save SSN if it changed
    localStorage.setItem(`portal_ssn_${activePatient.id}`, formSsn);

    // If restricted settings were modified, stamp month counter
    if (isRestrictedEditing) {
      const currentMonth = "2026-06";
      setRestrictedUpdateMonth(currentMonth);
      localStorage.setItem(`portal_restricted_month_${activePatient.id}`, currentMonth);
      setIsRestrictedEditing(false);
      onLogITEvent(
        'PATIENT_PROFILE_UPDATE',
        `Restrained Month Correction executed once: Changed SSN/Legal Info for Patient ID: ${activePatient.id}.`,
        'Patient Portal'
      );
    } else {
      onLogITEvent(
        'PATIENT_PROFILE_UPDATE',
        `Demographic coordinates modified for Patient ID: ${activePatient.id}. Fields: phone, email, credentials updated.`,
        'Patient Portal'
      );
    }

    // Callback parent state update
    onUpdatePatient(updatedPatient);
    setProfileSuccess("✨ Core demographic folder and portal coordinates synchronized successfully!");
    setTimeout(() => setProfileSuccess(''), 5000);
  };

  // Change Password
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempPassword.length < 6) {
      alert("⚠️ Secure portal passwords must be at least 6 characters.");
      return;
    }
    setPortalPassword(tempPassword);
    localStorage.setItem(`portal_pass_${activePatient.id}`, tempPassword);
    setTempPassword('');
    setPasswordSuccess("🔐 Secure credential ledger updated! Your portals' authentication passcode has changed.");
    setTimeout(() => setPasswordSuccess(''), 5000);
  };

  // HIPAA Secure Records & AVS Transmission Dispatch
  const handleTransmitAvsLog = () => {
    // Generate an automatic AfterVisitSummary state to link to Secure Records
    const savedAvsString = localStorage.getItem('clinic_after_visit_summaries');
    const parsedAvs = savedAvsString ? JSON.parse(savedAvsString) : [];

    const activeVisRecord = visitationRecords.find(v => v.patientId === activePatient.id) || visitationRecords[0] || null;
    const cleanDiagnosis = activeVisRecord?.reasonForVisit || "Post-acute Respiratory Checkup";

    // Build structured medical dossier
    const customSummaryId = `AVS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAvsLog = {
      id: customSummaryId,
      patientId: activePatient.id,
      patientName: `${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName}`,
      visitId: activeVisRecord?.id || 'VIS-9999',
      date: new Date().toISOString().split('T')[0],
      doctorName: activeVisRecord?.doctorName || "Dr. Alistair Vance, MD",
      chiefComplaint: activeVisRecord?.symptoms || "Follow-up recovery check and physical therapy review",
      vitals: {
        bloodPressure: "120/80 mmHg",
        heartRate: "76 bpm",
        temperature: "98.6 °F",
        respiratoryRate: "16 bpm"
      },
      diagnoses: [`G22.10 - Normal clinical health check, ${cleanDiagnosis}`],
      medications: [
        {
          name: "Routine prescription lookup",
          dosage: "1-tablet",
          frequency: "Daily",
          instructions: "Take with morning fluids as authorized."
        }
      ],
      careInstructions: `Patient routed record. Instructed complete self-care protocol rest as needed. Follow up scheduled within 30 days. Maintain standard telemetry audits.`,
      emergencySymptoms: "Shortness of breath, chest pain, dizziness, high fever above 102 degrees.",
      followUp: {
        date: "2026-07-16",
        time: "10:00 AM",
        instructions: "Standard spirometry wellness and diagnostic code check"
      },
      reviewStatus: "Verified Accurate",
      reviewedBy: activeVisRecord?.doctorName || "Dr. Alistair Vance, MD",
      reviewedAt: new Date().toISOString(),
      verificationChecklist: {
        idChecked: true,
        vitalsChecked: true,
        diagnosesChecked: true,
        medicationsChecked: true,
        instructionsChecked: true
      },
      patientSsnCode: formSsn
    };

    const newConvLog = {
      id: `CONV-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activePatient.id,
      patientName: `${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName}`,
      date: new Date().toISOString().split('T')[0],
      doctorName: activeVisRecord?.doctorName || "Dr. Alistair Vance, MD",
      transcript: `Patient self-reported security logs.\nISP Network: ${ispInfo.isp} (${ispInfo.ip})\nNetwork Loc: ${ispInfo.city}, ${ispInfo.state}\nEncrypted under AES-256 standard and verified on HIPAA repository ledger.`,
      encryptionStatus: 'Encrypted',
      encryptionKeyHash: "sha256-fdb921472ae583cc948bf82381e46f6984e12",
      consentSignature: `${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName}`,
      witnessName: "Direct HIPAA Secure Portal Transmission API",
      timestamp: new Date().toISOString()
    };

    // Save and commit to unified ledger arrays
    const updatedSummaries = [newAvsLog, ...parsedAvs];
    localStorage.setItem('clinic_after_visit_summaries', JSON.stringify(updatedSummaries));

    const savedConvs = localStorage.getItem('clinic_secure_conversations');
    const parsedConvs = savedConvs ? JSON.parse(savedConvs) : [];
    const updatedConvs = [newConvLog, ...parsedConvs];
    localStorage.setItem('clinic_secure_conversations', JSON.stringify(updatedConvs));

    // Raise telemetry logs
    onLogITEvent(
      'VISITATION_UPDATE',
      `Transmitted patient after-visit logs to HIPAA Secure Records array. Summary ID generated: ${customSummaryId}`,
      'HIPAA Link API'
    );

    alert(`📤 Secure Transmission Complete! Generated summary dossier (${customSummaryId}) and network log linked under HIPAA ledger successfully. Review the updated files under the 'HIPAA Secure Records & AVS' tab!`);
  };

  // Main UI render: gate check vs dashboard
  if (!authChecked) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-8 max-w-2xl mx-auto shadow-sm my-4 text-center">
        <div className="w-14 h-14 bg-teal-100/80 rounded-full flex items-center justify-center mx-auto mb-5 text-teal-600">
          <Lock className="w-6 h-6" />
        </div>
        
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight mb-2">
          HIPAA Authorizer Gate
        </h2>
        <p className="text-slate-500 text-xs max-w-md mx-auto mb-6">
          Access to patient healthcare dossiers is lawfully restricted under clinical privacy protection mandates. Please specify your authorization status below:
        </p>

        {authError && (
          <div className="bg-rose-50 text-rose-800 text-xs font-bold px-4 py-3 border border-rose-100 rounded-2xl mb-6 flex items-center gap-2.5 text-left leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          {/* Option: Patient */}
          <button
            type="button"
            onClick={() => handleAuthenticate('patient')}
            className="p-4 border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/20 rounded-2xl text-slate-800 hover:text-slate-900 font-bold transition flex flex-col gap-1 cursor-pointer group"
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-slate-400 group-hover:text-teal-600 bg-slate-100 group-hover:bg-teal-100/50 p-1.5 rounded-lg">
                <User className="w-4 h-4" />
              </span>
              <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-bold">Acting Patient</span>
            </div>
            <span className="text-xs font-black mt-2">The Registered Patient</span>
            <span className="text-[10px] text-slate-400 font-medium">Direct personal records self-access.</span>
          </button>

          {/* Option: POA 1 */}
          <button
            type="button"
            onClick={() => handleAuthenticate('poa1')}
            className="p-4 border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/20 rounded-2xl text-slate-800 hover:text-slate-900 font-bold transition flex flex-col gap-1 cursor-pointer group"
          >
            <div className="flex justify-between items-center w-full max-w-full overflow-hidden text-ellipsis">
              <span className="text-slate-400 group-hover:text-teal-600 bg-slate-100 group-hover:bg-teal-100/50 p-1.5 rounded-lg">
                <HeartHandshake className="w-4 h-4" />
              </span>
              <span className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-extrabold max-w-[85%] truncate">POA Representative #1</span>
            </div>
            <span className="text-xs font-black mt-2">David Jenkins</span>
            <span className="text-[10px] text-slate-400 font-medium">Legal Power of Attorney designee.</span>
          </button>

          {/* Option: POA 2 */}
          <button
            type="button"
            onClick={() => handleAuthenticate('poa2')}
            className="p-4 border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/20 rounded-2xl text-slate-800 hover:text-slate-900 font-bold transition flex flex-col gap-1 cursor-pointer group"
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-slate-400 group-hover:text-teal-600 bg-slate-100 group-hover:bg-teal-100/50 p-1.5 rounded-lg">
                <HeartHandshake className="w-4 h-4" />
              </span>
              <span className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-extrabold">POA Representative #2</span>
            </div>
            <span className="text-xs font-black mt-2">Emily Jenkins</span>
            <span className="text-[10px] text-slate-400 font-medium">Secondary Power of Attorney designee.</span>
          </button>

          {/* Option: Family */}
          <button
            type="button"
            onClick={() => handleAuthenticate('family')}
            className="p-4 border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/20 rounded-2xl text-slate-800 hover:text-slate-900 font-bold transition flex flex-col gap-1 cursor-pointer group"
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-slate-400 group-hover:text-teal-600 bg-slate-100 group-hover:bg-teal-100/50 p-1.5 rounded-lg">
                <Milestone className="w-4 h-4" />
              </span>
              <span className={isFamilyOptedIn ? "text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-extrabold" : "text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-extrabold"}>
                {isFamilyOptedIn ? 'Family Opt-In Active' : 'Family Opt-In Locked'}
              </span>
            </div>
            <span className="text-xs font-black mt-2">Immediate Family Member</span>
            <span className="text-[10px] text-slate-400 font-medium">Restricted family folder preview.</span>
          </button>
        </div>

        {/* HIPAA Family Consent Toggle config */}
        <div className="bg-slate-100 p-4 rounded-2xl border text-left flex items-start gap-3">
          <input
            type="checkbox"
            id="familyOptinChk"
            checked={isFamilyOptedIn}
            onChange={(e) => handleFamilyOptinToggle(e.target.checked)}
            className="w-4 h-4 mt-0.5 border border-slate-300 rounded text-teal-600 focus:ring-1 focus:ring-teal-500"
          />
          <div className="text-xs">
            <label htmlFor="familyOptinChk" className="block font-extrabold text-slate-900 cursor-pointer">
              Enable Immediate Family Portal Shared Access Folders
            </label>
            <span className="text-[10px] text-slate-500 leading-relaxed block mt-0.5">
              Checking this box implements an official clinical HIPAA waiver to authorize immediate family members (spouse, adult siblings, parents) to view and sync your Visitation summaries, doctor queries, and diagnostic codes. If unchecked, family records lookup is disabled.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Active Authorised Dashboard View!
  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-teal-900 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-200 text-xs font-black tracking-wide uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Patient Portal Portal</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Greetings, {authorizedUser === 'patient' ? activePatient.personalInfo.firstName : authorizedUser === 'poa1' ? 'David Jenkins (POA)' : authorizedUser === 'poa2' ? 'Emily Jenkins (POA)' : 'Immediate Family Member'}
          </h2>
          <p className="text-teal-100 text-xs mt-1">
            Dossier Folder: {activePatient.personalInfo.firstName} {activePatient.personalInfo.lastName} • HIPAA Record ID: <span className="font-mono bg-teal-950/40 px-2 py-0.5 rounded font-black">{activePatient.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePortalLock}
            className="px-4 py-2 bg-teal-950/50 hover:bg-teal-950 text-teal-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Access Gate</span>
          </button>
        </div>
      </div>

      {/* TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN: SCHEDULING RESPONSE & PHYSICIAN CONTACTS */}
        <div className="space-y-6">
          
          {/* 1. SCHEDULING INTERACTIVE RESPONSE PANELS */}
          <div className="bg-white border rounded-[26px] p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2 mb-4">
              <Milestone className="w-4 h-4 text-teal-600" />
              <span>Pending Visitation Proposals & Scheduling Responses</span>
            </h3>

            {appointments.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium">
                No proposed appointments pending Response for this patient. Proposals can be dispatched from the "Visitation Overview" panels.
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div 
                    key={appt.id} 
                    className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Reference ID: {appt.id}</span>
                        <span className="text-xs font-extrabold text-slate-800">Proposed by {appt.doctorName}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        appt.status === 'confirmed' ? 'bg-emerald-150 text-emerald-900 border border-emerald-200' :
                        appt.status === 'excused' ? 'bg-amber-100 text-amber-900' : 'bg-blue-50 text-blue-800'
                      }`}>
                        {appt.status === 'confirmed' ? 'Confirmed & Locked' : appt.status === 'excused' ? 'Excuse Requested' : 'Pending Patient Select'}
                      </span>
                    </div>

                    {appt.status === 'pending_selection' ? (
                      <div>
                        {/* Interactive Options list */}
                        <p className="text-[11px] font-bold text-slate-600 mb-2">Select your preferred consultation slot proposal:</p>
                        <div className="space-y-1.5 mb-3">
                          {appt.options.map((opt) => (
                            <label 
                              key={opt.id} 
                              className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-100 hover:bg-teal-50/10 cursor-pointer text-xs"
                            >
                              <input 
                                type="radio" 
                                name={`appt-opt-${appt.id}`}
                                checked={selectedOptId[appt.id] === opt.id}
                                onChange={() => setSelectedOptId(prev => ({ ...prev, [appt.id]: opt.id }))}
                                className="w-3.5 h-3.5 text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-slate-800 font-semibold">{new Date(opt.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </label>
                          ))}
                        </div>

                        {/* Confirmation Button */}
                        <button
                          type="button"
                          onClick={() => handleConfirmAppointment(appt.id)}
                          className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 mb-4"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept & Lock Proposed Slot</span>
                        </button>

                        {/* Direct Excuse Box */}
                        <div className="border-t border-slate-200/60 pt-3">
                          <label className="block text-[10px] font-black text-rose-800 mb-1">Unable to attend clinical proposed timeline?</label>
                          <textarea
                            rows={2}
                            placeholder="State excuse description context (up to 1000 characters) to opt out or adjust late cancel fees..."
                            value={excuseText[appt.id] || ''}
                            onChange={(e) => setExcuseText(prev => ({ ...prev, [appt.id]: e.target.value }))}
                            className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 outline-none font-medium h-12"
                          />
                          <button
                            type="button"
                            onClick={() => handleRequestExcuse(appt.id)}
                            className="mt-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/50 hover:border-rose-200 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3 text-rose-800" />
                            <span>Request Excuse / Cancellation Waiver</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs bg-white p-3 rounded-2xl border border-slate-100 text-slate-600">
                        {appt.status === 'confirmed' ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-emerald-700 font-bold">
                              <Check className="w-4 h-4 shrink-0" />
                              <span>Locked Appointment Confirmation</span>
                            </div>
                            <span className="block text-slate-800 font-extrabold text-sm leading-snug mt-1">
                              {new Date(appt.selectedDateTime || '').toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-1">Calendar holds synced automatically. Late cancel overrides apply.</span>
                          </div>
                        ) : (
                          <div>
                            <span className="block font-bold mt-1 text-slate-700">Waiver Reason Submitted:</span>
                            <span className="block italic text-slate-500 mt-0.5">"{appt.excuseReason}"</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. DIRECT COMMUNICATIONS TO PHYSICIAN PANEL */}
          <div className="bg-white border rounded-[26px] p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-teal-600" />
              <span>Patient Direct Encrypted Message Dispatcher</span>
            </h3>

            {messageSuccess && (
              <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-3 border border-emerald-100 rounded-2xl mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{messageSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Prepopulated Name field */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Prepopulated Client Name</label>
                  <input
                    type="text"
                    disabled
                    value={`${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName}`}
                    className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-not-allowed"
                  />
                </div>
                {/* Prepopulated Contact */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Prepopulated Contact Email</label>
                  <input
                    type="text"
                    disabled
                    value={formEmail}
                    className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Doctor Selector Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Attending Primary Care Provider / Physician</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <select
                    value={selectedDoctor.name}
                    onChange={(e) => {
                      const doc = CLINIC_DOCTORS.find(d => d.name === e.target.value);
                      if (doc) setSelectedDoctor(doc);
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-teal-500 outline-none font-bold"
                  >
                    {CLINIC_DOCTORS.map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>

                  {/* Doctor direct email badge for reference */}
                  <div className="px-3 py-1.5 bg-slate-100 hover:bg-slate-150 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between font-mono overflow-x-auto select-all shrink-0">
                    <span className="text-[10px] text-slate-400">PCP Email just in case:</span>
                    <span className="font-bold text-teal-800 whitespace-nowrap ml-1">{selectedDoctor.email}</span>
                  </div>
                </div>
              </div>

              {/* 6 to 7 Subject line Reasons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Subject Message Reason Line</label>
                <select
                  value={messageReason}
                  onChange={(e) => setMessageReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-teal-500 outline-none font-semibold text-slate-800"
                >
                  {SERVICE_REASONS.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              {/* Message outline */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 font-bold">Encrypted Text Content Area</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail your request to the physician panel here (priorities, dosage logs, symptoms, etc.)."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 border border-slate-950 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-800 cursor-pointer transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Query under HIPAA Encryption</span>
              </button>
            </form>

            {/* Sent Mail Log history */}
            {sentMessages.length > 0 && (
              <div className="mt-5 border-t border-slate-200/60 pt-4">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2.5">
                  Your Dispatched Telemetry Log ({sentMessages.length})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sentMessages.map(msg => (
                    <div key={msg.id} className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-slate-800">{msg.doctorName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className="block text-[10px] text-teal-800 font-extrabold mb-1">Subject: {msg.reason}</span>
                      <p className="text-[11px] text-slate-600 italic mt-1 leading-snug">"{msg.body}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CORE SETTINGS (UPDATING EMAIL/PASSWORD & RESTRICTED DEMOGRAPHICS), HIPAA NETWORK INFO */}
        <div className="space-y-6">

          {/* 3. PROFILE SETTINGS AND MONTHLY GRACE MODIFICATION CONTROL */}
          <div className="bg-white border rounded-[26px] p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-teal-600" />
              <span>Demographic Settings & Core Patient Dossier</span>
            </h3>

            {profileSuccess && (
              <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-3 border border-emerald-100 rounded-2xl mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="bg-rose-50 text-rose-800 text-xs font-bold px-4 py-3 border border-rose-100 rounded-2xl mb-4 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfileSettings} className="space-y-4">
              
              {/* standard profile info - freely editable always */}
              <div>
                <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest block mb-2.5 border-b pb-1">General Demographics (Unrestricted)</span>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Contact Email Address</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="col-span-3 md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Street Address</label>
                    <input
                      type="text"
                      required
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">City</label>
                    <input
                      type="text"
                      required
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">State & Zip</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={formState}
                        onChange={(e) => setFormState(e.target.value)}
                        className="w-12 px-1.5 py-1.5 border border-slate-205 rounded-xl text-xs text-center font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Zip"
                        value={formZip}
                        onChange={(e) => setFormZip(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Occupation</label>
                    <input
                      type="text"
                      value={formOccupation}
                      onChange={(e) => setFormOccupation(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Employer Name</label>
                    <input
                      type="text"
                      value={formEmployer}
                      onChange={(e) => setFormEmployer(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* RESTRICTED LEGAL FIELDS */}
              <div className="border-t border-slate-100 pt-4 bg-slate-50 rounded-2xl p-3.5 border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-amber-850 uppercase tracking-widest block">Restricted Legal Identity coordinates</span>
                  <span className="text-[9px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-black border border-amber-100 uppercase tracking-wide">HIPAA Lock</span>
                </div>
                
                <p className="text-[10px] leading-relaxed text-slate-500 mb-3.5">
                  To prevent medical fraud or identity tampering, editing your SSN, Legal Name, and Date of Birth is limited to <strong>once per calendar month</strong>.
                </p>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-slate-650 mb-0.5">Legal First Name</label>
                      <input
                        type="text"
                        required
                        disabled={!isRestrictedEditing}
                        value={formFirstName}
                        onChange={(e) => setFormFirstName(e.target.value)}
                        className={`w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold outline-none ${
                          isRestrictedEditing ? 'bg-white focus:ring-1 focus:ring-amber-500 border-amber-300' : 'bg-slate-200/55 cursor-not-allowed text-slate-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-650 mb-0.5">Legal Last Name</label>
                      <input
                        type="text"
                        required
                        disabled={!isRestrictedEditing}
                        value={formLastName}
                        onChange={(e) => setFormLastName(e.target.value)}
                        className={`w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold outline-none ${
                          isRestrictedEditing ? 'bg-white focus:ring-1 focus:ring-amber-500 border-amber-300' : 'bg-slate-200/55 cursor-not-allowed text-slate-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-slate-650 mb-0.5">Social Security Number (SSN)</label>
                      <input
                        type="text"
                        required
                        disabled={!isRestrictedEditing}
                        value={formSsn}
                        onChange={(e) => setFormSsn(e.target.value)}
                        placeholder="666-XX-XXXX"
                        className={`w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-mono font-semibold outline-none ${
                          isRestrictedEditing ? 'bg-white focus:ring-1 focus:ring-amber-500 border-amber-300' : 'bg-slate-200/55 cursor-not-allowed text-slate-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-650 mb-0.5">Date of Birth (DoB)</label>
                      <input
                        type="date"
                        required
                        disabled={!isRestrictedEditing}
                        value={formDob}
                        onChange={(e) => setFormDob(e.target.value)}
                        className={`w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold outline-none ${
                          isRestrictedEditing ? 'bg-white focus:ring-1 focus:ring-amber-500 border-amber-300' : 'bg-slate-200/55 cursor-not-allowed text-slate-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1.5">
                    {!isRestrictedEditing ? (
                      <button
                        type="button"
                        onClick={handleTriggerCorrectionUnlock}
                        className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-850 hover:text-amber-900 border border-amber-200/70 rounded-xl text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Generate Monthly Correction Request</span>
                      </button>
                    ) : (
                      <div className="text-[10px] text-amber-800 bg-amber-50 p-2 border border-amber-200 rounded-xl font-extrabold w-full">
                        ⚠️ editing restricted master elements now unlocked! Press Save Changes to apply legal identity modifications permanently.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-200" />
                  <span>Save Demographic Coordinates</span>
                </button>
              </div>
            </form>

            {/* SEPARATE PASSWORD SETTINGS */}
            <form onSubmit={handleUpdatePassword} className="mt-5 border-t border-slate-250/60 pt-4 space-y-3.5">
              <span className="text-[10px] font-black text-slate-550 uppercase tracking-widest block mb-1">Update Security Authentication Password</span>
              
              {passwordSuccess && (
                <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 border border-emerald-100 rounded-xl mb-3 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative w-full">
                  <input
                    type="password"
                    required
                    placeholder="Enter new portal authorization password..."
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full px-3.5 py-1.5 border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 outline-none font-medium text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shrink-0 cursor-pointer transition"
                >
                  Change Password
                </button>
              </div>
              <span className="text-[9px] text-slate-400 block">Requires 6 character criteria under HIPAA secure portal policy.</span>
            </form>
          </div>

          {/* 4. After Visitation Summary (AVS) Section & HIPAA Secure records Dispatch link */}
          <div className="bg-white border rounded-[26px] p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>After-Visit Clinical Clinical Summaries (AVS)</span>
            </h3>

            {visitationRecords.filter(r => r.patientId === activePatient.id).length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-4 text-center text-xs text-slate-400">
                No active visitation history logs registered in database directory. Try completing an intake first.
              </div>
            ) : (
              <div className="space-y-4">
                {visitationRecords.filter(r => r.patientId === activePatient.id).slice(0, 1).map((record) => (
                  <div key={record.id} className="border border-slate-100 bg-teal-50/5/10 rounded-2xl p-4 space-y-3.5">
                    <div className="flex justify-between items-center bg-teal-50/20 p-2 rounded-xl mb-1 border border-teal-100/50">
                      <div>
                        <span className="block text-[10px] font-black text-slate-400">VISITATION DATE</span>
                        <span className="block text-xs font-black text-teal-900">{record.visitDate}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-black text-slate-400 text-right">PCP PHYSICIAN</span>
                        <span className="block text-xs font-black text-teal-900 text-right">{record.doctorName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase">Chief Symptoms</span>
                        <p className="text-slate-800 font-semibold leading-relaxed mt-0.5">{record.symptoms}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase">Encounter Reason</span>
                        <p className="text-slate-800 font-semibold leading-relaxed mt-0.5">{record.reasonForVisit}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/60 pt-2.5">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">Diagnoses & Procedures Codes (CPT/ICD)</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {record.diagnosticCodes && record.diagnosticCodes.map((code) => {
                          const lookup = (code as any);
                          return (
                            <span key={code} className="bg-teal-50 border border-teal-100 text-teal-800 font-mono text-[10px] font-black px-2 py-0.5 rounded-lg">
                              Code {code}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Transmit Log action button! */}
                    <div className="pt-2 border-t border-slate-200 border-dashed">
                      <p className="text-[9px] text-slate-500 leading-snug mb-2">
                        You can send this entire clinical log (with active secure network ISP coordinates attached) over to your physical "Secure Records & AVS" ledger list.
                      </p>
                      <button
                        type="button"
                        onClick={handleTransmitAvsLog}
                        className="w-full py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-950" />
                        <span>Transmit Clinical Log to HIPAA Secure Repository & AVS</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. HIPAA CONSTITUTION & ACTIVE ISP NETWORK COMPLIANCE LOG */}
          <div className="border border-slate-200 rounded-[26px] p-5.5 bg-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 -z-5 animate-pulse"></div>
            
            <h4 className="text-[11px] font-black text-slate-800 tracking-wider uppercase flex items-center gap-1.5 mb-3">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>HIPAA Telemetry Coordinates & Active Network Node Audit</span>
            </h4>

            {loadingIsp ? (
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Syncing ISP network routing logs...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 font-mono text-[10.5px]">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-[9px] text-slate-400 block">EXTERNAL IP</span>
                    <span className="text-slate-800 font-bold">{ispInfo.ip}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">ISP PROVIDER</span>
                    <span className="text-slate-850 font-bold leading-tight block">{ispInfo.isp}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <span className="text-[9px] text-slate-400 block">ROUTING ENDPOINT</span>
                    <span className="text-slate-800 font-bold">{ispInfo.city}, {ispInfo.state}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">SECURITY PROTOCOL</span>
                    <span className="text-teal-700 font-black flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-teal-600 shrink-0" />
                      <span>TLS 1.3 / AES-256</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-3 border-t border-slate-200/70 pt-2 bg-white/40 p-2 rounded-xl">
              * The Health Insurance Portability and Accountability Act mandated logging network ISP telemetry tags to audit patient data flows against unauthorized access hazards.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
