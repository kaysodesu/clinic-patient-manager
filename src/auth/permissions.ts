// Who can open what. Change these lists to adjust access for your clinic.
import { ClinicRole } from '../types';

export type StaffRole = Exclude<ClinicRole, 'patient'>;

export const ROLE_LABELS: Record<ClinicRole, string> = {
  admin: 'Clinic Administrator',
  team_lead: 'Clinical Team Lead',
  ops_manager: 'Operations Manager',
  it_support: 'IT Support',
  facility_database_administrator: 'Database Administrator',
  patient: 'Patient (preview)',
};

export const STAFF_ROLES: StaffRole[] = ['admin', 'team_lead', 'ops_manager', 'it_support', 'facility_database_administrator'];

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  admin: 'Everything, including staff accounts.',
  team_lead: 'Clinical work, plus emergency access to secure conversation records.',
  ops_manager: 'Clinical work, the IT desk and emergency access to secure records.',
  it_support: 'Clinical work, the IT desk and the AI code auditor.',
  facility_database_administrator: 'Clinical work and the diagnostic code and conditions database.',
};

const PERMISSIONS = {
  manageStaff: ['admin'],
  itConsole: ['admin', 'it_support', 'ops_manager'],
  diagnosticDatabase: ['admin', 'facility_database_administrator'],
  emergencyRecordAccess: ['admin', 'team_lead', 'ops_manager'],
  codeAudit: ['admin', 'it_support'],
} satisfies Record<string, ClinicRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: ClinicRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as ClinicRole[]).includes(role);
}

export function rolesWith(permission: Permission): string {
  return (PERMISSIONS[permission] as ClinicRole[]).map(r => ROLE_LABELS[r]).join(', ');
}
