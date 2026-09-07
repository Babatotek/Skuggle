import { UserRole } from '../types';

export const backendRoleToUi = (value: unknown): UserRole => {
  const key = String(value ?? '').trim().toLowerCase().replace(/[ -]+/g, '_');
  const roles: Record<string, UserRole> = {
    school_super_admin: 'Super Admin',
    school_admin: 'School Admin',
    principal: 'Principal',
    teacher: 'Teacher',
    parent: 'Parent',
    student: 'Student',
    platform_super_admin: 'Platform Owner',
    platform_owner: 'Platform Owner',
    bursar: 'Bursar',
    examination_officer: 'School Admin',
    admission_officer: 'School Admin',
  };
  return roles[key] || 'Student';
};

export const isSchoolGovernanceRole = (role: UserRole): boolean => role === 'Super Admin';
export const isSchoolOperationsAdmin = (role: UserRole): boolean => role === 'School Admin' || role === 'Super Admin';
