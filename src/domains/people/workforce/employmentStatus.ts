import type { EmploymentStatus } from '../../../types';

const STATUS_LABELS: Record<string, EmploymentStatus> = {
  active: 'Active',
  on_leave: 'On Leave',
  suspended: 'Suspended',
  terminated: 'Terminated',
  probation: 'Probation',
  resigned: 'Resigned',
  retired: 'Retired',
  inactive: 'Inactive',
};

export const EMPLOYMENT_STATUS_OPTIONS: Array<{ value: string; label: EmploymentStatus }> = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'probation', label: 'Probation' },
  { value: 'resigned', label: 'Resigned' },
  { value: 'retired', label: 'Retired' },
  { value: 'inactive', label: 'Inactive' },
];

export function toEmploymentStatusLabel(raw: string | null | undefined): EmploymentStatus {
  if (!raw) return 'Active';
  if (raw === 'Pending Invitation') return 'Pending Invitation';
  return STATUS_LABELS[raw.toLowerCase()] ?? (raw as EmploymentStatus);
}

export function toEmploymentStatusApi(label: string | null | undefined): string {
  if (!label) return 'active';
  const match = EMPLOYMENT_STATUS_OPTIONS.find((item) => item.label === label);
  if (match) return match.value;
  return label.toLowerCase().replace(/\s+/g, '_');
}

export function isConsequentialEmploymentStatus(status: string): boolean {
  const api = toEmploymentStatusApi(status);
  return api === 'suspended' || api === 'terminated' || api === 'resigned' || api === 'retired';
}

export function mapEmployeeRow(row: Record<string, unknown>) {
  const position = row.position && typeof row.position === 'object' ? row.position as Record<string, unknown> : null;
  const department = row.department && typeof row.department === 'object' ? row.department as Record<string, unknown> : null;
  const campus = row.campus && typeof row.campus === 'object' ? row.campus as Record<string, unknown> : null;
  const linkedUser = row.linkedUser && typeof row.linkedUser === 'object' ? row.linkedUser as Record<string, unknown> : null;
  const personal = row.personal && typeof row.personal === 'object' ? row.personal as Record<string, unknown> : {};
  const positionName = String(position?.name ?? '');
  const email = String(row.email ?? personal.email ?? linkedUser?.email ?? '');
  const phone = String(row.phone ?? personal.phone ?? '');
  return {
    id: String(row.id),
    staffNo: String(row.employeeNumber ?? ''),
    fullName: String(row.name ?? ''),
    email,
    phone,
    role: positionName || 'Staff',
    position: positionName || '—',
    positionId: position?.id ? String(position.id) : null,
    department: department?.name ? String(department.name) : undefined,
    departmentId: department?.id ? String(department.id) : null,
    staffCategory: (row.staffCategory as 'teaching' | 'non_teaching' | null | undefined) ?? null,
    campus: campus?.name ? String(campus.name) : '',
    campusId: campus?.id ? String(campus.id) : null,
    linkedUserId: linkedUser?.id ? String(linkedUser.id) : null,
    assignedClasses: [] as string[],
    assignedSubjects: [] as string[],
    status: toEmploymentStatusLabel(String(row.status ?? 'active')),
  };
}
