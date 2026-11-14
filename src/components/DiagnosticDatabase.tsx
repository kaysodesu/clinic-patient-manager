import React, { useState, useEffect } from 'react';
import { can, rolesWith } from '../auth/permissions';
import { AccessDenied } from '../auth/AccessDenied';
import { motion, AnimatePresence } from 'motion/react';
import { ClinicRole, ITEvent } from '../types';
import { clinicalCodes as initialClinicalCodes, ClinicalCode, CODE_SET_VERSION, CODE_SET_LABEL } from '../data/clinicalCodes';
import { 
  Database, Shield, KeyRound, Search, Filter, Plus, Trash2, Edit, CheckCircle, 
  AlertTriangle, FileUp, FileDown, RefreshCw, Sparkles, X, Check, Save, UserCheck, Calendar,
  Activity, Pill, Heart as HeartIcon, Stethoscope, Info, Ban
} from 'lucide-react';

export interface MedicalCondition {
  id: string;
  name: string;
  category: 'Sickness/Acute' | 'Illness/Infectious' | 'Chronic Condition' | 'Medical Condition/Other';
  icd10Codes?: string[]; // linked ICD-10-CM diagnosis codes
  symptoms: string[];
  accuracyProbability: number;
  appropriateMedications: string[];
  allergyCautions: string;
  adverseSideEffects: string;
  afterCare: string;
  lastUpdated: string;
}

const defaultConditions: MedicalCondition[] = [
  {
    id: "COND-001",
    icd10Codes: ["J02.0"],
    name: "Acute Streptococcal Pharyngitis (Strep Throat)",
    category: "Illness/Infectious",
    symptoms: ["Severe sore throat", "High fever", "Tonsillar exudate", "Swollen lymph nodes", "Difficulty swallowing", "Headache"],
    accuracyProbability: 95,
    appropriateMedications: ["Penicillin V potassium (500mg PO TID)", "Amoxicillin (500mg PO BID)", "Cephalexin (if mild allergy)"],
    allergyCautions: "Do NOT assign Penicillin or Amoxicillin if patient has a known history of type I hypersensitivity (anaphylaxis or hives) to beta-lactam antibiotics.",
    adverseSideEffects: "May cause stomach upset, nausea, diarrhea, oral thrush, or mild transient skin rashes.",
    afterCare: "Adhere to the entire antibiotic course (10 days) to prevent rheumatic fever. Drink warm broths, rest vocal cords, prioritize warm saline gargles (1/2 tsp salt in warm water), and stay hydrated.",
    lastUpdated: "2026-06-15"
  },
  {
    id: "COND-002",
    icd10Codes: ["E11.9","E11.65"],
    name: "Type 2 Diabetes Mellitus",
    category: "Chronic Condition",
    symptoms: ["Frequent urination", "Increased thirst", "Fatigue", "Blurry vision", "Slower cut healing", "Tingling in feet"],
    accuracyProbability: 99,
    appropriateMedications: ["Metformin (500mg BID with meals, titrate)", "GLP-1 RA, e.g. semaglutide (Ozempic weekly sub-Q) when ASCVD, obesity or high risk", "SGLT2 inhibitor, e.g. empagliflozin (Jardiance 10mg QD) when heart failure or CKD"],
    allergyCautions: "Metformin is strictly contraindicated in severe renal impairment (eGFR < 30 mL/min/1.73m²), acute metabolic acidosis, or severe hepatic failure.",
    adverseSideEffects: "Metformin causes transient abdominal cramping and diarrhea. SGLT2 inhibitors like Empagliflozin carry increased risk of UTIs, yeast infections, and mild orthostatic hypotension.",
    afterCare: "Check capillary blood glucose daily. Commit to a low-calorie, low-glycemic dietary regime, perform 150 minutes of weekly moderate aerobic activity, inspect lower extremities daily for skin lesions, and monitor HbA1c quarterly.",
    lastUpdated: "2026-06-12"
  },
  {
    id: "COND-003",
    icd10Codes: ["J45.901"],
    name: "Bronchial Asthma (Acute Exacerbation)",
    category: "Sickness/Acute",
    symptoms: ["Wheezing", "Dry cough", "Shortness of breath", "Chest tightness", "Increased respiratory rate"],
    accuracyProbability: 88,
    appropriateMedications: ["Budesonide-formoterol (ICS-formoterol) as-needed reliever, per GINA Track 1", "Albuterol HFA (2 puffs q4-6h PRN), always alongside an inhaled corticosteroid", "Prednisone short oral course for moderate-severe exacerbation"],
    allergyCautions: "Use bronchodilators with extreme caution in patients with underlying ischemic cardiovascular disease or severe tachyarrhythmias.",
    adverseSideEffects: "Albuterol may trigger tremors, high tachycardia, hypokalemia, or heart palpitations. Oral corticosteroids induce potential transient hyperglycemia, mood shifts, and sleep disturbance.",
    afterCare: "Rinse mouth thoroughly with warm water and spit after each corticosteroid inhaler use to prevent oral candidiasis (thrush). Keep a structured asthma action plan on hand, monitor peak flow daily, and steer clear of known allergen triggers like smoke or animal dander.",
    lastUpdated: "2026-06-10"
  },
  {
    id: "COND-004",
    icd10Codes: ["N39.0"],
    name: "Acute Uncomplicated Cystitis (UTI)",
    category: "Sickness/Acute",
    symptoms: ["Pain on urination", "Urinary frequency", "Suprapubic pain", "Cloudy urine", "Foul-smelling urine"],
    accuracyProbability: 92,
    appropriateMedications: ["Nitrofurantoin (Macrobid 100mg PO BID x 5d)", "Sulfamethoxazole-Trimethoprim (Bactrim DS BID x 3d)", "Fosfomycin (3g single pouch)"],
    allergyCautions: "Do NOT prescribe Sulfamethoxazole (Bactrim) if the patient holds a sulfa hypersensitivity. Avoid Nitrofurantoin in patients with a creatinine clearance (CrCl) under 30 mL/min.",
    adverseSideEffects: "Bactrim may cause dramatic photosensitivity, nausea, or drug rashes. Nitrofurantoin can sometimes induce transient pulmonary toxicity on rare long-term exposure, or mild headache.",
    afterCare: "Increase oral fluid intake to 2.5-3 liters of water daily to wash out pathogens. Void immediately after intercourse and refuse to hold urine. Complete the entire course of antibacterial medications.",
    lastUpdated: "2026-06-16"
  },
  {
    id: "COND-005",
    icd10Codes: ["K21.9"],
    name: "Gastroesophageal Reflux Disease (GERD)",
    category: "Chronic Condition",
    symptoms: ["Heartburn", "Acid regurgitation", "Difficulty swallowing", "Dry cough", "Sensation of lump in throat"],
    accuracyProbability: 90,
    appropriateMedications: ["Omeprazole (Prilosec 20mg daily AC)", "Famotidine (Pepcid 20mg BID)", "Calcium carbonate antacids (PRN)"],
    allergyCautions: "Do not administer proton pump inhibitors if patient is allergic to substituted benzimidazoles. High dose calcium carbonate may lead to milk-alkali syndrome over long durations.",
    adverseSideEffects: "Omeprazole long-term use is associated with Vitamin B12 deficiency, osteoporosis risk, hypomagnesemia, and C. diff microflora flares.",
    afterCare: "Avoid eating within 3 hours of reclining. Elevate the head of your bed by 6 inches. Limit trigger foods including excessive chocolate, caffeine, mints, citrus fruits, spicy seasonings, and fatty meats. Eat smaller, frequent meals.",
    lastUpdated: "2026-06-14"
  },
  {
    id: "COND-006",
    icd10Codes: ["I10"],
    name: "Essential (Primary) Hypertension",
    category: "Chronic Condition",
    symptoms: ["Often no symptoms", "Elevated office or home blood pressure readings (130/80 mmHg or higher)", "Morning headaches", "Dizziness"],
    accuracyProbability: 97,
    appropriateMedications: ["Lisinopril (ACE inhibitor) 10mg daily", "Amlodipine (calcium channel blocker) 5mg daily", "Chlorthalidone (thiazide-like diuretic) 12.5mg daily"],
    allergyCautions: "Avoid ACE inhibitors/ARBs in pregnancy and in patients with prior ACE-inhibitor angioedema. Check potassium and kidney function after starting ACE inhibitors, ARBs or diuretics.",
    adverseSideEffects: "ACE inhibitors may cause dry cough or high potassium; amlodipine may cause ankle swelling; thiazide diuretics may lower sodium or potassium and raise blood sugar or uric acid.",
    afterCare: "Confirm with home blood pressure monitoring (validated upper-arm cuff, readings shared through remote monitoring when enrolled). Reduce sodium, follow a DASH-style diet, stay active 150 minutes per week, limit alcohol, and recheck within 4 weeks of any medication change.",
    lastUpdated: "2026-11-01"
  },
  {
    id: "COND-007",
    icd10Codes: ["F41.1"],
    name: "Generalized Anxiety Disorder",
    category: "Medical Condition/Other",
    symptoms: ["Excessive worry most days for 6+ months", "Restlessness", "Fatigue", "Poor concentration", "Irritability", "Muscle tension", "Sleep disturbance"],
    accuracyProbability: 85,
    appropriateMedications: ["Sertraline (SSRI) 25-50mg daily, titrate", "Escitalopram (SSRI) 10mg daily", "Buspirone 7.5mg BID (adjunct or alternative)"],
    allergyCautions: "Screen for bipolar disorder before starting an SSRI. Do not combine SSRIs with MAO inhibitors. Avoid routine benzodiazepine use because of dependence and fall risk.",
    adverseSideEffects: "SSRIs may cause nausea, sleep changes, sexual side effects and, in patients under 25, a boxed-warning risk of increased suicidal thoughts early in treatment.",
    afterCare: "Track symptoms with the GAD-7 at each visit. Offer cognitive behavioral therapy (in person or by telehealth) and consider behavioral health integration care management. Follow up within 4-6 weeks of starting medication and give crisis line information (988).",
    lastUpdated: "2026-11-01"
  },
  {
    id: "COND-008",
    icd10Codes: ["U07.1"],
    name: "COVID-19 (Confirmed SARS-CoV-2 Infection)",
    category: "Illness/Infectious",
    symptoms: ["Fever or chills", "Cough", "Sore throat", "Fatigue", "Loss of taste or smell", "Muscle aches", "Shortness of breath"],
    accuracyProbability: 96,
    appropriateMedications: ["Supportive care: fluids, rest, acetaminophen for fever", "Nirmatrelvir-ritonavir (Paxlovid) within 5 days of symptom onset for high-risk patients", "Molnupiravir when Paxlovid is not appropriate"],
    allergyCautions: "Paxlovid has many serious drug interactions (e.g., some statins, anticoagulants, antiarrhythmics); review the full medication list first and adjust the dose for reduced kidney function.",
    adverseSideEffects: "Paxlovid may cause altered taste, diarrhea and raised blood pressure. Molnupiravir is not recommended in pregnancy.",
    afterCare: "Confirm with a rapid antigen or PCR test. Isolate per current CDC guidance until fever-free for 24 hours without medication and symptoms are improving. Seek urgent care for trouble breathing or oxygen below 92%. Offer the current-season COVID-19 vaccine after recovery.",
    lastUpdated: "2026-11-01"
  }
];

interface ExtendedClinicalCode extends ClinicalCode {
  entryDate: string;
  legitimacy: 'Approved / Industry Standard' | 'Pending Review' | 'Experimental' | 'Obsolete';
  authenticated: boolean;
  /** CODE_SET_VERSION for built-in codes, 'custom' for codes the clinic added */
  codeSetVersion?: string;
}

interface DiagnosticDatabaseProps {
  role: ClinicRole;
  onSetRole: (role: ClinicRole) => void;
  onLogITEvent: (type: ITEvent['type'], details: string, author?: string, status?: ITEvent['status']) => void;
  playBeep: () => void;
}

export default function DiagnosticDatabase({
  role,
  onSetRole,
  onLogITEvent,
  playBeep
}: DiagnosticDatabaseProps) {
  // Gated Passcode verification for Diagnostic Database
  const [passcode, setPasscode] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinShaking, setIsPinShaking] = useState(false);
  const [sessionUnlocked, setSessionUnlocked] = useState(() => can(role, 'diagnosticDatabase'));

  // Core Diagnostic Codes state
  const [codes, setCodes] = useState<ExtendedClinicalCode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLegitimacy, setFilterLegitimacy] = useState<string>('All');

  // Multi-View Sub Tab
  const [activeSubTab, setActiveSubTab] = useState<'conditions' | 'codes'>('conditions');

  // Medical Conditions Catalog & Diagnostic section state
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [condSearchQuery, setCondSearchQuery] = useState('');
  const [selectedCondType, setSelectedCondType] = useState<string>('All');

  // Symptom Matcher tool selection pool
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Condition Form states
  const [isCondFormOpen, setIsCondFormOpen] = useState(false);
  const [editingCondId, setEditingCondId] = useState<string | null>(null);
  
  const [formCondName, setFormCondName] = useState('');
  const [formCondCategory, setFormCondCategory] = useState<'Sickness/Acute' | 'Illness/Infectious' | 'Chronic Condition' | 'Medical Condition/Other'>('Sickness/Acute');
  const [formCondSymptoms, setFormCondSymptoms] = useState(''); // comma-separated strings
  const [formCondProbability, setFormCondProbability] = useState(90);
  const [formCondMeds, setFormCondMeds] = useState(''); // comma-separated strings
  const [formCondAllergyCautions, setFormCondAllergyCautions] = useState('');
  const [formCondAdverseEffects, setFormCondAdverseEffects] = useState('');
  const [formCondAfterCare, setFormCondAfterCare] = useState('');

  // Form states for adding/editing a code
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Clinical Laboratory Services');
  const [formLegitimacy, setFormLegitimacy] = useState<ExtendedClinicalCode['legitimacy']>('Approved / Industry Standard');
  const [formAuthenticated, setFormAuthenticated] = useState(true);

  // File Upload / Import states
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Auto-unlock if user's role is already facility_database_administrator
  useEffect(() => {
    setSessionUnlocked(can(role, 'diagnosticDatabase'));
  }, [role]);

  // Read diagnostic codes and medical conditions from localStorage on mount or seed defaults
  useEffect(() => {
    const saved = localStorage.getItem('clinic_diagnostic_codes');
    let savedCodes: ExtendedClinicalCode[] = [];
    try {
      savedCodes = saved ? JSON.parse(saved) : [];
    } catch {
      savedCodes = [];
    }
    if (savedCodes.some(c => c.codeSetVersion === CODE_SET_VERSION)) {
      setCodes(savedCodes);
    } else {
      // No saved list, or one built from an older code set: load the current built-in set
      // and keep any codes the clinic added itself
      const seeded: ExtendedClinicalCode[] = initialClinicalCodes.map(c => ({
        ...c,
        entryDate: '2026-01-01',
        legitimacy: 'Approved / Industry Standard',
        authenticated: true,
        codeSetVersion: CODE_SET_VERSION,
      }));
      const builtInCodes = new Set(seeded.map(c => c.code));
      const clinicAdded = savedCodes.filter(c => c.codeSetVersion === 'custom' && !builtInCodes.has(c.code));
      const merged = [...seeded, ...clinicAdded];
      setCodes(merged);
      localStorage.setItem('clinic_diagnostic_codes', JSON.stringify(merged));
    }

    const savedConds = localStorage.getItem('clinic_medical_conditions');
    if (savedConds) {
      // Keep the clinic's edits, and add any built-in conditions that are new in this version
      const parsedConds: MedicalCondition[] = JSON.parse(savedConds);
      const knownIds = new Set(parsedConds.map(c => c.id));
      const missing = defaultConditions.filter(c => !knownIds.has(c.id));
      const mergedConds = [...parsedConds, ...missing];
      setConditions(mergedConds);
      if (missing.length) localStorage.setItem('clinic_medical_conditions', JSON.stringify(mergedConds));
    } else {
      setConditions(defaultConditions);
      localStorage.setItem('clinic_medical_conditions', JSON.stringify(defaultConditions));
    }
  }, []);

  const saveToLocalStorage = (updatedCodes: ExtendedClinicalCode[]) => {
    setCodes(updatedCodes);
    localStorage.setItem('clinic_diagnostic_codes', JSON.stringify(updatedCodes));
  };

  const saveConditionsToLocalStorage = (updatedConds: MedicalCondition[]) => {
    setConditions(updatedConds);
    localStorage.setItem('clinic_medical_conditions', JSON.stringify(updatedConds));
  };

  // Handle standard digital gate keypad entries
  const handleDigitPress = (digit: string) => {
    setPinError(null);
    if (passcode.length < 4) {
      setPasscode(prev => prev + digit);
    }
  };

  const verifyPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcode === '9999') {
      onLogITEvent('OTHER', 'Diagnostic Database console unlocked. Credential: Facility Database Administrator.', 'FDBA User (9999)');
      onSetRole('facility_database_administrator');
      setSessionUnlocked(true);
      setPasscode('');
      setPinError(null);
      playBeep();
      alert('🔓 Facility Database Administrator Credentials Validated. Welcome to the Code Registry Console.');
    } else {
      onLogITEvent('LOGIN_ERROR', `FDBA gate unauthorized passcode entry attempt: "${passcode}"`, 'ADMIN_IP', 'ERROR');
      setIsPinShaking(true);
      setPinError('Invalid security access code. Please try again.');
      setPasscode('');
      playBeep();
      setTimeout(() => setIsPinShaking(false), 500);
    }
  };

  // CRUD actions for medical conditions
  const handleOpenCreateCond = () => {
    setEditingCondId(null);
    setFormCondName('');
    setFormCondCategory('Sickness/Acute');
    setFormCondSymptoms('');
    setFormCondProbability(90);
    setFormCondMeds('');
    setFormCondAllergyCautions('');
    setFormCondAdverseEffects('');
    setFormCondAfterCare('');
    setIsCondFormOpen(true);
  };

  const startEditCondition = (cond: MedicalCondition) => {
    setEditingCondId(cond.id);
    setFormCondName(cond.name);
    setFormCondCategory(cond.category);
    setFormCondSymptoms(cond.symptoms.join(', '));
    setFormCondProbability(cond.accuracyProbability);
    setFormCondMeds(cond.appropriateMedications.join(', '));
    setFormCondAllergyCautions(cond.allergyCautions);
    setFormCondAdverseEffects(cond.adverseSideEffects);
    setFormCondAfterCare(cond.afterCare);
    setIsCondFormOpen(true);
  };

  const closeCondForm = () => {
    setIsCondFormOpen(false);
    setEditingCondId(null);
  };

  const handleCreateOrUpdateCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCondName.trim()) {
      alert("Please provide the condition/sickness name.");
      return;
    }

    const symptomsList = formCondSymptoms.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
      
    const medsList = formCondMeds.split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    if (editingCondId) {
      // Edit mode
      const updated = conditions.map(c => {
        if (c.id === editingCondId) {
          return {
            ...c,
            name: formCondName.trim(),
            category: formCondCategory,
            symptoms: symptomsList,
            accuracyProbability: formCondProbability,
            appropriateMedications: medsList,
            allergyCautions: formCondAllergyCautions.trim(),
            adverseSideEffects: formCondAdverseEffects.trim(),
            afterCare: formCondAfterCare.trim(),
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return c;
      });
      saveConditionsToLocalStorage(updated);
      onLogITEvent('VISITATION_UPDATE', `Modified Clinical Condition entry ${editingCondId} (${formCondName.trim()})`, 'FDBA Console');
      alert(`Condition ${formCondName.trim()} updated successfully.`);
    } else {
      // Add mode
      const newId = `COND-${String(conditions.length + 1).padStart(3, '0')}`;
      const newCond: MedicalCondition = {
        id: newId,
        name: formCondName.trim(),
        category: formCondCategory,
        symptoms: symptomsList,
        accuracyProbability: formCondProbability,
        appropriateMedications: medsList,
        allergyCautions: formCondAllergyCautions.trim(),
        adverseSideEffects: formCondAdverseEffects.trim(),
        afterCare: formCondAfterCare.trim(),
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      saveConditionsToLocalStorage([newCond, ...conditions]);
      onLogITEvent('VISITATION_UPDATE', `Registered new Clinical Condition ${newId} (${formCondName.trim()})`, 'FDBA Console');
      alert(`New clinical condition ${formCondName.trim()} registered completely.`);
    }

    closeCondForm();
    playBeep();
  };

  const handleDeleteCondition = (id: string, name: string) => {
    if (confirm(`Are you certain you want to remove condition ${name} (${id})? This will delete related records from the workspace console.`)) {
      const updated = conditions.filter(c => c.id !== id);
      saveConditionsToLocalStorage(updated);
      onLogITEvent('VISITATION_UPDATE', `Purged Clinical Condition entry ${id} - ${name}`, 'FDBA Console');
      playBeep();
      alert(`Condition ${name} removed from diagnostic registry.`);
    }
  };

  // Categories list
  const categories = ['All', ...new Set(codes.map(c => c.category))];

  // Create or Update code entry
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formDescription.trim()) {
      alert('Please fill out all directory fields.');
      return;
    }

    const cleanCode = formCode.trim().toUpperCase();

    if (editingCodeId) {
      // Edit mode
      const updated = codes.map(c => {
        if (c.code === editingCodeId) {
          return {
            ...c,
            code: cleanCode,
            description: formDescription.trim(),
            category: formCategory,
            legitimacy: formLegitimacy,
            authenticated: formAuthenticated,
            entryDate: new Date().toISOString().split('T')[0],
            codeSetVersion: 'custom'
          };
        }
        return c;
      });
      saveToLocalStorage(updated);
      onLogITEvent('VISITATION_UPDATE', `Diagnostic Code ${editingCodeId} updated to ${cleanCode} (${formDescription.trim()}).`, 'FDBA Console');
      alert(`Diagnostic code ${cleanCode} updated successfully.`);
    } else {
      // Add mode - duplicate check
      if (codes.some(c => c.code === cleanCode)) {
        alert(`Warning: Diagnostic code ${cleanCode} already exists in database. Duplicate detection will flag this entry!`);
      }
      const newEntry: ExtendedClinicalCode = {
        code: cleanCode,
        description: formDescription.trim(),
        category: formCategory,
        legitimacy: formLegitimacy,
        authenticated: formAuthenticated,
        entryDate: new Date().toISOString().split('T')[0],
        codeSetVersion: 'custom'
      };
      saveToLocalStorage([newEntry, ...codes]);
      onLogITEvent('VISITATION_UPDATE', `Manually created new Diagnostic Code entry ${cleanCode} - ${formDescription.trim()}`, 'FDBA Console');
      alert(`Diagnostic code ${cleanCode} registered successfully.`);
    }

    closeForm();
    playBeep();
  };

  const startEdit = (c: ExtendedClinicalCode) => {
    setEditingCodeId(c.code);
    setFormCode(c.code);
    setFormDescription(c.description);
    setFormCategory(c.category);
    setFormLegitimacy(c.legitimacy);
    setFormAuthenticated(c.authenticated);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCodeId(null);
    setFormCode('');
    setFormDescription('');
    setFormCategory('Clinical Laboratory Services');
    setFormLegitimacy('Approved / Industry Standard');
    setFormAuthenticated(true);
  };

  const handleDeleteCode = (codeToDelete: string) => {
    if (confirm(`Are you certain you want to remove diagnostic code ${codeToDelete}? This action cannot be undone.`)) {
      const updated = codes.filter(c => c.code !== codeToDelete);
      saveToLocalStorage(updated);
      onLogITEvent('VISITATION_UPDATE', `Removed diagnostic code ${codeToDelete} from database register.`, 'FDBA Console');
      playBeep();
      alert(`Code ${codeToDelete} successfully removed.`);
    }
  };

  // Toggle authenticated status directly
  const handleToggleAuthenticate = (codeToAuth: string) => {
    const updated = codes.map(c => {
      if (c.code === codeToAuth) {
        const nextState = !c.authenticated;
        onLogITEvent('VISITATION_UPDATE', `Diagnostic Code ${c.code} verification status changed to: ${nextState ? 'AUTHENTICATED' : 'UNAUTHENTICATED'}`, 'FDBA Console');
        return { ...c, authenticated: nextState };
      }
      return c;
    });
    saveToLocalStorage(updated);
    playBeep();
  };

  // DEDUPLICATION: Detect and clean duplicate diagnostic records
  const getDuplicateGroups = () => {
    const counts: { [key: string]: ExtendedClinicalCode[] } = {};
    codes.forEach(c => {
      const codeId = c.code.trim().toUpperCase();
      if (!counts[codeId]) counts[codeId] = [];
      counts[codeId].push(c);
    });

    const dupes: { code: string; entries: ExtendedClinicalCode[] }[] = [];
    Object.keys(counts).forEach(key => {
      if (counts[key].length > 1) {
        dupes.push({ code: key, entries: counts[key] });
      }
    });

    return dupes;
  };

  const duplicateGroups = getDuplicateGroups();

  const handleResolveDuplicates = () => {
    if (duplicateGroups.length === 0) {
      alert('Perfect Database Integrity: No matching code identifier duplicates found.');
      return;
    }

    // Standard de-duplication strategy: keep the most recently entered standard-legitimate element, drop others
    let resolvedCount = 0;
    const keptCodes: ExtendedClinicalCode[] = [];
    const seenCodes = new Set<string>();

    // Sort codes: approved/industry standard first, then newer entry date first
    const sortedAll = [...codes].sort((a, b) => {
      if (a.legitimacy === 'Approved / Industry Standard' && b.legitimacy !== 'Approved / Industry Standard') return -1;
      if (b.legitimacy === 'Approved / Industry Standard' && a.legitimacy !== 'Approved / Industry Standard') return 1;
      return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
    });

    sortedAll.forEach(item => {
      const codeId = item.code.trim().toUpperCase();
      if (seenCodes.has(codeId)) {
        resolvedCount++;
      } else {
        seenCodes.add(codeId);
        keptCodes.push(item);
      }
    });

    saveToLocalStorage(keptCodes);
    onLogITEvent('PROFILE_MERGED', `Diagnostic Database deduplication action triggered. Consolidated ${resolvedCount} repetitive entries, re-establishing pristine registry.`, 'FDBA Optimizer');
    playBeep();
    alert(`🎉 Success! Deduplication resolved ${resolvedCount} redundant entries. All diagnostic codes are unified.`);
  };

  // EXPORT FILE: JSON schema downloader
  const handleExportCodes = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(codes, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `clinical_diagnostic_codes_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onLogITEvent('OTHER', 'Exported diagnostic codes registry to external JSON schema file.', 'FDBA Console');
      playBeep();
    } catch (e) {
      alert('Export failed due to browser permissions.');
    }
  };

  // DRAG AND DROP FILE IMPORT PARSER
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processImportText = (text: string) => {
    try {
      let imported: any[] = [];
      if (text.trim().startsWith('[')) {
        // Parse as JSON array of ClinicalCodes
        imported = JSON.parse(text);
      } else {
        // Parse as CSV/TSV format (rows separated by newlines, cols separated by comma or tabs)
        const lines = text.split('\n');
        lines.forEach(line => {
          if (!line.trim()) return;
          const parts = line.split(/[,\t]/);
          if (parts.length >= 2) {
            imported.push({
              code: parts[0].replace(/['"]+/g, '').trim(),
              description: parts[1].replace(/['"]+/g, '').trim(),
              category: parts[2] ? parts[2].replace(/['"]+/g, '').trim() : 'Clinical Laboratory Services'
            });
          }
        });
      }

      if (imported.length === 0) {
        setImportStatus({ success: false, message: 'Could not resolve any clinical codes inside files.' });
        return;
      }

      // Convert imported elements to ExtendedClinicalCodes
      const parsedExtended: ExtendedClinicalCode[] = imported.map((item: any) => ({
        code: String(item.code || '').trim().toUpperCase(),
        description: String(item.description || item.name || 'Custom imported entry').trim(),
        category: String(item.category || 'Imported Custom Codebook').trim(),
        entryDate: new Date().toISOString().split('T')[0],
        legitimacy: 'Approved / Industry Standard' as const,
        authenticated: true,
        codeSetVersion: 'custom'
      })).filter(item => item.code.length > 0);

      // Append avoiding direct duplicate overlays
      const currentMap = new Map<string, ExtendedClinicalCode>(codes.map(c => [c.code, c]));
      parsedExtended.forEach(item => {
        currentMap.set(item.code, item); // Overwrites matching codes with recently imported ones
      });

      const merged: ExtendedClinicalCode[] = Array.from(currentMap.values());
      saveToLocalStorage(merged);
      onLogITEvent('VISITATION_UPDATE', `Imported ${parsedExtended.length} custom diagnostic code rows into active workspace registry.`, 'FDBA Console');
      setImportStatus({ success: true, message: `Successfully parsed and loaded ${parsedExtended.length} codes from file document!` });
      playBeep();
      setTimeout(() => setImportStatus(null), 5000);
    } catch (err) {
      setImportStatus({ success: false, message: 'Failed to parse file format. Please upload valid JSON or CSV.' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processImportText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processImportText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Filter clinical codes based on category, search queries and legitimacy status
  const filteredCodes = codes.filter(c => {
    const categoryMatch = selectedCategory === 'All' || c.category === selectedCategory;
    const legitimacyMatch = filterLegitimacy === 'All' || c.legitimacy === filterLegitimacy;
    const searchMatch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.system || '').toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && legitimacyMatch && searchMatch;
  });

  if (!sessionUnlocked) {
    return <AccessDenied area="The Diagnostic Database" allowedRoles={rolesWith('diagnosticDatabase')} />;
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Dashboard Title Panel */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-[10px] uppercase font-bold tracking-wider mb-2 font-mono">
              <Database className="w-3.5 h-3.5" />
              <span>Diagnostic Codes & Sickness Advisory Board</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Facility Clinical Database Console</span>
              <span className="bg-teal-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded font-mono uppercase tracking-wider">FDBA PRIVILEGE LEVEL</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              {activeSubTab === 'codes' 
                ? 'Add, audit, remove, and de-duplicate registered CPT/HCPCS diagnostic standards. Establish Legitimacy and Industry Compliance indices based on entry date. Drag and drop bulk text layouts for instant facility local codebook integration.'
                : 'Categorize physical sicknesses, high-infectious illnesses, chronic medical conditions, and typical symptoms. Document standard diagnostic probabilities, drug safety guidelines, allergy warnings, adverse side effects, and strict after-care checklists.'
              }
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeSubTab === 'codes' ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Create Diagnostic Register</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCodes}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-teal-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-teal-400" />
                  <span>Export Schema</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateCond}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Register Sickness / Condition</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* HORIZONTAL MULTI-VIEW TAB NAVIGATION */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1 sm:max-w-md text-left">
        <button
          type="button"
          onClick={() => { setActiveSubTab('conditions'); playBeep(); }}
          className={`flex-1 py-2 px-3 text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
            activeSubTab === 'conditions'
              ? 'bg-slate-900 border border-slate-950 text-white shadow-sm font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sickness & Conditions Advisory</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('codes'); playBeep(); }}
          className={`flex-1 py-2 px-3 text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
            activeSubTab === 'codes'
              ? 'bg-slate-900 border border-slate-950 text-white shadow-sm font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-teal-500" />
          <span>Codes Registry Admin</span>
        </button>
      </div>

      {/* MAIN VIEW PANELS */}
      {activeSubTab === 'codes' && (
        <>
          {/* QUICK INTEGRITY AND DEDUPLICATION MODULES */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
            
            {/* DEDUPLICATION CARD (Slot 7) */}
            <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Pristine Registry Duplicate Checker & Unifier</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Scans internal standard codebook keys to purge identical entries instantly.</p>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-1 bg-amber-50 rounded text-amber-700 border border-amber-100">
                  {duplicateGroups.length} Matches Found
                </span>
              </div>

              {duplicateGroups.length === 0 ? (
                <div className="bg-teal-50/40 border border-teal-100/60 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div className="text-xs">
                    <strong className="text-teal-900 block font-bold">100% Unique Elements Verified</strong>
                    <span className="text-slate-500">Every single diagnostic key matches clinical standards. Zero duplicate or redundant entries currently detected!</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-2.5 text-xs text-amber-900 leading-normal">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Repetitive Entries Detected:</strong> Found duplicates for code identifiers: {duplicateGroups.map(d => `'${d.code}'`).join(', ')}. Clean the database to establish a pristine single-value master ledger.
                    </div>
                  </div>

                  <div className="max-h-24 overflow-y-auto space-y-1.5 border p-2 rounded-lg bg-slate-50">
                    {duplicateGroups.map((g, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b last:border-0 border-slate-200">
                        <span className="font-mono font-bold text-slate-700">{g.code}</span>
                        <span className="text-slate-500">({g.entries.length} copies found inside directory)</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleResolveDuplicates}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Establish Legitimacy: Merge & Sanitize Repetitive Codes</span>
                  </button>
                </div>
              )}
            </div>

            {/* BULK FILE DOCUMENT IMPORT ZONE (Slot 5) */}
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-teal-600" />
                  <span>Import Custom Facility Codebook</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Drag-and-drop or select any JSON files or CSV/TSV spreadsheets of code registries.</p>
              </div>

              {/* DRAG ZONE */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-2xl p-4 text-center border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                  dragActive 
                    ? 'bg-teal-50 border-teal-500 scale-[1.02]' 
                    : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <input 
                  type="file" 
                  id="fdba-file-uploader" 
                  accept=".json,.csv,.txt"
                  className="hidden" 
                  onChange={handleFileInputChange} 
                />
                <label htmlFor="fdba-file-uploader" className="cursor-pointer space-y-1">
                  <FileUp className="w-6 h-6 text-slate-400 mx-auto" />
                  <div className="text-[11.5px] font-bold text-slate-700">Drag files here or <span className="text-teal-600 hover:underline">browse locally</span></div>
                  <p className="text-[9.5px] text-slate-400">Supports standard coding formats (.txt, .json, .csv)</p>
                </label>
              </div>

              {importStatus && (
                <div className={`p-2.5 rounded-xl text-center text-[10.5px] font-semibold leading-relaxed border ${
                  importStatus.success 
                    ? 'bg-emerald-55 border-emerald-100 text-emerald-800' 
                    : 'bg-rose-50 border-rose-100 text-rose-850'
                }`}>
                  {importStatus.message}
                </div>
              )}
            </div>
          </div>

          {/* CORE CODES TABLE AND FILTERING SECTION */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs text-left space-y-5">
            
            {/* FILTERS TOOLBAR */}
            <p className="text-[11px] text-slate-500 bg-sky-50/60 border border-sky-100 rounded-xl px-3 py-2">
              <strong className="text-slate-700">Code set: {CODE_SET_LABEL}.</strong> Primary-care and private-practice reference list with plain-language descriptions.
              Verify codes against the licensed CPT®, HCPCS and ICD-10-CM code books and payer rules before billing.
            </p>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">

              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search diagnostic code directories, names, categories..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                
                {/* Category Dropdown */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl">
                  <Filter className="w-3 h-3 text-slate-400 shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="text-xs bg-transparent border-0 outline-none py-0.5 cursor-pointer text-slate-705 font-medium"
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat === 'All' ? 'All Classes' : cat}</option>
                    ))}
                  </select>
                </div>

                {/* Legitimacy Standard Dropdown */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl">
                  <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                  <select
                    value={filterLegitimacy}
                    onChange={e => setFilterLegitimacy(e.target.value)}
                    className="text-xs bg-transparent border-0 outline-none py-0.5 cursor-pointer text-slate-705 font-medium"
                  >
                    <option value="All">All Legitimacy standards</option>
                    <option value="Approved / Industry Standard">Approved Standards</option>
                    <option value="Pending Review">Pending Reviews</option>
                    <option value="Experimental">Experimental</option>
                    <option value="Obsolete">Obsolete</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setFilterLegitimacy('All');
                  }}
                  className="text-xs font-semibold px-2.5 py-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* DATA TABLE */}
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 uppercase font-mono tracking-wider text-[9px] select-none font-bold">
                    <th className="px-4 py-3">Code / Key</th>
                    <th className="px-4 py-3">Clinical Description</th>
                    <th className="px-4 py-3">Category Class</th>
                    <th className="px-4 py-3">Entry/Standard Date</th>
                    <th className="px-4 py-3">Legitimacy Status</th>
                    <th className="px-4 py-3 text-center">Auth / Review</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 italic">No matching diagnostic records found.</td>
                    </tr>
                  ) : (
                    filteredCodes.map((c) => (
                      <tr key={c.code} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          <span className="select-all">{c.code}</span>
                          {c.system && (
                            <span className={`block mt-0.5 w-fit text-[8.5px] px-1 py-px rounded font-sans font-bold tracking-wide ${
                              c.system === 'ICD-10-CM' ? 'bg-sky-50 text-sky-800' : c.system === 'CPT' ? 'bg-teal-50 text-teal-800' : 'bg-amber-50 text-amber-800'
                            }`}>
                              {c.system}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 truncate max-w-xs">{c.description}</td>
                        <td className="px-4 py-3 text-slate-500">{c.category}</td>
                        <td className="px-4 py-3 font-mono text-[10.5px] text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            {c.entryDate}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            c.legitimacy === 'Approved / Industry Standard' ? 'bg-emerald-55 text-emerald-800' :
                            c.legitimacy === 'Pending Review' ? 'bg-amber-50 text-amber-800' :
                            c.legitimacy === 'Experimental' ? 'bg-indigo-50 text-indigo-800' : 'bg-rose-50 text-rose-850'
                          }`}>
                            {c.legitimacy}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleAuthenticate(c.code)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              c.authenticated 
                                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-800' 
                                : 'bg-rose-50 hover:bg-rose-100 border-rose-100 text-rose-800'
                            }`}
                          >
                            {c.authenticated ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Authenticated</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>Unreviewed</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(c)}
                              className="p-1 px-2 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-lg border border-slate-200 cursor-pointer"
                              title="Edit register data"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCode(c.code)}
                              className="p-1 px-2 bg-rose-55 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-100 cursor-pointer"
                              title="Delete code from register"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>Displaying <strong>{filteredCodes.length}</strong> of <strong>{codes.length}</strong> codes</span>
              <span>Prism Optimizer Core v4.1</span>
            </div>
          </div>
        </>
      )}

      {/* SICKNESS AND MEDICAL CONDITIONS ADVISORY CATALOG TAB */}
      {activeSubTab === 'conditions' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          
          {/* SYMPTOM MATCHING INTEGRATION TOOL (Interactive Symptom Advisor) */}
          <div className="bg-white border border-slate-200 rounded-[30px] p-5 shadow-xs text-left space-y-4">
            <div className="border-b pb-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Clinical Symptom Vector Matcher & Advisor</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Toggle reported indicators to calculate analytical diagnostic probability, safe medications, and and after-care instructions.</p>
              </div>
              {selectedSymptoms.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSymptoms([])}
                  className="px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Indicators Checklist ({selectedSymptoms.length})
                </button>
              )}
            </div>

            {/* Symptoms Grid checkbox badges */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-mono tracking-wider font-extrabold uppercase block select-none">Active Symptom Profile checklist</span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                {Array.from(new Set(conditions.flatMap(c => c.symptoms || []))).sort().map((symptom, sidx) => {
                  const isChecked = selectedSymptoms.includes(symptom);
                  return (
                    <button
                      key={sidx}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedSymptoms(selectedSymptoms.filter(item => item !== symptom));
                        } else {
                          setSelectedSymptoms([...selectedSymptoms, symptom]);
                        }
                        playBeep();
                      }}
                      className={`text-[11px] font-semibold py-1 px-3 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-emerald-950 border-emerald-800 text-emerald-300 font-bold scale-[1.02]'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-emerald-400 shadow shadow-emerald-400' : 'bg-slate-300'}`} />
                      <span>{symptom}</span>
                      {isChecked ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3 text-slate-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Match output feedback */}
            {selectedSymptoms.length > 0 && (
              <div className="pt-2 animate-in slide-in-from-top-2 duration-250">
                <span className="text-[10px] text-slate-400 font-mono tracking-wider font-extrabold uppercase block mb-2">Probability Scoring based on indicator match</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {conditions.map(cond => {
                    const matchedSymptoms = cond.symptoms.filter(s => selectedSymptoms.includes(s));
                    const matchPercent = Math.round((matchedSymptoms.length / cond.symptoms.length) * 100);
                    if (matchPercent === 0) return null;
                    return (
                      <div key={cond.id} className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-3.5 space-y-2 text-left">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-900 block truncate leading-tight max-w-[150px]">{cond.name}</span>
                          <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-800 shrink-0">
                            {matchPercent}% Matches
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-500 leading-normal">
                          <strong className="text-slate-600">Commonalities: </strong>
                          {matchedSymptoms.join(', ')}
                        </div>
                        <div className="text-[10.5px] text-teal-800 leading-normal border-t border-emerald-100/40 pt-1.5 flex items-center gap-1">
                          <Pill className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate">Active therapy: <strong>{cond.appropriateMedications[0]}</strong></span>
                        </div>
                      </div>
                    );
                  }).filter(Boolean).length === 0 && (
                    <div className="col-span-full py-3.5 text-center text-xs text-slate-450 italic bg-slate-50 rounded-xl">
                      No matching conditions currently match those specific indications. Check others!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MAIN SICKNESS DIRECTORY GRID */}
          <div className="bg-white border border-slate-205 rounded-[30px] p-5 shadow-xs text-left space-y-5">
            
            {/* SEARCH AND FILTER SUB-GRID */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={condSearchQuery}
                  onChange={e => setCondSearchQuery(e.target.value)}
                  placeholder="Search disease titles, categories, symptoms, or medications..."
                  className="w-full bg-white border border-slate-205 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl">
                  <Filter className="w-3 h-3 text-slate-400 shrink-0" />
                  <select
                    value={selectedCondType}
                    onChange={e => setSelectedCondType(e.target.value)}
                    className="text-xs bg-transparent border-0 outline-none py-0.5 cursor-pointer text-slate-705 font-bold text-slate-700"
                  >
                    <option value="All">All Categories</option>
                    <option value="Sickness/Acute">Sickness / Acute</option>
                    <option value="Illness/Infectious">Illness / Infectious</option>
                    <option value="Chronic Condition">Chronic Conditions</option>
                    <option value="Medical Condition/Other">Other Conditions</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCondSearchQuery('');
                    setSelectedCondType('All');
                    setSelectedSymptoms([]);
                  }}
                  className="text-xs font-bold px-3 py-1 bg-slate-200 text-slate-650 hover:bg-slate-250 cursor-pointer rounded-xl transition"
                >
                  Clear Advisory Filters
                </button>
              </div>
            </div>

            {/* GRID LAYOUT FOR CONDITIONS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-2">
              {conditions.filter(c => {
                const typeMatch = selectedCondType === 'All' || c.category === selectedCondType;
                const searchString = condSearchQuery.toLowerCase();
                const searchMatch = c.name.toLowerCase().includes(searchString) ||
                                    c.category.toLowerCase().includes(searchString) ||
                                    c.symptoms.some(s => s.toLowerCase().includes(searchString)) ||
                                    c.appropriateMedications.some(m => m.toLowerCase().includes(searchString));
                                    
                let matchFilter = true;
                if (selectedSymptoms.length > 0) {
                  matchFilter = c.symptoms.some(s => selectedSymptoms.includes(s));
                }
                return typeMatch && searchMatch && matchFilter;
              }).length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 italic bg-slate-50 border rounded-2xl">
                  No registered medical conditions match your query. Clear your filters above to view the full catalog.
                </div>
              ) : (
                conditions.filter(c => {
                  const typeMatch = selectedCondType === 'All' || c.category === selectedCondType;
                  const searchString = condSearchQuery.toLowerCase();
                  const searchMatch = c.name.toLowerCase().includes(searchString) ||
                                      c.category.toLowerCase().includes(searchString) ||
                                      c.symptoms.some(s => s.toLowerCase().includes(searchString)) ||
                                      c.appropriateMedications.some(m => m.toLowerCase().includes(searchString));
                                      
                  let matchFilter = true;
                  if (selectedSymptoms.length > 0) {
                    matchFilter = c.symptoms.some(s => selectedSymptoms.includes(s));
                  }
                  return typeMatch && searchMatch && matchFilter;
                }).map(cond => {
                  return (
                    <div 
                      key={cond.id} 
                      className="border border-slate-200 hover:border-slate-300 rounded-[28px] p-5 shadow-xs bg-white transition-all space-y-4 hover:shadow-sm"
                    >
                      {/* Title row */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg inline-block shrink-0">
                              <Stethoscope className="w-4 h-4" />
                            </span>
                            <h4 className="text-sm font-black text-slate-900 leading-snug select-all">{cond.name}</h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                            <span className="text-slate-400 font-mono font-bold">{cond.id}</span>
                            <span className="text-slate-300">•</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider ${
                              cond.category === 'Sickness/Acute' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                              cond.category === 'Illness/Infectious' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              cond.category === 'Chronic Condition' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 
                              'bg-slate-50 text-slate-700 border border-slate-100'
                            }`}>
                              {cond.category}
                            </span>
                            {(cond.icd10Codes || []).map(code => (
                              <span key={code} title="Linked ICD-10-CM diagnosis code" className="font-mono font-bold px-1.5 py-0.5 rounded text-[9px] bg-sky-50 text-sky-800 border border-sky-100">
                                ICD-10 {code}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Edit/Delete controls (FDBA only) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditCondition(cond)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Edit condition records"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCondition(cond.id, cond.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-105 text-rose-600 hover:text-rose-800 rounded-lg transition-all cursor-pointer"
                            title="Purge condition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Accuracy Score Indicator */}
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs">
                        <div className="flex justify-between items-center text-[11px] text-slate-650">
                          <span className="font-bold flex items-center gap-1 text-slate-705">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Diagnostic Accuracy Matching index</span>
                          </span>
                          <span className="font-mono text-emerald-600 font-extrabold">{cond.accuracyProbability}% Standard</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                            style={{ width: `${cond.accuracyProbability}%` }}
                          />
                        </div>
                      </div>

                      {/* Symptoms collection */}
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Typical Symptoms</span>
                        <div className="flex flex-wrap gap-1">
                          {cond.symptoms.map((symptom, sidx) => (
                            <span 
                              key={sidx} 
                              className={`text-[10.5px] font-medium px-2 py-0.5 rounded-md ${
                                selectedSymptoms.includes(symptom)
                                  ? 'bg-emerald-950 text-emerald-300 font-extrabold border border-emerald-800'
                                  : 'bg-slate-100 border border-slate-150 text-slate-650'
                              }`}
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Appropriate Medications to acquire */}
                      <div className="space-y-1.5 text-left">
                        <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block flex items-center gap-1 selection:none">
                          <Pill className="w-3 h-3 text-emerald-600" />
                          <span>Appropriate Medications to Acquire</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cond.appropriateMedications.map((med, midx) => (
                            <span key={midx} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-emerald-50/60 border border-emerald-100 rounded-lg px-2.5 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {med}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Allergy warns & cautions box */}
                      <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-2xl space-y-2 text-xs text-left">
                        <div className="flex items-center gap-1.5 text-rose-900 font-bold text-[11px]">
                          <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Safety Warnings & Side-Effect Cautions</span>
                        </div>
                        <div className="text-slate-650 text-[10.5px] leading-relaxed space-y-2">
                          <p>
                            <strong className="text-rose-800 block">Hypersensitivity & Allergy Cautions:</strong>
                            {cond.allergyCautions || "None recorded."}
                          </p>
                          <p>
                            <strong className="text-slate-800 block">Adverse Side Effects:</strong>
                            {cond.adverseSideEffects || "None recorded."}
                          </p>
                        </div>
                      </div>

                      {/* After care checklists */}
                      <div className="bg-amber-50/30 border border-amber-100 p-3 rounded-2xl text-xs text-left space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                          <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Recommended After-Care & Healing Process</span>
                        </div>
                        <p className="text-slate-650 text-[10.5px] leading-relaxed">
                          {cond.afterCare}
                        </p>
                      </div>

                      {/* Footer update date */}
                      <div className="text-[9.5px] font-mono text-slate-400 text-right pt-1 select-none">
                        Dossier validated: {cond.lastUpdated}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>Displaying <strong>{conditions.filter(c => {
                const typeMatch = selectedCondType === 'All' || c.category === selectedCondType;
                const searchString = condSearchQuery.toLowerCase();
                const searchMatch = c.name.toLowerCase().includes(searchString) ||
                                    c.category.toLowerCase().includes(searchString) ||
                                    c.symptoms.some(s => s.toLowerCase().includes(searchString)) ||
                                    c.appropriateMedications.some(m => m.toLowerCase().includes(searchString));
                let matchFilter = true;
                if (selectedSymptoms.length > 0) {
                  matchFilter = c.symptoms.some(s => selectedSymptoms.includes(s));
                }
                return typeMatch && searchMatch && matchFilter;
              }).length}</strong> of <strong>{conditions.length}</strong> conditions dossiers</span>
              <span>Therapeutic Advisory Module v2.0</span>
            </div>

          </div>
        </div>
      )}

      {/* CREATE & EDIT MODAL OVERLAY */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border rounded-[26px] p-6 max-w-md w-full shadow-2xl relative text-left"
            >
              <button 
                onClick={closeForm}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-base font-extrabold text-slate-900 border-b pb-2 mb-4 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-teal-600" />
                <span>{editingCodeId ? 'Edit Diagnostic Code Entry' : 'Create New Diagnostic Key'}</span>
              </h2>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1">Code ID (e.g. 99213, G0306)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCodeId}
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    placeholder="Enter unique alphanumeric code..."
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1">Clinical Standard Description</label>
                  <input
                    type="text"
                    required
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Brief definition of medical service or illness..."
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1">Code Category Class</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs bg-white"
                  >
                    <option value="Clinical Laboratory Services">Clinical Laboratory Services</option>
                    <option value="Physical & Occupational Therapy">Physical & Occupational Therapy</option>
                    <option value="Radiology & Imaging Services">Radiology & Imaging Services</option>
                    <option value="Radiation Therapy">Radiation Therapy</option>
                    <option value="Preventive Screenings & Vaccines">Preventive Screenings & Vaccines</option>
                    <option value="Custom Codebook Entry">Custom Codebook Entry</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-2 border-b">
                  <div>
                    <label className="block text-xs font-bold text-slate-650 mb-1">Industry standard legitimacy</label>
                    <select
                      value={formLegitimacy}
                      onChange={e => setFormLegitimacy(e.target.value as any)}
                      className="w-full px-2 py-2 border border-slate-205 rounded-xl text-xs bg-white"
                    >
                      <option value="Approved / Industry Standard">Approved</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Experimental">Experimental</option>
                      <option value="Obsolete">Obsolete</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formAuthenticated}
                        onChange={e => setFormAuthenticated(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-350 accent-teal-650"
                      />
                      <span className="text-xs font-semibold text-slate-650">Mark Authenticated</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Register Elements</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}

        {isCondFormOpen && (
          <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border rounded-[26px] p-6 max-w-lg w-full shadow-2xl relative text-left my-8"
            >
              <button 
                type="button"
                onClick={closeCondForm}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <h2 className="text-base font-extrabold text-slate-900 border-b pb-2.5 mb-4 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>{editingCondId ? 'Edit Medical Dossier' : 'Register New Medical Dossier'}</span>
              </h2>

              <form onSubmit={handleCreateOrUpdateCondition} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Condition Name</label>
                    <input
                      type="text"
                      required
                      value={formCondName}
                      onChange={e => setFormCondName(e.target.value)}
                      placeholder="e.g. Influenza A"
                      className="w-full px-3.5 py-1.5 border border-slate-205 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Clinical Classification</label>
                    <select
                      value={formCondCategory}
                      onChange={e => setFormCondCategory(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-205 rounded-xl text-xs bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Sickness/Acute">Sickness/Acute</option>
                      <option value="Illness/Infectious">Illness/Infectious</option>
                      <option value="Chronic Condition">Chronic Condition</option>
                      <option value="Medical Condition/Other">Medical Condition/Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Typical Symptoms (Comma-separated list)</label>
                  <input
                    type="text"
                    required
                    value={formCondSymptoms}
                    onChange={e => setFormCondSymptoms(e.target.value)}
                    placeholder="e.g. Sore throat, Fever, Fatigue, Body aches"
                    className="w-full px-3.5 py-1.5 border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Enter symptoms partitioned by commas for checklist assignment.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 font-sans">Diagnostic Accuracy Probability (%)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={formCondProbability}
                      onChange={e => setFormCondProbability(Number(e.target.value))}
                      placeholder="e.g. 95"
                      className="w-full px-3.5 py-1.5 border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Medications list (Comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={formCondMeds}
                      onChange={e => setFormCondMeds(e.target.value)}
                      placeholder="e.g. Tamiflu (75mg), Ibuprofen"
                      className="w-full px-3.5 py-1.5 border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 text-rose-800">Hypersensitivity & Allergy Warnings</label>
                  <textarea
                    required
                    rows={2}
                    value={formCondAllergyCautions}
                    onChange={e => setFormCondAllergyCautions(e.target.value)}
                    placeholder="e.g. Contraindicated if hypersensitive to neuraminidase inhibitors..."
                    className="w-full px-3.5 py-1.5 border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 text-slate-705">Common Adverse Effects</label>
                  <textarea
                    required
                    rows={2}
                    value={formCondAdverseEffects}
                    onChange={e => setFormCondAdverseEffects(e.target.value)}
                    placeholder="e.g. Nausea, headache, dizziness, insomnia..."
                    className="w-full px-3.5 py-1.5 border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 text-amber-805">Healing Process & Recommended After-Care</label>
                  <textarea
                    required
                    rows={2}
                    value={formCondAfterCare}
                    onChange={e => setFormCondAfterCare(e.target.value)}
                    placeholder="e.g. Initiate Tamiflu dosing within 48h. Secure complete bedrest, plenty fluids..."
                    className="w-full px-3.5 py-1.5 border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeCondForm}
                    className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-slate-950" />
                    <span>Save Advisory Dossier</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
