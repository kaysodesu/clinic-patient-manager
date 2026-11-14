import React, { useState, useEffect } from 'react';
import { BRAND } from '../config/brand';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Patient, 
  Prescription, 
  Pharmacy, 
  CallLogEntry, 
  PatientSideEffectReport 
} from '../types';
import { 
  Heart, Stethoscope, Phone, Clock, MapPin, Plus, Trash2, 
  CalendarDays, AlertCircle, Info, CheckSquare, Edit, Save, 
  Search, PhoneCall, FileText, ChevronRight, AlertTriangle
} from 'lucide-react';

interface PrescriptionManagerProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  role: string;
}

const DEFAULT_PHARMACY_SARAH: Pharmacy = {
  name: "Walgreens Pharmacy #4230",
  address: "4315 SW Beaverton Hillsdale Hwy",
  city: "Portland",
  state: "OR",
  zipCode: "97221",
  phone: "(503) 555-0134",
  hours: "8:00 AM - 10:00 PM (Mon-Sun)"
};

const DEFAULT_PHARMACY_MARCUS: Pharmacy = {
  name: "CVS Pharmacy #1093",
  address: "12555 SW Canyon Rd",
  city: "Beaverton",
  state: "OR",
  zipCode: "97005",
  phone: "(503) 555-0111",
  hours: "9:00 AM - 9:00 PM (Daily)"
};

const DEFAULT_PHARMACY_ELENA: Pharmacy = {
  name: "OHSU In-Patient & Outpatient Pharmacy",
  address: "3181 SW Sam Jackson Park Rd",
  city: "Portland",
  state: "OR",
  zipCode: "97239",
  phone: "(503) 555-0123",
  hours: "24 Hours (7 Days-a-Week)"
};

const INITIAL_PRESCRIPTIONS: Prescription[] = [];

export default function PrescriptionManager({
  patients,
  selectedPatientId,
  onSelectPatient,
  role
}: PrescriptionManagerProps) {
  // Prescription database state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const saved = localStorage.getItem('clinic_prescriptions');
    return saved ? JSON.parse(saved) : INITIAL_PRESCRIPTIONS;
  });

  // Keep localStorage up to date
  useEffect(() => {
    localStorage.setItem('clinic_prescriptions', JSON.stringify(prescriptions));
  }, [prescriptions]);

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const patientPrescriptions = prescriptions.filter(rx => rx.patientId === activePatient?.id);

  // Active prescription selection state
  const [activePrescriptionId, setActivePrescriptionId] = useState<string>("");

  // Sync active prescription selection when patient changes
  useEffect(() => {
    if (patientPrescriptions.length > 0) {
      setActivePrescriptionId(patientPrescriptions[0].id);
    } else {
      setActivePrescriptionId("");
    }
  }, [selectedPatientId]);

  const selectedRx = patientPrescriptions.find(rx => rx.id === activePrescriptionId);

  // Prescription creation form state
  const [isAddingRx, setIsAddingRx] = useState(false);
  const [newRxName, setNewRxName] = useState("");
  const [newRxPronunciation, setNewRxPronunciation] = useState("");
  const [newRxDosage, setNewRxDosage] = useState("");
  const [newRxWhatItDoes, setNewRxWhatItDoes] = useState("");
  const [newRxWhatItTreats, setNewRxWhatItTreats] = useState("");
  const [newRxInstructions, setNewRxInstructions] = useState("");
  const [newRxRefillDate, setNewRxRefillDate] = useState("");
  const [newRxNextVisitDate, setNewRxNextVisitDate] = useState("");

  // Pharmacy edit state
  const [isEditingPharmacy, setIsEditingPharmacy] = useState(false);
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyAddress, setPharmacyAddress] = useState("");
  const [pharmacyCity, setPharmacyCity] = useState("");
  const [pharmacyState, setPharmacyState] = useState("");
  const [pharmacyZip, setPharmacyZip] = useState("");
  const [pharmacyPhone, setPharmacyPhone] = useState("");
  const [pharmacyHours, setPharmacyHours] = useState("");

  // Call record log form state
  const [isAddingCall, setIsAddingCall] = useState(false);
  const [callCallerRole, setCallCallerRole] = useState<'patient' | 'clinic_staff' | 'pharmacy'>('patient');
  const [callCallerName, setCallCallerName] = useState("");
  const [callSummary, setCallSummary] = useState("");
  const [callFollowUp, setCallFollowUp] = useState(false);

  // Side effects note form state
  const [isAddingSideEffect, setIsAddingSideEffect] = useState(false);
  const [seSymptom, setSeSymptom] = useState("");
  const [seSeverity, setSeSeverity] = useState<'routine' | 'urgent' | 'critical'>('routine');
  const [seNotes, setSeNotes] = useState("");
  const [seActionTaken, setSeActionTaken] = useState("");

  // Loaded severity manual visualization
  const [selectedManualSeverity, setSelectedManualSeverity] = useState<'routine' | 'urgent' | 'critical'>('routine');

  // Trigger loading values into pharmacy form
  useEffect(() => {
    if (selectedRx) {
      setPharmacyName(selectedRx.pharmacy.name);
      setPharmacyAddress(selectedRx.pharmacy.address);
      setPharmacyCity(selectedRx.pharmacy.city);
      setPharmacyState(selectedRx.pharmacy.state);
      setPharmacyZip(selectedRx.pharmacy.zipCode);
      setPharmacyPhone(selectedRx.pharmacy.phone);
      setPharmacyHours(selectedRx.pharmacy.hours);
    }
  }, [activePrescriptionId]);

  // Handle saving clinical pharmacy update
  const savePharmacyUpdate = () => {
    if (!selectedRx) return;
    const updatedPharmacy: Pharmacy = {
      name: pharmacyName,
      address: pharmacyAddress,
      city: pharmacyCity,
      state: pharmacyState,
      zipCode: pharmacyZip,
      phone: pharmacyPhone,
      hours: pharmacyHours
    };

    setPrescriptions(prevRxes => prevRxes.map(r => {
      if (r.id === selectedRx.id) {
        return { ...r, pharmacy: updatedPharmacy };
      }
      return r;
    }));

    setIsEditingPharmacy(false);
  };

  // Add customized prescription
  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRxName || !newRxDosage) {
      alert("Please provide at least a medication name and dosage instruction.");
      return;
    }

    const created: Prescription = {
      id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: activePatient.id,
      name: newRxName,
      pronunciation: newRxPronunciation || newRxName,
      dosage: newRxDosage,
      whatItDoes: newRxWhatItDoes || "Inhibits symptom progression.",
      whatItTreats: newRxWhatItTreats || "Specified medical conditions.",
      instructions: newRxInstructions || "Take as directed by your physician.",
      refillDate: newRxRefillDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextVisitDate: newRxNextVisitDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pharmacy: selectedRx?.pharmacy || {
        name: "General Campus Pharmacy",
        address: "710 Commons Way",
        city: "Portland",
        state: "OR",
        zipCode: "97201",
        phone: "(503) 555-0199",
        hours: "9:00 AM - 6:00 PM (Mon-Fri)"
      },
      callLogs: [],
      sideEffectNotes: []
    };

    setPrescriptions(prev => [...prev, created]);
    setActivePrescriptionId(created.id);
    setIsAddingRx(false);
    
    // Clear form
    setNewRxName("");
    setNewRxPronunciation("");
    setNewRxDosage("");
    setNewRxWhatItDoes("");
    setNewRxWhatItTreats("");
    setNewRxInstructions("");
    setNewRxRefillDate("");
    setNewRxNextVisitDate("");
  };

  // Delete specific prescription
  const handleDeletePrescription = (rxId: string) => {
    if (!confirm("Are you sure you would like to delete this prescription allocation?")) return;
    setPrescriptions(prev => prev.filter(r => r.id !== rxId));
    setActivePrescriptionId("");
  };

  // Add Call record
  const handleAddCallLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRx || !callSummary || !callCallerName) return;

    const newCall: CallLogEntry = {
      id: `CL-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      callerRole: callCallerRole,
      callerName: callCallerName,
      summary: callSummary,
      followUpRequired: callFollowUp
    };

    setPrescriptions(prev => prev.map(r => {
      if (r.id === selectedRx.id) {
        return {
          ...r,
          callLogs: [newCall, ...r.callLogs]
        };
      }
      return r;
    }));

    // Clear and close
    setCallCallerName("");
    setCallSummary("");
    setCallFollowUp(false);
    setIsAddingCall(false);
  };

  // Add Side Effect Note
  const handleAddSideEffectReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRx || !seSymptom || !seNotes) return;

    const newReport: PatientSideEffectReport = {
      id: `SE-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      symptomName: seSymptom,
      reportedSeverity: seSeverity,
      notes: seNotes,
      actionTaken: seActionTaken || "Instructed to monitor condition carefully."
    };

    setPrescriptions(prev => prev.map(r => {
      if (r.id === selectedRx.id) {
        return {
          ...r,
          sideEffectNotes: [newReport, ...r.sideEffectNotes]
        };
      }
      return r;
    }));

    // Alert or preset manual view automatically matching the reported severity
    setSelectedManualSeverity(seSeverity);

    // Clear and close
    setSeSymptom("");
    setSeNotes("");
    setSeActionTaken("");
    setIsAddingSideEffect(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="prescription-tab-frame">
      {/* LEFT COLUMN: Medication Index & Patient Context Summary */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Patient Quick Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-550/20 flex items-center justify-center border border-teal-500/20 text-teal-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-teal-400 font-mono font-black">ACTIVE DOSSIER PROFILE</span>
              <h3 className="text-sm font-bold truncate">{activePatient?.personalInfo?.firstName || ''} {activePatient?.personalInfo?.lastName || ''}</h3>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Patient Identifier:</span>
              <strong className="text-slate-100 font-mono text-[11px]">{activePatient?.id}</strong>
            </div>
            <div className="flex justify-between">
              <span>Date of Birth:</span>
              <span className="text-slate-200">{activePatient?.personalInfo?.dateOfBirth || 'N/A'} ({activePatient?.personalInfo?.gender || 'N/A'})</span>
            </div>
            <div className="flex justify-between">
              <span>Primary Symptoms:</span>
              <span className="text-slate-200 truncate max-w-[200px]">{activePatient?.currentVisit.symptoms}</span>
            </div>
          </div>

          {/* Quick select patient switcher */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1.5">Switch Patient Dossier</label>
            <select
              value={selectedPatientId}
              onChange={(e) => onSelectPatient(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-teal-500 outline-none"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.personalInfo.firstName} {p.personalInfo.lastName} ({p.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prescription Inventory Directory */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-teal-600 rounded-sm inline-block"></span>
              Medications Checklist
            </h3>
            <button
              onClick={() => setIsAddingRx(true)}
              className="text-xs bg-teal-550 hover:bg-teal-600 text-white font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Rx</span>
            </button>
          </div>

          {/* List of Medications */}
          {patientPrescriptions.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Info className="w-7 h-7 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No active allocations</p>
              <p className="text-[11px] text-slate-450 mt-1">There are currently no prescriptions logged for this patient profile.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {patientPrescriptions.map(rx => {
                const isActive = rx.id === activePrescriptionId;
                return (
                  <div
                    key={rx.id}
                    onClick={() => {
                      setActivePrescriptionId(rx.id);
                      setIsEditingPharmacy(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isActive 
                        ? 'bg-teal-50/50 border-teal-550/70 shadow-3xs' 
                        : 'bg-white border-slate-150 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{rx.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400 italic">/{rx.pronunciation}/</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-250">
                        {rx.dosage.includes("mg") ? rx.dosage.split(" ")[0] + " " + rx.dosage.split(" ")[1] : "Active"}
                      </span>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{rx.dosage}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-350 transition-transform ${isActive ? 'translate-x-1 text-teal-600' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Prescription Workspace & Clinical Context */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Prescription Allocation Creation Modal/Pane */}
        <AnimatePresence>
          {isAddingRx && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-teal-950 border border-teal-800 rounded-2xl p-6 text-white"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-bold text-teal-300">Prescribe New Patient Medication</h3>
                  <p className="text-xs text-teal-400/80">Authorize and log a new pharmaceutical ledger for {activePatient?.personalInfo?.firstName || ''} {activePatient?.personalInfo?.lastName || ''}.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingRx(false)}
                  className="bg-teal-900/40 hover:bg-teal-850 p-1.5 rounded-lg text-teal-400 transition-colors"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreatePrescription} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-teal-200 mb-1">Medication Name *</label>
                    <input
                      type="text"
                      required
                      value={newRxName}
                      onChange={e => setNewRxName(e.target.value)}
                      placeholder="e.g., Lisinopril, Metformin"
                      className="w-full bg-teal-900/50 border border-teal-850 rounded-lg px-3 py-2 text-sm text-teal-100 placeholder-teal-500/80 focus:ring-1 focus:ring-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-200 mb-1">Pronunciation Guide</label>
                    <input
                      type="text"
                      value={newRxPronunciation}
                      onChange={e => setNewRxPronunciation(e.target.value)}
                      placeholder="e.g., lyse-IN-oh-pril"
                      className="w-full bg-teal-900/50 border border-teal-850 rounded-lg px-3 py-2 text-sm text-teal-100 placeholder-teal-500/80 focus:ring-1 focus:ring-teal-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-teal-200 mb-1">Dosage & Frequency *</label>
                    <input
                      type="text"
                      required
                      value={newRxDosage}
                      onChange={e => setNewRxDosage(e.target.value)}
                      placeholder="e.g., 10 mg daily, 500 mg BID"
                      className="w-full bg-teal-900/50 border border-teal-850 rounded-lg px-3 py-2 text-sm text-teal-100 placeholder-teal-500/80 focus:ring-1 focus:ring-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-200 mb-1">Active Refill Reminder Date</label>
                    <input
                      type="date"
                      value={newRxRefillDate}
                      onChange={e => setNewRxRefillDate(e.target.value)}
                      className="w-full bg-teal-900/50 border border-teal-850 rounded-lg px-3 py-2 text-sm text-teal-100 focus:ring-1 focus:ring-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-200 mb-1">Next Clinic Visit Appointment</label>
                    <input
                      type="date"
                      value={newRxNextVisitDate}
                      onChange={e => setNewRxNextVisitDate(e.target.value)}
                      className="w-full bg-teal-900/50 border border-teal-850 rounded-lg px-3 py-2 text-sm text-teal-100 focus:ring-1 focus:ring-teal-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-teal-200 mb-1">What It Does (Mechanism)</label>
                    <input
                      type="text"
                      value={newRxWhatItDoes}
                      onChange={e => setNewRxWhatItDoes(e.target.value)}
                      placeholder="e.g., relaxes smooth muscles surrounding vascular beds"
                      className="w-full bg-teal-900/50 border border-teal-850 rounded-lg px-3 py-2 text-sm text-teal-100 placeholder-teal-500/80 focus:ring-1 focus:ring-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-teal-200 mb-1">Indications (What It Treats)</label>
                    <input
                      type="text"
                      value={newRxWhatItTreats}
                      onChange={e => setNewRxWhatItTreats(e.target.value)}
                      placeholder="e.g., severe localized hypertension"
                      className="w-full bg-teal-900/50 border border-teal-850 rounded-lg px-3 py-2 text-sm text-teal-100 placeholder-teal-500/80 focus:ring-1 focus:ring-teal-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-teal-200 mb-1">Patient Usage Instructions (Detailed)</label>
                  <textarea
                    rows={2}
                    value={newRxInstructions}
                    onChange={e => setNewRxInstructions(e.target.value)}
                    placeholder="e.g., Swallow whole with standard fluids. Do not break or chew. Document weekly pressure counts..."
                    className="w-full bg-teal-900/50 border border-teal-850 rounded-lg px-3 py-2 text-sm text-teal-100 placeholder-teal-500/80 focus:ring-1 focus:ring-teal-400 outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingRx(false)}
                    className="border border-teal-800 hover:bg-teal-900 text-teal-300 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Dismiss Form
                  </button>
                  <button
                    type="submit"
                    className="bg-teal-550 hover:bg-teal-500 text-white font-bold py-2 px-5 rounded-xl text-xs cursor-pointer transition-all"
                  >
                    Commit Active Authorization
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WORKSPACE DETAILED WORKSPACE PANEL */}
        {!selectedRx ? (
          <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center shadow-xs">
            <Stethoscope className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-850">Individual Prescription Worksheet</h4>
            <p className="text-xs text-slate-450 mt-1.5 max-w-md mx-auto">
              Please select an active drug allocation from the inventory ledger on the left to review instructions, manage pharmacy updates, trace client calls, and track side effects.
            </p>
            {patientPrescriptions.length > 0 && (
              <button
                onClick={() => setActivePrescriptionId(patientPrescriptions[0].id)}
                className="mt-4 bg-teal-550 hover:bg-teal-600 font-bold text-xs text-white px-4 py-2 rounded-xl transition-all"
              >
                Inspect Default Allocation: {patientPrescriptions[0].name}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. COMPREHENSIBLE PHARMACEUTICAL FACT SHEET CARD */}
            <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase font-mono px-2 py-0.5 bg-teal-550 text-white rounded">
                      ACTIVE RX ALIAS
                    </span>
                    <span className="text-[11px] font-mono text-teal-400">ID: {selectedRx.id}</span>
                  </div>
                  <h3 className="text-base font-extrabold tracking-tight mt-1">
                    {selectedRx.name}{" "}
                    <span className="text-slate-400 font-normal font-sans italic text-xs">
                      (pronounced <strong className="text-teal-300 font-mono">/{selectedRx.pronunciation}/</strong>)
                    </span>
                  </h3>
                </div>
                
                <button
                  onClick={() => handleDeletePrescription(selectedRx.id)}
                  className="bg-slate-800 hover:bg-rose-950 p-2 rounded-xl text-slate-400 hover:text-rose-400 border border-slate-750 transition-colors cursor-pointer"
                  title="Revoke Prescription"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* 2x2 Grid for Drug Properties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-0.5">MECHANISM OF ACTION (WHAT IT DOES)</span>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">{selectedRx.whatItDoes}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block mb-0.5">THERAPEUTIC INDICATIONS (WHAT IT TREATS)</span>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">{selectedRx.whatItTreats}</p>
                  </div>
                </div>

                {/* Instructions Box */}
                <div className="bg-teal-50/40 p-4 rounded-xl border border-teal-150/60">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-teal-700 block mb-1">CLINICAL SIGNATURE & COMPREHENSIBLE USAGE MANUAL</span>
                  <p className="text-xs font-bold text-slate-750 leading-relaxed">{selectedRx.instructions}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-teal-600 font-semibold bg-white/70 py-1.5 px-2.5 rounded-lg border border-teal-150 w-fit">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Dosage Rate: <strong className="text-slate-800">{selectedRx.dosage}</strong></span>
                  </div>
                </div>

                {/* REMINDERS BAR (Refills & Scheduling) */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between text-left">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700 border border-teal-150">
                      <CalendarDays className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Critical Medication Management Dates:</h4>
                      <div className="flex flex-wrap gap-4 mt-1 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          Refill Reminder Date: 
                          <strong className="text-amber-600 font-mono">{selectedRx.refillDate}</strong>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1">
                          Recommended Visit Appointment: 
                          <strong className="text-teal-600 font-mono">{selectedRx.nextVisitDate}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => alert(`⏰ Refill directive initiated with chosen pharmacy: ${selectedRx.pharmacy.name}. Patient notified via SMS.`)}
                      className="bg-teal-555 hover:bg-teal-650 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg border border-teal-650 tracking-wider inline-block cursor-pointer"
                    >
                      Trigger Refill Alert
                    </button>
                    <button
                      onClick={() => alert(`📅 Outpatient checkup request added to schedule pipeline for ${selectedRx.nextVisitDate}.`)}
                      className="bg-slate-800 hover:bg-slate-850 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg border border-slate-700 tracking-wider inline-block cursor-pointer"
                    >
                      Schedule Visit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. DYNAMIC PHARMACY ROUTING CARD (CAN BE UPDATED AS NEEDED) */}
            <div className="bg-white border border-slate-150 rounded-2xl shadow-xs p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Primary Dispensary Router ({selectedRx.name})
                </h3>
                {!isEditingPharmacy ? (
                  <button
                    onClick={() => {
                      setIsEditingPharmacy(true);
                      // load values
                      setPharmacyName(selectedRx.pharmacy.name);
                      setPharmacyAddress(selectedRx.pharmacy.address);
                      setPharmacyCity(selectedRx.pharmacy.city);
                      setPharmacyState(selectedRx.pharmacy.state);
                      setPharmacyZip(selectedRx.pharmacy.zipCode);
                      setPharmacyPhone(selectedRx.pharmacy.phone);
                      setPharmacyHours(selectedRx.pharmacy.hours);
                    }}
                    className="text-xs text-teal-600 hover:bg-teal-50 font-bold px-3 py-1.5 rounded-lg border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Change Pharmacy</span>
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setIsEditingPharmacy(false)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={savePharmacyUpdate}
                      className="text-xs bg-teal-550 hover:bg-teal-600 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Config</span>
                    </button>
                  </div>
                )}
              </div>

              {!isEditingPharmacy ? (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-450 uppercase block font-semibold mb-0.5">Dispensary Title</span>
                    <strong className="text-slate-800 block text-sm">{selectedRx.pharmacy.name}</strong>
                    <span className="text-[11px] text-slate-500 font-mono mt-1 block">Phone: {selectedRx.pharmacy.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 uppercase block font-semibold mb-0.5">Dispensary Address</span>
                    <address className="text-slate-600 not-italic block">{selectedRx.pharmacy.address}</address>
                    <span className="text-slate-600 block">{selectedRx.pharmacy.city}, {selectedRx.pharmacy.state} {selectedRx.pharmacy.zipCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-450 uppercase block font-semibold mb-0.5">Operating Schedule</span>
                    <div className="flex items-center gap-1 text-slate-650 font-mono font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedRx.pharmacy.hours}</span>
                    </div>
                    <span className="text-[10px] text-teal-650 bg-teal-50 border border-teal-100 font-semibold px-2 py-0.5 rounded block w-fit mt-2">
                      Routing Status: Sync Active
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-teal-50/20 border border-teal-200/50 p-4 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Dispensary Title</label>
                      <input
                        type="text"
                        value={pharmacyName}
                        onChange={e => setPharmacyName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 focus:ring-1 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Phone Number</label>
                      <input
                        type="text"
                        value={pharmacyPhone}
                        onChange={e => setPharmacyPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 focus:ring-1 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Street Address</label>
                      <input
                        type="text"
                        value={pharmacyAddress}
                        onChange={e => setPharmacyAddress(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 focus:ring-1 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">City</label>
                      <input
                        type="text"
                        value={pharmacyCity}
                        onChange={e => setPharmacyCity(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 focus:ring-1 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">State</label>
                        <input
                          type="text"
                          value={pharmacyState}
                          onChange={e => setPharmacyState(e.target.value)}
                          maxLength={2}
                          className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-xs text-center text-slate-750 focus:ring-1 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Zip</label>
                        <input
                          type="text"
                          value={pharmacyZip}
                          onChange={e => setPharmacyZip(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-xs text-center text-slate-750 focus:ring-1 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Hours of Operation</label>
                    <input
                      type="text"
                      value={pharmacyHours}
                      onChange={e => setPharmacyHours(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. SIDE EFFECTS, LOGBOOK & THE SEVERITY EMERGENCY REFERENCE MANUAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Patient Side Effects Logger */}
              <div className="bg-white border border-slate-150 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      Patient side effect Log
                    </h3>
                    <button
                      onClick={() => setIsAddingSideEffect(prev => !prev)}
                      className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold py-1 px-2.5 rounded-lg border border-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Note</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {isAddingSideEffect && (
                      <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddSideEffectReport} 
                        className="bg-rose-50/40 border border-rose-100 p-3 rounded-xl mb-4 text-xs space-y-3 overflow-hidden"
                      >
                        <div>
                          <label className="block text-[10px] font-bold text-rose-800 mb-0.5">Symptom / Side-Effect *</label>
                          <input
                            type="text"
                            required
                            value={seSymptom}
                            onChange={e => setSeSymptom(e.target.value)}
                            placeholder="e.g., Stomach cramps, dry mouth, mild itchiness"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 outline-none focus:ring-1 focus:ring-rose-450"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-rose-800 mb-0.5">Reported Severity</label>
                            <select
                              value={seSeverity}
                              onChange={e => setSeSeverity(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-750 outline-none"
                            >
                              <option value="routine">Routine (Low)</option>
                              <option value="urgent">Urgent (Medium)</option>
                              <option value="critical">Critical (High)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-rose-800 mb-0.5">Action Plan / Taken</label>
                            <input
                              type="text"
                              value={seActionTaken}
                              onChange={e => setSeActionTaken(e.target.value)}
                              placeholder="e.g. Advised hydration, checkup booked"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 outline-none focus:ring-1 focus:ring-rose-450"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-rose-800 mb-0.5">Observation Notes</label>
                          <textarea
                            rows={2}
                            required
                            value={seNotes}
                            onChange={e => setSeNotes(e.target.value)}
                            placeholder="Describe what the patient experiencing..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 outline-none resize-none focus:ring-1 focus:ring-rose-450"
                          ></textarea>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingSideEffect(false)}
                            className="px-2 py-1 bg-slate-200 text-slate-600 font-bold rounded"
                          >
                            Dismiss
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1 bg-rose-600 hover:bg-rose-700 font-bold rounded text-white"
                          >
                            Add to Log
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Logbook Items */}
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {selectedRx.sideEffectNotes.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs">
                        No adverse occurrences noted.
                      </div>
                    ) : (
                      selectedRx.sideEffectNotes.map(item => (
                        <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs text-left">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-extrabold text-slate-800">{item.symptomName}</span>
                            <span className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded font-black border ${
                              item.reportedSeverity === 'critical' 
                                ? 'bg-red-50 text-red-600 border-red-200' 
                                : item.reportedSeverity === 'urgent'
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-blue-50 text-blue-600 border-blue-250'
                            }`}>
                              {item.reportedSeverity}
                            </span>
                          </div>
                          
                          <p className="text-slate-600 italic">"{item.notes}"</p>
                          
                          <div className="mt-2 pt-2 border-t border-slate-200/60 leading-relaxed text-[11px] text-slate-500">
                            <strong>Action:</strong> {item.actionTaken}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400 font-mono">
                            Logged: {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 mt-4 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Clinical safety checks are logged directly to ledger.</span>
                </div>
              </div>

              {/* Patient Response Severity Manual Guide */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-white flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2 mb-3">
                    <Stethoscope className="w-4 h-4 text-teal-400" />
                    Clinical Side-Effect Severity Manual
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Reference framework for care-coordinators to advice patients reporting medical impacts based on urgency:
                  </p>

                  {/* Segmented Severity Selectors */}
                  <div className="flex bg-slate-950 p-1.5 rounded-xl gap-1.5 mb-4">
                    {(['routine', 'urgent', 'critical'] as const).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSelectedManualSeverity(sev)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          selectedManualSeverity === sev
                            ? sev === 'critical'
                              ? 'bg-rose-750 text-white border border-rose-600/50'
                              : sev === 'urgent'
                              ? 'bg-amber-600 text-slate-950 font-black'
                              : 'bg-teal-600 text-white'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>

                  {/* Manual Instruction Output block */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                    {selectedManualSeverity === 'routine' && (
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-1.5 text-teal-400">
                          <Info className="w-4 h-4 shrink-0" />
                          <h4 className="font-bold uppercase tracking-wider">Routine Impact Protocol</h4>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-350">
                          <li>Instruct client to continue medication as prescribed.</li>
                          <li>Recommend hydrating, taking the medication with simple side-course foods, or slight rest.</li>
                          <li>Establish logs to note patterns or frequency.</li>
                          <li>Review the symptom timeline during the next standard clinical out-patient session.</li>
                        </ul>
                      </div>
                    )}

                    {selectedManualSeverity === 'urgent' && (
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <h4 className="font-bold uppercase tracking-wider">Urgent Intervention Directive</h4>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-350">
                          <li>Advise patient to briefly space or hold the dosing pending a clinic recall if symptoms interfere with comfort.</li>
                          <li>Promptly alert the presiding doctor or call the triage shift director directly.</li>
                          <li>Book an outpatient telehealth review within the next 24 to 48 hours.</li>
                          <li>Instruct client to refrain from heavy engineering activities or driving.</li>
                        </ul>
                      </div>
                    )}

                    {selectedManualSeverity === 'critical' && (
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-1.5 text-rose-500 font-extrabold animate-pulse">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <h4 className="font-black uppercase tracking-wider">CRITICAL EMERGENCY PROTOCOL</h4>
                        </div>
                        <ul className="list-disc pl-4 space-y-1.5 text-rose-200">
                          <li><strong>IMMEDIATELY TERMINATE ALL MEDICATION DOSAGES.</strong></li>
                          <li>Dispatch patient directly to the nearest Emergency Department or dial Emergency Services (911) instantly.</li>
                          <li>Guide companion to watch for airway swelling, shortness of breath, profound vertigo, or sudden hives.</li>
                          <li>Trigger clinic incident telemetry reports of drug allergic anaphylaxis once safe.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-[10px] text-slate-500 font-mono text-center">
                  Emergency Manual Framework Ver. 4.9.1 • {BRAND.facilityName}
                </div>
              </div>

            </div>

            {/* 4. CLINIC COMMUNICATIONS DISPATCH SHEET (CALL LOG) */}
            <div className="bg-white border border-slate-150 rounded-2xl shadow-xs p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-teal-600" />
                    Medication Communication Call Logs
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Logs of communication involving the patient, prescribing staff, and dispensing pharmacist.</p>
                </div>
                <button
                  onClick={() => setIsAddingCall(prev => !prev)}
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Call</span>
                </button>
              </div>

              <AnimatePresence>
                {isAddingCall && (
                  <motion.form 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    onSubmit={handleAddCallLog}
                    className="p-4 bg-slate-50 rounded-xl mb-4 border border-slate-150 text-xs space-y-3"
                  >
                    <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wide text-left">Record Telephone Conversation Context</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Caller Designation</label>
                        <select
                          value={callCallerRole}
                          onChange={e => setCallCallerRole(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-750 outline-none"
                        >
                          <option value="patient">Patient Client</option>
                          <option value="clinic_staff">Clinic Care Coordinator</option>
                          <option value="pharmacy">Pharmacist / Dispensary</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Speaker Full Name *</label>
                        <input
                          type="text"
                          required
                          value={callCallerName}
                          onChange={e => setCallCallerName(e.target.value)}
                          placeholder="e.g. Pharmacist Tom Green"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-slate-650 font-bold select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={callFollowUp}
                            onChange={e => setCallFollowUp(e.target.checked)}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-400 border-slate-350 outline-none"
                          />
                          <span>Requires Clinical Follow-Up</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Conversed Consultation Summary *</label>
                      <textarea
                        rows={2}
                        required
                        value={callSummary}
                        onChange={e => setCallSummary(e.target.value)}
                        placeholder="Provide details regarding the drug, dosage concerns, refill claims, or side-effect questions..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 outline-none resize-none focus:ring-1 focus:ring-teal-500"
                      ></textarea>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingCall(false)}
                        className="px-2.5 py-1.5 bg-slate-200 text-slate-600 font-bold rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-teal-550 hover:bg-teal-600 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Save Record to Timeline
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Calls Timeline */}
              <div className="divide-y divide-slate-100 max-h-[180px] overflow-y-auto pr-1">
                {selectedRx.callLogs.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs">
                    No calls recorded for this medication cycle.
                  </div>
                ) : (
                  selectedRx.callLogs.map(log => (
                    <div key={log.id} className="py-2.5 text-left text-xs">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-black border ${
                            log.callerRole === 'patient' 
                              ? 'bg-blue-50 text-blue-600 border-blue-200' 
                              : log.callerRole === 'pharmacy'
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-teal-50 text-teal-600 border-teal-200'
                          }`}>
                            {log.callerRole === 'patient' ? 'Patient' : log.callerRole === 'pharmacy' ? 'Dispensary' : 'Staff'}
                          </span>
                          <strong className="text-slate-800 text-xs">{log.callerName}</strong>
                          <span className="text-[10px] text-slate-400">({new Date(log.timestamp).toLocaleString()})</span>
                        </div>

                        {log.followUpRequired && (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-650 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded animate-pulse">
                            ⚠️ ACTION REQUIRED
                          </span>
                        )}
                      </div>

                      <p className="text-slate-600 mt-1 pl-1 leading-relaxed">"{log.summary}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
