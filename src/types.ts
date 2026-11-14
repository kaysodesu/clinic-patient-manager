export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface EmploymentCoverage {
  employmentStatus: string; // Employed, Unemployed, Student, Retired, etc.
  employerName: string;
  occupation: string;
  primaryCareProvider: string;
}

export interface MedicalSocialHistory {
  smokerStatus: string; // Never, Former, Active
  alcoholConsumption: string; // None, Occasional, Moderate, Heavy
  exerciseFrequency: string; // Light, Moderate, Heavy, None
  familyHistory: string[]; // e.g., Diabetes, Heart Disease, Hypertension
  pastSurgeries: string;
}

export interface MedicalQuestionnaire {
  chronicConditions: string[]; // e.g. Asthma, Diabetes, Hypertension, etc.
  otherChronicConditions: string;
  allergies: string; // Medications, food, seasonal, etc.
  prescriptions: string; // Currently taking Rx
  overTheCounter: string; // OTC drugs, vitamins, supplements
}

export interface CurrentVisit {
  symptoms: string;
  duration: string; // e.g. 3 days, 1 week
  severity: 'Mild' | 'Moderate' | 'Severe';
  department: string; // General Practice, Pediatrics, Cardiology, etc.
}

export interface EmergencyContact {
  fullName: string;
  relationship: string;
  phone: string;
  altPhone?: string;
  email?: string;
}

export interface InsuranceBillingInfo {
  providerName: string;
  policyNo: string;
  groupNo: string;
  policyHolderName: string;
  policyHolderDoB: string;
  individualDeductible: number;
  deductibleMet: number;
  copayAmount: number;
}

export interface Patient {
  id: string;
  personalInfo: PersonalInfo;
  employmentCoverage: EmploymentCoverage;
  medicalHistory: MedicalSocialHistory;
  medicalQuestionnaire: MedicalQuestionnaire;
  currentVisit: CurrentVisit;
  emergencyContact: EmergencyContact;
  insuranceBilling: InsuranceBillingInfo;
  status: 'In Processing' | 'Triage' | 'With Doctor' | 'Discharged';
  dateAdmitted: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  description: string;
  paymentMethod?: string;
  paymentDate?: string;
  isPartial?: boolean;
  originalAmount?: number;
  paidAmount?: number;
  penaltyApplied?: boolean;
  paymentPlanDeadline?: string;
  defaultCardUsed?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'clinic';
  text: string;
  timestamp: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'Billing' | 'Intake' | 'General' | 'Insurance';
}

export type ClinicRole = 'patient' | 'admin' | 'team_lead' | 'ops_manager' | 'it_support' | 'facility_database_administrator';

export interface VisitationRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  assistingStaff: string;
  reasonForVisit: string;
  symptoms: string;
  medicalHistorySummary: string;
  diagnosticCodes: string[]; // CPT/HCPCS codes
  visitDate: string;
}

export interface ProgressLogComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
  replies?: ProgressLogComment[]; // Nested replies / subcomments
}

export interface ClinicalAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'dicom';
  source: 'local' | 'cloud';
  url: string; // File contents as base64/objectUrl or Cloud URL
  timestamp: string;
  size?: string;
}

export interface ProgressLogNote {
  id: string;
  patientId: string;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  timestamp: string;
  severity: 'routine' | 'urgent' | 'critical';
  comments: ProgressLogComment[];
  attachments: ClinicalAttachment[];
}

export interface Pharmacy {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  hours: string;
}

export interface CallLogEntry {
  id: string;
  timestamp: string;
  callerRole: 'patient' | 'clinic_staff' | 'pharmacy';
  callerName: string;
  summary: string;
  followUpRequired: boolean;
}

export interface PatientSideEffectReport {
  id: string;
  timestamp: string;
  symptomName: string;
  reportedSeverity: 'routine' | 'urgent' | 'critical';
  notes: string;
  actionTaken: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  name: string;
  pronunciation: string;
  dosage: string;
  whatItDoes: string;
  whatItTreats: string;
  instructions: string;
  refillDate: string;
  nextVisitDate: string;
  pharmacy: Pharmacy;
  callLogs: CallLogEntry[];
  sideEffectNotes: PatientSideEffectReport[];
}

export interface ITEvent {
  id: string;
  timestamp: string;
  type: 'LOGIN_ERROR' | 'PATIENT_PROFILE_UPDATE' | 'VISITATION_UPDATE' | 'PATIENT_STATUS_UPDATE' | 'NOTE_UPDATE' | 'INTAKE_UPDATE' | 'SYSTEM_ERROR' | 'PROFILE_MERGED' | 'OTHER';
  details: string;
  author: string;
  status: 'SUCCESS' | 'ERROR';
}

export interface PatientTransfer {
  id: string;
  patientId: string;
  patientName: string;
  reasonForTransfer: string;
  severity: 'routine' | 'high_priority' | 'life_threatening';
  consentGiven: boolean;
  consentType: 'patient_direct' | 'power_of_attorney' | 'emergency_override';
  consentSigneeName?: string;
  transportTeam: string[]; // names of everyone in charge of transportation
  
  // Timestamps
  timestampInformed: string; // when patient was informed
  timestampPrepared: string; // when getting prepared for transport
  timestampEntryVehicle: string; // entry into vehicle
  timestampExitVehicle: string; // exit from vehicle once at location
  timestampRoomArrival: string; // when patient made it into the room
  timestampStaffContact: string; // when staff attending to the patient finally made contact with them
  
  status: 'draft' | 'in_transit' | 'completed';
  destination: string;
  notes?: string;
  createdAt: string;
}

export interface PatientAvailability {
  patientId: string;
  daysOfWeek: string[]; // e.g. ['Monday', 'Wednesday']
  preferredTimeRange: 'morning' | 'afternoon' | 'evening' | 'any';
  customNotes?: string;
  lastUpdated: string;
}

export interface AppointmentOption {
  id: string;
  dateTime: string; // ISO string e.g., "2026-06-10T10:00:00"
}

export interface PatientAppointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  status: 'pending_selection' | 'confirmed' | 'excused' | 'unexcused';
  selectedDateTime?: string; // becomes locked when selected
  options: AppointmentOption[]; // options provided by nurse/doctor
  excuseReason?: string; // up to 1000 chars
  cancellationFee?: number;
  unexcusedReason?: string;
  createdAt: string;
  selectionTimestamp?: string;
}





