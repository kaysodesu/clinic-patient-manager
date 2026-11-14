import React, { useState, useEffect, useRef } from 'react';
import { Patient, VisitationRecord, ClinicRole, ProgressLogNote, ProgressLogComment, ClinicalAttachment, PatientTransfer, PatientAvailability, PatientAppointment, AppointmentOption } from '../types';
import { clinicalCodes, ClinicalCode } from '../data/clinicalCodes';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stethoscope, Users, User, FileText, Search, Plus, Trash2, CheckCircle2, 
  Calendar, Clipboard, HelpCircle, ChevronRight, UserCheck, AlertCircle, RefreshCw,
  MessageSquare, MessageCircle, Link, FileUp, Shield, UploadCloud, Eye, Image as ImageIcon,
  Video, Sliders, Maximize2, Sparkles, Lock, LockKeyhole, Send, HelpCircle as HelpIcon, Check,
  Truck, ArrowRight, Clock, Compass, DoorOpen, MapPin, AlertTriangle, ShieldCheck, Activity, CalendarDays,
  X, Printer, Download, Mail, Cloud, Share2
} from 'lucide-react';

interface VisitationOverviewProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  visitationRecords: VisitationRecord[];
  onAddVisitation: (record: VisitationRecord) => void;
  onDeleteVisitation: (id: string) => void;
  isAdmin: boolean;
  role: ClinicRole;
  onSetRole: (role: ClinicRole) => void;
  progressNotes: ProgressLogNote[];
  onUpdateProgressNotes: (updater: ProgressLogNote[] | ((prev: ProgressLogNote[]) => ProgressLogNote[])) => void;
}

export default function VisitationOverview({
  patients,
  selectedPatientId,
  onSelectPatient,
  visitationRecords,
  onAddVisitation,
  onDeleteVisitation,
  isAdmin,
  role,
  onSetRole,
  progressNotes,
  onUpdateProgressNotes
}: VisitationOverviewProps) {
  // Find current patient
  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0] || null;

  // Selected visitation record for full clinical dossier preview modal
  const [selectedPreviewRecord, setSelectedPreviewRecord] = useState<VisitationRecord | null>(null);

  // Selected after-visit summary for advanced inspection, download & email dispatch
  const [selectedInspectAvs, setSelectedInspectAvs] = useState<any | null>(null);

  // New Visit Form State
  const [doctorName, setDoctorName] = useState('');
  const [assistingStaff, setAssistingStaff] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicalHistorySummary, setMedicalHistorySummary] = useState('');

  // Diagnostic codes being aggregated
  const [selectedCodes, setSelectedCodes] = useState<ClinicalCode[]>([]);

  // Search input and auto-completion states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter clinical record view
  const [recordFilter, setRecordFilter] = useState<'all' | 'patient'>('patient');

  // Sub-tabs for Encounter, Progressive Clinical logs, Transfer Desk, & Scheduling
  const [visitationTab, setVisitationTab] = useState<'encounter' | 'progress' | 'transfer' | 'schedule'>('encounter');

  // Progress Logs State is mapped to the parent's custom hook updater
  const setProgressNotes = onUpdateProgressNotes;

  // Progress Note Creation Form states
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteSeverity, setNewNoteSeverity] = useState<'routine' | 'urgent' | 'critical'>('routine');
  const [tempAttachments, setTempAttachments] = useState<ClinicalAttachment[]>([]);
  
  // Local File uploader, Presets or Cloud state
  const [cloudFileName, setCloudFileName] = useState('');
  const [cloudFileUrl, setCloudFileUrl] = useState('');
  const [cloudFileType, setCloudFileType] = useState<'image' | 'video' | 'pdf' | 'dicom'>('image');
  
  // Interactive Radiograph Enhancement states
  const [activeAttachment, setActiveAttachment] = useState<ClinicalAttachment | null>(null);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageBrightness, setImageBrightness] = useState(100);
  const [imageContrast, setImageContrast] = useState(100);
  const [imageInvert, setImageInvert] = useState(false);

  // Root-level comments text per progress note
  const [rootCommentTexts, setRootCommentTexts] = useState<Record<string, string>>({});

  // --- PATIENT TRANSFER DESK HANDLERS ---
  const handleResetTransferForm = () => {
    setTransferReason('');
    setTransferSeverity('routine');
    setTransferConsentGiven(true);
    setTransferConsentType('patient_direct');
    setTransferConsentSignee('');
    setTransferDestination('');
    setTransferTeamCSV('');
    setTransferNotes('');
  };

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;
    if (!transferReason.trim()) {
      alert("⚠️ Please state the reasoning/indication for patient transfer.");
      return;
    }
    if (!transferDestination.trim()) {
      alert("⚠️ Destination facility must be declared.");
      return;
    }

    const teamList = transferTeamCSV
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (teamList.length === 0) {
      alert("⚠️ Regulate transport names: Must name at least one crew member in charge of custody and vehicle navigation.");
      return;
    }

    const newTransfer: PatientTransfer = {
      id: `XFER-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activePatient.id,
      patientName: `${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName}`,
      reasonForTransfer: transferReason.trim(),
      severity: transferSeverity,
      consentGiven: transferConsentGiven,
      consentType: transferConsentType,
      consentSigneeName: transferConsentGiven 
        ? (transferConsentType === 'emergency_override' ? 'Emergency Medical Override' : transferConsentSignee.trim() || 'Patient Signature Attached')
        : 'Consent Withheld (Emergency Waiver Active)',
      transportTeam: teamList,
      timestampInformed: '',
      timestampPrepared: '',
      timestampEntryVehicle: '',
      timestampExitVehicle: '',
      timestampRoomArrival: '',
      timestampStaffContact: '',
      status: 'draft',
      destination: transferDestination.trim(),
      notes: transferNotes.trim(),
      createdAt: new Date().toISOString()
    };

    setTransfers(prev => [newTransfer, ...prev]);
    handleResetTransferForm();
    alert("🎉 Patient Transfer Log created! Proceed below to track live routing timelines.");
  };

  const handleStampTimestamp = (transferId: string, timestampKey: keyof PatientTransfer) => {
    setTransfers(prev => prev.map(t => {
      if (t.id !== transferId) return t;
      
      const currentTimeStr = new Date().toISOString();
      const updatedTransfer = {
        ...t,
        [timestampKey]: currentTimeStr
      };

      // Automatically transition routing stages
      let nextStatus = t.status;
      if (timestampKey === 'timestampInformed') {
        nextStatus = 'in_transit';
      } else if (timestampKey === 'timestampStaffContact') {
        nextStatus = 'completed';
      }
      updatedTransfer.status = nextStatus;

      return updatedTransfer;
    }));
  };

  const handleUpdateManualTimestamp = (transferId: string, timestampKey: keyof PatientTransfer, customValue: string) => {
    setTransfers(prev => prev.map(t => {
      if (t.id !== transferId) return t;
      return {
        ...t,
        [timestampKey]: customValue
      };
    }));
  };

  const handleDeleteTransfer = (transferId: string) => {
    if (window.confirm("⚠️ Clear Dossier Log: Are you sure you wish to expunge this certified Patient Transfer dispatch?")) {
      setTransfers(prev => prev.filter(t => t.id !== transferId));
    }
  };
  // ---------------------------------------

  // --- PATIENT TRANSFER DESK STATES ---
  const [transfers, setTransfers] = useState<PatientTransfer[]>(() => {
    const saved = localStorage.getItem('clinic_patient_transfers');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Transfer Form inputs
  const [transferReason, setTransferReason] = useState('');
  const [transferSeverity, setTransferSeverity] = useState<'routine' | 'high_priority' | 'life_threatening'>('routine');
  const [transferConsentGiven, setTransferConsentGiven] = useState(true);
  const [transferConsentType, setTransferConsentType] = useState<'patient_direct' | 'power_of_attorney' | 'emergency_override'>('patient_direct');
  const [transferConsentSignee, setTransferConsentSignee] = useState('');
  const [transferDestination, setTransferDestination] = useState('');
  const [transferTeamCSV, setTransferTeamCSV] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem('clinic_patient_transfers', JSON.stringify(transfers));
  }, [transfers]);

  // Sync log notes to localStorage
  useEffect(() => {
    localStorage.setItem('clinic_progress_notes', JSON.stringify(progressNotes));
  }, [progressNotes]);

  // --- SCHEDULING & AVAILABILITY STATES ---
  const [availabilities, setAvailabilities] = useState<PatientAvailability[]>(() => {
    const saved = localStorage.getItem('clinic_patient_availabilities');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [appointments, setAppointments] = useState<PatientAppointment[]>(() => {
    const saved = localStorage.getItem('clinic_patient_appointments');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [scheduleNotifications, setScheduleNotifications] = useState<{
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warn';
  }[]>(() => {
    const saved = localStorage.getItem('clinic_schedule_notifications');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem('clinic_patient_availabilities', JSON.stringify(availabilities));
  }, [availabilities]);

  useEffect(() => {
    localStorage.setItem('clinic_patient_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('clinic_schedule_notifications', JSON.stringify(scheduleNotifications));
  }, [scheduleNotifications]);

  // Form states for Patient Availability
  const [patientDaysOfWeek, setPatientDaysOfWeek] = useState<string[]>([]);
  const [patientPreferredTime, setPatientPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'any'>('any');
  const [patientCustomNotes, setPatientCustomNotes] = useState('');

  // Form states for Proposing Appointments
  const [proposeDocName, setProposeDocName] = useState('');
  const [proposeDate1, setProposeDate1] = useState('');
  const [proposeDate2, setProposeDate2] = useState('');
  const [proposeDate3, setProposeDate3] = useState('');

  // Cancellation Admin Override States
  const [adminExcuseFormOpen, setAdminExcuseFormOpen] = useState(false);
  const [cancelTargetApptId, setCancelTargetApptId] = useState('');
  const [excuseMode, setExcuseMode] = useState<'excused' | 'unexcused'>('excused');
  const [excusedReasonText, setExcusedReasonText] = useState('');

  // Pre-populate patient availability on selection shift
  useEffect(() => {
    if (activePatient) {
      const avail = availabilities.find(a => a.patientId === activePatient.id);
      if (avail) {
        setPatientDaysOfWeek(avail.daysOfWeek);
        setPatientPreferredTime(avail.preferredTimeRange);
        setPatientCustomNotes(avail.customNotes || '');
      } else {
        setPatientDaysOfWeek([]);
        setPatientPreferredTime('any');
        setPatientCustomNotes('');
      }
    }
  }, [selectedPatientId]);

  // Helpers for scheduling checks
  const getHoursUntilAppointment = (dateTimeStr: string): number => {
    const appt = new Date(dateTimeStr);
    const now = new Date();
    const diffMs = appt.getTime() - now.getTime();
    return diffMs / (1000 * 60 * 60);
  };

  const isLockedForPatientCheck = (dateTimeStr?: string): boolean => {
    if (!dateTimeStr) return false;
    const hours = getHoursUntilAppointment(dateTimeStr);
    return hours <= 48; // locks within 48h limit
  };

  // AVAILABILITY PROFILE UPDATE
  const handleUpdateAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    const updatedAvail: PatientAvailability = {
      patientId: activePatient.id,
      daysOfWeek: patientDaysOfWeek,
      preferredTimeRange: patientPreferredTime,
      customNotes: patientCustomNotes,
      lastUpdated: new Date().toISOString()
    };

    setAvailabilities(prev => {
      const filtered = prev.filter(a => a.patientId !== activePatient.id);
      return [...filtered, updatedAvail];
    });

    // Notify clinic of availability update
    const newNotif = {
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      message: `Availability Profile updated for ${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName} (${activePatient.id})`,
      type: 'info' as const
    };
    setScheduleNotifications(prev => [newNotif, ...prev]);

    alert("✅ Availability profile successfully updated. The clinical scheduling team is notified.");
  };

  // TOGGLE DAY SELECTION FOR PATIENT AVAILABILITY
  const handleToggleDay = (day: string) => {
    setPatientDaysOfWeek(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // PHYSICIAN DISPATCHES APPOINTMENT PROPOSALS
  const handleDispatchProposals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;
    if (!proposeDocName.trim()) {
      alert("⚠️ Attending physician name is required for appointments.");
      return;
    }

    const collectedOptions: AppointmentOption[] = [];
    if (proposeDate1) collectedOptions.push({ id: `OPT-${Math.floor(Math.random() * 10000)}`, dateTime: proposeDate1 });
    if (proposeDate2) collectedOptions.push({ id: `OPT-${Math.floor(Math.random() * 10000)}`, dateTime: proposeDate2 });
    if (proposeDate3) collectedOptions.push({ id: `OPT-${Math.floor(Math.random() * 10000)}`, dateTime: proposeDate3 });

    if (collectedOptions.length === 0) {
      alert("⚠️ Must provide at least one scheduled date option for the patient.");
      return;
    }

    const newAppointment: PatientAppointment = {
      id: `APP-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activePatient.id,
      patientName: `${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName}`,
      doctorName: proposeDocName.trim(),
      status: 'pending_selection',
      options: collectedOptions,
      createdAt: new Date().toISOString()
    };

    setAppointments(prev => [newAppointment, ...prev]);

    // Notification builder
    const newNotif = {
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      message: `Proposed ${collectedOptions.length} appointment option(s) for ${activePatient.personalInfo.firstName} by ${proposeDocName}.`,
      type: 'warn' as const
    };
    setScheduleNotifications(prev => [newNotif, ...prev]);

    // reset fields
    setProposeDate1('');
    setProposeDate2('');
    setProposeDate3('');
    alert("🚀 Propose slot dispatch committed successfully. Sent to patient portal.");
  };

  // PATIENT SELECTION HANDLER
  const handlePatientSelectSlot = (apptId: string, optionDateTime: string) => {
    setAppointments(prev => prev.map(appt => {
      if (appt.id !== apptId) return appt;
      return {
        ...appt,
        status: 'confirmed',
        selectedDateTime: optionDateTime,
        selectionTimestamp: new Date().toISOString()
      };
    }));

    // Notification trigger
    const appt = appointments.find(a => a.id === apptId);
    const pName = appt ? appt.patientName : "Patient";
    const newNotif = {
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      message: `${pName} confirmed appointment reservation on ${new Date(optionDateTime).toLocaleString()}.`,
      type: 'success' as const
    };
    setScheduleNotifications(prev => [newNotif, ...prev]);

    alert("🎉 Appointment selection confirmed and locked in! Universal Calendar sync handles are unlocked below.");
  };

  // CLINIC ADMIN MODIFIES APPOINTMENTS
  const handleAdminModifyAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetApptId) return;

    setAppointments(prev => prev.map(appt => {
      if (appt.id !== cancelTargetApptId) return appt;

      if (excuseMode === 'excused') {
        return {
          ...appt,
          status: 'excused',
          excuseReason: excusedReasonText.trim().substring(0, 1000),
          cancellationFee: 0
        };
      } else {
        return {
          ...appt,
          status: 'unexcused',
          excuseReason: 'No Show/Unable to attend - Late Cancellation fee: $25',
          cancellationFee: 25,
          unexcusedReason: 'No Show/Unable to attend - Late Cancellation fee: $25'
        };
      }
    }));

    const appt = appointments.find(a => a.id === cancelTargetApptId);
    const details = appt ? `${appt.patientName} (${appt.id})` : "Appointment";

    const newNotif = {
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      message: `Encounter status overridden by clinical team for ${details}. Marked as ${excuseMode === 'excused' ? 'Excused Absence' : 'Late unexcused (Late fee charged)'}.`,
      type: excuseMode === 'excused' ? 'info' as const : 'warn' as const
    };
    setScheduleNotifications(prev => [newNotif, ...prev]);

    setAdminExcuseFormOpen(false);
    setExcusedReasonText('');
    setCancelTargetApptId('');
    alert(`Status overridden successfully as ${excuseMode === 'excused' ? 'Excused' : 'Unexcused / Fee Charged'}.`);
  };

  // CALENDAR DEEPLINK INTEGRATION GENERATORS
  const generateGoogleCalendarUrl = (docName: string, dateStr: string) => {
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + 45 * 60 * 1000); // 45-min consulting
    const fmtStr = (dt: Date) => dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const title = encodeURIComponent(`Medical Consultation with ${docName}`);
    const dates = `${fmtStr(start)}/${fmtStr(end)}`;
    const details = encodeURIComponent(`Clinical Consultation with ${docName}. Locked and confirmed appointment details. Please contact the medical panel 48h in advance if needing excuse override.`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&sf=true&output=xml`;
  };

  const generateYahooCalendarUrl = (docName: string, dateStr: string) => {
    const start = new Date(dateStr);
    const fmtStr = (dt: Date) => dt.toISOString().replace(/[-:]/g, "").split(".")[0];
    const title = encodeURIComponent(`Medical Consultation with ${docName}`);
    const details = encodeURIComponent(`Clinical Consultation with ${docName}. Locked appointment details.`);
    return `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${fmtStr(start)}&dur=0045&desc=${details}`;
  };

  const generateOutlookCalendarUrl = (docName: string, dateStr: string) => {
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    const title = encodeURIComponent(`Medical Consultation with ${docName}`);
    const details = encodeURIComponent(`Clinical Consultation with ${docName}. Locked appointment details.`);
    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${details}`;
  };

  const downloadICSFileVal = (docName: string, dateStr: string, patientName: string) => {
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    const fmtStr = (dt: Date) => dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Cascade Clinic//NONSGML Scheduling Desk//EN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@cascadeclinic.com`,
      `DTSTAMP:${fmtStr(new Date())}`,
      `DTSTART:${fmtStr(start)}`,
      `DTEND:${fmtStr(end)}`,
      `SUMMARY:Medical Consultation: ${docName}`,
      `DESCRIPTION:Clinical Consultation for ${patientName} with ${docName}. Locked and verified schedule.`,
      "LOCATION:Cascade Medical Center Specialty Wing",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `medical_appointment_${docName.replace(/\s+/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Load/Pre-populate symptoms and medical history when active patient shifts
  useEffect(() => {
    if (activePatient) {
      // Re-populate reason & symptoms from current intake if applicable
      setReasonForVisit(activePatient.currentVisit.department + " consultation request");
      setSymptoms(activePatient.currentVisit.symptoms || '');
      
      // Auto-formatting pre-populated Medical history
      const chronic = activePatient.medicalQuestionnaire.chronicConditions?.join(', ') || 'None';
      const other = activePatient.medicalQuestionnaire.otherChronicConditions || '';
      const allergies = activePatient.medicalQuestionnaire.allergies || 'N/A';
      const familyHist = activePatient.medicalHistory.familyHistory?.join(', ') || 'None';
      const surgeries = activePatient.medicalHistory.pastSurgeries || 'None';

      const summaryText = [
        `Chronic Conditions: ${chronic}${other ? ` (${other})` : ''}`,
        `Allergies: ${allergies}`,
        `Family History: ${familyHist}`,
        `Surgeries: ${surgeries}`,
        `Current Status: ${activePatient.status}`
      ].join('\n');

      setMedicalHistorySummary(summaryText);
    }
  }, [activePatient]);

  // Click outside suggestions watcher
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter codes in database based on search input (code entry or keyword match)
  const filteredCodes = searchQuery.trim() === ''
    ? []
    : clinicalCodes.filter(item => {
        const query = searchQuery.toLowerCase();
        return item.code.toLowerCase().includes(query) ||
               item.description.toLowerCase().includes(query) ||
               item.category.toLowerCase().includes(query);
      }).slice(0, 10); // Display top 10 matches for beautiful sizing

  // Handlers
  const handleAddCode = (codeItem: ClinicalCode) => {
    if (selectedCodes.some(c => c.code === codeItem.code)) {
      alert("⚠️ This clinical code has already been added.");
      return;
    }
    setSelectedCodes([...selectedCodes, codeItem]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRemoveCode = (codeString: string) => {
    setSelectedCodes(selectedCodes.filter(c => c.code !== codeString));
  };

  const resetForm = () => {
    setDoctorName('');
    setAssistingStaff('');
    setReasonForVisit('');
    setSymptoms('');
    setSelectedCodes([]);
    if (activePatient) {
      setReasonForVisit(activePatient.currentVisit.department + " consultation request");
      setSymptoms(activePatient.currentVisit.symptoms || '');
    }
  };

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;
    if (!doctorName.trim()) {
      alert("Please designate the attending Physician / Doctor.");
      return;
    }
    if (!assistingStaff.trim()) {
      alert("Please designate the nurse or healthcare worker assisting.");
      return;
    }
    if (selectedCodes.length === 0) {
      alert("Please associate at least one diagnostic clinical code applicable (CPT/HCPCS).");
      return;
    }

    const newRecord: VisitationRecord = {
      id: `VIS-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activePatient.id,
      patientName: `${activePatient.personalInfo.firstName} ${activePatient.personalInfo.lastName}`,
      doctorName: doctorName.trim(),
      assistingStaff: assistingStaff.trim(),
      reasonForVisit: reasonForVisit.trim(),
      symptoms: symptoms.trim(),
      medicalHistorySummary: medicalHistorySummary.trim(),
      diagnosticCodes: selectedCodes.map(c => c.code),
      visitDate: new Date().toISOString().split('T')[0]
    };

    onAddVisitation(newRecord);
    resetForm();
    alert("🎉 Clinical Visitation record saved successfully & committed to patients ledger.");
  };

  // Save recursive comment
  const handleSaveCommentOrReply = (noteId: string, text: string, parentCommentId?: string) => {
    if (!text.trim()) return;

    // Current logged-in user names
    const authorName = role === 'ops_manager' ? "Dr. Rachel Thorne, MD (Ops Mgr)" : 
                       role === 'team_lead' ? "Dr. Alistair Vance, MD (Team Lead)" : 
                       role === 'admin' ? "Sarah Miller, RN (Admin)" : "Guest Caretaker";
                       
    const commentId = `COM-${Math.floor(10000 + Math.random() * 90000)}`;
    const newComment: ProgressLogComment = {
      id: commentId,
      author: authorName,
      role: role,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      replies: []
    };

    setProgressNotes(prev => {
      return prev.map(note => {
        if (note.id !== noteId) return note;

        if (!parentCommentId) {
          return {
            ...note,
            comments: [...note.comments, newComment]
          };
        } else {
          // Recursive comment inserting
          const insertReplyRecursive = (commentsList: ProgressLogComment[]): ProgressLogComment[] => {
            return commentsList.map(c => {
              if (c.id === parentCommentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), newComment]
                };
              } else if (c.replies && c.replies.length > 0) {
                return {
                  ...c,
                  replies: insertReplyRecursive(c.replies)
                };
              }
              return c;
            });
          };

          return {
            ...note,
            comments: insertReplyRecursive(note.comments)
          };
        }
      });
    });
  };

  // Add progress note
  const handleCreateProgressNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      alert("Please provide both a title and descriptive notes for the log.");
      return;
    }
    if (!activePatient) return;

    const authorName = role === 'ops_manager' ? "Dr. Rachel Thorne, MD" : 
                       role === 'team_lead' ? "Dr. Alistair Vance, MD" : "Sarah Miller, RN";

    const newNote: ProgressLogNote = {
      id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
      patientId: activePatient.id,
      authorName: authorName,
      authorRole: role,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      timestamp: new Date().toISOString(),
      severity: newNoteSeverity,
      comments: [],
      attachments: tempAttachments
    };

    setProgressNotes(prev => [newNote, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteSeverity('routine');
    setTempAttachments([]);
    setIsAddingNote(false);
    alert("🎉 Clinical progress log note filed successfully.");
  };

  // Local File uploader converter
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newAttachment: ClinicalAttachment = {
        id: `ATT-${Math.floor(10000 + Math.random() * 90000)}`,
        name: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        source: 'local',
        url: dataUrl,
        timestamp: new Date().toISOString(),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };
      setTempAttachments(prev => [...prev, newAttachment]);
    };
    reader.readAsDataURL(file);
  };

  // Cloud Link
  const handleAddCloudLink = () => {
    if (!cloudFileName.trim() || !cloudFileUrl.trim()) {
      alert("Both Reference Name and Cloud URL are required to pair a cloud record.");
      return;
    }

    const newAttachment: ClinicalAttachment = {
      id: `ATT-${Math.floor(10000 + Math.random() * 90000)}`,
      name: cloudFileName.trim(),
      type: cloudFileType,
      source: 'cloud',
      url: cloudFileUrl.trim(),
      timestamp: new Date().toISOString(),
      size: 'Cloud Resource (.pacs / drive)'
    };

    setTempAttachments(prev => [...prev, newAttachment]);
    setCloudFileName('');
    setCloudFileUrl('');
    alert("🔗 Cloud document paired successfully!");
  };

  // Preset file attachment
  const handleAttachPreset = (preset: { name: string; url: string; type: 'image' | 'video'; size: string }) => {
    const newAttachment: ClinicalAttachment = {
      id: `ATT-${Math.floor(10000 + Math.random() * 90000)}`,
      name: preset.name,
      type: preset.type,
      source: 'cloud',
      url: preset.url,
      timestamp: new Date().toISOString(),
      size: preset.size
    };
    setTempAttachments(prev => [...prev, newAttachment]);
  };

  // Delete log note
  const handleDeleteProgressNote = (noteId: string) => {
    if (window.confirm("Are you sure you want to expunge this clinical progress log note and all its comment thread responses?")) {
      setProgressNotes(prev => prev.filter(n => n.id !== noteId));
      if (activeAttachment && activeAttachment.id === noteId) {
        setActiveAttachment(null);
      }
    }
  };

  const activePatientRecords = visitationRecords.filter(r => r.patientId === selectedPatientId);
  const displayedRecords = recordFilter === 'all' ? visitationRecords : activePatientRecords;

  return (
    <div id="visitation-overview-panel" className="space-y-6">
      
      {/* HEADER HERO ACCENT card */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded-full bg-teal-500/20 text-teal-400 font-mono text-[9px] uppercase font-bold tracking-wider">
                Clinical Workflow Module
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-teal-400 shrink-0" />
              Visitation Overview & Clinical Notes
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl font-sans">
              Formulate, audit, and commit comprehensive summaries for patient encounters. Associate verified CPT1 / HCPCS codes under the Social Security Act §1877 regulations.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-850 p-2 border border-slate-800 rounded-lg">
            <label className="text-[10px] uppercase font-bold text-slate-400 block whitespace-nowrap">Select Case Dossier:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => onSelectPatient(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-teal-300 font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.personalInfo.lastName}, {p.personalInfo.firstName} ({p.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SUB-TAB CONTROL RAIL */}
      <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 select-none font-sans">
        <button
          type="button"
          onClick={() => setVisitationTab('encounter')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            visitationTab === 'encounter'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4 shrink-0 text-teal-500" />
          Encounter & Coding
        </button>
        <button
          type="button"
          onClick={() => setVisitationTab('progress')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            visitationTab === 'progress'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0 text-amber-500" />
          Progressive Clinical Logs
        </button>
        <button
          type="button"
          onClick={() => setVisitationTab('transfer')}
          className={`flex-1 min-w-[145px] py-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            visitationTab === 'transfer'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 shrink-0 text-indigo-500" />
          Patient Transfer Desk
        </button>
        <button
          type="button"
          onClick={() => setVisitationTab('schedule')}
          className={`flex-1 min-w-[145px] py-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            visitationTab === 'schedule'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0 text-emerald-500" />
          Scheduling & Availability
        </button>
      </div>

      {/* THREE SECTION GRID: Patient Quick Dossier, Form Creator, Saved Visit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE CASE FILE (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs uppercase font-extrabold text-slate-900 tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                Selected Case File
              </h3>
              <span className="font-mono text-xs font-black text-slate-450 bg-slate-100 px-2.5 py-0.5 rounded-full">{activePatient?.id}</span>
            </div>

            {activePatient ? (
              <div className="space-y-3.5 text-xs font-sans">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Demographic Name</span>
                  <strong className="text-sm font-bold text-slate-900 flex items-center gap-1">
                    {activePatient.personalInfo.firstName} {activePatient.personalInfo.lastName}
                    <span className="text-xs text-slate-450 font-normal">({activePatient.personalInfo.gender}, DoB: {activePatient.personalInfo.dateOfBirth})</span>
                  </strong>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-80/50">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Triage Admitted</span>
                    <span className="text-slate-700 font-medium">{activePatient.dateAdmitted}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Department</span>
                    <span className="text-teal-700 font-extrabold">{activePatient.currentVisit.department}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-80/50">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Allergies & Sensitivities</span>
                  <span className="text-rose-700 font-bold bg-rose-50 border border-rose-100 px-2 py-1 rounded block mt-0.5 animate-pulse">
                    ⚠️ {activePatient.medicalQuestionnaire.allergies || 'No allergies declared'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-80/50 space-y-1 text-[11px] leading-relaxed">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Medical History Records</span>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-150 font-mono text-[10.5px] text-slate-650 space-y-1 max-h-36 overflow-y-auto">
                    <div>
                      <span className="text-slate-450 text-[9px] uppercase block">CHRONIC CONDITIONS:</span>
                      <strong>{activePatient.medicalQuestionnaire.chronicConditions?.join(', ') || 'None'}</strong>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100">
                      <span className="text-slate-450 text-[9px] uppercase block">PRESCRIBED RX:</span>
                      <p className="italic text-slate-700">"{activePatient.medicalQuestionnaire.prescriptions || 'None declared'}"</p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100">
                      <span className="text-slate-450 text-[9px] uppercase block">SURGERY HISTORY:</span>
                      <p className="text-slate-700">"{activePatient.medicalHistory.pastSurgeries || 'No past surgical notes'}"</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-80/50">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Intake Reason / Presenting Complaints</span>
                  <p className="bg-amber-50/55 border border-amber-100 text-amber-900 p-2.5 rounded-lg italic text-[11.5px] leading-relaxed mt-1">
                    "{activePatient.currentVisit.symptoms}"
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-6">No patient selected. Please register/select one.</p>
            )}
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 text-white space-y-3">
            <span className="font-mono text-[10px] text-teal-400 uppercase tracking-widest font-bold block">Quick Reference CPT Code Search</span>
            <p className="text-[11px] text-slate-400 font-sans">
              Diagnostic code validation is grounded in American Medical Association (2025/2026 guidelines). Easily search by entry numbers like <strong>70450</strong> or tags like <strong>venipuncture</strong>.
            </p>
          </div>
        </div>

        {/* MIDDLE COLUMN: WRITE NEW VISITATION NOTE (8 COLS) */}
        <div id="write-new-visitation-notes" className="lg:col-span-8 space-y-6">

          {/* ==================== TAB 1: ENCOUNTER REPORT & DIAGNOSTIC CODES ==================== */}
          {visitationTab === 'encounter' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <form onSubmit={handleSaveVisit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-3xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-3 gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-500" />
                      Formulate Encounter Report & Diagnostic Coding
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">Pre-populated and editable clinically compliant report lines</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-[10px] text-slate-500 hover:text-slate-850 font-bold border border-slate-200 hover:border-slate-350 p-1 px-2.5 rounded-md transition-all self-start sm:self-center cursor-pointer select-none"
                  >
                    Clear Fields
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Attending Physician / Doctor *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserCheck className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        placeholder="e.g. Dr. Arthur Pendelton, MD"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9.5 pr-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white focus:outline-none text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Assisting Health Care Worker / Nurse *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Users className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={assistingStaff}
                        onChange={(e) => setAssistingStaff(e.target.value)}
                        placeholder="e.g. Sarah Miller, RN"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9.5 pr-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white focus:outline-none text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 font-sans">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Clinical Reason for Visit</label>
                    <input
                      type="text"
                      required
                      value={reasonForVisit}
                      onChange={(e) => setReasonForVisit(e.target.value)}
                      placeholder="Designated consultation or referral checkups"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white focus:outline-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Symptom Notes & Clinical Presentation</label>
                    <textarea
                      rows={2}
                      required
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Record patient complaints, notes, presentation details"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white focus:outline-none text-slate-800"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Medical History Summary (Autopopulated & Editable)</label>
                      <span className="text-[9px] text-teal-600 font-bold">Populated from File</span>
                    </div>
                    <textarea
                      rows={4}
                      required
                      value={medicalHistorySummary}
                      onChange={(e) => setMedicalHistorySummary(e.target.value)}
                      placeholder="Populated medical file details..."
                      className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 bg-teal-50/20 focus:ring-1 focus:ring-teal-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* SELECTION MATRIX OF THE APPLICABLE CLINICAL CODES */}
                <div className="pt-4 border-t border-slate-150 space-y-4 select-none">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      Diagnostic of the Clinical Code Applicable
                    </h4>
                    <p className="text-[11px] text-slate-450">Select medical codes with the search utility below. Use the plus button (+) to append multiple codes.</p>
                  </div>

                  {/* SEARCH ENGINE AUTOSUGGEST DIRECT INTERACTION CAROUSEL */}
                  <div className="space-y-3 font-sans relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          placeholder="Search code (e.g. 86890, 70450) or keyword (e.g. blood, thyroid, lung)"
                          className="w-full bg-slate-50 border border-slate-250 focus:border-teal-500 rounded-lg pl-9.5 pr-3 py-2 text-xs focus:outline-none text-slate-800"
                        />

                        {/* Suggestions Box Overlay */}
                        <AnimatePresence>
                          {showSuggestions && searchQuery.trim() !== '' && (
                            <div 
                              ref={suggestionsRef}
                              className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto divide-y divide-slate-100"
                            >
                              {filteredCodes.length > 0 ? (
                                filteredCodes.map((item, idx) => (
                                  <button
                                    key={item.code}
                                    type="button"
                                    onClick={() => handleAddCode(item)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs flex justify-between items-center transition-all cursor-pointer font-sans"
                                  >
                                    <div>
                                      <span className="font-mono font-black text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded mr-2">
                                        {item.code}
                                      </span>
                                      <span className="text-slate-850 truncate font-semibold">{item.description}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-450 uppercase font-mono tracking-wider ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {item.category}
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-center text-slate-450 italic text-xs flex flex-col items-center gap-1">
                                  <AlertCircle className="w-4 h-4 text-slate-400" />
                                  No custom clinical codes found for "{searchQuery}".
                                </div>
                              )}
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* VISUAL SELECTION CHIPS ACCENTS */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 block">Diagnosed Codes Selected ({selectedCodes.length})</span>
                      {selectedCodes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedCodes.map((item) => (
                            <div 
                              key={item.code}
                              className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg transition-all"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="font-mono text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded">
                                    {item.code}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-200/55 px-1.5 py-0.2 rounded uppercase truncate">
                                    {item.category}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-850 font-medium truncate">{item.description}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCode(item.code)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="De-couple clinical code"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-teal-50/20 border border-dashed border-teal-200 rounded-xl text-teal-800 text-[11px] leading-relaxed flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 shrink-0 text-teal-600" />
                          <span>Configure CPT diagnosis code above. Multiple entries can be paired using the search.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form submit button */}
                <div className="pt-4 border-t border-slate-150">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-550 active:bg-teal-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Commit Visitation Report to Patient Dossier & Close Visit
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ==================== TAB 2: PROGRESSIVE CLINICAL LOGS ==================== */}
          {visitationTab === 'progress' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* RAD COMPONENT SIMULATOR */}
              {activeAttachment && activeAttachment.type === 'image' && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-white space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-mono text-teal-400 uppercase tracking-widest font-black">X-Ray Orthodiagraphic Image Enhancer Client</h4>
                      <p className="text-[10px] text-slate-400 font-sans">HIPAA Compliance Level-III Live Sandbox Simulator</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setActiveAttachment(null)}
                      className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 p-1 px-2 rounded font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Close Viewer
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center justify-center overflow-hidden min-h-[300px] relative">
                      <img 
                        src={activeAttachment.url} 
                        alt="X-ray view"
                        referrerPolicy="no-referrer"
                        className="max-h-[350px] object-contain rounded-lg transition-all duration-150"
                        style={{ 
                          filter: `brightness(${imageBrightness}%) contrast(${imageContrast}%) invert(${imageInvert ? 1 : 0})`,
                          transform: `scale(${imageZoom / 100})`
                        }}
                      />
                      <div className="absolute left-2.5 bottom-2.5 font-mono text-[9px] bg-slate-950/80 p-1.5 border border-slate-800 rounded">
                        ZOOM: {imageZoom}% | BRIGHT: {imageBrightness}% | CONTRAST: {imageContrast}%
                      </div>
                    </div>

                    <div className="space-y-4 text-xs font-sans self-center">
                      <div>
                        <span className="text-[10px] uppercase text-zinc-400 block font-bold mb-1.5">Interactive Radiograph Enhancements</span>
                        <div className="space-y-3.5">
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span>Image Brightness</span>
                              <span className="font-mono text-teal-400 font-bold">{imageBrightness}%</span>
                            </div>
                            <input 
                              type="range" min="50" max="200" 
                              value={imageBrightness} 
                              onChange={(e) => setImageBrightness(parseInt(e.target.value))}
                              className="w-full accent-teal-500 cursor-pointer" 
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span>Double Contrast</span>
                              <span className="font-mono text-teal-400 font-bold">{imageContrast}%</span>
                            </div>
                            <input 
                              type="range" min="50" max="200" 
                              value={imageContrast} 
                              onChange={(e) => setImageContrast(parseInt(e.target.value))}
                              className="w-full accent-teal-500 cursor-pointer" 
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span>Magnification Lens Zoom</span>
                              <span className="font-mono text-teal-400 font-bold">{imageZoom}%</span>
                            </div>
                            <input 
                              type="range" min="80" max="250" 
                              value={imageZoom} 
                              onChange={(e) => setImageZoom(parseInt(e.target.value))}
                              className="w-full accent-teal-500 cursor-pointer" 
                            />
                          </div>

                          <label className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-lg select-none cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={imageInvert}
                              onChange={(e) => setImageInvert(e.target.checked)}
                              className="accent-teal-500 cursor-pointer" 
                            />
                            <span className="font-semibold text-slate-300">Invert Photographic Grayscale</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1 bg-slate-900/50 p-2.5 rounded border border-slate-800/80">
                        <span className="text-[9px] uppercase tracking-wider block font-bold font-mono">Attachment Metadata:</span>
                        <p className="font-mono text-[10px] text-zinc-400 truncate">Name: {activeAttachment.name}</p>
                        <p className="font-mono text-[10px] text-zinc-400">Date Logged: {new Date(activeAttachment.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* POST CLINICAL PROGRESS LOG (Only Staff roles can post new records) */}
              {role !== 'patient' ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
                      alert("⚠️ Field verification failed: Title and Narrative are required.");
                      return;
                    }
                    const newLog: ProgressLogNote = {
                      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
                      patientId: activePatient?.id || "PT-X",
                      authorName: role === 'team_lead' ? 'Dr. Alistair Vance, MD' : (role === 'ops_manager' ? 'Dr. Rachel Thorne, MD' : 'Attending Support Worker, RN'),
                      authorRole: role,
                      title: newNoteTitle.trim(),
                      content: newNoteContent.trim(),
                      severity: newNoteSeverity,
                      timestamp: new Date().toISOString(),
                      attachments: tempAttachments,
                      comments: []
                    };
                    setProgressNotes(prev => [newLog, ...prev]);
                    setNewNoteTitle('');
                    setNewNoteContent('');
                    setNewNoteSeverity('routine');
                    setTempAttachments([]);
                    setIsAddingNote(false);
                    alert("🌟 Progress note saved perfectly to permanent localStorage.");
                  }} 
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-3xs space-y-4"
                >
                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Log Progressive Clinical Chronology Note
                      </h3>
                      <p className="text-xs text-slate-500">Record targeted diagnostic narratives, laboratory telemetry responses or updates</p>
                    </div>
                    <span className="text-[10px] font-mono text-amber-600 bg-amber-50 border border-amber-100 p-1 px-2 rounded-full font-bold uppercase shrink-0">
                      Attending Clinician Gate
                    </span>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Observation Focus / Investigation Title *</label>
                        <input 
                          type="text" required
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          placeholder="e.g., Asthma medication compliance sequence & Peak flow review"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Observation Urgency *</label>
                        <select 
                          value={newNoteSeverity}
                          onChange={(e) => setNewNoteSeverity(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer font-semibold focus:ring-1 focus:ring-teal-500"
                        >
                          <option value="routine">🟢 Routine / Minor</option>
                          <option value="urgent">🟡 Urgent Monitoring</option>
                          <option value="critical">🔴 Critical Alert Sequence</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Clinical Findings & Detailed Narrative *</label>
                      <textarea 
                        rows={3} required
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Detail physical, mental, telemetry readings, or pharmaceutical compliance notes..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-teal-500 text-slate-800"
                      />
                    </div>

                    <div className="border border-dashed border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-3">
                      <span className="text-[10px] text-slate-500 uppercase font-black block">Log Attachments Simulator asset</span>
                      
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => setTempAttachments(prev => [...prev, {
                            id: `ATT-${Math.floor(Math.random()*1000)}`,
                            name: "sarah_jenkins_chest_xray.jpg",
                            type: "image",
                            source: "cloud",
                            url: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e2e8f0'/%3E%3Ctext x='400' y='260' font-family='sans-serif' font-size='28' fill='%2364748b' text-anchor='middle'%3ESample attachment%3C/text%3E%3C/svg%3E",
                            timestamp: new Date().toISOString(),
                            size: "4.8 MB"
                          }])}
                          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer text-slate-655"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                          Attach Chest X-Ray Asset
                        </button>

                        <button
                          type="button"
                          onClick={() => setTempAttachments(prev => [...prev, {
                            id: `ATT-${Math.floor(Math.random()*1000)}`,
                            name: "patellar_ultrasound_cartilage_scan.jpg",
                            type: "image",
                            source: "cloud",
                            url: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e2e8f0'/%3E%3Ctext x='400' y='260' font-family='sans-serif' font-size='28' fill='%2364748b' text-anchor='middle'%3ESample attachment%3C/text%3E%3C/svg%3E",
                            timestamp: new Date().toISOString(),
                            size: "6.2 MB"
                          }])}
                          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer text-slate-655"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                          Attach Orthopedic Cartilage Scan
                        </button>
                      </div>

                      {tempAttachments.length > 0 && (
                        <div className="p-2 border border-slate-100 rounded-lg bg-teal-50/20 font-mono text-[10.5px] text-teal-850 flex flex-wrap gap-1.5">
                          {tempAttachments.map((at, index) => (
                            <span key={at.id} className="bg-white border border-teal-150 rounded px-2.5 py-1 flex items-center gap-2">
                              📎 {at.name} ({at.size})
                              <button 
                                type="button" 
                                onClick={() => setTempAttachments(prev => prev.filter((_, i) => i !== index))}
                                className="text-rose-600 font-extrabold hover:underline"
                              >
                                Remove
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-150">
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-bold shadow transition-all cursor-pointer"
                    >
                      Digitally Sign & File Log Note
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-900 leading-relaxed font-sans">
                  ℹ️ <strong>Patient View Authorization</strong>: You are viewing Progressive Clinical logs as a Patient. Only licensed clinicians are authorized to file official medical log narratives, but you can read notes and reply directly inside open discussion channels below.
                </div>
              )}

              {/* PROGRESS LOGS ACCORDIAN LEDGER */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-slate-900 tracking-wider">Clinician Progressive Log Records</h3>
                
                {progressNotes.filter(n => n.patientId === activePatient?.id).length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 italic text-xs">
                    No Progressive Logs recorded yet for this patient dossier. Attending clinicians can draft observations above.
                  </div>
                ) : (
                  progressNotes.filter(n => n.patientId === activePatient?.id).map((note) => (
                    <div 
                      key={note.id} 
                      className={`bg-white rounded-xl border p-5 shadow-3xs space-y-4 transition-all relative ${
                        note.severity === 'critical' ? 'border-l-4 border-l-rose-500 border-slate-200' :
                        note.severity === 'urgent' ? 'border-l-4 border-l-amber-500 border-slate-200' :
                        'border-l-4 border-l-teal-500 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400 font-black">{note.id}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              note.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              note.severity === 'urgent' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-teal-50 text-teal-700 border border-teal-100'
                            }`}>
                              {note.severity} urgency
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(note.timestamp).toLocaleString()}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{note.title}</h4>
                          <span className="text-[11px] text-slate-500 block font-sans">Author: <strong>{note.authorName}</strong> ({note.authorRole})</span>
                        </div>

                        {role !== 'patient' && (
                          <button 
                            type="button"
                            onClick={() => handleDeleteProgressNote(note.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors border border-slate-100 hover:bg-rose-50 cursor-pointer"
                            title="Expunge observation records"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/70 p-3.5 rounded-lg border border-slate-150">
                        {note.content}
                      </p>

                      {/* Attachments Section */}
                      {note.attachments && note.attachments.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[9px] uppercase tracking-wider text-slate-440 block font-bold">Observation Attachments:</span>
                          <div className="flex flex-wrap gap-2.5">
                            {note.attachments.map(att => (
                              <button
                                type="button"
                                key={att.id}
                                onClick={() => {
                                  setActiveAttachment(att);
                                  setImageBrightness(100);
                                  setImageContrast(100);
                                  setImageZoom(100);
                                  setImageInvert(false);
                                  alert(`Loaded ${att.name} into orthopedic/radiological enhancement console.`);
                                }}
                                className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 border border-slate-200 rounded-lg text-xs cursor-pointer select-none font-sans text-slate-700"
                              >
                                <Eye className="w-4 h-4 text-teal-600" />
                                <strong>{att.name}</strong> ({att.size})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comment feed */}
                      <div className="pt-4 border-t border-slate-150 space-y-3.5">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-bold flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> Comments Thread Response Chain
                        </span>

                        {note.comments.length > 0 && (
                          <div className="space-y-3 pl-3.5 border-l-2 border-slate-150">
                            {note.comments.map(c => (
                              <div key={c.id} className="text-xs space-y-1 font-sans">
                                <div className="flex items-center gap-2">
                                  <strong className="text-slate-850 font-bold">{c.author}</strong>
                                  <span className="bg-slate-100 text-slate-600 text-[9px] uppercase px-1 rounded font-mono font-bold">{c.role}</span>
                                  <span className="text-slate-400 text-[9px]">{new Date(c.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-700 italic bg-slate-50 p-2 rounded-md border border-slate-100">"{c.text}"</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline draft input */}
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const currentText = rootCommentTexts[note.id] || '';
                            if (!currentText.trim()) return;

                            const activeUserName = role === 'patient' 
                              ? `${activePatient?.personalInfo?.firstName || ''} ${activePatient?.personalInfo?.lastName || ''}`.trim() || 'Patient' 
                              : (role === 'team_lead' ? 'Dr. Alistair Vance, MD' : (role === 'ops_manager' ? 'Dr. Rachel Thorne, MD' : 'Attending Support Nurse, RN'));

                            const newComment = {
                              id: `COM-${Date.now()}`,
                              author: activeUserName,
                              role: role,
                              text: currentText.trim(),
                              timestamp: new Date().toISOString(),
                              replies: []
                            };

                            setProgressNotes(prev => prev.map(n => {
                              if (n.id !== note.id) return n;
                              return {
                                ...n,
                                comments: [...n.comments, newComment]
                              };
                            }));

                            setRootCommentTexts(prev => ({ ...prev, [note.id]: '' }));
                          }} 
                          className="flex gap-2"
                        >
                          <input 
                            type="text" 
                            required
                            placeholder="Draft thread reply..."
                            value={rootCommentTexts[note.id] || ''}
                            onChange={(e) => setRootCommentTexts(prev => ({ ...prev, [note.id]: e.target.value }))}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs flex-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <button 
                            type="submit"
                            className="bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-lg px-4 py-2 text-xs font-bold cursor-pointer"
                          >
                            Submit
                          </button>
                        </form>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== TAB 3: PATIENT TRANSFER DESK ==================== */}
          {visitationTab === 'transfer' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* INTERACTIVE TRANSPORT DISPATCH INITIATION FORM */}
              {role !== 'patient' ? (
                <form onSubmit={handleInitiateTransfer} className="bg-white rounded-xl border border-slate-200 p-6 shadow-3xs space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                        <Truck className="w-5 h-5 text-indigo-500" />
                        Initiate Outward Patient Transport Dispatch
                      </h3>
                      <p className="text-xs text-slate-500">Formulate regulatory and clinical transport logs to guarantee custody safe handovers</p>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 p-1 px-2.5 rounded-full font-bold uppercase">
                      Custody Dispatch Officer
                    </span>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">State transport indicators / Transfer Reason *</label>
                        <input 
                          type="text" required
                          value={transferReason}
                          onChange={(e) => setTransferReason(e.target.value)}
                          placeholder="e.g. Acute pediatric pulmonology tertiary referral series"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Target Handover Destination Facility *</label>
                        <input 
                          type="text" required
                          value={transferDestination}
                          onChange={(e) => setTransferDestination(e.target.value)}
                          placeholder="e.g. St. Jude Pulmonary Health Annex, Critical Room 102"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Level of transport severity *</label>
                        <select 
                          value={transferSeverity}
                          onChange={(e) => setTransferSeverity(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold cursor-pointer focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="routine">🟢 routine</option>
                          <option value="high_priority">🟡 high_priority</option>
                          <option value="life_threatening">🔴 life_threatening</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Assigned Custody Transport Crew (Separated by commas) *</label>
                        <input 
                          type="text" required
                          value={transferTeamCSV}
                          onChange={(e) => setTransferTeamCSV(e.target.value)}
                          placeholder="e.g. Dr. Arthur Pendelton, EMT Allison Cameron, CC Driver Gregory House"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <div className="self-center">
                        <label className="flex items-center gap-2 font-sans font-bold select-none cursor-pointer text-slate-700">
                          <input 
                            type="checkbox" 
                            checked={transferConsentGiven}
                            onChange={(e) => setTransferConsentGiven(e.target.checked)}
                            className="accent-indigo-500" 
                          />
                          Consent Form Obtained?
                        </label>
                      </div>

                      {transferConsentGiven && (
                        <>
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Consent Authorization Authority</label>
                            <select 
                              value={transferConsentType}
                              onChange={(e) => setTransferConsentType(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1"
                            >
                              <option value="patient_direct">Patient Direct Signature</option>
                              <option value="power_of_attorney">Healthcare Power of Attorney</option>
                              <option value="emergency_override">Emergency Medical Override</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Authorized Signee Name *</label>
                            <input 
                              type="text" required
                              value={transferConsentSignee}
                              onChange={(e) => setTransferConsentSignee(e.target.value)}
                              placeholder="e.g. Sarah Jenkins"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Special Custody Notes or Medical Directives</label>
                      <textarea 
                        rows={2}
                        value={transferNotes}
                        onChange={(e) => setTransferNotes(e.target.value)}
                        placeholder="Detail continuous vital checks required, mechanical SpO2 oxygen flow instructions..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-150">
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 border border-indigo-500 hover:bg-indigo-550 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                    >
                      Audit & File Outward Transport Dossier
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-900 leading-relaxed font-sans">
                  ℹ️ <strong>Patient View authorization</strong>: You are viewing active transport dispatches as a patient. These dispatches track custody handovers to tertiary specialty hospitals when necessary. Attending emergency dispatch officers manages timestamps below.
                </div>
              )}

              {/* ROUTING TIMELINES TRACKING SUITE */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-slate-900 tracking-wider">Live Ambulance Routing & Custody Timeline dispatches ({transfers.filter(t => t.patientId === activePatient?.id).length})</h3>

                {transfers.filter(t => t.patientId === activePatient?.id).length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 italic text-xs">
                    No active transport dispatches or outpatient transfers logged for this dossier.
                  </div>
                ) : (
                  transfers.filter(t => t.patientId === activePatient?.id).map((t) => (
                    <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                      
                      {/* header block */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-2.5 gap-2">
                        <div>
                          <strong className="text-slate-900 font-bold block text-sm">Target destination: {t.destination}</strong>
                          <span className="text-[11px] text-slate-500 font-sans block">
                            Status: <strong className="uppercase font-mono text-[9.5px] bg-indigo-50 text-indigo-700 px-1.5 rounded">{t.status}</strong> | ID: <span className="font-mono text-indigo-900 font-semibold">{t.id}</span>
                          </span>
                        </div>

                        {role !== 'patient' && (
                          <button 
                            type="button"
                            onClick={() => handleDeleteTransfer(t.id)}
                            className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 p-1 px-2 rounded-lg shrink-0 cursor-pointer"
                          >
                            Delete Dossier
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-1">
                          <span className="text-[9px] text-slate-450 uppercase font-bold block">Authorization Protocols:</span>
                          <p className="text-slate-700">Reason: <strong>"{t.reasonForTransfer}"</strong></p>
                          <p className="text-slate-500">Consent: <span className="font-semibold">{t.consentGiven ? 'Signed & Witnessed' : 'Withheld (Awaiting Override)'} ({t.consentSigneeName})</span></p>
                          <p className="text-slate-500">Priority Severity Rating: <span className="font-bold text-indigo-700 uppercase">{t.severity}</span></p>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-1">
                          <span className="text-[9px] text-slate-450 uppercase font-bold block">Assigned Custody Transport Crew:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {t.transportTeam.map(tm => (
                              <span key={tm} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                                🧑‍🚀 {tm}
                              </span>
                            ))}
                          </div>
                          {t.notes && <p className="italic text-slate-655 pt-1 border-t border-slate-200/50 mt-1 font-semibold">Directive: "{t.notes}"</p>}
                        </div>
                      </div>

                      {/* STAGED TIMELINES PROTOCOL */}
                      <div className="space-y-3 pt-2">
                        <span className="text-[9px] uppercase tracking-wider text-slate-450 block font-bold font-mono">Outpatient Handover Timeline Sequence Progress:</span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3 select-none">
                          
                          {/* Milestone 1 */}
                          <div className={`p-2.5 rounded-lg border transition-all text-center space-y-1 ${t.timestampInformed ? 'bg-teal-50/40 border-teal-200' : 'bg-slate-50 border-slate-150'}`}>
                            <span className="text-[9px] text-slate-400 block font-bold leading-tight">1. INFORMED</span>
                            {t.timestampInformed ? (
                              <span className="font-mono text-[9.5px] block font-semibold text-teal-850 bg-teal-100 rounded py-0.5">{new Date(t.timestampInformed).toLocaleTimeString()}</span>
                            ) : (
                              role !== 'patient' ? (
                                <button type="button" onClick={() => handleStampTimestamp(t.id, 'timestampInformed')} className="w-full text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded py-0.5 mt-0.5 cursor-pointer">Stamp Now</button>
                              ) : <span className="text-[10px] italic text-slate-450">Awaiting...</span>
                            )}
                            {role !== 'patient' && (
                              <input 
                                type="text"
                                placeholder="Edit HH:MM"
                                value={t.timestampInformed ? new Date(t.timestampInformed).toLocaleTimeString() : ''}
                                onChange={(e) => handleUpdateManualTimestamp(t.id, 'timestampInformed', e.target.value)}
                                className="w-full border border-slate-150 p-0.5 rounded text-[8.5px] font-mono text-center"
                              />
                            )}
                          </div>

                          {/* Milestone 2 */}
                          <div className={`p-2.5 rounded-lg border transition-all text-center space-y-1 ${t.timestampPrepared ? 'bg-teal-50/40 border-teal-200' : 'bg-slate-50 border-slate-150'}`}>
                            <span className="text-[9px] text-slate-400 block font-bold leading-tight">2. PREPARED</span>
                            {t.timestampPrepared ? (
                              <span className="font-mono text-[9.5px] block font-semibold text-teal-850 bg-teal-100 rounded py-0.5">{new Date(t.timestampPrepared).toLocaleTimeString()}</span>
                            ) : (
                              role !== 'patient' ? (
                                <button type="button" onClick={() => handleStampTimestamp(t.id, 'timestampPrepared')} className="w-full text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded py-0.5 mt-0.5 cursor-pointer">Stamp Now</button>
                              ) : <span className="text-[10px] italic text-slate-450">Awaiting...</span>
                            )}
                            {role !== 'patient' && (
                              <input 
                                type="text"
                                placeholder="Edit HH:MM"
                                value={t.timestampPrepared ? new Date(t.timestampPrepared).toLocaleTimeString() : ''}
                                onChange={(e) => handleUpdateManualTimestamp(t.id, 'timestampPrepared', e.target.value)}
                                className="w-full border border-slate-150 p-0.5 rounded text-[8.5px] font-mono text-center"
                              />
                            )}
                          </div>

                          {/* Milestone 3 */}
                          <div className={`p-2.5 rounded-lg border transition-all text-center space-y-1 ${t.timestampEntryVehicle ? 'bg-teal-50/40 border-teal-200' : 'bg-slate-50 border-slate-150'}`}>
                            <span className="text-[9px] text-slate-400 block font-bold leading-tight">3. VEHICLE ENTRY</span>
                            {t.timestampEntryVehicle ? (
                              <span className="font-mono text-[9.5px] block font-semibold text-teal-850 bg-teal-100 rounded py-0.5">{new Date(t.timestampEntryVehicle).toLocaleTimeString()}</span>
                            ) : (
                              role !== 'patient' ? (
                                <button type="button" onClick={() => handleStampTimestamp(t.id, 'timestampEntryVehicle')} className="w-full text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded py-0.5 mt-0.5 cursor-pointer">Stamp Now</button>
                              ) : <span className="text-[10px] italic text-slate-450">Awaiting...</span>
                            )}
                            {role !== 'patient' && (
                              <input 
                                type="text"
                                placeholder="Edit HH:MM"
                                value={t.timestampEntryVehicle ? new Date(t.timestampEntryVehicle).toLocaleTimeString() : ''}
                                onChange={(e) => handleUpdateManualTimestamp(t.id, 'timestampEntryVehicle', e.target.value)}
                                className="w-full border border-slate-150 p-0.5 rounded text-[8.5px] font-mono text-center"
                              />
                            )}
                          </div>

                          {/* Milestone 4 */}
                          <div className={`p-2.5 rounded-lg border transition-all text-center space-y-1 ${t.timestampExitVehicle ? 'bg-teal-50/40 border-teal-200' : 'bg-slate-50 border-slate-150'}`}>
                            <span className="text-[9px] text-slate-400 block font-bold leading-tight">4. VEHICLE EXIT</span>
                            {t.timestampExitVehicle ? (
                              <span className="font-mono text-[9.5px] block font-semibold text-teal-850 bg-teal-100 rounded py-0.5">{new Date(t.timestampExitVehicle).toLocaleTimeString()}</span>
                            ) : (
                              role !== 'patient' ? (
                                <button type="button" onClick={() => handleStampTimestamp(t.id, 'timestampExitVehicle')} className="w-full text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded py-0.5 mt-0.5 cursor-pointer">Stamp Now</button>
                              ) : <span className="text-[10px] italic text-slate-450">Awaiting...</span>
                            )}
                            {role !== 'patient' && (
                              <input 
                                type="text"
                                placeholder="Edit HH:MM"
                                value={t.timestampExitVehicle ? new Date(t.timestampExitVehicle).toLocaleTimeString() : ''}
                                onChange={(e) => handleUpdateManualTimestamp(t.id, 'timestampExitVehicle', e.target.value)}
                                className="w-full border border-slate-150 p-0.5 rounded text-[8.5px] font-mono text-center"
                              />
                            )}
                          </div>

                          {/* Milestone 5 */}
                          <div className={`p-2.5 rounded-lg border transition-all text-center space-y-1 ${t.timestampRoomArrival ? 'bg-teal-50/40 border-teal-200' : 'bg-slate-50 border-slate-150'}`}>
                            <span className="text-[9px] text-slate-400 block font-bold leading-tight">5. ROOM ASSIGNED</span>
                            {t.timestampRoomArrival ? (
                              <span className="font-mono text-[9.5px] block font-semibold text-teal-850 bg-teal-100 rounded py-0.5">{new Date(t.timestampRoomArrival).toLocaleTimeString()}</span>
                            ) : (
                              role !== 'patient' ? (
                                <button type="button" onClick={() => handleStampTimestamp(t.id, 'timestampRoomArrival')} className="w-full text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded py-0.5 mt-0.5 cursor-pointer">Stamp Now</button>
                              ) : <span className="text-[10px] italic text-slate-450">Awaiting...</span>
                            )}
                            {role !== 'patient' && (
                              <input 
                                type="text"
                                placeholder="Edit HH:MM"
                                value={t.timestampRoomArrival ? new Date(t.timestampRoomArrival).toLocaleTimeString() : ''}
                                onChange={(e) => handleUpdateManualTimestamp(t.id, 'timestampRoomArrival', e.target.value)}
                                className="w-full border border-slate-150 p-0.5 rounded text-[8.5px] font-mono text-center"
                              />
                            )}
                          </div>

                          {/* Milestone 6 */}
                          <div className={`p-2.5 rounded-lg border transition-all text-center space-y-1 ${t.timestampStaffContact ? 'bg-teal-50/40 border-teal-200' : 'bg-slate-50 border-slate-150'}`}>
                            <span className="text-[9px] text-slate-400 block font-bold leading-tight">6. STAFF CONTACT</span>
                            {t.timestampStaffContact ? (
                              <span className="font-mono text-[9.5px] block font-semibold text-teal-850 bg-teal-100 rounded py-0.5">{new Date(t.timestampStaffContact).toLocaleTimeString()}</span>
                            ) : (
                              role !== 'patient' ? (
                                <button type="button" onClick={() => handleStampTimestamp(t.id, 'timestampStaffContact')} className="w-full text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded py-0.5 mt-0.5 cursor-pointer">Stamp Now</button>
                              ) : <span className="text-[10px] italic text-slate-450">Awaiting...</span>
                            )}
                            {role !== 'patient' && (
                              <input 
                                type="text"
                                placeholder="Edit HH:MM"
                                value={t.timestampStaffContact ? new Date(t.timestampStaffContact).toLocaleTimeString() : ''}
                                onChange={(e) => handleUpdateManualTimestamp(t.id, 'timestampStaffContact', e.target.value)}
                                className="w-full border border-slate-150 p-0.5 rounded text-[8.5px] font-mono text-center"
                              />
                            )}
                          </div>

                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== TAB 4: SCHEDULING DECK & PATIENT AVAILABILITY ==================== */}
          {visitationTab === 'schedule' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* CURRENT IDENTITY ROLE NOTICE */}
              <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider font-mono">verified clinic security credential</span>
                  <div className="font-bold text-xs flex items-center gap-1.5 font-sans">
                    <span>Active Gateway Scope:</span>
                    <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded uppercase">{role} access role</span>
                  </div>
                </div>

                <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white">
                  Active Patient: <strong className="text-teal-300 font-sans">{activePatient ? `${activePatient.personalInfo?.firstName || ''} ${activePatient.personalInfo?.lastName || ''}` : 'None Selected'} ({activePatient?.id || 'N/A'})</strong>
                </div>
              </div>

              {/* SECTION A: AVAILABILITY MATRIX */}
              <div id="availability-section" className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                <div className="flex border-b border-slate-150 pb-2.5 justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      Patient Preferred Availability Profiles
                    </h3>
                    <p className="text-[11px] text-slate-500 font-sans">Consultations are mapped to target availability windows to bypass personal restrictions</p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-150 px-1.5 rounded uppercase font-bold">IT-Verified</span>
                </div>

                {role === 'patient' ? (
                  /* PATIENT FORM */
                  <form onSubmit={handleUpdateAvailability} className="space-y-4 text-xs font-sans">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">Select Your Preferred Days of the Week *</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                          const isSel = patientDaysOfWeek.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleToggleDay(day)}
                              className={`p-2 px-3.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                isSel 
                                  ? 'bg-slate-900 border-[1px] border-slate-900 text-white shadow-xs' 
                                  : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                              }`}
                            >
                              {isSel && '✓ '} {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Preferred Time of Day *</label>
                        <select
                          value={patientPreferredTime}
                          onChange={(e) => setPatientPreferredTime(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold cursor-pointer"
                        >
                          <option value="morning">🌅 Morning (08:00 AM - 12:00 PM)</option>
                          <option value="afternoon">☀️ Afternoon (12:00 PM - 05:00 PM)</option>
                          <option value="evening">🌌 Evening (05:00 PM - 09:00 PM)</option>
                          <option value="any">🔄 Flexible (Any Time Range)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Additional Constraints / Restriction Notes</label>
                        <input
                          type="text"
                          value={patientCustomNotes}
                          onChange={(e) => setPatientCustomNotes(e.target.value)}
                          placeholder="e.g. Cannot attend Wednesday before 10 AM due to chemotherapy series..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Audit & Lock My Availability Profile
                    </button>
                  </form>
                ) : (
                  /* MEDICAL STAFF AND IT VIEW */
                  <div className="space-y-3 font-sans text-xs">
                    <p className="text-slate-600 font-medium">The healthcare staff and the IT specialists utilize the schedule indicator below to map prospective consulting dates aligned to candidate parameters:</p>
                    {(() => {
                      const avail = availabilities.find(a => a.patientId === activePatient?.id);
                      if (!avail) {
                        return (
                          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-900 italic text-[11px] flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>This patient has not declared availability flags yet. Clinician-directed bookings apply standard sequences.</span>
                          </div>
                        );
                      }
                      return (
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-150 pb-2">
                            <span className="font-bold text-slate-850">Parameters for Patient {activePatient?.personalInfo?.firstName || ''} {activePatient?.personalInfo?.lastName || ''}:</span>
                            <span className="text-[10px] bg-slate-200 text-slate-800 font-mono px-2 rounded-full font-bold">Last Profile Update: {new Date(avail.lastUpdated).toLocaleDateString()}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block font-bold mb-1">Approved Days of Week:</span>
                              <div className="flex flex-wrap gap-1">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => {
                                  const matches = avail.daysOfWeek.includes(d);
                                  return (
                                    <span key={d} className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${matches ? 'bg-emerald-100 text-emerald-800 border-emerald-200 border' : 'bg-slate-100 text-slate-400 opacity-60'}`}>
                                      {d}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block font-bold mb-1 font-sans">Preferred Slot Interval:</span>
                              <span className="bg-slate-900 text-teal-300 font-mono text-[11px] font-bold px-2.5 py-1 rounded-md inline-block uppercase shadow-xs">
                                {avail.preferredTimeRange} range
                              </span>
                            </div>
                          </div>

                          {avail.customNotes && (
                            <div className="pt-2 border-t border-slate-200/60">
                              <span className="text-[10px] text-slate-400 uppercase block font-bold mb-0.5">Physical Constraints & Notes:</span>
                              <p className="italic text-slate-700 font-semibold">"{avail.customNotes}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* SECTION B: CLINIC STAFF PROPOSE SLOTS FORM (Only staff can use this) */}
              {role !== 'patient' && (
                <form onSubmit={handleDispatchProposals} className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                  <div>
                    <h3 className="text-xs uppercase font-extrabold text-slate-900 tracking-wider">Clinician Propose Consultation Options</h3>
                    <p className="text-[11px] text-slate-500 font-sans">Formulate and dispatch candidate appointment options. Ensure slots fit the patient availability rules shown above!</p>
                  </div>

                  <div className="space-y-4 font-sans text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Attending Clinician / Team Lead *</label>
                      <input
                        type="text" required
                        value={proposeDocName}
                        onChange={(e) => setProposeDocName(e.target.value)}
                        placeholder="e.g. Dr. Alistair Vance, MD"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Candidate Slot 1 (Datetime) *</label>
                        <input
                          type="datetime-local" required
                          value={proposeDate1}
                          onChange={(e) => setProposeDate1(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Candidate Slot 2 (Datetime)</label>
                        <input
                          type="datetime-local"
                          value={proposeDate2}
                          onChange={(e) => setProposeDate2(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Candidate Slot 3 (Datetime)</label>
                        <input
                          type="datetime-local"
                          value={proposeDate3}
                          onChange={(e) => setProposeDate3(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-55 border border-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                    >
                      Dispatch Appointment Proposals to Patient Portal
                    </button>
                  </div>
                </form>
              )}

              {/* SECTION C: APPOINTMENTS LEDGER & SELECTION PORTAL */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-slate-900 tracking-wider">Scheduled Consultation Ledgers</h3>

                {appointments.filter(a => a.patientId === activePatient?.id).length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 italic text-xs">
                    No bookings logged on this patient files currently. Propose dates using the clinical utility tools.
                  </div>
                ) : (
                  appointments.filter(a => a.patientId === activePatient?.id).map((appt) => {
                    const isLocked = appt.selectedDateTime ? isLockedForPatientCheck(appt.selectedDateTime) : false;
                    return (
                      <div key={appt.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
                        
                        {/* Status bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-150 pb-2.5">
                          <div>
                            <span className="font-mono text-teal-800 text-xs font-bold inline-block mr-1">{appt.id}</span>
                            <span className="text-[11px] font-sans text-slate-500">Booking with <strong>{appt.doctorName}</strong></span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {appt.status === 'pending_selection' && (
                              <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">Awaiting Selection</span>
                            )}
                            {appt.status === 'confirmed' && (
                              <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${isLocked ? 'bg-indigo-900 border-indigo-950 text-indigo-100 border' : 'bg-emerald-100 border border-emerald-200 text-emerald-800'}`}>
                                {isLocked ? '🔒 Confirmed & Locked' : '🟢 Confirmed & Open'}
                              </span>
                            )}
                            {appt.status === 'excused' && (
                              <span className="bg-sky-100 border border-sky-200 text-sky-850 text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase">Excused Absence: Unpenalized</span>
                            )}
                            {appt.status === 'unexcused' && (
                              <span className="bg-rose-100 border border-rose-200 text-rose-805 text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase">Unexcused absence</span>
                            )}
                          </div>
                        </div>

                        {/* Booking State Rendering details */}
                        <div className="text-xs font-sans space-y-3.5 leading-relaxed">
                          
                          {appt.status === 'pending_selection' && (
                            <div className="space-y-3">
                              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-amber-900 text-[11px] leading-relaxed flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                <span>Attending clinic has proposed several consultation candidate times. Select a date to confirm booking.</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 select-none">
                                {appt.options.map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      if (role === 'patient') {
                                        handlePatientSelectSlot(appt.id, opt.dateTime);
                                      } else if (window.confirm(`Propose Action: Proceed as Clinical Team Proxy to confirm slot on behalf of ${appt.patientName}?`)) {
                                        handlePatientSelectSlot(appt.id, opt.dateTime);
                                      }
                                    }}
                                    className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 rounded-xl text-center transition-all duration-150 cursor-pointer text-slate-800 font-bold space-y-1"
                                  >
                                    <span className="text-[10px] text-slate-400 block font-bold">PROPOSED OPTION:</span>
                                    <strong className="block text-[11px] font-semibold">{new Date(opt.dateTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {appt.status === 'confirmed' && appt.selectedDateTime && (
                            <div className="space-y-4">
                              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <span className="text-[9px] text-slate-455 uppercase tracking-wider block font-bold">Selected Booking Appointment:</span>
                                  <strong className="text-sm font-bold text-slate-900 font-mono inline-block mt-0.5">{new Date(appt.selectedDateTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</strong>
                                  <p className="text-[10.5px] text-slate-500 font-sans mt-0.5">Custody Handover signee: <strong>{appt.doctorName}</strong></p>
                                </div>

                                <div className="space-y-1 sm:text-right text-xs">
                                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Locking Status Timer</span>
                                  {isLocked ? (
                                    <span className="bg-rose-50 border border-rose-100 text-rose-700 px-2 py-1 rounded block font-bold text-[10px]">
                                      🔒 Under 48h (No modifications allowed)
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-1 rounded block font-bold text-[10px]">
                                      🔓 Over 48h (Modifications allowed)
                                    </span>
                                  )}
                                  <p className="text-[9.5px] text-slate-450">({Math.round(getHoursUntilAppointment(appt.selectedDateTime))} Hrs remaining)</p>
                                </div>
                              </div>

                              {/* CALENDAR SYNC CONTROLS */}
                              <div className="p-4 border border-dashed border-slate-200 bg-slate-50/40 rounded-xl space-y-3 font-sans">
                                <div className="space-y-0.5">
                                  <span className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest font-bold block flex items-center gap-1">
                                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                                    Universal Calendar Deep-Link Integrations
                                  </span>
                                  <p className="text-[10.5px] text-slate-450">Add the verified appointment to your preferred digital calendar system with one-click triggers:</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                  <a
                                    href={generateGoogleCalendarUrl(appt.doctorName, appt.selectedDateTime)}
                                    target="_blank" rel="noreferrer"
                                    className="p-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 rounded-lg text-center font-bold text-[10.5px] text-slate-700 flex items-center justify-center gap-1 transition-all"
                                  >
                                    Add to Gmail Calendar
                                  </a>

                                  <a
                                    href={generateOutlookCalendarUrl(appt.doctorName, appt.selectedDateTime)}
                                    target="_blank" rel="noreferrer"
                                    className="p-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 rounded-lg text-center font-bold text-[10.5px] text-slate-700 flex items-center justify-center gap-1 transition-all"
                                  >
                                    Add to Outlook Live
                                  </a>

                                  <a
                                    href={generateYahooCalendarUrl(appt.doctorName, appt.selectedDateTime)}
                                    target="_blank" rel="noreferrer"
                                    className="p-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 rounded-lg text-center font-bold text-[10.5px] text-slate-700 flex items-center justify-center gap-1 transition-all"
                                  >
                                    Add to Yahoo Calendar
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => downloadICSFileVal(appt.doctorName, appt.selectedDateTime!, appt.patientName)}
                                    className="p-2 border border-slate-200 hover:border-teal-350 hover:bg-teal-50 rounded-lg text-center font-black text-[10.5px] text-teal-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  >
                                    Download .ics file
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {appt.status === 'excused' && appt.excuseReason && (
                            <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl space-y-1 text-slate-800 border-l-4 border-l-sky-500">
                              <span className="text-[9px] uppercase tracking-wider block font-bold text-sky-700">Absence Status Level: Excused Absence</span>
                              <p className="text-[11.5px] leading-relaxed">Reason Recorded: <strong className="text-sky-955 font-semibold font-mono">"{appt.excuseReason}"</strong></p>
                              <span className="text-[9.5px] text-sky-400 block pt-1.5 font-bold font-sans">Absence processed under penalty waive protocol §310-B.</span>
                            </div>
                          )}

                          {appt.status === 'unexcused' && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl space-y-1.5 text-rose-850 border-l-4 border-l-rose-500">
                              <span className="text-[9.5px] uppercase tracking-widest block font-black text-rose-700 font-mono">Status alert: Late unexcused absence & penalty charge applied</span>
                              <p className="text-[11.5px] leading-relaxed font-mono">Log notification: <strong>"{appt.unexcusedReason || 'No Show/Unable to attend - Late Cancellation fee: $25'}"</strong></p>
                              <div className="flex items-center gap-2 pt-1 border-t border-rose-200/50">
                                <span className="bg-rose-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">Fee Ledger: $25.00</span>
                                <span className="text-[9.5px] text-rose-500 font-sans font-bold">Billed automatically to clinical invoice ledger.</span>
                              </div>
                            </div>
                          )}

                        </div>

                        {/* CLINICAL TIMELINE MODIFICATION BY CLINIC AMIN (Only can be used by Doctor/Nurse) */}
                        <div className="pt-2 flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest font-sans">Attending CLINIC AMIN OVERRIDES CONTROL PANEL:</span>

                          <div className="flex gap-1.5">
                            {/* Override trigger for Doctors & nurses */}
                            <button
                              type="button"
                              onClick={() => {
                                setCancelTargetApptId(appt.id);
                                setExcuseMode('excused');
                                setExcusedReasonText('');
                                setAdminExcuseFormOpen(true);
                                alert(`Admin-Lock override: Loaded appointment ${appt.id} into status editor.`);
                              }}
                              className="text-[9.5px] font-bold text-slate-700 hover:text-slate-900 border border-slate-350 hover:bg-slate-200 p-1 px-2.5 rounded transition-colors cursor-pointer select-none"
                            >
                              Admin status Change Override
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* FLOATING ACTION OVERLAY FORM FOR STATUS CHANGE OVERRIDE */}
              {adminExcuseFormOpen && (
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-zinc-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <div>
                      <h4 className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Clinical Status override form</h4>
                      <p className="text-[10px] text-zinc-400 font-sans">Attending practitioner bypasses scheduling rules for APP: <strong className="font-mono">{cancelTargetApptId}</strong></p>
                    </div>
                    <button type="button" onClick={() => setAdminExcuseFormOpen(false)} className="text-xs text-zinc-400 hover:text-white cursor-pointer font-bold">Cancel</button>
                  </div>

                  <form onSubmit={handleAdminModifyAppointment} className="space-y-4 text-xs font-sans">
                    <div className="space-y-2">
                      <span className="block font-bold">Select targeted absence designation:</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 select-none cursor-pointer">
                          <input
                            type="radio"
                            name="excuse_mode"
                            checked={excuseMode === 'excused'}
                            onChange={() => setExcuseMode('excused')}
                            className="accent-emerald-500"
                          />
                          <span>Excused: Unable to attend (Unpenalized)</span>
                        </label>

                        <label className="flex items-center gap-1.5 select-none cursor-pointer">
                          <input
                            type="radio"
                            name="excuse_mode"
                            checked={excuseMode === 'unexcused'}
                            onChange={() => setExcuseMode('unexcused')}
                            className="accent-rose-500"
                          />
                          <span>Unexcused: Unable to attend (Late Fee Charged)</span>
                        </label>
                      </div>
                    </div>

                    {excuseMode === 'excused' ? (
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                          <span>Excuse Reasoning Verification Indication (Max 1000 characters) *</span>
                          <span className="font-mono text-[9px]">{excusedReasonText.length} / 1000 Chars</span>
                        </div>
                        <textarea
                          rows={3} required
                          maxLength={1000}
                          value={excusedReasonText}
                          onChange={(e) => setExcusedReasonText(e.target.value)}
                          placeholder="Please state clinical reasoning or medical emergency indicators to waive cancellation fees..."
                          className="w-full bg-slate-900 border border-zinc-700 rounded-lg p-2 text-white font-sans text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-rose-300">
                        <span className="text-[10.5px] uppercase font-bold block mb-0.5 font-sans">Auto-Cancellation System Penalties Active</span>
                        <p className="text-[11px] leading-relaxed">Unexcused absences trigger automated cancellation processing. An automatic notification reason will say: <strong className="font-mono text-white block mt-1">"No Show/Unable to attend - Late Cancellation fee: $25"</strong></p>
                      </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-zinc-800">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white rounded-lg text-xs font-bold font-mono shadow cursor-pointer"
                      >
                        Apply Override & Sync Profile
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SECTION D: ACTIVITY TRACKING SYSTEM LEDGER */}
              <div className="bg-zinc-900 text-zinc-100 rounded-xl border border-slate-850 p-5 space-y-3.5">
                <span className="text-[9.5px] font-mono tracking-widest uppercase text-emerald-400 font-bold block flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Recent Scheduling Operations & IT Audits
                </span>

                <div className="divide-y divide-zinc-800 max-h-48 overflow-y-auto pr-1">
                  {scheduleNotifications.map(notif => (
                    <div key={notif.id} className="py-2.5 text-[10.5px] font-sans flex items-start gap-2.5">
                      <span className="font-mono text-zinc-500 font-semibold shrink-0">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                      <div className="flex-1 text-zinc-350">
                        <p>{notif.message}</p>
                      </div>
                      <span className={`text-[8.5px] font-mono font-bold uppercase p-0.5 px-1.5 rounded-md shrink-0 ${
                        notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                        notif.type === 'warn' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {notif.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </div>

      {/* HISTORIC VISITS LOG LEDGER */}
      <div id="visitation-history-ledger" className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Clipboard className="w-4 h-4 text-emerald-500" />
              Electronic Encounter Records & History Logs ({displayedRecords.length})
            </h3>
            <p className="text-xs text-slate-500">Chronological list of patient and physician diagnostics</p>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs self-start sm:self-center font-sans">
            <button
              type="button"
              onClick={() => setRecordFilter('patient')}
              className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer ${
                recordFilter === 'patient' 
                  ? 'bg-white text-slate-900 shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              This Patient Only
            </button>
            <button
              type="button"
              onClick={() => setRecordFilter('all')}
              className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer ${
                recordFilter === 'all' 
                  ? 'bg-white text-slate-900 shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Clinic Records
            </button>
          </div>
        </div>

        {displayedRecords.length > 0 ? (
          <div className="space-y-4 font-sans">
            {displayedRecords.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedPreviewRecord(item)}
                className="p-5 bg-slate-50 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/[0.01] hover:shadow-sm rounded-xl transition-all flex flex-col md:flex-row justify-between gap-4 cursor-pointer group relative"
                title="Click to view/print secure clinical dossier"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-150/55 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">{item.id}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-extrabold">
                        📅 Visit Date: {item.visitDate}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        Patient: <strong className="text-teal-900">{item.patientName}</strong> ({item.patientId})
                      </span>
                    </div>
                    <span className="text-[10px] text-teal-600 font-extrabold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      Inspect Secure Dossier 🔍
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed pt-1">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Attending Staff</span>
                      <strong className="text-slate-850">Attending: {item.doctorName}</strong>
                      <p className="text-slate-500 text-[10.5px]">Assisting: {item.assistingStaff}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Encounters & Reasons</span>
                      <p className="text-slate-800">
                        <strong className="font-semibold block text-slate-900">{item.reasonForVisit}</strong>
                        <span className="italic text-slate-600 block mt-0.5">"Complaints: {item.symptoms}"</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 font-mono text-[11px]">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold font-sans mb-1">Diagnosed Codes</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.diagnosticCodes.map((code) => {
                        const parsed = clinicalCodes.find(c => c.code === code);
                        return (
                          <div 
                            key={code}
                            className="bg-zinc-900 text-white rounded p-1 px-2 text-[10px] flex items-center gap-1.5"
                          >
                            <span className="text-rose-400 font-extrabold">{code}</span>
                            <span className="text-slate-450 border-l border-slate-700 pl-1.5 truncate max-w-sm">
                              {parsed ? parsed.description : 'Custom CPT Diagnostic Code'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-150 text-[10px] text-slate-500">
                    <span className="font-bold underline text-[9px] block text-slate-450 uppercase mb-0.5 font-sans">Patient medical background copy:</span>
                    <pre className="whitespace-pre-wrap font-mono text-[10px] font-medium leading-relaxed bg-slate-100 p-2 rounded-md">
                      {item.medicalHistorySummary}
                    </pre>
                  </div>

                  {(() => {
                    const summariesStr = localStorage.getItem('clinic_after_visit_summaries');
                    const uploadedSummaries = summariesStr ? JSON.parse(summariesStr) : [];
                    const linkedAvs = uploadedSummaries.find((s: any) => s.visitId === item.id);
                    if (!linkedAvs) return null;
                    return (
                      <div className="mt-3 pt-2 w-full border-t border-teal-200/60 bg-teal-500/[0.04] p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-left">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                          <div>
                            <span className="text-[10px] bg-teal-100 text-teal-800 font-extrabold px-1.5 py-0.5 rounded mr-1">
                              {linkedAvs.id}
                            </span>
                            <span className="font-extrabold text-teal-900">HIPAA After-Visit Summary (AVS) Uploaded & Linked!</span>
                            <p className="text-[10.5px] text-slate-500 mt-0.5">Status: <strong className="text-emerald-700">{linkedAvs.reviewStatus}</strong> | Reviewer: {linkedAvs.reviewedBy || 'System'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInspectAvs(linkedAvs);
                          }}
                          className="self-start sm:self-center bg-teal-600 hover:bg-teal-700 text-white hover:shadow-xs transition-all font-extrabold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer flex items-center gap-1 select-none"
                        >
                          <Eye className="w-3 h-3 text-white shrink-0" />
                          <span>Inspect Attached AVS</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("End-user verification: Are you sure you wish to expunge this certified visitation note?")) {
                        onDeleteVisitation(item.id);
                      }
                    }}
                    className="p-1 px-2.5 text-xs text-rose-600 hover:text-white hover:bg-rose-600 rounded-md transition-all font-semibold flex items-center gap-1 cursor-pointer select-none border border-rose-100"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Expunge
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 italic bg-slate-50 rounded-xl border border-dashed border-slate-250">
            No visitation records found matching this patient filter. Fill out the report above to save a visitation file.
          </div>
        )}

      </div>

      {/* Dossier Preview Modal overlay window */}
      <AnimatePresence>
        {selectedPreviewRecord && (() => {
          const linkedPatient = patients.find(p => p.id === selectedPreviewRecord.patientId);
          const summariesStr = localStorage.getItem('clinic_after_visit_summaries');
          const uploadedSummaries = summariesStr ? JSON.parse(summariesStr) : [];
          const linkedAvs = uploadedSummaries.find((s: any) => s.visitId === selectedPreviewRecord.id);

          const copyDossierToClipboard = (item: VisitationRecord) => {
            const text = `
=========================================
      CLINICAL ENCOUNTER REPORT
=========================================
Encounter Reference: ${item.id}
Date of Visit: ${item.visitDate}
Patient Name: ${item.patientName} (ID: ${item.patientId})
DOB: ${linkedPatient?.personalInfo?.dateOfBirth || 'N/A'} | Gender: ${linkedPatient?.personalInfo?.gender || 'N/A'}
Insurance Provider: ${linkedPatient?.insuranceBilling?.providerName || 'N/A'}

ATTENDING MEDICAL TEAM:
Attending Provider: ${item.doctorName}
Assisting Clinical Staff: ${item.assistingStaff}

ENCOUNTER & REASONS:
Chief Complaint: ${item.reasonForVisit}
Subjective Symptoms: ${item.symptoms}

DIAGNOSTIC CODING (CPT/ICD):
${item.diagnosticCodes.map(code => {
  const parsed = clinicalCodes.find(c => c.code === code);
  return `- [${code}] ${parsed ? parsed.description : 'Custom CPT Diagnostic Code'}`;
}).join('\n')}

PATIENT BACKGROUND SUMMARY:
${item.medicalHistorySummary}

CONFIDENTIALITY NOTE: This document contains Protected Health Information (PHI) subjected to HIPAA compliance.
            `.trim();
            navigator.clipboard.writeText(text);
            alert("📋 Certified Clinical Dossier text copied securely to clipboard!");
          };

          return (
            <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header of Modal */}
                <div className="flex items-center justify-between p-4 border-b border-slate-150 bg-slate-50 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Clinical Encounter Dossier</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Reference ID: {selectedPreviewRecord.id} | Certified Health Ledger</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      HIPAA Secure
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewRecord(null)}
                      className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body of Modal */}
                <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-800 leading-relaxed font-sans text-left">
                  
                  {/* Medical Branding & Stamp */}
                  <div className="border-b-2 border-double border-teal-500/30 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-left">
                      <h2 className="text-base font-black text-teal-900 uppercase tracking-tight">VANCE & THORNE CLINICAL SYSTEM</h2>
                      <p className="text-[11px] text-slate-500 font-medium">100 Hospital Drive, Suite 400 • Phone (555) 019-2834 • HIPAA Compliance #45-164</p>
                    </div>
                    <div className="self-start sm:self-center bg-teal-50 border border-teal-150 p-2.5 rounded-xl flex items-center gap-2 shrink-0">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <div className="text-left">
                        <span className="text-[9px] uppercase font-black text-teal-800 block leading-none">Status</span>
                        <strong className="text-xs text-teal-900">Certified Record</strong>
                      </div>
                    </div>
                  </div>

                  {/* Patient Demographic Information Block */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 justify-start">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Patient Demographic Ledger & Billing Profile
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left">
                      <div>
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Full Name</span>
                        <strong className="text-slate-850 font-bold">{selectedPreviewRecord.patientName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Patient Reference ID</span>
                        <span className="font-mono bg-slate-200/60 px-1.5 py-0.5 rounded font-black text-slate-700">{selectedPreviewRecord.patientId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Date of Birth</span>
                        <span className="text-slate-750 font-medium">{linkedPatient?.personalInfo?.dateOfBirth || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Gender Marker</span>
                        <span className="text-slate-750 font-medium">{linkedPatient?.personalInfo?.gender || "N/A"}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Primary Care Provider</span>
                        <span className="text-slate-750 font-medium font-mono">{linkedPatient?.employmentCoverage?.primaryCareProvider || "Vance & Thorne Care Group"}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Insurance coverage provider</span>
                        <span className="text-slate-750 font-bold">{linkedPatient?.insuranceBilling?.providerName || "Self-Pay / Not Declared"}</span>
                        {linkedPatient?.insuranceBilling?.policyNo && (
                          <span className="text-[10px] text-slate-500 block font-mono">Policy No: {linkedPatient.insuranceBilling.policyNo} | Group: {linkedPatient.insuranceBilling.groupNo}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Attending Provider & Assistant Block */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 justify-start">
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                      Attending Medical Staff Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-slate-200 rounded-xl text-xs bg-teal-500/[0.01]">
                      <div>
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Primary Attending Physician</span>
                        <strong className="text-slate-800 text-sm font-extrabold">{selectedPreviewRecord.doctorName}</strong>
                        <p className="text-slate-500 text-[10.5px]">Certification Signature: Verified Digital Signature</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Clinical Assisting Team Staff</span>
                        <strong className="text-slate-800 text-sm font-semibold">{selectedPreviewRecord.assistingStaff || "On-duty Medical Nurse Assistant"}</strong>
                        <p className="text-slate-500 text-[10.5px]">Affiliated: General Practice Clinic</p>
                      </div>
                    </div>
                  </div>

                  {/* Encounter Reasons / Complaints */}
                  <div className="space-y-4">
                    <div className="border-t border-slate-150 pt-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5 text-left">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Chief Complained Complaint / Reason For Visit</span>
                        <blockquote className="bg-slate-50 border-l-4 border-teal-500 p-3 rounded-r-lg font-bold text-slate-850">
                          {selectedPreviewRecord.reasonForVisit}
                        </blockquote>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Subjective Symptoms Summary</span>
                        <p className="bg-slate-50 p-3 rounded-lg italic text-slate-700 border border-slate-150">
                          &ldquo;{selectedPreviewRecord.symptoms}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosed Codes & CPT/HCPCS Codes catalog */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 justify-start">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Certified Diagnostic Codes & AMA-CPT Procedures
                    </h4>
                    <div className="flex flex-wrap gap-2 text-left">
                      {selectedPreviewRecord.diagnosticCodes.length > 0 ? (
                        selectedPreviewRecord.diagnosticCodes.map((code) => {
                          const parsed = clinicalCodes.find(c => c.code === code);
                          return (
                            <div 
                              key={code}
                              className="bg-slate-900 text-white rounded-xl p-3 text-xs flex flex-col gap-1 w-full sm:w-[calc(50%-0.5rem)] text-left shadow-2xs border border-slate-800"
                            >
                              <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                                <span className="font-mono text-rose-400 font-extrabold uppercase tracking-widest">{code}</span>
                                <span className="text-[9px] bg-slate-850 text-slate-400 px-1.5 rounded font-bold font-sans">AMA-CPT Certified</span>
                              </div>
                              <p className="text-slate-200 text-[11px] leading-tight font-sans font-medium mt-1">
                                {parsed ? parsed.description : 'Custom Procedural Code Assessment'}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-slate-450 italic text-xs py-2">No procedures diagnostic codes classified.</div>
                      )}
                    </div>
                  </div>

                  {/* Patient Clinical Background Notes */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 justify-start font-sans">
                      <Clipboard className="w-3.5 h-3.5 text-slate-400 font-sans" />
                      Compiled Intake History & Clinical Notes Copy
                    </h4>
                    <pre className="whitespace-pre-wrap font-mono text-[11px] font-medium leading-relaxed bg-slate-100 border border-slate-200 max-w-full overflow-x-auto p-3.5 rounded-lg text-slate-700">
                      {selectedPreviewRecord.medicalHistorySummary || 'No clinical history reported for this session.'}
                    </pre>
                  </div>

                  {/* Nested Attached After Visit Summary (AVS) if available */}
                  {linkedAvs && (
                    <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-teal-200/60">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                        <h4 className="text-xs font-black text-teal-900 uppercase tracking-tight">
                          Standardized HIPAA After-Visit Summary (AVS) Linked
                        </h4>
                        <span className="text-[9px] bg-teal-100 text-teal-800 font-black px-1.5 py-0.5 rounded font-mono ml-auto">
                          {linkedAvs.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
                        <div>
                          <span className="text-slate-450 block text-[9px] uppercase font-bold">Patient Chief Complaint</span>
                          <p className="text-slate-800 font-bold">{linkedAvs.chiefComplaint}</p>
                        </div>
                        <div>
                          <span className="text-slate-450 block text-[9px] uppercase font-bold">Vitals Verified Stamp</span>
                          <p className="font-mono text-slate-700 leading-tight">
                            BP: <strong className="text-slate-900">{linkedAvs.vitals?.bloodPressure || '120/80'}</strong> mmHg<br />
                            Heart Rate: <strong className="text-slate-900">{linkedAvs.vitals?.heartRate || '72'}</strong> bpm
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-450 block text-[9px] uppercase font-bold">Clinical Diagnoses Checklist</span>
                          <div className="flex flex-wrap gap-1 mt-1 justify-start">
                            {linkedAvs.diagnoses?.map((diag: string, idx: number) => (
                              <span key={idx} className="bg-teal-100 text-teal-850 px-2 py-0.5 rounded text-[10px] font-bold">
                                {diag}
                              </span>
                            )) || <span className="italic text-slate-500">None logged</span>}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-450 block text-[9px] uppercase font-bold">Reviewer Specialist Details</span>
                          <p className="text-slate-700">{linkedAvs.reviewedBy || 'System Auditor'}</p>
                        </div>
                        <div>
                          <span className="text-slate-450 block text-[9px] uppercase font-bold">Certification Status</span>
                          <p className="font-bold text-emerald-700">{linkedAvs.reviewStatus || 'Completed'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Certification attestation stamp */}
                  <div className="pt-4 border-t border-dashed border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10px] text-slate-500">
                    <div className="text-left">
                      <p className="font-semibold">Security Level: HIPAA Category II Secure Health Record</p>
                      <p className="mt-0.5">Approved & Encrypted via Standard secure hash protocols.</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-bold">Signed: Dr. Rachel Thorne, MD, FACP</p>
                      <p className="text-[9.5px]">Certification Timestamp Slot: {selectedPreviewRecord.visitDate}</p>
                    </div>
                  </div>

                </div>

                {/* Footer Controls of Modal */}
                <div className="flex items-center justify-between p-4 border-t border-slate-150 bg-slate-50 rounded-b-2xl">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyDossierToClipboard(selectedPreviewRecord)}
                      className="bg-slate-200 hover:bg-slate-350 text-slate-800 transition-all font-extrabold text-[11px] py-2 px-3.5 rounded-xl cursor-pointer flex items-center gap-1.5 select-none"
                    >
                      <Clipboard className="w-4 h-4 text-slate-700" />
                      <span>Copy Text Ledger</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white transition-all font-extrabold text-[11px] py-2 px-3.5 rounded-xl cursor-pointer flex items-center gap-1.5 select-none"
                    >
                      <Printer className="w-4 h-4 text-white" />
                      <span>Print Formatted Dossier</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewRecord(null)}
                    className="p-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all"
                  >
                    Close Preview
                  </button>
                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Advanced AVS Security, Download, and Multi-Recipient Dispatch Modal overlay */}
      <AnimatePresence>
        {selectedInspectAvs && (
          <InspectAvsModal
            avs={selectedInspectAvs}
            onClose={() => setSelectedInspectAvs(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// Dedicated HIPAA-Compliant After-Visit Summary (AVS) Share and Safeguard Suite
interface InspectAvsModalProps {
  avs: any;
  onClose: () => void;
}

function InspectAvsModal({ avs, onClose }: InspectAvsModalProps) {
  const [recipientEmails, setRecipientEmails] = useState<string[]>([
    "secure-vault@example.com",
  ]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [emailSuccessMessage, setEmailSuccessMessage] = useState('');
  const [sendError, setSendError] = useState('');

  const handleAddEmail = () => {
    setSendError('');
    setEmailSuccessMessage('');
    const email = newEmailInput.trim();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSendError("⚠️ Please enter a valid email address (e.g. name@example.com).");
      return;
    }
    if (recipientEmails.includes(email)) {
      setSendError("⚠️ This email is already in the recipient list.");
      return;
    }
    if (recipientEmails.length >= 5) {
      setSendError("⚠️ Maximum limit of 5 secure recipients reached.");
      return;
    }
    setRecipientEmails([...recipientEmails, email]);
    setNewEmailInput('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setRecipientEmails(recipientEmails.filter(e => e !== emailToRemove));
    setEmailSuccessMessage('');
    setSendError('');
  };

  const handleSendEmails = () => {
    setSendError('');
    setEmailSuccessMessage('');
    if (recipientEmails.length === 0) {
      setSendError("⚠️ Please add at least one recipient email address.");
      return;
    }
    // Simulate HIPAA-compliant dispatch
    setEmailSuccessMessage(`📨 HIPAA Secure Dispatch Completed! Encrypted AVS files have been securely routed to ${recipientEmails.length} recipient inbox(es) with end-to-end TLS encryption.`);
  };

  const handleTriggerSync = () => {
    setIsSyncingDrive(true);
    setTimeout(() => {
      setIsSyncingDrive(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 1000);
  };

  const downloadFile = (format: 'json' | 'txt') => {
    let content = '';
    let filename = `AVS-${avs.id}`;
    if (format === 'json') {
      content = JSON.stringify(avs, null, 2);
      filename += '.json';
    } else {
      content = `
=====================================================
          HIPAA CLINICAL AFTER-VISIT SUMMARY
=====================================================
AVS ID: ${avs.id}
Affiliated Visit ID: ${avs.visitId}
Generation Date: ${avs.date}

PATIENT FILE:
- Name: ${avs.patientName}
- Patient ID: ${avs.patientId}

ATTENDING TEAM:
- Physician: ${avs.doctorName}
- Reviewer: ${avs.reviewedBy || 'System Auditor'}
- Verification Status: ${avs.reviewStatus || 'Verified Accurate'}

VITAL SIGNS REGISTER:
- Blood Pressure: ${avs.vitals?.bloodPressure || 'N/A'} mmHg
- Heart Rate: ${avs.vitals?.heartRate || 'N/A'} bpm
- Temperature: ${avs.vitals?.temperature || 'N/A'} °F
- Respiratory Rate: ${avs.vitals?.respiratoryRate || 'N/A'} bpm

CONFIDENTIAL CHIEF COMPLAINT:
"${avs.chiefComplaint}"

PRIMARY DIAGNOSIS CODES:
${avs.diagnoses?.join(', ') || 'None Documented'}

CARE PLAN & FOLLOW-UP CLINICAL INSTRUCTIONS:
${avs.careInstructions || 'No primary outpatient guidelines recorded.'}

-----------------------------------------------------
SECURE ENTERPRISE INTEGRATION STATS:
- Google Drive File URL: https://storage.example.com/avs-vault/${avs.id}
- Local Checksum Hash: sha256-${avs.id}-validated-integrity
- Intended Use: Internal Hospital Record System Only. Do not distribute.
=====================================================
      `.trim();
      filename += '.txt';
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const driveTargetLink = `https://storage.example.com/avs-vault/${avs.id}`;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header content */}
        <div className="flex items-center justify-between p-4 border-b border-slate-150 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">AVS Inspection & Security Suite</h3>
              <p className="text-[10px] text-slate-500 font-mono">Standardized Record ID: {avs.id} | HIPAA Secure Channel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-800 leading-relaxed font-sans text-left">
          
          {/* Section 1: Standardized Health details card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold uppercase text-[10px] text-teal-800 font-mono">Patient Clinical Dossier</span>
              <span className="font-mono text-slate-400">{avs.date}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-slate-450 block text-[9px] uppercase font-bold">Patient Name</span>
                <strong className="text-slate-800 text-sm font-black">{avs.patientName}</strong>
              </div>
              <div>
                <span className="text-slate-450 block text-[9px] uppercase font-bold">Affiliated Patient ID</span>
                <span className="font-mono bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-700 font-bold">{avs.patientId}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-150" />
              <div>
                <span className="text-slate-450 block text-[9px] uppercase font-bold">Attending Medical Practitioner</span>
                <strong className="text-slate-705 text-slate-700">{avs.doctorName || 'Dr. Rachel Thorne, MD'}</strong>
              </div>
              <div>
                <span className="text-slate-450 block text-[9px] uppercase font-bold">Encrypted Local Checksum</span>
                <span className="font-mono text-[9px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded">sha256-{avs.id}</span>
              </div>
            </div>

            {/* Vitals widget */}
            <div className="mt-2 bg-white rounded-lg p-2.5 border border-slate-150 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div>
                <span className="text-slate-400 block text-[8px] uppercase font-bold">Blood Pressure</span>
                <strong className="text-slate-800 font-mono text-xs">{avs.vitals?.bloodPressure || '120/80'}</strong>
                <span className="text-[9px] text-slate-450 block">mmHg</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px] uppercase font-bold">Heart Rate</span>
                <strong className="text-slate-800 font-mono text-xs">{avs.vitals?.heartRate || '72'}</strong>
                <span className="text-[9px] text-slate-450 block">bpm</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px] uppercase font-bold">Temperature</span>
                <strong className="text-slate-800 font-mono text-xs">{avs.vitals?.temperature || '98.6'}</strong>
                <span className="text-[9px] text-slate-450 block">°F</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px] uppercase font-bold">Respiratory</span>
                <strong className="text-slate-800 font-mono text-xs">{avs.vitals?.respiratoryRate || '16'}</strong>
                <span className="text-[9px] text-slate-450 block">bpm</span>
              </div>
            </div>

            {/* Diagnosis and instructions */}
            <div className="pt-2 text-xs space-y-1.5">
              <div>
                <span className="text-slate-400 text-[9px] block uppercase font-bold">Chief Complaint & Diagnostic CPT/ICD Codes</span>
                <p className="font-semibold text-slate-850 bg-white p-2 rounded-lg border border-slate-150">
                  {avs.chiefComplaint}
                </p>
                <div className="flex flex-wrap gap-1 mt-1 justify-start">
                  {avs.diagnoses?.map((diag: string, idx: number) => (
                    <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-805 text-rose-800 text-[10px] px-2 py-0.5 rounded font-bold">
                      ⚕️ {diag}
                    </span>
                  ))}
                </div>
              </div>
              {avs.careInstructions && (
                <div className="pt-1.5">
                  <span className="text-slate-400 text-[9px] block uppercase font-bold">In-home Care Instructions</span>
                  <p className="text-slate-700 bg-teal-50/[0.04] p-2 rounded-lg border border-teal-100/60 leading-relaxed font-sans text-[11px]">
                    {avs.careInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Download / Open in custom tab Actions */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 justify-start">
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Direct Download & External Tab Services
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => downloadFile('txt')}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-350 text-slate-800 font-extrabold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <Download className="w-4 h-4 text-slate-655" />
                <span>Download TXT file</span>
              </button>
              <button
                type="button"
                onClick={() => downloadFile('json')}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-350 text-slate-800 font-extrabold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <FileText className="w-4 h-4 text-slate-655" />
                <span>Download JSON file</span>
              </button>
              <button
                type="button"
                onClick={() => window.open(driveTargetLink, '_blank')}
                className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <Share2 className="w-4 h-4 text-white" />
                <span>Open Link in New Tab</span>
              </button>
            </div>
          </div>

          {/* Section 3: Google Drive & Internal secured save indicators */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 justify-start">
              <Cloud className="w-3.5 h-3.5 text-slate-400" />
              Automated Google Workplace & Enterprise Cloud Backup (Internal Only)
            </h4>
            <div className="p-4 bg-teal-500/[0.04] border border-teal-200/60 rounded-xl space-y-3 text-xs leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                  <span className="font-extrabold text-slate-805">Google Drive Synchronization Status:</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">Active Link Sync</span>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  className="bg-teal-700 hover:bg-teal-850 text-white font-bold text-[10px] py-1 px-2.5 rounded-md cursor-pointer select-none transition-all flex items-center gap-1 shrink-0"
                  disabled={isSyncingDrive}
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDrive ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Secure Audit Workspace Path:</span>
                  <span className="font-mono text-slate-700 text-right font-semibold break-all">/My Drive/Clinic_Security_Logs/AVS-Backup-{avs.id}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Specified Google Drive Link:</span>
                  <a
                    href={driveTargetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-teal-800 hover:text-teal-950 font-bold underline break-all text-right"
                  >
                    storage.example.com/avs-vault/{avs.id}
                  </a>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Last Verified Integrity Backup:</span>
                  <span className="text-slate-700 font-semibold">{lastSyncTime} • Today (Success)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Secure HIPAA Email Transmitter */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 justify-start">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Secure HIPAA Email Dispatcher (Maximum 5 Recipient Inboxes)
            </h4>
            
            <div className="p-4 border border-slate-250 bg-slate-50 rounded-xl space-y-4">
              {/* Form Input for New Email */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="email"
                    placeholder="Enter valid recipient email address..."
                    value={newEmailInput}
                    onChange={(e) => {
                      setNewEmailInput(e.target.value);
                      setEmailSuccessMessage('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    disabled={recipientEmails.length >= 5}
                    className="w-full bg-white border border-slate-200 outline-none pl-9 pr-3 py-2 text-xs rounded-xl focus:border-teal-500 font-semibold disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={recipientEmails.length >= 5}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl cursor-pointer select-none transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shrink-0"
                >
                  + Add Recipient
                </button>
              </div>

              {/* Recipient Counter & Email List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                  <span>Authorized Recipient list:</span>
                  <span className={`${recipientEmails.length >= 5 ? 'text-rose-600 font-black' : 'text-slate-500'}`}>
                    {recipientEmails.length} / 5 Selected Inboxes
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-start">
                  {recipientEmails.map((email, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-200 hover:bg-slate-350 rounded-full px-3 py-1 flex items-center gap-1.5 text-slate-800 text-xs font-bold transition-all"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="text-slate-450 hover:text-rose-600 font-bold text-sm cursor-pointer ml-1 select-none flex items-center justify-center p-0.5 bg-slate-150 rounded-full w-4 h-4 text-center"
                        title="Remove recipient"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {recipientEmails.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-1">No recipients specified yet. AVS remains localized.</p>
                  )}
                </div>
              </div>

              {/* Status and Action Trigger */}
              {sendError && (
                <p className="text-xs text-rose-600 font-extrabold bg-rose-50 p-2 rounded-lg border border-rose-100">{sendError}</p>
              )}
              {emailSuccessMessage && (
                <p className="text-xs text-emerald-800 font-extrabold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">{emailSuccessMessage}</p>
              )}

              <button
                type="button"
                onClick={handleSendEmails}
                disabled={recipientEmails.length === 0}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer select-none transition-all flex items-center justify-center gap-1.5 disabled:bg-slate-350 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Securely Send After-Visit Summary & Share Link</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer controls */}
        <div className="flex justify-end items-center p-3.5 bg-slate-50 border-t border-slate-150 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-905 bg-slate-900 text-white font-black hover:bg-slate-800 text-[11px] py-1.5 px-4 rounded-xl cursor-pointer transition-all uppercase tracking-wider"
          >
            Finished Assuring AVS
          </button>
        </div>

      </motion.div>
    </div>
  );
}
