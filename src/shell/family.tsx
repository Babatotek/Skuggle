import React from 'react';
import { WorkspaceShellChrome, type WorkspaceShellChromeProps } from './WorkspaceShellChrome';

export const SchoolStaffShell: React.FC<Omit<WorkspaceShellChromeProps, 'family'>> = (props) => (
  <WorkspaceShellChrome family="school-staff" {...props} />
);

export const ParentStudentShell: React.FC<Omit<WorkspaceShellChromeProps, 'family'>> = (props) => (
  <WorkspaceShellChrome family="parent-student" {...props} />
);

export const PersonalShell: React.FC<Omit<WorkspaceShellChromeProps, 'family'>> = (props) => (
  <WorkspaceShellChrome family="personal" {...props} />
);

export const PlatformShell: React.FC<Omit<WorkspaceShellChromeProps, 'family'>> = (props) => (
  <WorkspaceShellChrome family="platform" {...props} />
);
