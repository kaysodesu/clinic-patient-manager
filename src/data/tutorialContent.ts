// Content for the onboarding tours, how-to video walkthroughs and the in-app user manual.

export type AppSection =
  | 'database' | 'intake' | 'visitation' | 'prescriptions' | 'secure_records' | 'marketing'
  | 'feedback' | 'patient_portal' | 'settings' | 'it_support' | 'diagnostic_database' | 'code_audit';

export interface TourStep {
  id: string;
  /** Screen to open before showing the step (omit to stay where you are) */
  section?: AppSection;
  /** CSS selector to highlight; falls back to the main panel when hidden (e.g. on phones) */
  target?: string;
  title: string;
  body: string;
}

export interface SectionGuide {
  section: AppSection;
  label: string;
  navTarget: string;
  /** Who uses this screen and what for, one sentence */
  summary: string;
  /** Duration shown on the video card */
  videoLength: string;
  /** Optional recorded video (mp4/webm published alongside the app). Empty = interactive walkthrough */
  videoUrl?: string;
  steps: TourStep[];
}

export const SECTION_GUIDES: SectionGuide[] = [
  {
    section: 'database', label: 'Patients', navTarget: '#desktop-nav-database', videoLength: '0:40',
    summary: 'The home screen: scan IDs, search every registered patient and update their visit status.',
    steps: [
      { id: 'db-1', section: 'database', target: '#desktop-nav-database', title: 'Patients',
        body: 'This is home base. Every registered patient appears here with their status: In Processing, Triage, With Doctor or Discharged.' },
      { id: 'db-2', section: 'database', target: 'main', title: 'ID & wristband scanner',
        body: 'At the top, the scanner reads wristbands, licenses, state IDs and passports. Try a sample ID card: it pre-fills the intake form for a new patient or opens the chart of an existing one.' },
      { id: 'db-3', section: 'database', target: '#load-test-patients-btn', title: 'Load test patients',
        body: 'Click "Load Test Patients" to add five fictional patients, each with a visit and an invoice, so you have something to practice on. "New Intake" registers a brand-new patient.' },
    ],
  },
  {
    section: 'intake', label: 'New patient intake', navTarget: '#desktop-nav-intake', videoLength: '0:30',
    summary: 'A guided four-step registration form for new patients.',
    steps: [
      { id: 'in-1', section: 'intake', target: 'main', title: 'Four-step intake',
        body: 'Register a new patient in four steps: personal and emergency contacts, medical and social history, current symptoms, then insurance and billing. Saving creates the patient and their copay invoice automatically.' },
    ],
  },
  {
    section: 'visitation', label: 'Visits & notes', navTarget: '#desktop-nav-visitation', videoLength: '0:45',
    summary: 'Clinicians record visits with ICD-10 and CPT codes, write progress notes, schedule and arrange transfers.',
    steps: [
      { id: 'vi-1', section: 'visitation', target: 'main', title: 'Visits and coding',
        body: 'Pick a patient to see their visits. Each visit lists diagnosis (ICD-10) and billing (CPT/HCPCS) codes with plain-language descriptions.' },
      { id: 'vi-2', section: 'visitation', target: 'main', title: 'Notes, scheduling and transfers',
        body: 'Further down you can write progress notes with comment threads, offer appointment times, track patient availability and log a transfer or referral to another facility.' },
    ],
  },
  {
    section: 'prescriptions', label: 'Prescriptions', navTarget: '#desktop-nav-prescriptions', videoLength: '0:30',
    summary: 'Prescribe and track medications, with the patient’s allergies in view.',
    steps: [
      { id: 'rx-1', section: 'prescriptions', target: 'main', title: 'Prescriptions',
        body: 'Add, refill or stop medications for the selected patient. Always check the allergy list shown with the patient before prescribing.' },
    ],
  },
  {
    section: 'secure_records', label: 'Messages & summaries', navTarget: '#desktop-nav-secure-records', videoLength: '0:35',
    summary: 'Secure doctor-patient conversation records and after-visit summaries.',
    steps: [
      { id: 'sr-1', section: 'secure_records', target: 'main', title: 'Secure records',
        body: 'Store consent-signed conversation records and write after-visit summaries (AVS) with vitals, diagnoses and next steps for the patient to take home.' },
    ],
  },
  {
    section: 'marketing', label: 'Outreach & feedback', navTarget: '#desktop-nav-marketing', videoLength: '0:30',
    summary: 'Send reminders, newsletters and consent requests by text or email.',
    steps: [
      { id: 'mk-1', section: 'marketing', target: 'main', title: 'Patient communications',
        body: 'Preview and send appointment reminders, wellness newsletters and opt-in requests. Every message is logged in the dispatch history.' },
    ],
  },
  {
    section: 'feedback', label: 'Patient feedback', navTarget: '#desktop-nav-marketing', videoLength: '0:20',
    summary: 'Collect and review patient feedback and satisfaction surveys.',
    steps: [
      { id: 'fb-1', section: 'feedback', target: 'main', title: 'Feedback',
        body: 'Send satisfaction surveys after a visit and review what patients said.' },
    ],
  },
  {
    section: 'patient_portal', label: 'Patient portal', navTarget: '#desktop-nav-patient-portal', videoLength: '0:35',
    summary: 'What patients, parents and legal representatives see when they sign in.',
    steps: [
      { id: 'pp-1', section: 'patient_portal', target: 'main', title: 'Patient portal',
        body: 'Patients choose whether they are the patient, a power-of-attorney representative or a family member. They can then pick appointment times, read summaries and message the clinic securely.' },
    ],
  },
  {
    section: 'settings', label: 'Patient profile', navTarget: '#desktop-nav-settings', videoLength: '0:25',
    summary: 'Profile details, billing and payment methods, FAQs, contact and app display settings.',
    steps: [
      { id: 'st-1', section: 'settings', target: 'main', title: 'Profile and settings',
        body: 'Update contact details, manage payment cards, read the FAQ, chat with the clinic and adjust brightness, text size and sound.' },
    ],
  },
  {
    section: 'it_support', label: 'IT support', navTarget: '#desktop-nav-it-support', videoLength: '0:25',
    summary: 'System activity log, duplicate-record merging and troubleshooting (IT, Operations and Admin roles).',
    steps: [
      { id: 'it-1', section: 'it_support', target: 'main', title: 'IT Support desk',
        body: 'Open to IT Support, Operations Managers and Administrators. Review the activity log and merge duplicate patient records.' },
    ],
  },
  {
    section: 'diagnostic_database', label: 'Diagnosis reference', navTarget: '#desktop-nav-diagnostic', videoLength: '0:40',
    summary: 'The clinic’s code library (ICD-10, CPT, HCPCS) and condition guidance (Database Administrator and Admin roles).',
    steps: [
      { id: 'dx-1', section: 'diagnostic_database', target: 'main', title: 'Diagnosis reference',
        body: 'Open to Database Administrators and Administrators. "Codes Registry Admin" holds the 2026 primary-care code set; "Conditions Advisory" links common conditions to ICD-10 codes with medications, cautions and after-care.' },
    ],
  },
  {
    section: 'code_audit', label: 'Code & Prompt Auditor', navTarget: '#desktop-nav-code-audit', videoLength: '0:20',
    summary: 'AI review of the app’s code for architecture, security and usability (needs an AI key).',
    steps: [
      { id: 'ca-1', section: 'code_audit', target: 'main', title: 'AI auditor',
        body: 'For developers: an AI reviewer that checks the app’s code from an architecture, security or usability point of view. It is switched off until an AI key is added.' },
    ],
  },
];

const INTRO_STEPS: TourStep[] = [
  { id: 'intro-1', target: 'aside', title: 'Welcome to Evergreen Valley Family Clinic',
    body: 'This short tour shows where everything is. The dark sidebar on the left is your main menu. On a phone, tap the ☰ button at the top instead.' },
  { id: 'intro-2', target: '#role-switcher, #account-panel', title: 'Your account and role',
    body: 'Each staff member signs in with their own account, and their role decides which tools they can open. Administrators add staff and set roles from Staff & access. (In the demo you can switch roles here instead.)' },
];

const OUTRO_STEPS: TourStep[] = [
  { id: 'outro-1', section: 'database', target: '#help-center-button', title: 'Help is always here',
    body: 'Click the Help button any time to replay a tour, watch a how-to walkthrough or open the user manual. Enjoy exploring!' },
];

export const FULL_TOUR: TourStep[] = [...INTRO_STEPS, ...SECTION_GUIDES.flatMap(g => g.steps), ...OUTRO_STEPS];

// ---------------- USER MANUAL ----------------

export const WHO_IT_IS_FOR = `Clinic Patient Dashboard is an all-in-one front-desk and back-office dashboard for small and growing healthcare practices: independent family and primary-care physicians, private specialty practices, walk-in and urgent-care clinics, therapists and behavioral health providers who see patients by telehealth, and the office managers, nurses, medical assistants and billing staff who keep them running.

Most small practices juggle several disconnected tools: one for scheduling, another for intake paperwork, a spreadsheet for invoices, and phone tag for patient messages. This dashboard brings those jobs together. Front-desk staff can scan an ID card or wristband, register new patients through a guided four-step intake, and see everyone's status at a glance. Clinicians can record visits with current ICD-10 diagnosis and CPT billing codes, write progress notes, manage prescriptions with allergy cautions, arrange transfers and publish after-visit summaries. Billing staff can issue copay invoices, take payments and set up payment plans. Patients, parents and legal representatives get a self-service portal for appointments, records and secure messages.

Role-based access keeps each person in their lane: receptionists, team leads, operations managers, IT support and database administrators each see the tools they need. It runs in a web browser on desktop computers, tablets and phones, so staff can check in a patient at the counter or review a chart from an exam room without installing any extra software.

This beta is a working demonstration built for hands-on testing and honest feedback. It contains only fictional patients and is not yet approved for real protected health information.`;

export const GETTING_STARTED: string[] = [
  'Sign in with the email and password your clinic administrator gave you. The very first person to open a new installation creates the administrator account.',
  'When the welcome window appears, pick a guided tour (you click Next), an automatic tour (it plays by itself) or the how-to walkthroughs. You can skip and come back any time with the Help button in the bottom-right corner.',
  'On Patients, click "Load Test Patients" to add five fictional practice patients.',
  'Click a patient to make them the active patient. Most screens work with the active patient shown in the top bar.',
  "Use the sidebar (or ☰ on a phone) to move between screens. Screens your role can't open say who can.",
  'Only ever type made-up information. This beta is for testing, not real patients.',
];

// Roles and what each can open (mirrors src/auth/permissions.ts)
export { ROLE_LABELS, ROLE_DESCRIPTIONS, STAFF_ROLES } from '../auth/permissions';
