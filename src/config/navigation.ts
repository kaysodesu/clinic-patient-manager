// One place for every section's name, menu group, icon and page description.
// The sidebar, mobile menu and top bar all read from here so they never drift apart.
import {
  Users, Stethoscope, Pill, ShieldCheck, ClipboardPlus, UserRound, Settings,
  Megaphone, LifeBuoy, Database, Code2, Receipt, type LucideIcon,
} from 'lucide-react';

export type ViewId =
  | 'database' | 'intake' | 'billing' | 'settings' | 'visitation' | 'prescriptions'
  | 'secure_records' | 'marketing' | 'it_support' | 'diagnostic_database' | 'patient_portal' | 'code_audit';

export interface ViewMeta {
  id: ViewId;
  /** Short label for the menu */
  label: string;
  /** Page title in the top bar */
  title: string;
  /** One plain-language line under the title */
  description: string;
  icon: LucideIcon;
  group: NavGroup;
  /** Hidden from the menu (reached from another screen) */
  hidden?: boolean;
}

export type NavGroup = 'Patient care' | 'Patient access' | 'Front office' | 'Admin & IT';
export const NAV_GROUPS: NavGroup[] = ['Patient care', 'Patient access', 'Front office', 'Admin & IT'];

export const VIEWS: ViewMeta[] = [
  { id: 'database', label: 'Patients', title: 'Patients', description: 'Find a patient, check intake status and add quick notes.', icon: Users, group: 'Patient care' },
  { id: 'visitation', label: 'Visits & notes', title: 'Visits & clinical notes', description: 'Document the encounter, code it and review visit history.', icon: Stethoscope, group: 'Patient care' },
  { id: 'prescriptions', label: 'Prescriptions', title: 'Prescriptions', description: 'Active medications, refills and the prescription log.', icon: Pill, group: 'Patient care' },
  { id: 'secure_records', label: 'Messages & summaries', title: 'Secure messages & visit summaries', description: 'Patient conversations and after-visit summaries (AVS).', icon: ShieldCheck, group: 'Patient care' },
  { id: 'intake', label: 'New patient intake', title: 'New patient intake', description: 'Register a new patient: identity, contacts, insurance and history.', icon: ClipboardPlus, group: 'Patient care' },
  { id: 'patient_portal', label: 'Patient portal', title: 'Patient portal', description: "What the patient sees: their visits, medications and messages.", icon: UserRound, group: 'Patient access' },
  { id: 'settings', label: 'Patient profile', title: 'Patient profile & settings', description: 'Personal details, preferences and account settings.', icon: Settings, group: 'Patient access' },
  { id: 'marketing', label: 'Outreach & feedback', title: 'Outreach & feedback', description: 'Patient feedback, newsletters and reminder campaigns.', icon: Megaphone, group: 'Front office' },
  { id: 'billing', label: 'Billing', title: 'Billing', description: 'Charges, payments and balances.', icon: Receipt, group: 'Front office', hidden: true },
  { id: 'it_support', label: 'IT support', title: 'IT support & audit log', description: 'System events, duplicate records and access audit.', icon: LifeBuoy, group: 'Admin & IT' },
  { id: 'diagnostic_database', label: 'Diagnosis reference', title: 'Diagnosis reference database', description: 'Condition and code reference with a symptom matcher.', icon: Database, group: 'Admin & IT' },
  { id: 'code_audit', label: 'Code & prompt auditor', title: 'Code & prompt auditor', description: 'Developer tool: review code or AI prompts.', icon: Code2, group: 'Admin & IT' },
];

export const viewMeta = (id: ViewId) => VIEWS.find(v => v.id === id)!;
