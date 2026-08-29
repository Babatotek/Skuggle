import { UserRole, WorkspaceItem } from '../types';

export interface AccountModuleAccess {
  launchBlueprint: boolean;
  invitationsAndQr: boolean;
  subscriptionAndPricing: boolean;
  subscriptionPhase: 'personal' | 'school' | null;
  configurePlatformPlansAndMemberships: boolean;
}

/**
 * Central UI policy for account-level modules. API routes still enforce the
 * corresponding permissions; this prevents presenting inaccessible actions.
 */
export const getAccountModuleAccess = (
  workspace: Pick<WorkspaceItem, 'type'>,
  role: UserRole,
): AccountModuleAccess => {
  const isPersonal = workspace.type === 'personal';
  const isSchool = workspace.type === 'school';
  const isPlatformOwner = workspace.type === 'platform' && role === 'Platform Owner';
  const isSchoolAdmin = isSchool && role === 'School Admin';
  const isSchoolBillingManager = isSchool && (role === 'School Admin' || role === 'Bursar');

  return {
    launchBlueprint: isSchoolAdmin,
    invitationsAndQr: isSchoolAdmin,
    subscriptionAndPricing: isPersonal || isSchoolBillingManager,
    subscriptionPhase: isPersonal ? 'personal' : isSchoolBillingManager ? 'school' : null,
    configurePlatformPlansAndMemberships: isPlatformOwner,
  };
};
