// Five fictional beta-test scenarios covering common private-practice workflows.
// Every name, phone (555-01xx is reserved for fiction), email (example.com), address,
// insurer and policy number here is made up. Loaded on demand from the Patient Records screen.
import { Patient, Invoice, VisitationRecord } from '../types';

const TEST_NOTE = 'BETA TEST PATIENT - fictional record for testing only.';
const PROVIDER = 'Dr. Amelia Hart, MD (test provider)';

export interface BetaScenario {
  title: string;
  summary: string;
}

export const betaScenarios: Record<string, BetaScenario> = {
  'TEST-001': {
    title: 'New patient annual physical with abnormal labs',
    summary: 'Preventive visit for a new adult patient; A1c comes back in the prediabetes range and BMI is in the obesity range. Practice: preventive codes, lab orders, dietary counseling, follow-up scheduling.',
  },
  'TEST-002': {
    title: 'Chronic care: uncontrolled diabetes and hypertension',
    summary: 'Established patient with rising A1c and high home BP readings. Practice: chronic-care follow-up with G2211, enrolling in remote blood-pressure monitoring, medication changes, care management.',
  },
  'TEST-003': {
    title: 'Pediatric sick visit: strep throat',
    summary: 'Seven-year-old brought in by a parent with sore throat and fever; rapid strep test is positive. Practice: guardian/POA consent, point-of-care testing, prescriptions with allergy checks, school note.',
  },
  'TEST-004': {
    title: 'Telehealth behavioral health follow-up',
    summary: 'Video follow-up for generalized anxiety with GAD-7 / PHQ-9 screening. Practice: 2025 telehealth codes, secure messaging, behavioral health screening, after-visit summary.',
  },
  'TEST-005': {
    title: 'Medicare annual wellness visit, knee arthritis and vaccines',
    summary: 'Older adult for a subsequent Annual Wellness Visit with left knee osteoarthritis and fall-risk concerns; due for high-dose flu and RSV vaccines. Practice: Medicare wellness codes, vaccines with admin codes, PT referral, transfers.',
  },
};

export const betaTestPatients: Patient[] = [
  {
    id: 'TEST-001',
    personalInfo: {
      firstName: 'Maya', lastName: 'Thompson', dateOfBirth: '1992-03-18', gender: 'Female',
      phone: '(555) 010-1001', email: 'maya.thompson@example.com',
      address: '101 Test Meadow Ln', city: 'Evergreen Valley', state: 'WA', zipCode: '00001',
    },
    employmentCoverage: {
      employmentStatus: 'Full-Time', employerName: 'Sample Logistics Co.', occupation: 'Project Coordinator',
      primaryCareProvider: PROVIDER,
    },
    medicalHistory: {
      smokerStatus: 'Never', alcoholConsumption: 'Occasional', exerciseFrequency: 'Light',
      familyHistory: ['Diabetes', 'Hypertension'], pastSurgeries: 'None',
    },
    medicalQuestionnaire: {
      chronicConditions: [], otherChronicConditions: '', allergies: 'No known drug allergies',
      prescriptions: 'None', overTheCounter: 'Multivitamin daily',
    },
    currentVisit: {
      symptoms: 'New patient annual physical. Reports low energy in the afternoons; no acute complaints.',
      duration: 'N/A (preventive visit)', severity: 'Mild', department: 'Family Medicine',
    },
    emergencyContact: { fullName: 'Chris Thompson', relationship: 'Spouse', phone: '(555) 010-1002' },
    insuranceBilling: {
      providerName: 'Northwind Health PPO (test)', policyNo: 'TEST-NW-1001', groupNo: 'GRP-TEST-01',
      policyHolderName: 'Maya Thompson', policyHolderDoB: '1992-03-18',
      individualDeductible: 1500, deductibleMet: 200, copayAmount: 25,
    },
    status: 'With Doctor',
    dateAdmitted: '2026-11-10',
    notes: `${TEST_NOTE} BMI 31.2. A1c 6.0% (prediabetes range). Plan: dietary counseling, recheck A1c in 3 months.`,
  },
  {
    id: 'TEST-002',
    personalInfo: {
      firstName: 'Robert', lastName: 'Delgado', dateOfBirth: '1968-07-02', gender: 'Male',
      phone: '(555) 010-2001', email: 'robert.delgado@example.com',
      address: '202 Sample Ridge Rd', city: 'Evergreen Valley', state: 'WA', zipCode: '00002',
    },
    employmentCoverage: {
      employmentStatus: 'Full-Time', employerName: 'Example Freight LLC', occupation: 'Truck Dispatcher',
      primaryCareProvider: PROVIDER,
    },
    medicalHistory: {
      smokerStatus: 'Former', alcoholConsumption: 'Occasional', exerciseFrequency: 'None',
      familyHistory: ['Heart Disease', 'Diabetes'], pastSurgeries: 'Cholecystectomy (2015)',
    },
    medicalQuestionnaire: {
      chronicConditions: ['Diabetes', 'Hypertension', 'High Cholesterol'], otherChronicConditions: '',
      allergies: 'Sulfa drugs (rash)',
      prescriptions: 'Metformin 1000mg BID; Lisinopril 20mg daily; Atorvastatin 40mg daily',
      overTheCounter: 'Aspirin 81mg daily',
    },
    currentVisit: {
      symptoms: 'Diabetes and blood pressure follow-up. Home BP readings averaging 152/94. Increased thirst.',
      duration: '3 months', severity: 'Moderate', department: 'Family Medicine',
    },
    emergencyContact: { fullName: 'Ana Delgado', relationship: 'Spouse', phone: '(555) 010-2002' },
    insuranceBilling: {
      providerName: 'Contoso Health HMO (test)', policyNo: 'TEST-CH-2001', groupNo: 'GRP-TEST-02',
      policyHolderName: 'Robert Delgado', policyHolderDoB: '1968-07-02',
      individualDeductible: 2500, deductibleMet: 1800, copayAmount: 35,
    },
    status: 'Triage',
    dateAdmitted: '2026-11-11',
    notes: `${TEST_NOTE} A1c 8.4% (up from 7.6%). Consider GLP-1 RA; enroll in remote BP monitoring. Sulfa allergy on file.`,
  },
  {
    id: 'TEST-003',
    personalInfo: {
      firstName: 'Lily', lastName: 'Chen', dateOfBirth: '2019-05-21', gender: 'Female',
      phone: '(555) 010-3001', email: 'chen.family@example.com',
      address: '303 Example Ave', city: 'Evergreen Valley', state: 'WA', zipCode: '00003',
    },
    employmentCoverage: {
      employmentStatus: 'Student', employerName: 'Evergreen Valley Elementary (test)', occupation: '2nd grade student',
      primaryCareProvider: PROVIDER,
    },
    medicalHistory: {
      smokerStatus: 'Never', alcoholConsumption: 'None', exerciseFrequency: 'Moderate',
      familyHistory: ['Asthma'], pastSurgeries: 'None',
    },
    medicalQuestionnaire: {
      chronicConditions: [], otherChronicConditions: '', allergies: 'Amoxicillin (hives)',
      prescriptions: 'None', overTheCounter: "Children's ibuprofen as needed",
    },
    currentVisit: {
      symptoms: 'Sore throat, fever of 102.1°F, swollen glands, no cough. Rapid strep test positive.',
      duration: '2 days', severity: 'Moderate', department: 'Pediatrics',
    },
    emergencyContact: { fullName: 'Grace Chen', relationship: 'Mother (legal guardian)', phone: '(555) 010-3002' },
    insuranceBilling: {
      providerName: 'State Medicaid Kids Plan (test)', policyNo: 'TEST-MK-3001', groupNo: 'GRP-TEST-03',
      policyHolderName: 'Grace Chen', policyHolderDoB: '1988-09-30',
      individualDeductible: 0, deductibleMet: 0, copayAmount: 0,
    },
    status: 'With Doctor',
    dateAdmitted: '2026-11-12',
    notes: `${TEST_NOTE} PENICILLIN-CLASS ALLERGY (amoxicillin - hives): choose a non-penicillin antibiotic. Guardian consent from mother. School excuse note requested.`,
  },
  {
    id: 'TEST-004',
    personalInfo: {
      firstName: 'Jordan', lastName: 'Reyes', dateOfBirth: '1999-11-04', gender: 'Non-binary',
      phone: '(555) 010-4001', email: 'jordan.reyes@example.com',
      address: '404 Placeholder St, Apt 2', city: 'Evergreen Valley', state: 'WA', zipCode: '00004',
    },
    employmentCoverage: {
      employmentStatus: 'Full-Time', employerName: 'Fabrikam Design Studio (test)', occupation: 'Graphic Designer',
      primaryCareProvider: PROVIDER,
    },
    medicalHistory: {
      smokerStatus: 'Never', alcoholConsumption: 'Occasional', exerciseFrequency: 'Moderate',
      familyHistory: ['Depression'], pastSurgeries: 'None',
    },
    medicalQuestionnaire: {
      chronicConditions: ['Anxiety'], otherChronicConditions: 'Generalized anxiety disorder (diagnosed 2025)',
      allergies: 'No known drug allergies', prescriptions: 'Sertraline 50mg daily', overTheCounter: 'Melatonin 3mg at night',
    },
    currentVisit: {
      symptoms: 'Telehealth (video) follow-up 6 weeks after starting sertraline. Worry improved; still poor sleep. GAD-7 = 9, PHQ-9 = 6.',
      duration: '6 weeks', severity: 'Mild', department: 'Behavioral Health (Telehealth)',
    },
    emergencyContact: { fullName: 'Sam Reyes', relationship: 'Sibling', phone: '(555) 010-4002' },
    insuranceBilling: {
      providerName: 'Northwind Health PPO (test)', policyNo: 'TEST-NW-4001', groupNo: 'GRP-TEST-04',
      policyHolderName: 'Jordan Reyes', policyHolderDoB: '1999-11-04',
      individualDeductible: 1500, deductibleMet: 1500, copayAmount: 20,
    },
    status: 'In Processing',
    dateAdmitted: '2026-11-12',
    notes: `${TEST_NOTE} Telehealth visit (patient at home). Prefers secure portal messages. Discuss CBT referral and sleep hygiene.`,
  },
  {
    id: 'TEST-005',
    personalInfo: {
      firstName: 'Evelyn', lastName: 'Brooks', dateOfBirth: '1954-02-09', gender: 'Female',
      phone: '(555) 010-5001', email: 'evelyn.brooks@example.com',
      address: '505 Demo Court', city: 'Evergreen Valley', state: 'WA', zipCode: '00005',
    },
    employmentCoverage: {
      employmentStatus: 'Retired', employerName: 'Retired (former teacher)', occupation: 'Retired',
      primaryCareProvider: PROVIDER,
    },
    medicalHistory: {
      smokerStatus: 'Former', alcoholConsumption: 'None', exerciseFrequency: 'Light',
      familyHistory: ['Osteoporosis', 'Heart Disease'], pastSurgeries: 'Cataract surgery, both eyes (2021)',
    },
    medicalQuestionnaire: {
      chronicConditions: ['Hypertension', 'Arthritis'], otherChronicConditions: 'Left knee osteoarthritis',
      allergies: 'Codeine (nausea)',
      prescriptions: 'Amlodipine 5mg daily; Meloxicam 7.5mg daily; Vitamin D3 2000 IU daily',
      overTheCounter: 'Acetaminophen as needed; calcium supplement',
    },
    currentVisit: {
      symptoms: 'Medicare Annual Wellness Visit. Left knee pain worse on stairs; one near-fall last month. Due for flu and RSV vaccines.',
      duration: '6 months (knee pain)', severity: 'Moderate', department: 'Family Medicine (Medicare Wellness)',
    },
    emergencyContact: { fullName: 'Michael Brooks', relationship: 'Son (healthcare POA)', phone: '(555) 010-5002' },
    insuranceBilling: {
      providerName: 'Original Medicare Part B (test)', policyNo: 'TEST-MBI-5001', groupNo: 'N/A',
      policyHolderName: 'Evelyn Brooks', policyHolderDoB: '1954-02-09',
      individualDeductible: 257, deductibleMet: 257, copayAmount: 0,
    },
    status: 'In Processing',
    dateAdmitted: '2026-11-12',
    notes: `${TEST_NOTE} Fall-risk screen positive. Review NSAID use with hypertension. Refer to physical therapy. Son is healthcare POA.`,
  },
];

export const betaTestVisits: VisitationRecord[] = [
  {
    id: 'TEST-VIS-001', patientId: 'TEST-001', patientName: 'Maya Thompson', doctorName: PROVIDER,
    assistingStaff: 'Test Nurse, RN', reasonForVisit: 'New patient annual preventive exam',
    symptoms: 'No acute complaints; afternoon fatigue',
    medicalHistorySummary: 'Family history of diabetes and hypertension. No medications. NKDA.',
    diagnosticCodes: ['99385', '36415', '83036', '80061', 'Z00.01', 'R73.03', 'E66.9', 'Z71.3'],
    visitDate: '2026-11-10',
  },
  {
    id: 'TEST-VIS-002', patientId: 'TEST-002', patientName: 'Robert Delgado', doctorName: PROVIDER,
    assistingStaff: 'Test Medical Assistant', reasonForVisit: 'Diabetes and hypertension follow-up; remote BP monitoring enrollment',
    symptoms: 'Increased thirst; home BP average 152/94',
    medicalHistorySummary: 'T2DM, HTN, hyperlipidemia. Former smoker. Sulfa allergy.',
    diagnosticCodes: ['99214', 'G2211', '83036', '99453', '99454', 'E11.65', 'I10', 'E78.5'],
    visitDate: '2026-11-11',
  },
  {
    id: 'TEST-VIS-003', patientId: 'TEST-003', patientName: 'Lily Chen', doctorName: PROVIDER,
    assistingStaff: 'Test Nurse, RN', reasonForVisit: 'Sore throat and fever',
    symptoms: 'Fever 102.1°F, tonsillar swelling, tender neck glands, no cough',
    medicalHistorySummary: 'Healthy child. Amoxicillin allergy (hives). Family history of asthma.',
    diagnosticCodes: ['99213', '87880', 'J02.0'],
    visitDate: '2026-11-12',
  },
  {
    id: 'TEST-VIS-004', patientId: 'TEST-004', patientName: 'Jordan Reyes', doctorName: PROVIDER,
    assistingStaff: 'Test Care Coordinator', reasonForVisit: 'Telehealth anxiety follow-up (audio-video)',
    symptoms: 'Improved worry, ongoing insomnia. GAD-7 9, PHQ-9 6.',
    medicalHistorySummary: 'Generalized anxiety disorder on sertraline 50mg. NKDA.',
    diagnosticCodes: ['98006', '96127', 'F41.1'],
    visitDate: '2026-11-12',
  },
  {
    id: 'TEST-VIS-005', patientId: 'TEST-005', patientName: 'Evelyn Brooks', doctorName: PROVIDER,
    assistingStaff: 'Test Nurse, RN', reasonForVisit: 'Medicare Annual Wellness Visit (subsequent), knee pain, vaccines',
    symptoms: 'Left knee pain on stairs; near-fall last month',
    medicalHistorySummary: 'HTN, left knee OA, former smoker. Codeine intolerance. Son is healthcare POA.',
    diagnosticCodes: ['G0439', '90662', '90679', '90471', '90472', 'M17.12', 'I10', 'Z23'],
    visitDate: '2026-11-12',
  },
];

export const betaTestInvoices: Invoice[] = [
  { id: 'TEST-INV-001', patientId: 'TEST-001', patientName: 'Maya Thompson', date: '2026-11-10', dueDate: '2026-12-10', amount: 25, status: 'Pending', description: 'Preventive visit copay (test)' },
  { id: 'TEST-INV-002', patientId: 'TEST-002', patientName: 'Robert Delgado', date: '2026-11-11', dueDate: '2026-12-11', amount: 35, status: 'Overdue', description: 'Office visit copay (test)' },
  { id: 'TEST-INV-003', patientId: 'TEST-003', patientName: 'Lily Chen', date: '2026-11-12', dueDate: '2026-12-12', amount: 0, status: 'Paid', description: 'Medicaid - no copay (test)', paymentMethod: 'Insurance', paymentDate: '2026-11-12' },
  { id: 'TEST-INV-004', patientId: 'TEST-004', patientName: 'Jordan Reyes', date: '2026-11-12', dueDate: '2026-12-12', amount: 20, status: 'Pending', description: 'Telehealth visit copay (test)' },
  { id: 'TEST-INV-005', patientId: 'TEST-005', patientName: 'Evelyn Brooks', date: '2026-11-12', dueDate: '2026-12-12', amount: 0, status: 'Paid', description: 'Medicare wellness visit - no cost share (test)', paymentMethod: 'Insurance', paymentDate: '2026-11-12' },
];
