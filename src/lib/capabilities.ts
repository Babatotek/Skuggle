import type { CurrentUser } from '../types';

/** UX-only capability check. The API remains the authorization authority. */
export const hasCapability = (user: CurrentUser, capability: string): boolean =>
  Boolean(user.capabilities?.includes(capability));
