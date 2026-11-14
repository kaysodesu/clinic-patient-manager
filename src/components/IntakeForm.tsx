import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { Plus, Check, Shield, AlertCircle, Sparkles, Heart } from 'lucide-react';

interface IntakeFormProps {
  onAddPatient: (patient: Patient) => void;
  onCancel: () => void;
  initialData?: Partial<Patient>;
}

export default function IntakeForm({ onAddPatient, onCancel, initialData }: IntakeFormProps) {
  // 1. Personal Info
  const [firstName, setFirstName] = useState(initialData?.personalInfo?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.personalInfo?.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.personalInfo?.dateOfBirth || '');
  const [gender, setGender] = useState(initialData?.personalInfo?.gender || 'Female');
  const [phone, setPhone] = useState(initialData?.personalInfo?.phone || '');
  const [email, setEmail] = useState(initialData?.personalInfo?.email || '');
  const [address, setAddress] = useState(initialData?.personalInfo?.address || '');
  const [city, setCity] = useState(initialData?.personalInfo?.city || '');
  const [state, setState] = useState(initialData?.personalInfo?.state || 'OR');
  const [zipCode, setZipCode] = useState(initialData?.personalInfo?.zipCode || '');

  // 2. Employment & Coverage
  const [employmentStatus, setEmploymentStatus] = useState(initialData?.employmentCoverage?.employmentStatus || 'Full-Time');
  const [employerName, setEmployerName] = useState(initialData?.employmentCoverage?.employerName || '');
  const [occupation, setOccupation] = useState(initialData?.employmentCoverage?.occupation || '');
  const [primaryCareProvider, setPrimaryCareProvider] = useState(initialData?.employmentCoverage?.primaryCareProvider || '');

  // 3. Medical & Social History
  const [smokerStatus, setSmokerStatus] = useState(initialData?.medicalHistory?.smokerStatus || 'Never');
  const [alcoholConsumption, setAlcoholConsumption] = useState(initialData?.medicalHistory?.alcoholConsumption || 'Occasional');
  const [exerciseFrequency, setExerciseFrequency] = useState(initialData?.medicalHistory?.exerciseFrequency || 'Moderate');
  const [familyHistory, setFamilyHistory] = useState<string[]>(initialData?.medicalHistory?.familyHistory || []);
  const [pastSurgeries, setPastSurgeries] = useState(initialData?.medicalHistory?.pastSurgeries || '');

  // 4. Questionnaire (Chronic conditions, allergies, prescriptions, OTC)
  const [chronicConditions, setChronicConditions] = useState<string[]>(initialData?.medicalQuestionnaire?.chronicConditions || []);
  const [otherChronicConditions, setOtherChronicConditions] = useState(initialData?.medicalQuestionnaire?.otherChronicConditions || '');
  const [allergies, setAllergies] = useState(initialData?.medicalQuestionnaire?.allergies || '');
  const [prescriptions, setPrescriptions] = useState(initialData?.medicalQuestionnaire?.prescriptions || '');
  const [overTheCounter, setOverTheCounter] = useState(initialData?.medicalQuestionnaire?.overTheCounter || '');

  // 5. Current Visit Section
  const [symptoms, setSymptoms] = useState(initialData?.currentVisit?.symptoms || '');
  const [duration, setDuration] = useState(initialData?.currentVisit?.duration || '');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>(initialData?.currentVisit?.severity || 'Moderate');
  const [department, setDepartment] = useState(initialData?.currentVisit?.department || 'General Practice');

  // 6. Emergency Contact
  const [emergencyName, setEmergencyName] = useState(initialData?.emergencyContact?.fullName || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(initialData?.emergencyContact?.relationship || '');
  const [emergencyPhone, setEmergencyPhone] = useState(initialData?.emergencyContact?.phone || '');
  const [emergencyEmail, setEmergencyEmail] = useState(initialData?.emergencyContact?.email || '');

  // 7. Insurance Billing Information
  const [insuranceProvider, setInsuranceProvider] = useState(initialData?.insuranceBilling?.providerName || '');
  const [policyNo, setPolicyNo] = useState(initialData?.insuranceBilling?.policyNo || '');
  const [groupNo, setGroupNo] = useState(initialData?.insuranceBilling?.groupNo || '');
  const [holderName, setHolderName] = useState(initialData?.insuranceBilling?.policyHolderName || '');
  const [holderDoB, setHolderDoB] = useState(initialData?.insuranceBilling?.policyHolderDoB || '');
  const [individualDeductible, setIndividualDeductible] = useState(initialData?.insuranceBilling?.individualDeductible ? String(initialData.insuranceBilling.individualDeductible) : '1000');
  const [deductibleMet, setDeductibleMet] = useState(initialData?.insuranceBilling?.deductibleMet ? String(initialData.insuranceBilling.deductibleMet) : '250');
  const [copayAmount, setCopayAmount] = useState(initialData?.insuranceBilling?.copayAmount ? String(initialData.insuranceBilling.copayAmount) : '30');

  useEffect(() => {
    if (initialData) {
      if (initialData.personalInfo?.firstName !== undefined) setFirstName(initialData.personalInfo.firstName);
      if (initialData.personalInfo?.lastName !== undefined) setLastName(initialData.personalInfo.lastName);
      if (initialData.personalInfo?.dateOfBirth !== undefined) setDateOfBirth(initialData.personalInfo.dateOfBirth);
      if (initialData.personalInfo?.gender !== undefined) setGender(initialData.personalInfo.gender);
      if (initialData.personalInfo?.phone !== undefined) setPhone(initialData.personalInfo.phone);
      if (initialData.personalInfo?.email !== undefined) setEmail(initialData.personalInfo.email);
      if (initialData.personalInfo?.address !== undefined) setAddress(initialData.personalInfo.address);
      if (initialData.personalInfo?.city !== undefined) setCity(initialData.personalInfo.city);
      if (initialData.personalInfo?.state !== undefined) setState(initialData.personalInfo.state);
      if (initialData.personalInfo?.zipCode !== undefined) setZipCode(initialData.personalInfo.zipCode);

      if (initialData.employmentCoverage?.employmentStatus !== undefined) setEmploymentStatus(initialData.employmentCoverage.employmentStatus);
      if (initialData.employmentCoverage?.employerName !== undefined) setEmployerName(initialData.employmentCoverage.employerName);
      if (initialData.employmentCoverage?.occupation !== undefined) setOccupation(initialData.employmentCoverage.occupation);
      if (initialData.employmentCoverage?.primaryCareProvider !== undefined) setPrimaryCareProvider(initialData.employmentCoverage.primaryCareProvider);

      if (initialData.medicalHistory?.smokerStatus !== undefined) setSmokerStatus(initialData.medicalHistory.smokerStatus);
      if (initialData.medicalHistory?.alcoholConsumption !== undefined) setAlcoholConsumption(initialData.medicalHistory.alcoholConsumption);
      if (initialData.medicalHistory?.exerciseFrequency !== undefined) setExerciseFrequency(initialData.medicalHistory.exerciseFrequency);
      if (initialData.medicalHistory?.familyHistory !== undefined) setFamilyHistory(initialData.medicalHistory.familyHistory);
      if (initialData.medicalHistory?.pastSurgeries !== undefined) setPastSurgeries(initialData.medicalHistory.pastSurgeries);

      if (initialData.medicalQuestionnaire?.chronicConditions !== undefined) setChronicConditions(initialData.medicalQuestionnaire.chronicConditions);
      if (initialData.medicalQuestionnaire?.otherChronicConditions !== undefined) setOtherChronicConditions(initialData.medicalQuestionnaire.otherChronicConditions);
      if (initialData.medicalQuestionnaire?.allergies !== undefined) setAllergies(initialData.medicalQuestionnaire.allergies);
      if (initialData.medicalQuestionnaire?.prescriptions !== undefined) setPrescriptions(initialData.medicalQuestionnaire.prescriptions);
      if (initialData.medicalQuestionnaire?.overTheCounter !== undefined) setOverTheCounter(initialData.medicalQuestionnaire.overTheCounter);

      if (initialData.currentVisit?.symptoms !== undefined) setSymptoms(initialData.currentVisit.symptoms);
      if (initialData.currentVisit?.duration !== undefined) setDuration(initialData.currentVisit.duration);
      if (initialData.currentVisit?.severity !== undefined) setSeverity(initialData.currentVisit.severity);
      if (initialData.currentVisit?.department !== undefined) setDepartment(initialData.currentVisit.department);

      if (initialData.emergencyContact?.fullName !== undefined) setEmergencyName(initialData.emergencyContact.fullName);
      if (initialData.emergencyContact?.relationship !== undefined) setEmergencyRelationship(initialData.emergencyContact.relationship);
      if (initialData.emergencyContact?.phone !== undefined) setEmergencyPhone(initialData.emergencyContact.phone);
      if (initialData.emergencyContact?.email !== undefined) setEmergencyEmail(initialData.emergencyContact.email || '');

      if (initialData.insuranceBilling?.providerName !== undefined) setInsuranceProvider(initialData.insuranceBilling.providerName);
      if (initialData.insuranceBilling?.policyNo !== undefined) setPolicyNo(initialData.insuranceBilling.policyNo);
      if (initialData.insuranceBilling?.groupNo !== undefined) setGroupNo(initialData.insuranceBilling.groupNo);
      if (initialData.insuranceBilling?.policyHolderName !== undefined) setHolderName(initialData.insuranceBilling.policyHolderName);
      if (initialData.insuranceBilling?.policyHolderDoB !== undefined) setHolderDoB(initialData.insuranceBilling.policyHolderDoB);
      if (initialData.insuranceBilling?.individualDeductible !== undefined) setIndividualDeductible(String(initialData.insuranceBilling.individualDeductible));
      if (initialData.insuranceBilling?.deductibleMet !== undefined) setDeductibleMet(String(initialData.insuranceBilling.deductibleMet));
      if (initialData.insuranceBilling?.copayAmount !== undefined) setCopayAmount(String(initialData.insuranceBilling.copayAmount));
    }
  }, [initialData]);

  // Form step or section grouping for smooth UI
  const [activeTab, setActiveTab] = useState<'basics' | 'medical' | 'visit' | 'insurance'>('basics');
  const [validationError, setValidationError] = useState('');

  const commonChronicList = [
    'Asthma', 'Diabetes', 'Hypertension', 'Hypercholesterolemia', 
    'Arthritis', 'GERD / Acid Reflux', 'Coronary Artery Disease', 'Depression'
  ];

  const commonFamilyHistList = [
    'Diabetes', 'Hypertension', 'Heart Disease', 'Stroke', 'Cancer', 'Rheumatoid Arthritis'
  ];

  const handleToggleChronic = (cond: string) => {
    if (chronicConditions.includes(cond)) {
      setChronicConditions(chronicConditions.filter(c => c !== cond));
    } else {
      setChronicConditions([...chronicConditions, cond]);
    }
  };

  const handleToggleFamily = (hist: string) => {
    if (familyHistory.includes(hist)) {
      setFamilyHistory(familyHistory.filter(f => f !== hist));
    } else {
      setFamilyHistory([...familyHistory, hist]);
    }
  };

  const handleAutofillDemo = () => {
    // Autofills realistic demo patient data for convenient review
    setFirstName('Camila');
    setLastName('Rodriguez');
    setDateOfBirth('1991-03-12');
    setGender('Female');
    setPhone('(555) 555-0149');
    setEmail('camila.r@example.com');
    setAddress('882 Crestview View Rd');
    setCity('Portland');
    setState('OR');
    setZipCode('97210');

    setEmploymentStatus('Full-Time');
    setEmployerName('Cascade Creative Group');
    setOccupation('Art Director');
    setPrimaryCareProvider('Dr. Rachel Thorne, MD');

    setSmokerStatus('Never');
    setAlcoholConsumption('Occasional');
    setExerciseFrequency('Moderate');
    setFamilyHistory(['Hypertension', 'Diabetes']);
    setPastSurgeries('Tonsillectomy (2004)');

    setChronicConditions(['GERD / Acid Reflux']);
    setOtherChronicConditions('Seasonal Pollen Asthma (mild)');
    setAllergies('Sulfa drugs (minor itching), Hazelnuts (oral swelling)');
    setPrescriptions('Famotidine 20mg twice daily');
    setOverTheCounter('Iron 65mg daily, Melatonin 3mg nightly as needed');

    setSymptoms('Recurring chest tightness and acid rebound throat irritation, worsening when laying flat.');
    setDuration('3 weeks');
    setSeverity('Moderate');
    setDepartment('Gastroenterology');

    setEmergencyName('Eduardo Rodriguez');
    setEmergencyRelationship('Brother');
    setEmergencyPhone('(555) 555-0111');
    setEmergencyEmail('eduardo.r@example.com');

    setInsuranceProvider('Providence Health Plan');
    setPolicyNo('PR-912830');
    setGroupNo('GRP-PROV12');
    setHolderName('Camila Rodriguez');
    setHolderDoB('1991-03-12');
    setIndividualDeductible('1500');
    setDeductibleMet('950');
    setCopayAmount('25');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !dateOfBirth || !phone || !email) {
      setValidationError('Please complete all required fields: First Name, Last Name, DoB, Phone number, and Email.');
      setActiveTab('basics');
      return;
    }
    if (!symptoms || !duration) {
      setValidationError('Please complete the current visit block (symptoms and symptom duration).');
      setActiveTab('visit');
      return;
    }
    if (!emergencyName || !emergencyPhone) {
      setValidationError('Please complete emergency contact details.');
      setActiveTab('basics');
      return;
    }

    const newPatient: Patient = {
      id: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      personalInfo: {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        phone,
        email,
        address,
        city,
        state,
        zipCode
      },
      employmentCoverage: {
        employmentStatus,
        employerName,
        occupation,
        primaryCareProvider
      },
      medicalHistory: {
        smokerStatus,
        alcoholConsumption,
        exerciseFrequency,
        familyHistory,
        pastSurgeries
      },
      medicalQuestionnaire: {
        chronicConditions,
        otherChronicConditions,
        allergies: allergies || "None declared",
        prescriptions: prescriptions || "None declared",
        overTheCounter: overTheCounter || "None declared"
      },
      currentVisit: {
        symptoms,
        duration,
        severity,
        department
      },
      emergencyContact: {
        fullName: emergencyName,
        relationship: emergencyRelationship,
        phone: emergencyPhone,
        email: emergencyEmail
      },
      insuranceBilling: {
        providerName: insuranceProvider || "Self-Pay / Non-Insured",
        policyNo: policyNo || "N/A",
        groupNo: groupNo || "N/A",
        policyHolderName: holderName || "N/A",
        policyHolderDoB: holderDoB || "N/A",
        individualDeductible: Number(individualDeductible) || 0,
        deductibleMet: Number(deductibleMet) || 0,
        copayAmount: Number(copayAmount) || 0
      },
      status: 'In Processing',
      dateAdmitted: new Date().toISOString().split('T')[0],
      notes: 'New electronic registration submitted via intake terminal.'
    };

    onAddPatient(newPatient);
  };

  return (
    <div id="intake-form-wrapper" className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-slate-900 px-6 py-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-teal-400 stroke-[2.5]" />
            <h2 className="text-xl font-bold tracking-tight">Patient Ingress & Intake Processing</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">Complete intake questionnaires and insurance profile to process clinical admission.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="autofill-demo-btn"
            onClick={handleAutofillDemo}
            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-teal-950 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Autofill Demo State
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-xs font-medium transition-all"
          >
            Go Back
          </button>
        </div>
      </div>

      {validationError && (
        <div className="bg-rose-50 border-y border-rose-150 px-6 py-3.5 text-rose-800 text-sm flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-semibold">{validationError}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-150 overflow-x-auto bg-slate-50/50 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('basics')}
          className={`flex-1 min-w-[125px] px-4 py-3.5 text-sm font-medium border-b-2 text-center transition-all ${
            activeTab === 'basics' 
              ? 'border-teal-600 text-teal-700 bg-white shadow-xs font-semibold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          1. Personal & Emergency
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('medical')}
          className={`flex-1 min-w-[125px] px-4 py-3.5 text-sm font-medium border-b-2 text-center transition-all ${
            activeTab === 'medical' 
              ? 'border-teal-600 text-teal-700 bg-white shadow-xs font-semibold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          2. Medical & Social History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('visit')}
          className={`flex-1 min-w-[125px] px-4 py-3.5 text-sm font-medium border-b-2 text-center transition-all ${
            activeTab === 'visit' 
              ? 'border-teal-600 text-teal-700 bg-white shadow-xs font-semibold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          3. Current Symptoms
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('insurance')}
          className={`flex-1 min-w-[125px] px-4 py-3.5 text-sm font-medium border-b-2 text-center transition-all ${
            activeTab === 'insurance' 
              ? 'border-teal-600 text-teal-700 bg-white shadow-xs font-semibold' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          4. Coverage & Billing Info
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        {/* --- TAB 1: BASICS & EMERGENCY --- */}
        {activeTab === 'basics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Sec: Personal Info */}
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">Patient Directory Core</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Personal Identification Dossier</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">First Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="e.g. Camila"
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Last Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="e.g. Rodriguez"
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Date of Birth <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Gender Assigned at Birth</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 focus:border-transparent transition-all"
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                    <option>Decline to State</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Phone Number <span className="text-rose-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(555) 555-1234"
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Residential Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="123 Health Ave"
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Portland"
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 focus:border-transparent transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="OR"
                      maxLength={2}
                      className="w-full px-2 py-2 border border-slate-250 rounded-lg text-sm text-center uppercase bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5">Zip Code</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={e => setZipCode(e.target.value)}
                      placeholder="97201"
                      className="w-full px-2 py-2 border border-slate-250 rounded-lg text-sm text-center bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sec: Employment */}
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">Demographic Context</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Professional & Employment Context</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Employment Status</label>
                  <select
                    value={employmentStatus}
                    onChange={e => setEmploymentStatus(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all"
                  >
                    <option>Full-Time</option>
                    <option>Part-Time</option>
                    <option>Self-Employed</option>
                    <option>Unemployed</option>
                    <option>Student</option>
                    <option>Retired</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Employer Name</label>
                  <input
                    type="text"
                    value={employerName}
                    onChange={e => setEmployerName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    disabled={['Unemployed', 'Retired', 'Student'].includes(employmentStatus)}
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Active Occupation</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    placeholder="e.g. Design Lead"
                    disabled={['Unemployed', 'Retired'].includes(employmentStatus)}
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Declared Primary Care Physician</label>
                  <input
                    type="text"
                    value={primaryCareProvider}
                    onChange={e => setPrimaryCareProvider(e.target.value)}
                    placeholder="e.g. Dr. Vance, MD"
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Sec: Emergency Contact */}
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-650">Safety Framework</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Emergency Liaison Contact Details <span className="text-rose-500">*</span></h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-medium">Liaison Full Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={emergencyName}
                    onChange={e => setEmergencyName(e.target.value)}
                    placeholder="e.g. Jack Rodriguez"
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-medium">Clinical Relationship</label>
                  <input
                    type="text"
                    value={emergencyRelationship}
                    onChange={e => setEmergencyRelationship(e.target.value)}
                    placeholder="e.g. Spouse, Brother, Guardian"
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-medium">Direct Telephone Line <span className="text-rose-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    placeholder="(555) 555-9001"
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Next buttons */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('medical')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
              >
                Proceed to Medical History
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 2: MEDICAL & SOCIAL HISTORY --- */}
        {activeTab === 'medical' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">Clinical Baseline</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Social Metrics & Past Interventions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Tobacco/Smoker Tobacco Status</label>
                  <select
                    value={smokerStatus}
                    onChange={e => setSmokerStatus(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all"
                  >
                    <option>Never</option>
                    <option>Former (Quit and Tobacco-Free)</option>
                    <option>Active / Occasional Smoker</option>
                    <option>Heavy / Daily Smoker</option>
                    <option>Vapes / Alternative Nicotine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Alcohol Consumption Intensity</label>
                  <select
                    value={alcoholConsumption}
                    onChange={e => setAlcoholConsumption(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all"
                  >
                    <option>None (Teetotaler)</option>
                    <option>Occasional (1-2 drinks/week)</option>
                    <option>Moderate (1-2 drinks/day)</option>
                    <option>Social / Weekends</option>
                    <option>Heavy (Frequent/Daily)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Weekly Exercise Cadence</label>
                  <select
                    value={exerciseFrequency}
                    onChange={e => setExerciseFrequency(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all"
                  >
                    <option>None (Sedentary lifestyle)</option>
                    <option>Light (1-2 times/week casual strolls)</option>
                    <option>Moderate (3-4 times/week intense/aerobic)</option>
                    <option>Heavy / Athletic training (Daily/Competitive)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-650 mb-2">Past Surgical Interventions & Anesthetic History</label>
                <textarea
                  rows={2}
                  value={pastSurgeries}
                  onChange={e => setPastSurgeries(e.target.value)}
                  placeholder="e.g., Tonsillectomy (2004), Appendectomy (2012), Left wrist plating (2021). Declared none if applicable."
                  className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all font-sans"
                />
              </div>
            </div>

            {/* Sec: Chronic Conditions & Medical Questionnaire */}
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">Condition Screening</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Pre-Existing Chronic Conditions</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/60 p-4 rounded-xl border border-slate-150">
                {commonChronicList.map((cond) => {
                  const isChecked = chronicConditions.includes(cond);
                  return (
                    <button
                      type="button"
                      key={cond}
                      onClick={() => handleToggleChronic(cond)}
                      className={`px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between border select-none transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-teal-50 border-teal-250 text-teal-800 ring-2 ring-teal-50 hover:bg-teal-100' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:text-slate-850'
                      }`}
                    >
                      <span>{cond}</span>
                      {isChecked ? (
                        <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3]" />
                      ) : (
                        <div className="w-3.5 h-3.5 border border-slate-250 rounded bg-slate-50" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-650 mb-1.5">Other Diagnosed Conditions</label>
                <input
                  type="text"
                  value={otherChronicConditions}
                  onChange={e => setOtherChronicConditions(e.target.value)}
                  placeholder="Declare other autoimmune, neurological, tumorous, biochemical conditions..."
                  className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Family Medical History */}
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 font-medium">Genealogical Predispositions</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Hereditary Family Medical Context</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonFamilyHistList.map((hist) => {
                  const isChecked = familyHistory.includes(hist);
                  return (
                    <button
                      type="button"
                      key={hist}
                      onClick={() => handleToggleFamily(hist)}
                      className={`px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between border select-none transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:text-slate-850'
                      }`}
                    >
                      <span>{hist}</span>
                      {isChecked ? (
                        <Check className="w-3.5 h-3.5 text-teal-400 stroke-[3]" />
                      ) : (
                        <div className="w-3.5 h-3.5 border border-slate-250 rounded bg-slate-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Critical declarations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-rose-700 mb-1.5 font-medium">Allergic Sensitivities & Adverse Reactions</label>
                <textarea
                  rows={3}
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="List medications (e.g. penicillin, sulfa), foods (egg, nuts), latex, contrast dye. Write 'None Known' if none."
                  className="w-full px-3.5 py-2.5 border border-rose-200 focus:border-rose-450 focus:outline-rose-300 rounded-lg text-sm bg-rose-50/10 focus:bg-white transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-teal-700 mb-1.5 font-medium">Active Prescription Drugs (Prescriptions)</label>
                <textarea
                  rows={3}
                  value={prescriptions}
                  onChange={e => setPrescriptions(e.target.value)}
                  placeholder="Provide Name, Dosage, and Frequency (e.g. Lisinopril 10mg q.d., Inhaler PRN). Write 'None' if none."
                  className="w-full px-3.5 py-2.5 border border-teal-200 focus:border-teal-450 focus:outline-teal-300 rounded-lg text-sm bg-teal-50/10 focus:bg-white transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-755 mb-1.5">Over-The-Counter Medicine (OTC) & Supplements</label>
                <textarea
                  rows={3}
                  value={overTheCounter}
                  onChange={e => setOverTheCounter(e.target.value)}
                  placeholder="List vitamins, fish oil, ibuprofen, aspirin, allergy sprays, herbal extractions. Write 'None' if none."
                  className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all font-sans"
                />
              </div>
            </div>

            {/* Back / Next buttons */}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('basics')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all"
              >
                Back: Personal Dossier
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('visit')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
              >
                Proceed to Symptoms & Current Visit
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 3: CURRENT SYMPTOMS --- */}
        {activeTab === 'visit' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-650">Ingress Evaluation</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Primary Clinical Complaint & Severity</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Incoming Specialist Department Routing</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all"
                  >
                    <option>General Practice</option>
                    <option>Urgent Care / Emergency</option>
                    <option>Pulmonology / Allergy</option>
                    <option>Orthopedics / Joint Mechanics</option>
                    <option>Rheumatology & Immunology</option>
                    <option>Cardiology / Vascular Evaluation</option>
                    <option>Gastroenterology</option>
                    <option>Pediatrics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Symptom Duration Scale <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="e.g. 3 days, 2 weeks, sudden acute surge"
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Symptom Discomfort Assessment</label>
                  <div className="flex gap-1.5">
                    {(['Mild', 'Moderate', 'Severe'] as const).map(sev => {
                      const colors = {
                        Mild: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:ring-emerald-200',
                        Moderate: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 active:ring-amber-200',
                        Severe: 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 active:ring-rose-200'
                      };
                      const activeColors = {
                        Mild: 'bg-emerald-600 border-emerald-650 text-white hover:bg-emerald-700 shadow-sm',
                        Moderate: 'bg-amber-600 border-amber-650 text-white hover:bg-amber-700 shadow-sm',
                        Severe: 'bg-rose-600 border-rose-650 text-white hover:bg-rose-700 shadow-sm'
                      };
                      return (
                        <button
                          type="button"
                          key={sev}
                          onClick={() => setSeverity(sev)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide border transition-all text-center select-none cursor-pointer ${
                            severity === sev ? activeColors[sev] : colors[sev]
                          }`}
                        >
                          {sev}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-xs font-semibold text-slate-650 mb-2">Descriptive Complaint details & Symptom Outline <span className="text-rose-500">*</span></label>
                <textarea
                  rows={4}
                  required
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  placeholder="Detail the location, frequency, aggravating factors, pain rating (1-10), and triggering activities of active symptoms."
                  className="w-full px-4 py-3 border border-slate-250 rounded-xl text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-4 bg-amber-50 border border-amber-150 rounded-xl flex gap-3 text-sm text-amber-900 leading-relaxed max-w-full">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Staff/Triage Triage Guidelines:</span>
                Patients declaring Severe chest pain, numbness down extremities, or difficulty swallowing must be routed immediately to **Emergency Triage** without tabulating secondary insurance checklists first.
              </div>
            </div>

            {/* Back / Next buttons */}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('medical')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all"
              >
                Back: Medical baseline
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('insurance')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
              >
                Proceed to Financial Insurance Billing
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 4: INSURANCE & FINANCIAL BILLING --- */}
        {activeTab === 'insurance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <div className="border-b border-slate-100 pb-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-650">Payer Protocol</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Insurance Provider & Coverages</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Primary Insurance Carrier</label>
                  <input
                    type="text"
                    value={insuranceProvider}
                    onChange={e => setInsuranceProvider(e.target.value)}
                    placeholder="e.g. Cigna, Aetna, BlueCross"
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white focus:outline-teal-400 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Policy ID Number (Contract No)</label>
                  <input
                    type="text"
                    value={policyNo}
                    onChange={e => setPolicyNo(e.target.value)}
                    placeholder="e.g. CI-1029312"
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Group ID Number</label>
                  <input
                    type="text"
                    value={groupNo}
                    onChange={e => setGroupNo(e.target.value)}
                    placeholder="e.g. GRP-32103"
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Declared Policy Holder Holder Name</label>
                  <input
                    type="text"
                    value={holderName}
                    onChange={e => setHolderName(e.target.value)}
                    placeholder="e.g. Camila Rodriguez"
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Holder Birthdate (DoB)</label>
                  <input
                    type="date"
                    value={holderDoB}
                    onChange={e => setHolderDoB(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Individual Annual Deductible ($)</label>
                  <input
                    type="number"
                    value={individualDeductible}
                    onChange={e => setIndividualDeductible(e.target.value)}
                    placeholder="1000"
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Deductible Amount Met ($)</label>
                  <input
                    type="number"
                    value={deductibleMet}
                    onChange={e => setDeductibleMet(e.target.value)}
                    placeholder="400"
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Fixed Agreement Copay ($)</label>
                  <input
                    type="number"
                    value={copayAmount}
                    onChange={e => setCopayAmount(e.target.value)}
                    placeholder="30"
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-lg text-sm bg-slate-50/20 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Coverage validation badge */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex items-center gap-3">
              <Shield className="w-5 h-5 text-teal-600" />
              <div className="text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Assumed Patient Ledger Copay Routing:</p>
                This patient's copay will generate a basic intake invoice of <strong className="text-teal-700">${copayAmount || '0'}</strong> on successful completion, with coverage claims submitted to <strong className="text-slate-800">{insuranceProvider || 'the declared carrier'}</strong>.
              </div>
            </div>

            {/* Back / Register buttons */}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('visit')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all"
              >
                Back: Symptom Intake
              </button>
              <button
                type="submit"
                id="submit-register-patient-btn"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Register to Ledger & Issue Copay
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
