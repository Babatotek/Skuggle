import React from 'react';
import { WorkforcePage } from '../../domains/people/workforce/WorkforcePage';

/** @deprecated Use WorkforcePage. Kept as a compatibility alias after IAM/workforce separation. */
export const StaffManagementView: React.FC<{ context?: 'teachers' | 'staff' }> = ({ context = 'staff' }) => (
  <WorkforcePage view={context === 'teachers' ? 'teachers' : 'staff'} />
);
