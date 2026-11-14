import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { 
  Users, Search, Shield, Activity, Calendar, MapPin, Briefcase, FileText, 
  Heart, AlertTriangle, CheckCircle, ChevronDown, Clock, UserPlus, PhoneIncoming, FlaskConical 
} from 'lucide-react';

interface PatientsDatabaseProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onUpdateStatus: (patientId: string, status: Patient['status']) => void;
  onAddNote: (patientId: string, note: string) => void;
  onInitiateIntake: () => void;
  onLoadTestPatients?: () => void;
  selectedPatientId?: string;
}

export default function PatientsDatabase({ 
  patients, 
  onSelectPatient, 
  onUpdateStatus, 
  onAddNote,
  onInitiateIntake,
  onLoadTestPatients,
  selectedPatientId
}: PatientsDatabaseProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedDbPatientId, setSelectedDbPatientId] = useState<string>(selectedPatientId || patients[0]?.id || '');
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    if (selectedPatientId) {
      setSelectedDbPatientId(selectedPatientId);
    }
  }, [selectedPatientId]);

  const activeReviewPatient = patients.find(p => p.id === selectedDbPatientId) || patients[0];

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.personalInfo.firstName} ${p.personalInfo.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleNoteSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activeReviewPatient) return;
    onAddNote(activeReviewPatient.id, newNoteText.trim());
    setNewNoteText('');
  };

  const getStatusBadge = (status: Patient['status']) => {
    const classes = {
      'In Processing': 'bg-blue-50 text-blue-700 border-blue-150',
      'Triage': 'bg-amber-50 text-amber-700 border-amber-150',
      'With Doctor': 'bg-purple-50 text-purple-700 border-purple-150',
      'Discharged': 'bg-slate-100 text-slate-700 border-slate-205'
    };
    return (
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${classes[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      
      {/* Left Column: Patient List Index */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-150 shadow-xs flex flex-col h-[650px] overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-150 space-y-3 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              Patient Records ({filteredPatients.length})
            </h3>
            <div className="flex items-center gap-1.5">
            {onLoadTestPatients && (
              <button
                type="button"
                id="load-test-patients-btn"
                onClick={onLoadTestPatients}
                title="Add the 5 fictional beta test patients (skips any already loaded)"
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <FlaskConical className="w-3 h-3" />
                Load Test Patients
              </button>
            )}
            <button
              type="button"
              onClick={onInitiateIntake}
              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3 h-3" />
              New Intake
            </button>
            </div>
          </div>

          <div className="space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search patient name, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-250 rounded-lg text-xs"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-255 rounded-lg text-xs bg-white"
            >
              <option value="All">All Intake States</option>
              <option value="In Processing">In Processing</option>
              <option value="Triage">Triage</option>
              <option value="With Doctor">With Doctor</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>
        </div>

        {/* Patient catalog listing */}
        <div className="divide-y divide-slate-100 overflow-y-auto flex-1 select-none">
          {filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 py-12">
              <p className="text-xs font-semibold">No medical ledger results found.</p>
            </div>
          ) : (
            filteredPatients.map(p => {
              const isSelected = selectedDbPatientId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedDbPatientId(p.id)}
                  className={`p-4 hover:bg-slate-50/60 transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected ? 'bg-teal-50/20 border-r-3 border-teal-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {p.personalInfo.firstName} {p.personalInfo.lastName}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 font-bold block mt-0.5">{p.id}</span>
                    </div>
                    {getStatusBadge(p.status)}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans">
                    <span>Dept: {p.currentVisit.department}</span>
                    <span className="font-mono text-slate-450">{p.dateAdmitted}</span>
                  </div>
                  
                  {p.currentVisit.severity === 'Severe' && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[9px] px-2 py-0.5 rounded font-bold flex items-center gap-1 self-start">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Critical Symptoms
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right 2 Columns: Full Bento Patient Record dossier */}
      <div className="lg:col-span-2 space-y-5">
        {activeReviewPatient ? (
          <div className="space-y-5">
            
            {/* Header / Workflow controls */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-base shrink-0">
                  {activeReviewPatient.personalInfo.firstName[0]}{activeReviewPatient.personalInfo.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 leading-none">
                      {activeReviewPatient.personalInfo.firstName} {activeReviewPatient.personalInfo.lastName}
                    </h2>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-semibold">{activeReviewPatient.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Admitted: {activeReviewPatient.dateAdmitted} | Age/DoB: {activeReviewPatient.personalInfo.dateOfBirth}</p>
                </div>
              </div>

              {/* Status workflow dropdown */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Intake State:</span>
                <select
                  value={activeReviewPatient.status}
                  onChange={e => onUpdateStatus(activeReviewPatient.id, e.target.value as any)}
                  className="text-xs font-bold border-none bg-transparent focus:ring-0 text-slate-800 cursor-pointer focus:outline-none"
                >
                  <option value="In Processing">In Processing</option>
                  <option value="Triage">Triage Room</option>
                  <option value="With Doctor">With Attending Doctor</option>
                  <option value="Discharged">Discharged Ledger</option>
                </select>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Personal Dossier */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">1. Identification & Contact</h3>
                </div>
                <div className="text-xs space-y-2 font-sans text-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Phone Number</span>
                      <strong>{activeReviewPatient.personalInfo.phone}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Email Address</span>
                      <strong className="truncate block">{activeReviewPatient.personalInfo.email}</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Biological Gender</span>
                      <strong>{activeReviewPatient.personalInfo.gender}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Residential Area</span>
                      <strong>{activeReviewPatient.personalInfo.city}, {activeReviewPatient.personalInfo.state}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Prescribed Mail Address</span>
                    <span className="text-slate-800">{activeReviewPatient.personalInfo.address}, {activeReviewPatient.personalInfo.zipCode}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Employment & Emergency Contact */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Career & Safety Liaison</h3>
                </div>
                <div className="text-xs space-y-2.5 font-sans text-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Employer</span>
                      <strong>{activeReviewPatient.employmentCoverage.employerName || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Occupation</span>
                      <strong>{activeReviewPatient.employmentCoverage.occupation || 'N/A'}</strong>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    <span className="text-[9px] text-rose-700 uppercase font-bold block mb-1">Emergency Contact liaison</span>
                    <div className="flex justify-between font-medium">
                      <strong>{activeReviewPatient.emergencyContact.fullName}</strong>
                      <span className="text-[11px] text-slate-500">[{activeReviewPatient.emergencyContact.relationship}]</span>
                    </div>
                    <span className="text-[10px] font-mono block mt-1 text-slate-700">Phone: {activeReviewPatient.emergencyContact.phone}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Medical Baseline History */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                  <Heart className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">3. Habits & Genetic Predispositions</h3>
                </div>
                <div className="text-xs space-y-2 font-sans text-slate-700">
                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase">Nicotine</span>
                      <strong className="block text-slate-800 font-medium truncate">{activeReviewPatient.medicalHistory.smokerStatus}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase">Alcohol</span>
                      <strong className="block text-slate-800 font-medium truncate">{activeReviewPatient.medicalHistory.alcoholConsumption}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase">Exercise</span>
                      <strong className="block text-slate-800 font-medium truncate">{activeReviewPatient.medicalHistory.exerciseFrequency}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Hereditary Family Traits</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeReviewPatient.medicalHistory.familyHistory.map(f => (
                        <span key={f} className="text-[9px] bg-slate-900 text-teal-300 font-mono px-1.5 py-0.5 rounded font-bold">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Pre-surgeries</span>
                    <span className="text-slate-850 font-medium">{activeReviewPatient.medicalHistory.pastSurgeries || 'None declared'}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Detailed Medical Questionnaire Declarations */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">4. Condition & Medication Screening</h3>
                </div>
                <div className="text-xs space-y-2 font-sans text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Chronic Diseases Screened</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeReviewPatient.medicalQuestionnaire.chronicConditions.map(c => (
                        <span key={c} className="text-[9px] bg-teal-50 text-teal-850 border border-teal-150 px-1.5 py-0.5 rounded font-mono font-semibold">{c}</span>
                      ))}
                      {activeReviewPatient.medicalQuestionnaire.otherChronicConditions && (
                        <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">Other: {activeReviewPatient.medicalQuestionnaire.otherChronicConditions}</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                    <div className="bg-rose-50/50 p-2 rounded border border-rose-100">
                      <span className="text-[9px] text-rose-700 uppercase font-bold block">Allergies Declared</span>
                      <strong className="text-rose-900 text-[11px] leading-tight block">{activeReviewPatient.medicalQuestionnaire.allergies}</strong>
                    </div>
                    <div className="bg-teal-50/50 p-2 rounded border border-teal-100">
                      <span className="text-[9px] text-teal-700 uppercase font-bold block">Active Rx Prescriptions</span>
                      <strong className="text-teal-900 text-[11px] leading-tight block">{activeReviewPatient.medicalQuestionnaire.prescriptions}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Over the counter medicine (OTC) & Supplements</span>
                    <span className="text-slate-800 italic">{activeReviewPatient.medicalQuestionnaire.overTheCounter}</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Ingress Assessment / Symptoms details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs md:col-span-2 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <PhoneIncoming className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">5. Outpatient Presentation & Symptom Duration</h3>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    activeReviewPatient.currentVisit.severity === 'Severe' ? 'bg-rose-100 text-rose-850' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {activeReviewPatient.currentVisit.severity} Pain
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1 border-r border-slate-100 pr-2">
                    <span className="text-[9px] text-slate-400 uppercase">Routing Specialty</span>
                    <strong className="block text-xs text-slate-800">{activeReviewPatient.currentVisit.department}</strong>
                    <span className="text-[9px] text-slate-400 uppercase block mt-2.5">Symptom Duration</span>
                    <strong className="block text-xs text-slate-800">{activeReviewPatient.currentVisit.duration}</strong>
                  </div>
                  <div className="md:col-span-2 bg-amber-50/20 p-3 rounded-xl border border-amber-100/50">
                    <span className="text-[9px] text-amber-800 uppercase font-extrabold block mb-1">Stated Clinical Presentation / Symptoms</span>
                    <p className="text-xs text-slate-800 font-sans leading-relaxed">
                      "{activeReviewPatient.currentVisit.symptoms}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 6: Insurance Deductible and Billing Details */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-slate-350 md:col-span-2 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
                  <Shield className="w-4 h-4 text-teal-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">6. Carrier Coverage Ledger & Fixed Copays</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Carrier</span>
                    <strong className="text-white truncate block">{activeReviewPatient.insuranceBilling.providerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Annual Deductible</span>
                    <strong className="text-white font-mono">${activeReviewPatient.insuranceBilling.individualDeductible}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Deductible Met</span>
                    <strong className="text-white font-mono">${activeReviewPatient.insuranceBilling.deductibleMet}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned Copay</span>
                    <strong className="text-teal-400 font-mono text-sm">${activeReviewPatient.insuranceBilling.copayAmount} out-of-pocket</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Note filing console */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">Clinical Progress Log Notes</span>
              
              {activeReviewPatient.notes && (
                <div className="text-xs bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-slate-800 font-sans leading-relaxed italic">
                  "{activeReviewPatient.notes}"
                </div>
              )}

              <form onSubmit={handleNoteSubmission} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type an evaluation note or clinical update..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-250 rounded-xl"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  File Note Entry
                </button>
              </form>
            </div>

          </div>
        ) : (
          <p className="text-center text-xs text-slate-400 py-12">No patient loaded.</p>
        )}
      </div>

    </div>
  );
}
