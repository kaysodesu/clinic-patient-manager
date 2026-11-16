import React, { useState, useEffect } from 'react';
import { BRAND } from '../config/brand';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, VisitationRecord, ClinicRole } from '../types';
import { 
  Send, Phone, Mail, CheckCircle2, AlertCircle, Info, HelpCircle, 
  Settings, Users, ChevronRight, FileText, Smartphone, RefreshCw, 
  BookOpen, Heart, Activity, Sliders, ExternalLink, MessageSquare, 
  Lock, Copy, ShieldAlert, Check, Plus
} from 'lucide-react';

interface MarketingHubProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  visitationRecords: VisitationRecord[];
  role: ClinicRole;
}

interface DispatchLog {
  id: string;
  patientId: string;
  patientName: string;
  type: 'SMS_CONSENT' | 'SMS_WELCOME' | 'EMAIL_NEWSLETTER';
  recipient: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'delivered';
  summary: string;
}

// Educational references based on patient condition
interface EducationalResource {
  topic: string;
  title: string;
  summary: string;
  url: string;
  portal: 'Mayo Clinic' | 'WebMD' | 'NIH Medline' | 'CDC' | 'American Heart Association';
}

const GENERAL_EDUCATIONAL_RESOURCES: Record<string, EducationalResource[]> = {
  "PT-8802": [ // Sarah Jenkins (Asthma / Pulmonology)
    {
      topic: "Bronchial Asthma Management",
      title: "Asthma action plans: A guide to self-monitoring",
      summary: "Understand how to leverage daily peak flow readings, identify early triggers, and administer rescue beta-agonists via spacers correctly.",
      url: "https://www.mayoclinic.org/diseases-conditions/asthma/in-depth/asthma-action-plan/art-20048103",
      portal: "Mayo Clinic"
    },
    {
      topic: "Antihistamine Actions",
      title: "Allergy medications: Know your therapeutic options",
      summary: "Explore second-generation H1-receptor antagonists like cetirizine. Minimizing sedation while optimizing peripheral congestion relief.",
      url: "https://www.webmd.com/allergies/allergy-medication-tips",
      portal: "WebMD"
    }
  ],
  "PT-7140": [ // Marcus Vance (Hypertension / Knee Osteoarthritis)
    {
      topic: "Essential Hypertension Guidelines",
      title: "Managing Blood Pressure with ACE Inhibitors",
      summary: "An in-depth outline on Lisinopril, proper daily morning regimens, tracking sodium, and mitigating secondary bradykinin throat ticks.",
      url: "https://www.nhlbi.nih.gov/health/high-blood-pressure",
      portal: "NIH Medline"
    },
    {
      topic: "Knee Patellar Care",
      title: "Active Patellofemoral tracking rehabilitation",
      summary: "Instructional guides for strengthening the vastus medialis obliquus (VMO) to restore patellar tracking without cartilage erosion.",
      url: "https://www.mayoclinic.org/diseases-conditions/osteoarthritis/symptoms-causes/syc-253139",
      portal: "Mayo Clinic"
    }
  ],
  "PT-4921": [ // Elena Rostova (Rheumatoid Arthritis / GERD)
    {
      topic: "Autoimmune RA Therapies",
      title: "Methotrexate safety checklists and daily folic acid syncs",
      summary: "Safety parameters for administering weekly DMARD therapies, reporting hepatic concerns early, and managing clinical blood counts.",
      url: "https://www.webmd.com/rheumatoid-arthritis/guide/rheumatoid-arthritis-treatment-care",
      portal: "WebMD"
    },
    {
      topic: "Acid Suppression Science",
      title: "Understanding long-term Proton Pump Inhibitor usage",
      summary: "Proper ingestion schedules for delayed-release Omeprazole. Maximizing parietal cell proton pump blockade before morning breakfasts.",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK557385/",
      portal: "NIH Medline"
    }
  ],
  "general": [
    {
      topic: "General Preventive Wellness",
      title: "Comprehensive adult checkup diagnostics timeline",
      summary: "Standard routine evaluation checklists including annual lab reviews, metabolic screening targets, and immunization protocols.",
      url: "https://www.cdc.gov/chronicdisease/index.htm",
      portal: "CDC"
    }
  ]
};

const INITIAL_DISPATCH_LOGS: DispatchLog[] = [];

export default function MarketingHub({
  patients,
  selectedPatientId,
  onSelectPatient,
  visitationRecords,
  role
}: MarketingHubProps) {
  // Dispatch Audit Ledger history
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>(() => {
    const saved = localStorage.getItem('clinic_marketing_logs');
    return saved ? JSON.parse(saved) : INITIAL_DISPATCH_LOGS;
  });

  // Active Patient Selector
  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Live editable fields populated from active patient
  const [targetName, setTargetName] = useState("");
  const [targetId, setTargetId] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [targetPhone, setTargetPhone] = useState("");

  // Sync state with selected patient
  useEffect(() => {
    if (activePatient) {
      setTargetName(`${activePatient.personalInfo?.firstName || ''} ${activePatient.personalInfo?.lastName || ''}`.trim());
      setTargetId(activePatient.id);
      setTargetEmail(activePatient.personalInfo?.email || '');
      setTargetPhone(activePatient.personalInfo?.phone || '');
    }
  }, [selectedPatientId, activePatient]);

  // Save dispatchLogs to localStorage
  useEffect(() => {
    localStorage.setItem('clinic_marketing_logs', JSON.stringify(dispatchLogs));
  }, [dispatchLogs]);

  // Selected Channel layout
  const [channel, setChannel] = useState<'email' | 'sms'>('email');

  // Graph levels customizable sliders (Clinician live-presets)
  const [symptomSeverityScore, setSymptomSeverityScore] = useState<number>(65);
  const [diagnosticCertaintyScore, setDiagnosticCertaintyScore] = useState<number>(85);
  const [treatmentAdherenceAttempt, setTreatmentAdherenceAttempt] = useState<number>(90);
  const [medicationSatisfactionRating, setMedicationSatisfactionRating] = useState<number>(95);

  // Dynamic automatic message generation states
  const [smsConsentText, setSmsConsentText] = useState("");
  const [smsWelcomeText, setSmsWelcomeText] = useState("");
  
  // Email customizable block
  const [emailSubject, setEmailSubject] = useState("");
  const [emailOverviewPara1, setEmailOverviewPara1] = useState("");
  const [emailOverviewPara2, setEmailOverviewPara2] = useState("");
  const [customCareAdvice, setCustomCareAdvice] = useState("Continue checking vitals daily and document any deviations.");

  // Mobile simulator live visual chat simulation history
  const [simulatedMobileMessages, setSimulatedMobileMessages] = useState<{
    sender: 'clinic' | 'patient';
    text: string;
    time: string;
  }[]>([
    {
      sender: 'clinic',
      text: `Consent Broadcast: Do you agree to receive clinical newsletters, session feedback surveys, and updates from ${BRAND.facilityName}? Reply YES to confirm, or STOP to reject.`,
      time: "Yesterday, 10:15 AM"
    },
    {
      sender: 'patient',
      text: "YES",
      time: "Yesterday, 10:15 AM"
    },
    {
      sender: 'clinic',
      text: `Welcome! You can view your visit overview and medical details here: ${BRAND.portalUrl}/viewer/PT-8802/summary. Reply STOP to cancel future medical updates.`,
      time: "Yesterday, 10:16 AM"
    }
  ]);

  // Auto compile standard newsletters based on patient selected
  useEffect(() => {
    if (!activePatient) return;

    const facilityName = BRAND.facilityName;
    const name = `${activePatient.personalInfo?.firstName || ''} ${activePatient.personalInfo?.lastName || ''}`.trim() || 'Valued Patient';
    const pid = activePatient.id;

    // SMS Standard Consent Setup
    setSmsConsentText(
      `Consent Broadcast: Do you agree to receive digital health newsletters, session feedback survey triggers, and medical marketing materials on behalf of ${BRAND.facilityName} at this phone number? Reply YES to opt-in or STOP to reject.`
    );

    // SMS Welcome Standard Setup
    setSmsWelcomeText(
      `Welcome to your personalized client medical summary portal. View your clinical document here: ${BRAND.portalUrl}/viewer/${pid}/summary. Text STOP to stop receiving future updates.`
    );

    // Email Custom Setup
    setEmailSubject(`Your Visit Summary & Wellness Newsletter - ${name} (ID: ${pid})`);

    // Paragraph 1: Diagnostic overview
    const currentVisitNotes = activePatient.currentVisit;
    setEmailOverviewPara1(
      `We hope this newsletter finds you resting comfortably. Following your recent diagnostic encounter under our physical care routing, we would like to extend our warm appreciation for choosing ${facilityName}. Clinicians assessed your reported acute presentation of "${currentVisitNotes?.symptoms || 'general wellness indicators'}" which was documented as persistent on clinical admission. Vitals were checked and logged with precision to establish diagnostic clarity.`
    );

    // Paragraph 2: Clinical prognosis
    setEmailOverviewPara2(
      `Based on the auscultation diagnostics and the comprehensive care blueprint managed by ${BRAND.facilityName}, your customized treatment schedule is designed to alleviate your target conditions. Regular compliance with the outlined actions is critical. We encourage you to participate in active self-monitoring, check-recording your symptoms graph levels in your secure client dossier, and updating us if anomalies arise.`
    );

    // Default Sliders based on patient severity
    if (activePatient.id === "PT-8802") {
      setSymptomSeverityScore(45);
      setDiagnosticCertaintyScore(95);
      setTreatmentAdherenceAttempt(90);
      setMedicationSatisfactionRating(92);
      setCustomCareAdvice("Practice inhaling strictly with the AeroChamber spacer device and gargle thoroughly with water afterward to prevent local thrush.");
    } else if (activePatient.id === "PT-7140") {
      setSymptomSeverityScore(75);
      setDiagnosticCertaintyScore(80);
      setTreatmentAdherenceAttempt(85);
      setMedicationSatisfactionRating(90);
      setCustomCareAdvice("Wear the dual-compression patellar sleeve during walking exercises, and perform 3 sets of VMO leg raises daily.");
    } else {
      setSymptomSeverityScore(50);
      setDiagnosticCertaintyScore(90);
      setTreatmentAdherenceAttempt(95);
      setMedicationSatisfactionRating(95);
      setCustomCareAdvice("Document weekly metrics on an empty stomach and avoid excessive sodium.");
    }
  }, [selectedPatientId, activePatient]);

  // Dispatch Action Type SMS Consent
  const dispatchSmsConsent = () => {
    alert(`⚡ Consent text dispatched to mobile carrier routing for ${targetName} at ${targetPhone}`);
    
    // Log dispatch
    const logId = `LOG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLog: DispatchLog = {
      id: logId,
      patientId: targetId,
      patientName: targetName,
      type: 'SMS_CONSENT',
      recipient: targetPhone,
      timestamp: new Date().toISOString(),
      status: 'delivered',
      summary: `Dispatched automated clinical marketing opt-in broadcast text, requesting recipient authorization.`
    };

    setDispatchLogs(prev => [newLog, ...prev]);

    // Update simulated chat window mockup
    setSimulatedMobileMessages(prev => [
      ...prev,
      {
        sender: 'clinic',
        text: smsConsentText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Simulate standard positive reply YES 1 second later
    setTimeout(() => {
      setSimulatedMobileMessages(p => [
        ...p,
        {
          sender: 'patient',
          text: "YES",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  // Dispatch Action Type SMS Welcome + Doc Link
  const dispatchSmsWelcome = () => {
    alert(`⚡ Welcome portal SMS dispatched successfully to ${targetName} at ${targetPhone}`);

    // Log dispatch
    const logId = `LOG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLog: DispatchLog = {
      id: logId,
      patientId: targetId,
      patientName: targetName,
      type: 'SMS_WELCOME',
      recipient: targetPhone,
      timestamp: new Date().toISOString(),
      status: 'delivered',
      summary: `Dispatched welcome summary document text incorporating viewport reference secure links and STOP optical keys.`
    };

    setDispatchLogs(prev => [newLog, ...prev]);

    // Update simulated chat window mockup
    setSimulatedMobileMessages(prev => [
      ...prev,
      {
        sender: 'clinic',
        text: smsWelcomeText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Trigger Send via Email Newsletter
  const dispatchEmailNewsletter = () => {
    alert(`📧 Newsletter email compiled successfully with SVG interactive metrics and issued to ${targetEmail}`);

    const logId = `LOG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLog: DispatchLog = {
      id: logId,
      patientId: targetId,
      patientName: targetName,
      type: 'EMAIL_NEWSLETTER',
      recipient: targetEmail,
      timestamp: new Date().toISOString(),
      status: 'sent',
      summary: `Dispatched 2-paragraph medical digest incorporating symptoms curve diagrams and Mayo Clinic/WebMD reference bibliographies.`
    };

    setDispatchLogs(prev => [newLog, ...prev]);
  };

  // Retrieve Educational curation list based on active ID
  const activeResources = GENERAL_EDUCATIONAL_RESOURCES[activePatient.id] || GENERAL_EDUCATIONAL_RESOURCES["general"];

  // Fetch relevant diagnostics details
  const matchingHistoryRecord = visitationRecords.find(vr => vr.patientId === activePatient.id);
  const calculatedDiagnosis = matchingHistoryRecord?.reasonForVisit || "Acute Respiratory Symptoms / Muscle skeletal pathology";
  const calculatedTreatment = matchingHistoryRecord?.symptoms || "Structured pharmacological titration, rehabilitation routines, and physical hydration.";

  // Fetch active prescriptions
  const calculatedRx = activePatient.medicalQuestionnaire.prescriptions || "Available upon clinician authorization list.";

  return (
    <div id="marketing-feedback-hub" className="space-y-6">
      
      {/* 2. CORE INTERACTIVE HUB WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTROL & CUSTOMIZATION CONSOLE (V7-GRID: spanning 5 of 12 slots) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* A. PATIENT CORRELATION FORM */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs uppercase font-bold font-mono tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-teal-600 rounded-sm"></span>
              Patient
            </h3>

            <div className="space-y-4">
              {/* Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Selected Patient Record</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => onSelectPatient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-teal-500 outline-none font-medium"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.personalInfo.firstName} {p.personalInfo.lastName} (ID: {p.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Editable Name & ID Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Target Name</label>
                  <input
                    type="text"
                    value={targetName}
                    onChange={e => setTargetName(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-teal-500 outline-none"
                    placeholder="Patient Name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">System Patient ID#</label>
                  <input
                    type="text"
                    value={targetId}
                    onChange={e => setTargetId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 bg-slate-50 font-mono cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              {/* Editable Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Best Contact Email</label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={e => setTargetEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Contact Phone Number</label>
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={e => setTargetPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                    placeholder="(555) 000-0000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* B. MULTI-CHANNEL CHANNEL SELECTOR & PRESETS */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs uppercase font-bold font-mono tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-sky-600 rounded-sm"></span>
              Channel & template
            </h3>

            {/* Toggle switch */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  channel === 'email' 
                    ? 'bg-white text-slate-905 shadow-3xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span>Email Newsletter</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  channel === 'sms' 
                    ? 'bg-white text-slate-905 shadow-3xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span>Text Message (SMS)</span>
              </button>
            </div>

            {/* IF SMS CHANNEL IS SELECTED */}
            {channel === 'sms' && (
              <div className="space-y-4 text-xs">
                <div className="bg-sky-50/50 border border-sky-100 p-3.5 rounded-xl mb-3">
                  <div className="flex gap-2 text-sky-850 font-bold mb-1">
                    <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <span>Compliance Guarantee Safeguard</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    FCC/TCPA directives demand structured SMS dispatch sequencing: <strong>Consent opt-in notice</strong> matches client agreement, followed by the <strong>Welcome dossier</strong> with a <code>STOP</code> exit key.
                  </p>
                </div>

                {/* Automation Step 1: CONSENT */}
                <div className="border border-slate-150 p-3.5 rounded-xl space-y-2 text-left bg-slate-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase font-mono text-slate-500">
                      Step 1: SMS Opt-In Consent Protocol
                    </span>
                    <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      Auto pre-formatted
                    </span>
                  </div>
                  
                  <textarea
                    rows={3}
                    value={smsConsentText}
                    onChange={e => setSmsConsentText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] font-mono leading-normal text-slate-700 outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Consent statement..."
                  ></textarea>

                  <button
                    type="button"
                    onClick={dispatchSmsConsent}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] uppercase py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Disposed Step 1: Send Consent Text</span>
                  </button>
                </div>

                {/* Automation Step 2: WELCOME BLOCK */}
                <div className="border border-slate-150 p-3.5 rounded-xl space-y-2 text-left bg-slate-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase font-mono text-slate-500">
                      Step 2: Welcome Directive (Document Ref & STOP)
                    </span>
                    <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      Standard exit trigger
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={smsWelcomeText}
                    onChange={e => setSmsWelcomeText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] font-mono leading-normal text-slate-700 outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Welcome statement with document link..."
                  ></textarea>

                  <button
                    type="button"
                    onClick={dispatchSmsWelcome}
                    className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-[10px] uppercase py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3 h-3 text-teal-400" />
                    <span>Dispatched Step 2: Send Welcome SMS</span>
                  </button>
                </div>
              </div>
            )}

            {/* IF EMAIL CHANNEL IS SELECTED */}
            {channel === 'email' && (
              <div className="space-y-4 text-xs text-left text-slate-700">
                
                {/* Visual score modifiers (sliders) */}
                <div className="bg-teal-50/30 border border-teal-150 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-800 uppercase flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-teal-600" />
                      Dynamic graph rating variables
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">Drags modify SVG graph values</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    {/* Symptom score */}
                    <div>
                      <div className="flex justify-between text-slate-650 font-semibold">
                        <span>Symptom Intensity Level</span>
                        <span className="font-mono text-rose-600 font-bold">{symptomSeverityScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={symptomSeverityScore}
                        onChange={e => setSymptomSeverityScore(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                    </div>

                    {/* Certainty score */}
                    <div>
                      <div className="flex justify-between text-slate-650 font-semibold">
                        <span>Diagnostic Certainty</span>
                        <span className="font-mono text-teal-600 font-bold">{diagnosticCertaintyScore}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={diagnosticCertaintyScore}
                        onChange={e => setDiagnosticCertaintyScore(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                    </div>

                    {/* Adherence target */}
                    <div>
                      <div className="flex justify-between text-slate-650 font-semibold">
                        <span>Treatment Plan Adherence</span>
                        <span className="font-mono text-blue-600 font-bold">{treatmentAdherenceAttempt}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={treatmentAdherenceAttempt}
                        onChange={e => setTreatmentAdherenceAttempt(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                    </div>

                    {/* Satisfaction score */}
                    <div>
                      <div className="flex justify-between text-slate-650 font-semibold">
                        <span>Prescription Satisfaction Score</span>
                        <span className="font-mono text-indigo-600 font-bold">{medicationSatisfactionRating}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={medicationSatisfactionRating}
                        onChange={e => setMedicationSatisfactionRating(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Email Subject line</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-755 focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Two-Paragraph Overview (Para 1: Diagnostic)</label>
                    <textarea
                      rows={3}
                      value={emailOverviewPara1}
                      onChange={e => setEmailOverviewPara1(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs leading-normal text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Two-Paragraph Overview (Para 2: Prognosis / Self-care)</label>
                    <textarea
                      rows={3}
                      value={emailOverviewPara2}
                      onChange={e => setEmailOverviewPara2(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs leading-normal text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Extra Clinical Advice & Guidance Notes</label>
                    <input
                      type="text"
                      value={customCareAdvice}
                      onChange={e => setCustomCareAdvice(e.target.value)}
                      placeholder="e.g. Ensure hydration..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-755 focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={dispatchEmailNewsletter}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Customized Email Newsletter</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-FIDELITY PREVIEW MONUMENTS (V7-GRID: spanning 7 of 12 slots) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* A. DIGITAL OUTBOX REAL-TIME CORRELATION MONITOR */}
          {channel === 'sms' ? (
            /* MOBILE PHONE WRAPPER PREVIEW */
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex flex-col items-center">
              <div className="w-full flex items-center justify-between border-b pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  TCPA Decrypt Simulator (Live Feed)
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-550 border border-slate-250">
                  Carrier: {BRAND.facilityName}
                </span>
              </div>

              {/* PHONE FRAME SHAPE */}
              <div className="relative w-full max-w-[340px] bg-slate-950 rounded-[40px] p-4.5 pt-11 pb-4 shadow-xl border-4 border-slate-800 text-left">
                {/* Notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-800 rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950 mr-2.5"></div>
                  <div className="w-10 h-1 bg-slate-950 rounded"></div>
                </div>

                {/* Phone screen context */}
                <div className="bg-slate-900 rounded-[30px] p-4 min-h-[460px] flex flex-col justify-between overflow-hidden">
                  
                  {/* Status header inside phone */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-4 border-b border-white/5 pb-2">
                    <span>9:41 AM</span>
                    <div className="flex items-center gap-1">
                      <span>LTE</span>
                      <div className="w-4 h-2 bg-slate-400 rounded-sm"></div>
                    </div>
                  </div>

                  {/* Active Chat Name */}
                  <div className="text-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-100 flex items-center justify-center font-bold text-xs mx-auto border border-slate-700">
                      BD
                    </div>
                    <span className="text-[11px] font-bold text-slate-100 block mt-1">{BRAND.facilityName}</span>
                    <span className="text-[8px] text-slate-500 font-mono block">Patient: {targetName} ({targetId})</span>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[310px] min-h-[290px] text-[10px] pr-1.5 scrollbar-thin">
                    {simulatedMobileMessages.map((msg, idx) => {
                      const isClinic = msg.sender === 'clinic';
                      return (
                        <div key={idx} className={`flex flex-col ${isClinic ? 'items-start' : 'items-end'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 leading-normal ${
                            isClinic 
                              ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-750' 
                              : 'bg-sky-600 text-white rounded-tr-none'
                          }`}>
                            <p>{msg.text}</p>
                          </div>
                          <span className="text-[8px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Standard Text Input simulation */}
                  <div className="mt-2.5 pt-2.5 border-t border-white/5 flex gap-2">
                    <div className="flex-1 bg-slate-950 border border-slate-800 text-[10px] text-slate-400 px-3 py-1.5 rounded-full">
                      SMS Messages Locked...
                    </div>
                    <button
                      type="button"
                      onClick={() => alert("Send button disabled. Simulated interactive panel responds automatically to Step inputs.")}
                      className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>

              {/* Quick instructions for helper testing */}
              <div className="mt-4 text-center max-w-sm">
                <p className="text-[11px] text-slate-500 leading-normal">
                  To test the compliance flow: Click <strong>"Dispatched Step 1: Send Consent Text"</strong>. The simulator will receive the authorization request and automatically post the patient's agreement response (<code>YES</code>). You can then trigger the <strong>Welcome welcome text summary link</strong>.
                </p>
              </div>

            </div>
          ) : (
            /* EMAIL COMPILER PREVIEW PANEL */
            <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden text-left">
              
              {/* Header */}
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="text-sm font-bold leading-none">Message preview</h3>
                    <span className="text-[10px] text-slate-400 mt-1 block">Live interactive layout preview</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
              </div>

              {/* Envelope meta details */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 text-xs text-slate-605 space-y-1">
                <div>
                  <span className="font-semibold inline-block w-14">From:</span>
                  <span className="font-mono text-slate-800">{BRAND.noReplyEmail}</span>
                </div>
                <div>
                  <span className="font-semibold inline-block w-14">To:</span>
                  <span className="font-mono text-slate-850 font-extrabold">{targetEmail}</span>
                </div>
                <div>
                  <span className="font-semibold inline-block w-14">Subject:</span>
                  <span className="text-slate-800 font-bold">{emailSubject || "Visit Summary & Wellness Newsletter"}</span>
                </div>
              </div>

              {/* THE NEWSLETTER CANVAS */}
              <div className="p-6 md:p-8 space-y-6 bg-slate-50 max-h-[640px] overflow-y-auto">
                <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-3xs space-y-6">
                  
                  {/* LOGO */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                        <Heart className="w-4 h-4 text-teal-400 fill-teal-400" />
                      </div>
                      <div>
                        <span className="text-xs font-black tracking-tight block">{BRAND.facilityName}</span>
                        <span className="text-[8px] tracking-wider text-slate-400 font-mono block uppercase">Ingress & Health Systems</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono font-bold text-slate-400 block">ID REFERENCE: #{targetId}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-400 block">DATETIME: 2026-06-06</span>
                    </div>
                  </div>

                  {/* RECIPIENT ACCENT */}
                  <div className="bg-teal-50/30 border border-teal-100/70 rounded-xl px-4 py-3 text-xs text-slate-700">
                    <p className="font-semibold">Dear <strong className="text-slate-900">{targetName}</strong>,</p>
                    <p className="mt-1 text-slate-600">This document presents a comprehensive summary indices digest of your clinical evaluation conducted in association with <strong>{BRAND.facilityName}</strong>.</p>
                  </div>

                  {/* 1. VISITAL OVERVIEW (2-Paragraph Statement mandated) */}
                  <div className="space-y-3.5 text-xs text-slate-650 leading-relaxed text-justify">
                    <p>{emailOverviewPara1 || "(Paragraph 1 summary)"}</p>
                    <p>{emailOverviewPara2 || "(Paragraph 2 summary)"}</p>
                  </div>

                  {/* 2. HAND-DRAFTED INTERACTIVE PROGRESS SYMPTOMS DIAGRAM (SVG CURVES) */}
                  <div className="bg-slate-50 border border-slate-205/60 p-4 rounded-2xl space-y-3.5">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider text-slate-450 block text-center mb-1">
                        HISTORIC SYMPTOMS PATHWAYS & DIAGNOSTIC PROGRESS GRAPH
                      </span>
                      <p className="text-[10px] text-slate-500 text-center leading-normal">
                        Interactive SVG metrics representing active metrics compiled directly for client evaluation:
                      </p>
                    </div>

                    {/* SVG GRAPH PLOTTING */}
                    <div className="relative w-full bg-white rounded-xl p-4 border border-slate-105 shadow-3xs">
                      
                      {/* Responsive Grid lines vector using inline SVG */}
                      <svg viewBox="0 0 400 160" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                        {/* Background grid lines */}
                        <line x1="30" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="30" y1="50" x2="380" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="30" y1="80" x2="380" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="30" y1="110" x2="380" y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1="30" y1="140" x2="380" y2="140" stroke="#e2e8f0" strokeWidth="1.5" />
                        
                        {/* Vertical Dividers */}
                        <line x1="30" y1="10" x2="30" y2="140" stroke="#e2e8f0" strokeWidth="1.5" />
                        
                        {/* Label Y Axis */}
                        <text x="5" y="24" className="text-[8px] font-mono font-bold fill-slate-400" textAnchor="start">100%</text>
                        <text x="5" y="84" className="text-[8px] font-mono font-bold fill-slate-400" textAnchor="start">50%</text>
                        <text x="5" y="144" className="text-[8px] font-mono font-bold fill-slate-400" textAnchor="start">0%</text>

                        {/* Calculations for SVG bar height & points */}
                        {/* Formula: Y = 140 - (Y_score * 1.2) */}
                        {(() => {
                          const sY = 140 - (symptomSeverityScore * 1.25);
                          const dY = 140 - (diagnosticCertaintyScore * 1.25);
                          const aY = 140 - (treatmentAdherenceAttempt * 1.25);
                          const mY = 140 - (medicationSatisfactionRating * 1.25);

                          return (
                            <>
                              {/* Filled Visual Area beneath progression curve */}
                              <path 
                                d={`M 70 140 L 70 ${sY} L 150 ${dY} L 240 ${aY} L 330 ${mY} L 330 140 Z`} 
                                fill="url(#blue-teal-gradient)" 
                                opacity="0.12" 
                              />

                              {/* Progress curve line */}
                              <path 
                                d={`M 70 ${sY} L 150 ${dY} L 240 ${aY} L 330 ${mY}`} 
                                fill="none" 
                                stroke="#0d9488" 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                              />

                              {/* Target Point 1: Symptoms */}
                              <circle cx="70" cy={sY} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                              <text x="70" y={sY - 10} className="text-[8px] font-bold fill-rose-600" textAnchor="middle">{symptomSeverityScore}%</text>

                              {/* Target Point 2: Diagnosis */}
                              <circle cx="150" cy={dY} r="5" fill="#14b8a6" stroke="#ffffff" strokeWidth="1.5" />
                              <text x="150" y={dY - 10} className="text-[8px] font-bold fill-teal-600" textAnchor="middle">{diagnosticCertaintyScore}%</text>

                              {/* Target Point 3: Treatment */}
                              <circle cx="240" cy={aY} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                              <text x="240" y={aY - 10} className="text-[8px] font-bold fill-blue-600" textAnchor="middle">{treatmentAdherenceAttempt}%</text>

                              {/* Target Point 4: Prescription */}
                              <circle cx="330" cy={mY} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                              <text x="330" y={mY - 10} className="text-[8px] font-bold fill-indigo-600" textAnchor="middle">{medicationSatisfactionRating}%</text>
                            </>
                          );
                        })()}

                        {/* Defs for gradient background fill */}
                        <defs>
                          <linearGradient id="blue-teal-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14b8a6" />
                            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        
                        {/* X-axis labels */}
                        <text x="70" y="152" className="text-[8px] font-bold fill-slate-500 font-sans" textAnchor="middle">Symptoms</text>
                        <text x="150" y="152" className="text-[8px] font-bold fill-slate-500 font-sans" textAnchor="middle">Diagnosis</text>
                        <text x="240" y="152" className="text-[8px] font-bold fill-slate-500 font-sans" textAnchor="middle">Treatment</text>
                        <text x="330" y="152" className="text-[8px] font-bold fill-slate-500 font-sans" textAnchor="middle">Prescription</text>
                      </svg>

                      {/* Legends */}
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2.5 pt-2.5 border-t border-slate-100 text-[9px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          Symptoms Severity Indicator
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                          Certainty / Response Rate
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Plan Adherence Target
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. CURRENT DIAGNOSTICS & PHARMACEUTICAL DATA GRID */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-900 border-b pb-1">Primary Outpatient Encounter Metrics</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Symptoms & Diagnosis */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-450 uppercase block font-mono text-left">Clinical Admitted Symptoms</span>
                          <p className="text-slate-800 text-left font-medium mt-0.5">{activePatient.currentVisit.symptoms}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-450 uppercase block font-mono text-left">Primary Diagnostic Code / Reason</span>
                          <p className="text-teal-700 text-left font-semibold mt-0.5 bg-teal-50/50 px-2.5 py-1 rounded border border-teal-100/50 w-fit">{calculatedDiagnosis}</p>
                        </div>
                      </div>

                      {/* Treatments & Prescriptions */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-450 uppercase block font-mono text-left">Assigned Treatment Strategy</span>
                          <p className="text-slate-850 text-left font-medium mt-0.5">{calculatedTreatment}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-450 uppercase block font-mono text-left">Prescriptions Logged</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
                              {calculatedRx}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Advice block */}
                    <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-left text-xs">
                      <span className="text-[9px] font-extrabold uppercase font-mono text-indigo-700 block mb-0.5">Advice / Follow-up Recommendation</span>
                      <p className="text-slate-700 font-medium leading-relaxed">{customCareAdvice}</p>
                    </div>
                  </div>

                  {/* 4. COMPREHENSIVE EDUCATIONAL CITATIONS PANEL */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <BookOpen className="w-4 h-4 text-slate-600" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-none">Diagnostic Information & Clinical Bibliography</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">High-authority materials vetted for patient reading</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {activeResources.map((res, i) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-150 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold font-mono text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                              {res.portal}
                            </span>
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-0.5"
                            >
                              <span>Browse Guide</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <h5 className="font-bold text-slate-850 mt-1.5 mb-0.5">{res.title}</h5>
                          <p className="text-[11px] text-slate-600 leading-normal">{res.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer footer */}
                  <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400 space-y-1">
                    <p className="font-semibold">{BRAND.facilityName} Engagement Notice</p>
                    <p className="leading-relaxed">
                      This wellness document represents static clinic diagnostic notes compiled on demand. Do not self-administer medications beyond established physician instructions. If clinical conditions deteriorate, seek immediate emergency care.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* 3. VERIFIED DISPATCH HISTORICAL LEDGER */}
      <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-teal-600" />
          Sent messages log
        </h3>

        {dispatchLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-150">
            No record history exists. Dispatched SMS or Email items will pop-up instantly here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="text-[10px] uppercase text-slate-450 bg-slate-50 border-b border-slate-150">
                <tr>
                  <th className="px-4 py-3 font-mono font-bold">Log Record ID</th>
                  <th className="px-4 py-3 font-sans font-bold">Recipient Name</th>
                  <th className="px-4 py-3 font-sans font-bold">Media Format</th>
                  <th className="px-4 py-3 font-sans font-bold">Contact Router</th>
                  <th className="px-4 py-3 font-sans font-bold">Dispatched Time</th>
                  <th className="px-4 py-3 font-sans font-bold">Broadcasting Status</th>
                  <th className="px-4 py-3 font-sans font-bold">Summary & Diagnostic metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispatchLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-[10px] font-bold text-slate-500">{log.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{log.patientName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded-md ${
                          log.type === 'EMAIL_NEWSLETTER' 
                            ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                            : 'bg-sky-50 text-sky-700 border border-sky-100'
                        }`}>
                          {log.type === 'EMAIL_NEWSLETTER' ? 'Email Digest' : 'SMS Protocol'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{log.recipient}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 font-bold text-emerald-600 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Delivered</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 italic max-w-sm truncate" title={log.summary}>
                        {log.summary}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
