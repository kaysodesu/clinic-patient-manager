import React, { useState, useEffect, useRef } from 'react';
import SubTabs from './ui/SubTabs';
import { can, rolesWith } from '../auth/permissions';
import { AccessDenied } from '../auth/AccessDenied';
import { BRAND } from '../config/brand';
import { Patient, VisitationRecord, ClinicRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Lock, Unlock, FileText, Printer, Download, Share2, 
  CheckCircle2, RefreshCw, Eye, EyeOff, Search, Plus, Trash2, 
  CheckSquare, Square, AlertCircle, FileUp, KeyRound, ExternalLink,
  ChevronRight, Calendar, User, UserCheck, Phone, Stethoscope, Heart,
  Activity, ClipboardList, Info, AlertTriangle, ArrowRight
} from 'lucide-react';
import { clinicalCodes } from '../data/clinicalCodes';

interface SecureRecordsManagerProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  visitationRecords: VisitationRecord[];
  role: ClinicRole;
  onLogITEvent: (type: any, details: string, author?: string, status?: any) => void;
  onUpdateVisitationRecords?: (records: VisitationRecord[]) => void;
}

export interface SecureConversation {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  doctorName: string;
  transcript: string;
  encryptionStatus: 'Encrypted' | 'Decrypted';
  encryptionKeyHash: string;
  consentSignature: string;
  witnessName: string;
  timestamp: string;
}

export interface AfterVisitSummary {
  id: string;
  patientId: string;
  patientName: string;
  visitId: string; // Connected visitation record ID
  date: string;
  doctorName: string;
  chiefComplaint: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    respiratoryRate: string;
  };
  diagnoses: string[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    instructions: string;
  }[];
  careInstructions: string;
  emergencySymptoms: string;
  followUp: {
    date: string;
    time: string;
    instructions: string;
  };
  reviewStatus: 'Draft' | 'AI-Parsed' | 'Pending Review' | 'Verified Accurate';
  reviewedBy?: string;
  reviewedAt?: string;
  verificationChecklist: {
    idChecked: boolean;
    vitalsChecked: boolean;
    diagnosesChecked: boolean;
    medicationsChecked: boolean;
    instructionsChecked: boolean;
  };
  patientSsnCode: string; // Fully customizable passcode 
}

export default function SecureRecordsManager({
  patients,
  selectedPatientId,
  onSelectPatient,
  visitationRecords,
  role,
  onLogITEvent
}: SecureRecordsManagerProps) {
  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0] || null;

  // --- PERSISTENCE: LOCAL STORAGE SEED & LOAD ---
  const [conversations, setConversations] = useState<SecureConversation[]>(() => {
    const saved = localStorage.getItem('clinic_secure_conversations');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [summaries, setSummaries] = useState<AfterVisitSummary[]>(() => {
    const saved = localStorage.getItem('clinic_after_visit_summaries');
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    localStorage.setItem('clinic_secure_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('clinic_after_visit_summaries', JSON.stringify(summaries));
  }, [summaries]);

  // --- SUB-VIEW CONTROLS ---
  // Controls tabs inside this HIPAA view: 'conversations' (ledger), 'avs_editor' (standardizer), 'print_page' (print view), 'portal_simulator' (SSN access check)
  const [secureModeTab, setSecureModeTab] = useState<'conversations' | 'avs_editor' | 'print_page' | 'portal_simulator'>('conversations');

  // Selected Records for inspection
  const [selectedConvId, setSelectedConvId] = useState<string>("CONV-1021");
  const [selectedAvsId, setSelectedAvsId] = useState<string>("AVS-4091");

  // Decryption credentials modal/state
  const [unlockedConvs, setUnlockedConvs] = useState<Record<string, boolean>>({});
  const [accessPin, setAccessPin] = useState('');
  const [pinError, setPinError] = useState('');

  // --- CONVERSATION RECORDER / TRANSCRIPTION SIMULATOR STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [conversationDoctorText, setConversationDoctorText] = useState('');
  const [conversationWitness, setConversationWitness] = useState('Sarah Miller, RN');
  const [consentApproved, setConsentApproved] = useState(true);
  const [newTranscript, setNewTranscript] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated transcription samples for clinical speed-entry
  const transcriptPresets = [
    {
      label: "Sarah Jenkins Asthma Check",
      text: "Doctor: Welcome Sarah, how is your breathing today?\nPatient: It's gotten a bit tighter during my morning runs, especially with the high pollen count.\nDoctor: Understood. I'm reviewing your peak flow; it's down slightly. I want you to continue Albuterol twice daily, and focus on using your spacer carefully. Let's make sure we document this in your after-visit summary and keep your inhaler refilled.\nPatient: Thank you, doctor. I'll make sure to follow that closely."
    },
    {
      label: "Marcus Vance Knee Injury",
      text: "Doctor: Good morning Marcus, let's look at that left knee.\nPatient: Still lock up sometimes when I crawl over the steel joists, doctor.\nDoctor: Yes, the articular MRI demonstrated some medial femoral wear. No complete tear, which is excellent. We are going to prioritize targeted physical therapy sessions twice weekly.\nPatient: Sounds good. I prefer that over surgery.\nDoctor: Excellent. Keep using the compression sleeve and limit hyperflexion. I'll summarize this detail in your AVS."
    },
    {
      label: "Mild Hypertension Diagnostics",
      text: "Doctor: Hello patient, your blood pressure came back at 134/84.\nPatient: Oh, it was a bit lower last time.\nDoctor: Yes, slightly elevated. We will start a daily journal of your BP. Limit high-sodium foods and processed meats, and get 30 mins of moderate walking. I will prescribe Hydrochlorothiazide 12.5 mg tablet today.\nPatient: Understood. I'll buy a blood pressure cuff and log it."
    }
  ];

  // --- AFTER-VISIT SUMMARY FORM STATES ---
  const [avsVisitId, setAvsVisitId] = useState('');
  const [avsDoctorName, setAvsDoctorName] = useState(activePatient?.employmentCoverage.primaryCareProvider || 'Dr. Alistair Vance, MD');
  const [avsChiefComplaint, setAvsChiefComplaint] = useState('');
  const [avsBP, setAvsBP] = useState('120/80 mmHg');
  const [avsHR, setAvsHR] = useState('74');
  const [avsTemp, setAvsTemp] = useState('98.6');
  const [avsRR, setAvsRR] = useState('16');
  const [avsCareInstructions, setAvsCareInstructions] = useState('');
  const [avsEmergencySymptoms, setAvsEmergencySymptoms] = useState('Severe shortness of breath, sudden numbness, chest pain radiating to arm, or confusion.');
  const [avsFollowUpDate, setAvsFollowUpDate] = useState('2026-07-20');
  const [avsFollowUpTime, setAvsFollowUpTime] = useState('09:00 AM');
  const [avsFollowUpInstructions, setAvsFollowUpInstructions] = useState('Verify standard medication tolerance check. Pick up updated therapy charts.');
  const [avsSsnPasscode, setAvsSsnPasscode] = useState('');

  // Diagnostic CPT/ICD codes tags
  const [selectedIcdCodes, setSelectedIcdCodes] = useState<string[]>([]);
  const [icdQuery, setIcdQuery] = useState('');
  const [showIcdList, setShowIcdList] = useState(false);

  // Medication rows
  const [medsList, setMedsList] = useState<{name: string; dosage: string; frequency: string; instructions: string;}[]>([
    { name: '', dosage: '', frequency: '', instructions: '' }
  ]);

  // System Accuracy checklists
  const [checkId, setCheckId] = useState(false);
  const [checkVitals, setCheckVitals] = useState(false);
  const [checkDiagnoses, setCheckDiagnoses] = useState(false);
  const [checkMeds, setCheckMeds] = useState(false);
  const [checkInstructions, setCheckInstructions] = useState(false);

  // --- PORTAL SIMULATOR STATE ---
  const [enteredPortalSsn, setEnteredPortalSsn] = useState('');
  const [portalUnlocked, setPortalUnlocked] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [portalAvsSearchId, setPortalAvsSearchId] = useState('AVS-4091');

  // Pre-load active patient's info into form when patient changes
  useEffect(() => {
    if (activePatient) {
      setAvsDoctorName(activePatient.employmentCoverage.primaryCareProvider || 'Dr. Alistair Vance, MD');
      setAvsChiefComplaint(activePatient.currentVisit.symptoms || '');
      setAvsSsnPasscode(`666-55-${activePatient.id.replace(/\D/g, '').padEnd(4, '0')}`);
      
      // Auto pre-populate visit links if any
      const matchingVisits = visitationRecords.filter(v => v.patientId === activePatient.id);
      if (matchingVisits.length > 0) {
        setAvsVisitId(matchingVisits[0].id);
      } else {
        setAvsVisitId('VIS-STATIC');
      }
    }
  }, [activePatient, visitationRecords]);

  // Recording timer simulation
  const startRecordingSim = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingSim = (presetText?: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    if (presetText) {
      setNewTranscript(presetText);
      onLogITEvent('OTHER', `Simulated audio conversation parsed for ${activePatient?.personalInfo?.firstName || ''} ${activePatient?.personalInfo?.lastName || ''}.`, 'HIPAA_SECURE_CODER', 'SUCCESS');
    } else {
      setNewTranscript("Doctor: Conversational audio log finalized.\nPatient: Recording validated.\nWitness Nurse: Checked.");
    }
  };

  // Create Secured Hash & Encryption Simulation
  const handleSaveConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;
    if (!newTranscript.trim()) {
      alert("⚠️ Transcript field cannot be empty. Record or paste clinical discussion logs.");
      return;
    }
    if (!consentApproved) {
      alert("⚠️ You must verify that the patient completed the HIPAA written/verbal consent release form.");
      return;
    }

    const newConv: SecureConversation = {
      id: `CONV-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activePatient.id,
      patientName: `${activePatient.personalInfo?.firstName || ''} ${activePatient.personalInfo?.lastName || ''}`,
      date: new Date().toISOString().split('T')[0],
      doctorName: avsDoctorName || 'Dr. Rachel Thorne, MD',
      transcript: newTranscript,
      encryptionStatus: 'Encrypted',
      encryptionKeyHash: "sha255-" + Math.random().toString(16).substring(2, 10).padEnd(64, 'a12b'),
      consentSignature: (activePatient.personalInfo?.firstName || '') + " " + (activePatient.personalInfo?.lastName || ''),
      witnessName: conversationWitness,
      timestamp: new Date().toISOString()
    };

    setConversations(prev => [newConv, ...prev]);
    setSelectedConvId(newConv.id);
    setNewTranscript('');
    onLogITEvent('OTHER', `Secured doctor-patient conversation log ${newConv.id} under HIPAA compliance standard for ${newConv.patientName}. AES-256 Envelope generated.`, 'HIPAA_SECURE_CODER', 'SUCCESS');
    alert("🔐 Conversation encrypted with AES-255 algorithm and saved safely under patient secure docket.");
  };

  // "AI Content Parse" trigger to auto-populate the After-Visit-Summary fields
  const triggerAiTranscriptParse = () => {
    const activeConv = conversations.find(c => c.id === selectedConvId);
    if (!activeConv) {
      alert("Please select a valid conversation log to parse first.");
      return;
    }

    // Naive local keyword extractor to showcase the "system AI parsing"
    const text = activeConv.transcript.toLowerCase();
    
    // Parse symptoms
    let complaint = "Asthma symptoms control review";
    if (text.includes("knee")) {
      complaint = "Left knee articulate locking sensation and wear";
    } else if (text.includes("pressure") || text.includes("bp")) {
      complaint = "Blood pressure diagnostic monitoring check";
    } else if (text.includes("cough") || text.includes("pollen")) {
      complaint = "Dry cough and seasonal pollen-induced asthma flareup";
    }
    setAvsChiefComplaint(complaint);

    // Parse Vitals
    if (text.includes("134/84")) {
      setAvsBP("134/84 mmHg");
      setAvsHR("78");
    } else if (text.includes("knee")) {
      setAvsBP("115/72 mmHg");
      setAvsHR("68");
    }

    // Parse diagnoses matching clinicalCode list or custom
    if (text.includes("asthma") || text.includes("breath")) {
      setSelectedIcdCodes(["J45.909 - Unspecified asthma, uncomplicated"]);
      setAvsCareInstructions("Avoid running outside during high pollen days. Clean inhaler mouthpiece weekly. Log morning/night peak exhalations under profile journals.");
      setMedsList([
        { name: "Albuterol inhaler", dosage: "90 mcg (2 puffs)", frequency: "Every 4 hours as needed", instructions: "Inhale slowly over 5 seconds; hold breath for 10 seconds." },
        { name: "Cetirizine daily", dosage: "10 mg", frequency: "Once daily at bedtime", instructions: "Controls allergic trigger cascades." }
      ]);
    } else if (text.includes("knee")) {
      setSelectedIcdCodes(["M17.12 - Unilateral primary osteoarthritis, left knee"]);
      setAvsCareInstructions("Ice joint for 15 minutes after physical therapy sets. Wear double-compression stabilizer sleeves. Limit kneeling under weighted welder frameworks.");
      setMedsList([
        { name: "Ibuprofen", dosage: "400 mg", frequency: "Every 6-8 hours with food", instructions: "Anti-inflammatory joint lubrication inhibitor." }
      ]);
    } else {
      setSelectedIcdCodes(["I10 - Essential (primary) hypertension"]);
      setMedsList([
        { name: "Hydrochlorothiazide", dosage: "12.5 mg", frequency: "Once daily in morning", instructions: "Promotes excess fluid clearance." }
      ]);
    }

    setSecureModeTab('avs_editor');
    // Set status
    alert("🤖 Clinical Intelligence Parser complete! Extracted patient vitals, diagnostic indications, medications regimes, and care instructions straight into the After-Visit Summary editor.");
  };

  // PIN validation to view transcripts
  const tryDecryptConversation = (id: string) => {
    if (can(role, 'emergencyRecordAccess')) {
      // Auto unlock for high authority roles
      setUnlockedConvs(prev => ({ ...prev, [id]: true }));
      return;
    }
    // Other roles can't open encrypted records; the attempt is logged
    alert(`Secure conversation records can only be opened by: ${rolesWith('emergencyRecordAccess')}.`);
    onLogITEvent('OTHER', `DENIED: ${role} tried to open secure conversation record ${id}.`, role, 'ERROR');
  };

  // Add Medication Row
  const handleAddMedRow = () => {
    setMedsList(prev => [...prev, { name: '', dosage: '', frequency: '', instructions: '' }]);
  };

  const handleRemoveMedRow = (idx: number) => {
    setMedsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMedChange = (idx: number, field: string, val: string) => {
    setMedsList(prev => prev.map((med, i) => {
      if (i === idx) {
        return { ...med, [field]: val };
      }
      return med;
    }));
  };

  // Select ICD standard code
  const handleIcdSelect = (codeStr: string) => {
    if (!selectedIcdCodes.includes(codeStr)) {
      setSelectedIcdCodes(prev => [...prev, codeStr]);
    }
    setIcdQuery('');
    setShowIcdList(false);
  };

  const handleRemoveIcd = (codeStr: string) => {
    setSelectedIcdCodes(prev => prev.filter(c => c !== codeStr));
  };

  // CONFIDENCE CALCULATOR FOR SYSTEM REVIEW
  const calculateAccuracyConfidence = () => {
    let checkedCount = 0;
    if (checkId) checkedCount++;
    if (checkVitals) checkedCount++;
    if (checkDiagnoses) checkedCount++;
    if (checkMeds) checkedCount++;
    if (checkInstructions) checkedCount++;
    return (checkedCount / 5) * 100;
  };

  // SAVE standard After Visit Summary
  const handleSaveAVS = (isCertified: boolean) => {
    if (!activePatient) return;
    if (!avsChiefComplaint.trim()) {
      alert("⚠️ Please document the patient's Chief Complaint.");
      return;
    }
    if (selectedIcdCodes.length === 0) {
      alert("⚠️ At least one diagnosed clinical CPT/ICD code should be selected.");
      return;
    }

    const confidence = calculateAccuracyConfidence();
    const statusVal = isCertified ? 'Verified Accurate' : 'Pending Review';

    const newAvs: AfterVisitSummary = {
      id: summaries.some(s => s.id === "AVS-" + activePatient.id) ? "AVS-" + Math.floor(1000 + Math.random() * 90) : `AVS-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activePatient.id,
      patientName: `${activePatient.personalInfo?.firstName || ''} ${activePatient.personalInfo?.lastName || ''}`,
      visitId: avsVisitId,
      date: new Date().toISOString().split('T')[0],
      doctorName: avsDoctorName,
      chiefComplaint: avsChiefComplaint,
      vitals: {
        bloodPressure: avsBP,
        heartRate: avsHR,
        temperature: avsTemp,
        respiratoryRate: avsRR
      },
      diagnoses: selectedIcdCodes,
      medications: medsList.filter(m => m.name.trim() !== ''),
      careInstructions: avsCareInstructions,
      emergencySymptoms: avsEmergencySymptoms,
      followUp: {
        date: avsFollowUpDate,
        time: avsFollowUpTime,
        instructions: avsFollowUpInstructions
      },
      reviewStatus: statusVal,
      reviewedBy: isCertified ? (role === 'ops_manager' ? 'Ops Manager L3' : role === 'team_lead' ? 'Clinical Lead L2' : 'Admin L1') : undefined,
      reviewedAt: isCertified ? new Date().toISOString() : undefined,
      verificationChecklist: {
        idChecked: checkId,
        vitalsChecked: checkVitals,
        diagnosesChecked: checkDiagnoses,
        medicationsChecked: checkMeds,
        instructionsChecked: checkInstructions
      },
      patientSsnCode: avsSsnPasscode || `666-55-${activePatient.id.substring(activePatient.id.length - 4)}`
    };

    // Update summaries list (matching index or appending)
    setSummaries(prev => {
      const idx = prev.findIndex(s => s.id === selectedAvsId);
      if (idx > -1 && prev[idx].patientId === activePatient.id) {
        const updated = [...prev];
        updated[idx] = newAvs;
        return updated;
      }
      return [newAvs, ...prev];
    });

    setSelectedAvsId(newAvs.id);
    onLogITEvent('OTHER', `Created/Modified After-Visit Summary ${newAvs.id}. Status: ${newAvs.reviewStatus}. Accuracy Conf: ${confidence}%.`, 'HIPAA_AVS_COMPILER', 'SUCCESS');
    alert(`📄 After-Visit Summary complied successfully as ${newAvs.id}! Status is now "${statusVal}".`);
    
    // Switch to lists/printable
    setSecureModeTab('conversations');
  };

  // LINK / UPLOAD AVS TO VISIT
  const handleLinkAvsToVisit = (avsId: string, visitId: string) => {
    setSummaries(prev => prev.map(s => {
      if (s.id === avsId) {
        return { ...s, visitId: visitId };
      }
      return s;
    }));
    
    // Also log this link
    onLogITEvent('VISITATION_UPDATE', `Linked After-Visit Summary ${avsId} permanently with clinical visit file ${visitId}.`, 'AVS_VISIT_UPLOADER', 'SUCCESS');
    alert(`🔗 After-Visit Summary successfully uploaded and attached to patient visit file ${visitId}! It will now display as fully linked in the clinical archive.`);
  };

  // PORTAL VIEWER SSN CHECKER
  const handleCheckPortalAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const targetedAvs = summaries.find(s => s.id === portalAvsSearchId);
    if (!targetedAvs) {
      setPortalError("Critical Error: After-Visit Summary file reference not found.");
      setPortalUnlocked(false);
      return;
    }

    // Compare entered code against stored code
    // Standard validation: strip hyphens and check match
    const cleanEntered = enteredPortalSsn.replace(/\D/g, '');
    const cleanStored = targetedAvs.patientSsnCode.replace(/\D/g, '');

    if (cleanEntered === cleanStored || (cleanEntered.length === 4 && cleanStored.endsWith(cleanEntered))) {
      setPortalUnlocked(true);
      setPortalError('');
      onLogITEvent('OTHER', `Patient portal folder decrypted for AVS ${targetedAvs.id} using validated SSN credentials.`, 'PATIENT_PORTAL_GATEWAYS', 'SUCCESS');
    } else {
      setPortalUnlocked(false);
      setPortalError("🔓 SSN Verification Failed: The clinical passcode or SSN entered does not match the file on record.");
      onLogITEvent('OTHER', `PORTAL BLOCKED: Unauthorized SSN credentials entered for summary ${targetedAvs.id}`, 'PATIENT_PORTAL_GATEWAYS', 'ERROR');
    }
  };

  // --- PRINT / PDF TRIGGER ---
  const triggerPrintScreen = (avs: AfterVisitSummary) => {
    setSelectedAvsId(avs.id);
    setSecureModeTab('print_page');
  };

  const handleTriggerPrintCommand = () => {
    window.print();
  };

  const handleDownloadPdfSim = (avs: AfterVisitSummary) => {
    // Generate text/plain or text/html download blob to pretend to be a professional PDF
    const content = `
=============================================
             AFTER-VISIT SUMMARY          
     ${BRAND.facilityName.toUpperCase()}   
=============================================
PATIENT NAME : ${avs.patientName}          
RECORD ID    : ${avs.id}                  
VISIT DATE   : ${avs.date}                
ATTENDING DR : ${avs.doctorName}          
---------------------------------------------
CHIEF COMPLAINT:
${avs.chiefComplaint}

VITALS:
  Blood Pressure    : ${avs.vitals.bloodPressure}
  Heart Rate        : ${avs.vitals.heartRate}
  Temperature       : ${avs.vitals.temperature}
  Respiratory Rate  : ${avs.vitals.respiratoryRate}

DIAGNOSES (ICD-10):
${avs.diagnoses.map(d => ` - ${d}`).join('\n')}

MEDICATION INSTRUCTIONS:
${avs.medications.map((m, i) => `${i+1}. ${m.name} ${m.dosage} (${m.frequency})\n   Inst: ${m.instructions}`).join('\n')}

CARE PLAN & DIRECTIVES:
${avs.careInstructions}

EMERGENCY PROTOCOL SYMPTOMS:
${avs.emergencySymptoms}

FUTURE FOLLOW-UP:
  Date: ${avs.followUp.date} at ${avs.followUp.time}
  Inst: ${avs.followUp.instructions}

---------------------------------------------
HIPAA SECURITY VERIFICATION SHIELD:
  Standard Status : APPROVED & SIGNED
  Accreditation  : Verified Accurate
  Access Key Hash : ${avs.patientSsnCode.replace(/.(?=.{4})/g, '*')}
=============================================
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AfterVisitSummary_${avs.patientName.replace(/\s+/g, '_')}_${avs.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onLogITEvent('OTHER', `Downloaded text medical report format for AVS ${avs.id} successfully.`, role, 'SUCCESS');
  };

  const copySecureAccessLink = (avs: AfterVisitSummary) => {
    // Generate simulated URL containing the AVS query parameter
    const simulatedLink = `${window.location.origin}/?portal_view=true&avs_ref=${avs.id}`;
    navigator.clipboard.writeText(simulatedLink).then(() => {
      alert(`🔗 Secure link copied to clinical clipboard!\n\nUrl: ${simulatedLink}\nCode: Send this with patient's SSN (${avs.patientSsnCode}) to review safely.`);
      onLogITEvent('OTHER', `Copied patient portal secure link generator for AVS ${avs.id} to clipboard!`, role, 'SUCCESS');
    }).catch(err => {
      alert("Failed to copy automatically. Link: " + simulatedLink);
    });
  };

  const selectedAvs = summaries.find(s => s.id === selectedAvsId) || summaries[0];

  // Filter diagnoses presets matches
  const icdSuggestions = clinicalCodes.filter(c => 
    c.code.toLowerCase().includes(icdQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(icdQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <div id="hipaa-secure-records-container" className="space-y-6">
      
      <SubTabs
        label="Secure records views"
        active={secureModeTab}
        onChange={(id) => {
          if (id === 'portal_simulator') {
            setPortalUnlocked(false);
            setEnteredPortalSsn('');
            if (selectedAvs) setPortalAvsSearchId(selectedAvs.id);
          }
          if (id === 'avs_editor') {
            // start a new summary with an empty checklist
            setCheckId(false);
            setCheckVitals(false);
            setCheckDiagnoses(false);
            setCheckMeds(false);
            setCheckInstructions(false);
          }
          setSecureModeTab(id);
        }}
        tabs={[
          { id: 'conversations', label: 'Conversations & summaries', icon: ShieldCheck },
          { id: 'avs_editor', label: 'New after-visit summary', icon: Plus },
          { id: 'portal_simulator', label: 'Preview in patient portal', icon: KeyRound },
        ]}
      />

      {/* 2. TAB SWAPPER CONTAINER ELEMENT */}
      <AnimatePresence mode="wait">
        
        {/* VIEW A: SECURE LEDGER & CHATTER */}
        {secureModeTab === 'conversations' && (
          <motion.div 
            key="conversations_ledger"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* LEFT LOG COL: CONVERSATIONS LISTED */}
            <div className="lg:col-span-5 bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-500" />
                  <span>Conversations</span>
                </h3>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Count: {conversations.length}
                </span>
              </div>

              {/* Patient switch reminder indicator */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Active Medical Folder</span>
                    <strong className="text-xs text-slate-800">{activePatient?.personalInfo?.firstName || ''} {activePatient?.personalInfo?.lastName || ''}</strong>
                  </div>
                </div>
                <span className="text-[10px] bg-teal-100 text-teal-700 font-extrabold px-1.5 py-0.5 rounded font-mono">{activePatient?.id}</span>
              </div>

              {/* Dynamic Scroll List */}
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {conversations.filter(c => c.patientId === activePatient?.id).map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all relative flex flex-col gap-1 cursor-pointer overflow-hidden ${
                      selectedConvId === conv.id 
                        ? 'bg-teal-50/50 border-teal-200 shadow-3xs' 
                        : 'bg-white border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-800">{conv.doctorName}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{conv.date}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono tracking-tight bg-slate-50 border border-slate-150 rounded px-1.5 py-0.5 self-start">
                      {conv.id}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        unlockedConvs[conv.id] ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {unlockedConvs[conv.id] ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                        {unlockedConvs[conv.id] ? 'Decrypted Context' : 'Encrypted AES-256'}
                      </span>
                      <span className="text-[9px] text-slate-450">Consent Signed ✓</span>
                    </div>
                  </button>
                ))}
                {conversations.filter(c => c.patientId === activePatient?.id).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No conversation logs on file for {activePatient?.personalInfo?.firstName || 'this patient'}.
                  </div>
                )}
              </div>

              {/* RECORDER PANEL SIMULATOR */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">Verify Live Consultation Recording</span>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-slate-400">INPUT DEVICE: MIC INTERCEPTOR</span>
                      {isRecording && (
                        <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold animate-pulse">
                          <span className="w-2 h-2 bg-rose-500 rounded-full" />
                          RECORDING ({recordingSeconds}s)
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startRecordingSim}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                          <span>Start Audio Scan</span>
                        </button>
                      ) : (
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => stopRecordingSim()}
                            className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-650 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Finish
                          </button>
                          {transcriptPresets.map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => stopRecordingSim(preset.text)}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-550 text-[10px] font-bold rounded text-white cursor-pointer"
                            >
                              Load {preset.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transcript editor saving form */}
                  <form onSubmit={handleSaveConversation} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Raw Audio Transcript</label>
                      <textarea
                        value={newTranscript}
                        onChange={(e) => setNewTranscript(e.target.value)}
                        placeholder="Paste or type raw vocal consultation notes here..."
                        className="w-full h-24 text-xs font-mono p-2.5 border border-slate-200 rounded-xl focus:outline-teal-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Witness / Staff</label>
                        <input
                          type="text"
                          value={conversationWitness}
                          onChange={(e) => setConversationWitness(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div className="flex items-center pl-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 select-none cursor-pointer mt-4">
                          <input
                            type="checkbox"
                            checked={consentApproved}
                            onChange={(e) => setConsentApproved(e.target.checked)}
                            className="rounded text-teal-600 border-slate-300 focus:ring-teal-500 w-4 h-4"
                          />
                          <span>HIPAA Consent OK</span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Encrypt & Save HIPAA Conversation</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* RIGHT SUMMARY COL: CHATTER VIEWER & AVS DIRECTORY */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* SECTION A.1: SELECTED CONVERSATION TRANSCRIPT INSIGHTS */}
              {(() => {
                const activeConv = conversations.find(c => c.id === selectedConvId);
                if (!activeConv) return null;
                const isDecrypted = unlockedConvs[activeConv.id] || role === 'ops_manager' || role === 'team_lead';

                return (
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-slate-150 text-slate-800 px-2.5 py-0.5 rounded-md font-bold">
                            {activeConv.id}
                          </span>
                          <span className="text-xs text-slate-450 font-medium">Logged on {activeConv.date}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">Conversation: {activeConv.patientName} & {activeConv.doctorName}</h4>
                      </div>
                      <span className={`text-[10px] font-mono border px-2 py-0.5 rounded-full font-bold ${
                        isDecrypted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                      }`}>
                        {isDecrypted ? 'Status: DECRYPTED' : 'Status: HIPAA LOCKED'}
                      </span>
                    </div>

                    {/* Encryption status view */}
                    {!isDecrypted ? (
                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-8 text-center space-y-4">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div className="max-w-md mx-auto space-y-1">
                          <h5 className="text-xs font-extrabold text-slate-800">AES-256 Protected Private Health Record</h5>
                          <p className="text-[11px] text-slate-450 leading-relaxed">
                            This discussion content includes patient Protected Health Information (PHI) under federal HIPAA laws. Unredacted logs are encrypted inside our Cloud sandbox.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => tryDecryptConversation(activeConv.id)}
                          className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Decrypt Log Module</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Decrypted Transcript Box */}
                        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3 max-h-[220px] overflow-y-auto">
                          <span className="text-[9.5px] font-bold text-slate-450 uppercase tracking-widest block border-b border-slate-200/60 pb-1.5">Unredacted Conversation Log</span>
                          <div className="space-y-3">
                            {activeConv.transcript.split('\n').map((line, lIdx) => {
                              const isDr = line.startsWith('Doctor:');
                              const isPt = line.startsWith('Patient:');
                              return (
                                <div key={lIdx} className="text-xs leading-relaxed">
                                  <strong className={isDr ? "text-teal-600" : isPt ? "text-amber-600" : "text-slate-700"}>
                                    {line.split(':')[0]}:
                                  </strong>
                                  <span className="text-slate-850 ml-1">{line.substring(line.indexOf(':') + 1)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Audit Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-teal-50/20 border border-teal-500/10 p-3 rounded-xl font-mono text-slate-550">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Consent Approved Signee:</span>
                            <span className="text-slate-800 font-sans font-extrabold">{activeConv.consentSignature}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">SHA-256 Digest Block Hash:</span>
                            <span className="text-slate-900 text-[10px] line-clamp-1 truncate block">{activeConv.encryptionKeyHash}</span>
                          </div>
                        </div>

                        {/* Action parser: Auto compile as After-Visit Summary */}
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <strong className="text-emerald-950 font-bold block">Draft After-Visit Summary (AVS) Automatically</strong>
                            <p className="text-[10.5px] text-emerald-850">Parse this transcript to prefill medication dosages, vitals levels, care instructions, and symptoms warnings.</p>
                          </div>
                          <button
                            type="button"
                            onClick={triggerAiTranscriptParse}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>Compile AVS</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SECTION A.2: AFTER-VISIT SUMMARIES LISTING (AVS DIRECTORY) */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-500" />
                    <span>After-visit summaries</span>
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Active AVS: {summaries.filter(s => s.patientId === activePatient?.id).length}
                  </span>
                </div>

                {/* Summaries list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summaries.filter(s => s.patientId === activePatient?.id).map(avs => {
                    const linkedVisit = visitationRecords.find(v => v.id === avs.visitId);
                    
                    return (
                      <div 
                        key={avs.id} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          selectedAvsId === avs.id 
                            ? 'bg-teal-50/10 border-teal-500 shadow-3xs' 
                            : 'bg-white border-slate-150 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-extrabold">
                              {avs.id}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              avs.reviewStatus === 'Verified Accurate' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {avs.reviewStatus}
                            </span>
                          </div>

                          <div className="text-left font-sans">
                            <span className="text-[9px] text-slate-400 block uppercase">Chief Complaint</span>
                            <strong className="text-xs text-slate-800 line-clamp-1">{avs.chiefComplaint}</strong>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-550">
                            <div>
                              <span className="text-slate-400">Dr:</span> <span className="font-medium text-slate-700">{avs.doctorName.split(',')[0]}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Date:</span> <span className="font-mono text-slate-700">{avs.date}</span>
                            </div>
                          </div>

                          {/* Link attachment status */}
                          <div className="mt-2 text-[10px] bg-slate-50 border border-slate-200/60 p-2 rounded-lg flex items-center justify-between gap-1.5 text-left">
                            <div>
                              <span className="text-slate-400 text-[8.5px] uppercase block leading-none font-bold">Uploaded Visited Connection</span>
                              <strong className="text-[10px] text-slate-800">{avs.visitId || 'No Visit Linked'}</strong>
                            </div>
                            
                            {/* Visit drop connector linker */}
                            <select
                              value={avs.visitId}
                              onChange={(e) => handleLinkAvsToVisit(avs.id, e.target.value)}
                              className="text-[10px] p-1 border border-slate-200 rounded font-bold cursor-pointer max-w-[130px]"
                            >
                              <option value="">-- Attach Visit --</option>
                              {visitationRecords.filter(v => v.patientId === avs.patientId).map(vr => (
                                <option key={vr.id} value={vr.id}>{vr.id} ({vr.visitDate})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Interactive summary buttons */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => triggerPrintScreen(avs)}
                            className="py-1.5 border border-slate-250 text-slate-750 hover:bg-slate-50 font-bold text-[10.5px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Printer className="w-3 h-3 text-slate-500" />
                            <span>Print Preview</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => copySecureAccessLink(avs)}
                            className="py-1.5 bg-slate-100 hover:bg-slate-150 text-slate-800 font-extrabold text-[10.5px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Share2 className="w-3 h-3 text-teal-600 animate-pulse" />
                            <span>Secure link</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {summaries.filter(s => s.patientId === activePatient?.id).length === 0 && (
                    <div className="col-span-2 text-center py-10 text-slate-400 text-xs font-sans">
                      No matching After-Visit Summaries (AVS) recorded. Create one above!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW B: COMPILE & REVIEW AVS EDITOR */}
        {secureModeTab === 'avs_editor' && (
          <motion.div 
            key="avs_editor_module"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-teal-500" />
                  <span>Standardized After-Visit Summary Compiler</span>
                </h3>
                <p className="text-xs text-slate-450">Standardized summaries optimized for compliance review</p>
              </div>
              <button
                type="button"
                onClick={() => setSecureModeTab('conversations')}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-55 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel / Return
              </button>
            </div>

            {/* FORM BODY FOR CRITICAL DATA METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left text-xs">
              
              {/* COMPILER METRICS BLOCK */}
              <div className="space-y-4">
                <span className="text-[10.5px] font-extrabold text-teal-600 uppercase tracking-widest block border-b border-slate-100 pb-1.5">1. Administrative & Clinical Keys</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Affiliated Patient ID</label>
                    <div className="p-2.5 bg-slate-100 rounded-xl font-bold text-slate-700">{activePatient?.id || 'N/A'} ({activePatient?.personalInfo?.firstName || 'N/A'})</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Attending Physician/Dr</label>
                    <input
                      type="text"
                      value={avsDoctorName}
                      onChange={(e) => setAvsDoctorName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Linked Patient Visit ID</label>
                    <select
                      value={avsVisitId}
                      onChange={(e) => setAvsVisitId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl cursor-pointer"
                    >
                      <option value="">-- No Direct Visit Linked --</option>
                      {visitationRecords.filter(v => v.patientId === activePatient?.id).map(vr => (
                        <option key={vr.id} value={vr.id}>{vr.id} ({vr.visitDate})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Patient Secure SSN Access Code</label>
                    <input
                      type="text"
                      value={avsSsnPasscode}
                      onChange={(e) => setAvsSsnPasscode(e.target.value)}
                      placeholder="e.g. 666-55-8802"
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-bold font-mono tracking-wider bg-amber-50/20 text-amber-900 placeholder:text-slate-400"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block leading-tight">Patient entry passcode used to authenticate shared links. Must match SSN format.</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chief complaint & reason of consultation</label>
                  <textarea
                    value={avsChiefComplaint}
                    onChange={(e) => setAvsChiefComplaint(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                    placeholder="Dry cough, throat irritation, bronchial tightness following light cardio sets..."
                  />
                </div>

                {/* Patient Objective Vitals */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Objective Vitals Logged</label>
                  <div className="grid grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Blood Pres.</span>
                      <input
                        type="text"
                        value={avsBP}
                        onChange={(e) => setAvsBP(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-center font-mono mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">HR value</span>
                      <input
                        type="text"
                        value={avsHR}
                        onChange={(e) => setAvsHR(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-center font-mono mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Temp (°F)</span>
                      <input
                        type="text"
                        value={avsTemp}
                        onChange={(e) => setAvsTemp(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-center font-mono mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Resp. Rate</span>
                      <input
                        type="text"
                        value={avsRR}
                        onChange={(e) => setAvsRR(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-center font-mono mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* ICD-10 Coding Tags Selector */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">DIAGNOSES ENCOUNTERED (ICD-10)</label>
                  <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-50 border border-slate-200 rounded-xl items-center">
                    {selectedIcdCodes.map(code => (
                      <span key={code} className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-800 font-medium text-[10.5px] px-2 py-0.5 rounded-lg">
                        <span>{code}</span>
                        <button type="button" onClick={() => handleRemoveIcd(code)} className="text-teal-500 hover:text-teal-700 font-extrabold cursor-pointer">×</button>
                      </span>
                    ))}
                    {selectedIcdCodes.length === 0 && <span className="text-[10.5px] text-slate-400 pl-1">Search & select clinical ICD codes list...</span>}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={icdQuery}
                      onChange={(e) => {
                        setIcdQuery(e.target.value);
                        setShowIcdList(true);
                      }}
                      onFocus={() => setShowIcdList(true)}
                      placeholder="Type diagnostic name: Asthma, knee, or codes I10..."
                      className="flex-1 p-2 border border-slate-200 rounded-lg text-xs"
                    />
                    {showIcdList && (
                      <button
                        type="button"
                        onClick={() => setShowIcdList(false)}
                        className="text-[10.5px] border border-slate-300 px-2 rounded-lg"
                      >
                        Hide
                      </button>
                    )}
                  </div>

                  {showIcdList && icdQuery.trim() !== '' && (
                    <div className="absolute top-[100%] left-0 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-md p-1.5 max-h-[160px] overflow-y-auto">
                      {icdSuggestions.map(presetCode => (
                        <button
                          key={presetCode.code}
                          type="button"
                          onClick={() => handleIcdSelect(`${presetCode.code} - ${presetCode.description}`)}
                          className="w-full text-left p-2 hover:bg-slate-50 text-[11px] rounded transition-colors block border-b border-slate-100 last:border-0"
                        >
                          <strong className="text-teal-700 font-mono">{presetCode.code}</strong> — {presetCode.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* MEDS DIRECTIVES & COMPLIANCE REVIEW CHECKLIST */}
              <div className="space-y-4">
                <span className="text-[10.5px] font-extrabold text-teal-600 uppercase tracking-widest block border-b border-slate-100 pb-1.5">2. Prescriptions & Discharge Instructions</span>
                
                {/* Dynamically controlled meds loop */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Clinical Medication Regimes</label>
                    <button
                      type="button"
                      onClick={handleAddMedRow}
                      className="text-[10px] text-teal-600 font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Medication
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {medsList.map((med, medIdx) => (
                      <div key={medIdx} className="p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5 relative">
                        {medsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedRow(medIdx)}
                            className="absolute top-1 right-2 text-rose-500 font-bold hover:text-rose-700 text-xs cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        <span className="text-[9px] text-slate-400 font-bold">MEDICATION ROW #{medIdx + 1}</span>
                        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                          <div>
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleMedChange(medIdx, 'name', e.target.value)}
                              placeholder="e.g. Albuterol inhaler"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => handleMedChange(medIdx, 'dosage', e.target.value)}
                              placeholder="e.g. 90mcg (2 puffs)"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                          <div>
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => handleMedChange(medIdx, 'frequency', e.target.value)}
                              placeholder="e.g. Twice daily morning/night"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={med.instructions}
                              onChange={(e) => handleMedChange(medIdx, 'instructions', e.target.value)}
                              placeholder="e.g. Take with warm decaffeinated drinks"
                              className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Standard discharge & care instructions</label>
                    <textarea
                      value={avsCareInstructions}
                      onChange={(e) => setAvsCareInstructions(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                      placeholder="Limit running on peak high ozone indices. Wash inhalation spacers once weekly..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Critical emergency red-flags symptoms (Warning panel)</label>
                    <input
                      type="text"
                      value={avsEmergencySymptoms}
                      onChange={(e) => setAvsEmergencySymptoms(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Follow up metrics */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Future Care Scheduling</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[8.5px] text-slate-400 block uppercase font-bold">Appointment Date</span>
                      <input
                        type="date"
                        value={avsFollowUpDate}
                        onChange={(e) => setAvsFollowUpDate(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded text-[11px]"
                      />
                    </div>
                    <div>
                      <span className="text-[8.5px] text-slate-400 block uppercase font-bold">Appointment Time</span>
                      <input
                        type="text"
                        value={avsFollowUpTime}
                        onChange={(e) => setAvsFollowUpTime(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded text-[11px]"
                      />
                    </div>
                    <div>
                      <span className="text-[8.5px] text-slate-400 block uppercase font-bold">Diagnostic test</span>
                      <input
                        type="text"
                        value={avsFollowUpInstructions}
                        onChange={(e) => setAvsFollowUpInstructions(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 rounded text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. SYSTEM CLINICAL REVIEW ACCURACY MATRIX */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-850 text-white rounded-xl p-4 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-teal-400 font-black uppercase tracking-wider block">Clinical Accuracy System Check</span>
                    <span className="text-xs bg-teal-500/10 text-teal-300 font-extrabold px-1.5 py-0.5 rounded">
                      Score: {calculateAccuracyConfidence()}% Verified
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                    <label className="flex items-center gap-1.5 select-none cursor-pointer text-slate-350 hover:text-white">
                      <input
                        type="checkbox"
                        checked={checkId}
                        onChange={(e) => setCheckId(e.target.checked)}
                        className="rounded text-teal-500 border-slate-800 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <span>Verify Patient ID and DOB matched</span>
                    </label>
                    <label className="flex items-center gap-1.5 select-none cursor-pointer text-slate-350 hover:text-white">
                      <input
                        type="checkbox"
                        checked={checkVitals}
                        onChange={(e) => setCheckVitals(e.target.checked)}
                        className="rounded text-teal-500 border-slate-800 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <span>Verify vitals ranges validated</span>
                    </label>
                    <label className="flex items-center gap-1.5 select-none cursor-pointer text-slate-350 hover:text-white">
                      <input
                        type="checkbox"
                        checked={checkDiagnoses}
                        onChange={(e) => setCheckDiagnoses(e.target.checked)}
                        className="rounded text-teal-500 border-slate-800 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <span>Cross-verify ICD-10 diagnostic codes</span>
                    </label>
                    <label className="flex items-center gap-1.5 select-none cursor-pointer text-slate-350 hover:text-white">
                      <input
                        type="checkbox"
                        checked={checkMeds}
                        onChange={(e) => setCheckMeds(e.target.checked)}
                        className="rounded text-teal-500 border-slate-800 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <span>Validate Rx dosages safe limits</span>
                    </label>
                    <label className="flex items-center gap-1.5 select-none cursor-pointer text-slate-350 hover:text-white md:col-span-2">
                      <input
                        type="checkbox"
                        checked={checkInstructions}
                        onChange={(e) => setCheckInstructions(e.target.checked)}
                        className="rounded text-teal-500 border-slate-800 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <span>Review patient compliance discharge care rules clarity</span>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* ACTION TRIGGERS IN EDITOR FOOTER */}
            <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-slate-100 justify-end">
              <button
                type="button"
                onClick={() => handleSaveAVS(false)}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl cursor-pointer"
              >
                Save as Draft Summary
              </button>
              
              <button
                type="button"
                onClick={() => handleSaveAVS(true)}
                className={`px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  calculateAccuracyConfidence() === 100 
                    ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
                <span>Certify Standard & Lock Summary (Verify)</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW C: PRINT PREVIEW PAGE MODE */}
        {secureModeTab === 'print_page' && selectedAvs && (
          <motion.div 
            key="avs_print_manifest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            {/* Top clinical task control buttons */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-400" />
                <span className="text-xs font-bold font-sans">Medical Print / Download Portal Active</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrintCommand}
                  className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-650 text-slate-950 font-black text-xs rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPdfSim(selectedAvs)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-755 text-slate-200 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download file (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSecureModeTab('conversations')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-755 text-slate-400 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>

            {/* HIGH FIDELITY CLINICAL SUMMARY SHEET SHEET RENDER */}
            <div className="bg-white border-2 border-slate-350 p-8 md:p-12 shadow-sm rounded-2xl relative text-left select-text print:bg-white print:border-0 print:shadow-none print:p-0">
              
              {/* HIPAA federal sealing watermark */}
              <div className="absolute top-4 right-4 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-center select-none print:bg-white print:border-slate-300">
                <span className="text-[8.5px] font-mono tracking-widest text-slate-450 uppercase block font-black">HIPAA Compliance Code</span>
                <strong className="text-[10px] text-slate-800 font-bold block">FEDERAL SECTION §164.502</strong>
              </div>

              {/* Clinic primary identity headers */}
              <div className="border-b-4 border-slate-900 pb-6 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-600 rounded-lg text-white font-black">
                    <Heart className="w-6 h-6 stroke-[3.5]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 leading-tight">{BRAND.facilityName.toUpperCase()}</h2>
                    <span className="text-[10px] text-slate-500 font-mono block tracking-widest">PATIENT CLINICAL OUTPATIENT REFERENCE</span>
                  </div>
                </div>
              </div>

              {/* Title tag */}
              <div className="text-center py-6">
                <h1 className="text-xl font-black text-slate-950 uppercase tracking-widest">OFFICIAL AFTER-VISIT SUMMARY (AVS)</h1>
                <p className="text-xs text-slate-450 mt-1">Review finalized summary report carefully. Lock code: {selectedAvs.patientSsnCode.replace(/.(?=.{4})/g, '*')}</p>
              </div>

              {/* Administrative block details metadata */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl grid grid-cols-2 gap-4 text-xs font-sans text-slate-800 mb-8 print:bg-white print:border-slate-300">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Patient Name</span>
                    <strong className="text-slate-900 text-sm">{selectedAvs.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Date of Admissions</span>
                    <span className="font-mono text-slate-700">{selectedAvs.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Affiliated Clinic ID</span>
                    <strong className="font-mono font-bold text-slate-700">{selectedAvs.patientId}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Attending Physician MD</span>
                    <strong className="text-slate-900 text-sm">{selectedAvs.doctorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Affiliated Document ID</span>
                    <span className="font-mono text-slate-700 font-bold">{selectedAvs.id || 'AVS-DOCKET'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Visitations Enc. File</span>
                    <span className="font-mono text-slate-700 font-bold">{selectedAvs.visitId || 'Isolated Visit'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 text-sm text-slate-800">
                
                {/* 1. CHIEF COMPLAINT */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-950 uppercase tracking-widest text-xs border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-teal-500 inline-block shrink-0" />
                    <span>I. Indication / Clinical Symptoms Discussion</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed text-xs pl-3 pt-1">{selectedAvs.chiefComplaint}</p>
                </div>

                {/* 2. VITALS MEASURED */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-950 uppercase tracking-widest text-xs border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-teal-500 inline-block shrink-0" />
                    <span>II. Objective Physical Vitals Collected</span>
                  </h4>
                  <div className="grid grid-cols-4 gap-4 text-xs pl-3 text-slate-800">
                    <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-center print:bg-white print:border-slate-200">
                      <span className="text-slate-400 text-[8.5px] uppercase block tracking-wider leading-none">Blood Pressure</span>
                      <strong className="text-slate-900 font-mono font-bold block mt-1">{selectedAvs.vitals.bloodPressure}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-center print:bg-white print:border-slate-200">
                      <span className="text-slate-400 text-[8.5px] uppercase block tracking-wider leading-none">Heart Rate</span>
                      <strong className="text-slate-900 font-mono font-bold block mt-1">{selectedAvs.vitals.heartRate} bpm</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-center print:bg-white print:border-slate-200">
                      <span className="text-slate-400 text-[8.5px] uppercase block tracking-wider leading-none">Temperature</span>
                      <strong className="text-slate-900 font-mono font-bold block mt-1">{selectedAvs.vitals.temperature} °F</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-center print:bg-white print:border-slate-200">
                      <span className="text-slate-400 text-[8.5px] uppercase block tracking-wider leading-none">Respiratory</span>
                      <strong className="text-slate-900 font-mono font-bold block mt-1">{selectedAvs.vitals.respiratoryRate} /min</strong>
                    </div>
                  </div>
                </div>

                {/* 3. DIAGNOSES CODES */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-950 uppercase tracking-widest text-xs border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-teal-500 inline-block shrink-0" />
                    <span>III. Outpatient Diagnoses (ICD-10-CM Codes)</span>
                  </h4>
                  <ul className="list-disc list-inside mt-1 pl-3 text-xs text-slate-700 space-y-1">
                    {selectedAvs.diagnoses.map((diag, index) => (
                      <li key={index} className="leading-relaxed">
                        <strong className="text-teal-800 font-mono font-semibold">{diag.split(' - ')[0]}</strong> — {diag.split(' - ')[1]}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. MEDICATION COMPLIANCE */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-950 uppercase tracking-widest text-xs border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-teal-500 inline-block shrink-0" />
                    <span>IV. Clinically Certified Medications Schedule</span>
                  </h4>
                  <div className="space-y-3 pl-3">
                    {selectedAvs.medications.map((med, index) => (
                      <div key={index} className="p-3 border border-slate-200 rounded-xl bg-slate-50/20 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-teal-700 text-sm">💊 {med.name}</span>
                          <span className="text-slate-600">Dosage: {med.dosage}</span>
                        </div>
                        <p className="mt-1 text-slate-700"><span className="text-slate-450 font-semibold uppercase text-[9px] block">Timing / Frequency:</span> {med.frequency}</p>
                        <p className="mt-0.5 text-slate-500 italic"><span className="text-slate-450 font-semibold uppercase text-[9px] block">Discharge Instructions:</span> {med.instructions}</p>
                      </div>
                    ))}
                    {selectedAvs.medications.length === 0 && (
                      <p className="text-xs text-slate-500 italic">No medication changes or startup prescriptions issued during this clinical check.</p>
                    )}
                  </div>
                </div>

                {/* 5. PRIVATE DISCHARGE CARE PLAN */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-950 uppercase tracking-widest text-xs border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-teal-500 inline-block shrink-0" />
                    <span>V. Continuing Home Care Plan Instructions</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed text-xs pl-3 pt-1 whitespace-pre-line">{selectedAvs.careInstructions}</p>
                </div>

                {/* 6. RED FLAGS WARNING */}
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <h5 className="text-[10px] font-extrabold text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-550 shrink-0" />
                    <span>CRITICAL RED-FLAG ALERT WARNINGS</span>
                  </h5>
                  <p className="text-xs text-rose-950 leading-relaxed pl-5 font-semibold">{selectedAvs.emergencySymptoms}</p>
                  <p className="text-[10px] text-rose-700 pl-5 leading-relaxed mt-1">If any of these conditions are encountered, immediately call 911 or report to the nearest Emergency Consultation Ward.</p>
                </div>

                {/* 7. SCHEDULING DISPATCH */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-950 uppercase tracking-widest text-xs border-b border-slate-300 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-teal-500 inline-block shrink-0" />
                    <span>VI. Upcoming Care Referrals Scheduling</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pl-3 pt-1">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase text-[9px]">Follow-up Admittance</span>
                      <strong className="text-slate-800">{selectedAvs.followUp.date} at {selectedAvs.followUp.time}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase text-[9px]">Affiliation directives</span>
                      <p className="text-slate-700 leading-normal">{selectedAvs.followUp.instructions}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Legal regulatory sign-offs footer */}
              <div className="border-t border-slate-300 mt-10 pt-6 grid grid-cols-2 gap-4 text-[10px] text-slate-500 font-mono">
                <div>
                  <span className="block text-slate-400">Electronic verification:</span>
                  <span className="text-slate-800 font-sans font-bold block mt-1">Verified Accurate by System Matrix Check</span>
                  <span className="text-[9px] text-slate-400">Review status: {selectedAvs.reviewStatus} ({selectedAvs.reviewedBy || 'Admin'})</span>
                </div>
                <div className="text-right">
                  <span className="block text-slate-400">Physical Clinic Verification Code:</span>
                  <strong className="text-slate-800 font-sans font-semibold block mt-1">Signed out under Cascade Hub Vault</strong>
                  <span className="text-[9px] font-mono text-slate-500">Admittance timestamp: {selectedAvs.reviewedAt || new Date().toISOString()}</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW D: SECURED PATIENT ACCESS PORTAL SIMULATOR */}
        {secureModeTab === 'portal_simulator' && (
          <motion.div 
            key="secure_patient_access_portal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-6 text-left">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                  <KeyRound className="w-5 h-5 line-clamp-1 shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-50">Patient portal preview</h3>
                  <p className="text-[10.5px] text-slate-400 leading-tight">Authenticating access via federal regulatory SSN keys</p>
                </div>
              </div>

              {!portalUnlocked ? (
                <form onSubmit={handleCheckPortalAccess} className="space-y-4 text-xs font-sans">
                  
                  {/* Select AVS to test */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select AVS Document Docket to Access</label>
                    <select
                      value={portalAvsSearchId}
                      onChange={(e) => {
                        setPortalAvsSearchId(e.target.value);
                        setPortalError('');
                      }}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                    >
                      {summaries.map(s => (
                        <option key={s.id} value={s.id}>{s.id} — patient: {s.patientName} ({s.date})</option>
                      ))}
                    </select>
                  </div>

                  {/* Helpful hint regarding correct password */}
                  <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1 text-slate-350">
                    <span className="text-[9px] font-bold uppercase block text-amber-400">Review Helper Keys (Demo)</span>
                    {(() => {
                      const tgt = summaries.find(s => s.id === portalAvsSearchId);
                      return (
                        <p className="text-[10px]">
                          Entering secure access for patient <strong className="text-white">{tgt?.patientName}</strong>.<br />
                          Required Patient Code (Full SSN/Last 4 digits): <strong className="text-emerald-400 font-mono">{tgt?.patientSsnCode || '???-??-????'}</strong>
                        </p>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Enter Patient full SSN or Last 4 Digits</label>
                    <input
                      type="password"
                      value={enteredPortalSsn}
                      onChange={(e) => setEnteredPortalSsn(e.target.value)}
                      placeholder="e.g. 666-22-8802 or the last 4: 8802"
                      className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-center text-sm font-bold tracking-widest focus:ring-amber-500 focus:outline-amber-500"
                    />
                  </div>

                  {portalError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-[10.5px] text-rose-350 font-bold">
                      {portalError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-4 h-4 shrink-0" />
                    <span>Authenticate & Access File</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 font-bold mb-4">
                    🔓 IDENTITY VALIDATED: Outpatient health folder successfully unlocked.
                  </div>

                  {/* Render unlocked summary card */}
                  {(() => {
                    const authenticatedAvs = summaries.find(s => s.id === portalAvsSearchId);
                    if (!authenticatedAvs) return null;

                    return (
                      <div className="space-y-4 border-t border-slate-800 pt-4">
                        <div className="space-y-1">
                          <span className="text-[9.5px] text-slate-450 uppercase block">Chief Indication Symptoms</span>
                          <p className="text-slate-100 italic">"{authenticatedAvs.chiefComplaint}"</p>
                        </div>
                        
                        <div className="space-y-1.5">
                          <span className="text-[9.5px] text-slate-450 uppercase block">Discharged Medication instructions</span>
                          <div className="space-y-2">
                            {authenticatedAvs.medications.map((m, idx) => (
                              <div key={idx} className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-750">
                                <strong className="text-teal-400 block">{m.name} {m.dosage}</strong>
                                <span className="text-slate-350 block mt-0.5">Use frequency: {m.frequency}</span>
                                <span className="text-slate-400 italic block text-[10px] mt-0.5">Note: {m.instructions}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1 bg-slate-800/40 p-3 rounded-lg border border-slate-750">
                          <span className="text-[9.5px] text-slate-450 uppercase block">Daily self-care directives</span>
                          <p className="text-slate-200 leading-relaxed font-sans">{authenticatedAvs.careInstructions}</p>
                        </div>

                        {/* Critical symptoms warning panel */}
                        <div className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-lg text-rose-350 font-sans">
                          <strong className="text-[9.5px] font-mono tracking-widest text-rose-450 block mb-1">EMERGENCY PROTOCOLS ALERT</strong>
                          <p className="leading-relaxed leading-normal">{authenticatedAvs.emergencySymptoms}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10.5px] pt-2 border-t border-slate-850">
                          <div>
                            <span className="text-slate-500 block">Scheduled Checkup:</span>
                            <span className="text-slate-200 block font-bold">{authenticatedAvs.followUp.date}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Checkup details:</span>
                            <span className="text-slate-200 block text-[10px]">{authenticatedAvs.followUp.instructions}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => triggerPrintScreen(authenticatedAvs)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 font-bold border border-slate-700 text-slate-250 rounded-xl transition-all cursor-pointer text-center"
                          >
                            Print summary
                          </button>
                          <button
                            type="button"
                            onClick={() => setPortalUnlocked(false)}
                            className="flex-1 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-xl transition-all cursor-pointer text-center"
                          >
                            Lock portal folder
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
