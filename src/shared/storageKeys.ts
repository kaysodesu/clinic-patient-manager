// Which browser-storage keys hold clinic data that every user of the site should share.
// Everything else (role, brightness, audio, active patient, portal passwords/SSNs) stays per-device.

export const SHARED_KEYS = [
  'clinic_patients',
  'clinic_invoices',
  'clinic_visitation_records',
  'clinic_progress_notes',
  'clinic_after_visit_summaries',
  'clinic_default_pay_card',
  'clinic_diagnostic_codes',
  'clinic_fdba_permissions',
  'clinic_it_events',
  'clinic_marketing_logs',
  'clinic_medical_conditions',
  'clinic_patient_appointments',
  'clinic_patient_availabilities',
  'clinic_patient_transfers',
  'clinic_prescriptions',
  'clinic_schedule_notifications',
  'clinic_secure_conversations',
] as const;

export const SHARED_KEY_PREFIXES = [
  'portal_msgs_',
  'clinic_family_optin_',
  'portal_restricted_month_',
] as const;

export function isSharedKey(key: string): boolean {
  return (
    (SHARED_KEYS as readonly string[]).includes(key) ||
    SHARED_KEY_PREFIXES.some(prefix => key.startsWith(prefix) && key.length < 200)
  );
}
