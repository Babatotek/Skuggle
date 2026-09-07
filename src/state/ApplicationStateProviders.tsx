import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { AcademicSession, AcademicTerm, CurrentUser, Persona, WorkspaceItem } from '../types';

export type ProviderStatus = 'IDLE' | 'LOADING' | 'READY' | 'ERROR' | 'SWITCHING';
export type ProviderFailure = 'AUTH_FAILURE' | 'WORKSPACE_FAILURE' | 'ACCESS_FAILURE' | 'ACADEMIC_CONTEXT_FAILURE' | 'NETWORK_FAILURE';

export type AuthIdentity = Pick<CurrentUser, 'id' | 'fullName' | 'email' | 'phone' | 'avatarUrl' | 'verified' | 'teachingGrowthStreak' | 'timeSavedMinutes' | 'teacherProfile' | 'linkedChildren'>;
export interface AuthState { status: ProviderStatus; identity: AuthIdentity; failure: ProviderFailure | null }
export interface AuthActions {
  setIdentity: React.Dispatch<React.SetStateAction<AuthIdentity>>;
  setAuthStatus: (status: ProviderStatus, failure?: ProviderFailure | null) => void;
  clearAuth: () => void;
}

const emptyIdentity: AuthIdentity = { id: '', fullName: '', email: '', phone: '', avatarUrl: '', verified: false, teachingGrowthStreak: 0, timeSavedMinutes: 0 };
const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

function AuthProvider({ children }: React.PropsWithChildren) {
  const [identity, setIdentity] = useState<AuthIdentity>(emptyIdentity);
  const [status, setStatus] = useState<ProviderStatus>('IDLE');
  const [failure, setFailure] = useState<ProviderFailure | null>(null);
  const setAuthStatus = useCallback((next: ProviderStatus, nextFailure: ProviderFailure | null = null) => { setStatus(next); setFailure(nextFailure); }, []);
  const clearAuth = useCallback(() => { setIdentity(emptyIdentity); setStatus('IDLE'); setFailure(null); }, []);
  const value = useMemo(() => ({ status, identity, failure, setIdentity, setAuthStatus, clearAuth }), [status, identity, failure, setAuthStatus, clearAuth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export interface WorkspaceState { status: ProviderStatus; activeWorkspace: WorkspaceItem; availableWorkspaces: WorkspaceItem[]; generation: number; failure: ProviderFailure | null }
export interface WorkspaceActions {
  setActiveWorkspace: React.Dispatch<React.SetStateAction<WorkspaceItem>>;
  setAvailableWorkspaces: React.Dispatch<React.SetStateAction<WorkspaceItem[]>>;
  beginWorkspaceTransition: () => number;
  completeWorkspaceTransition: (workspace: WorkspaceItem, available?: WorkspaceItem[]) => number;
  failWorkspaceTransition: () => void;
  clearWorkspace: () => void;
}
const emptyWorkspace: WorkspaceItem = { id: '', name: 'Skuggle', type: 'personal', role: 'Student' };
const WorkspaceContext = createContext<(WorkspaceState & WorkspaceActions) | null>(null);

function WorkspaceProvider({ children }: React.PropsWithChildren) {
  const [activeWorkspace, setActiveWorkspace] = useState(emptyWorkspace);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<WorkspaceItem[]>([]);
  const [status, setStatus] = useState<ProviderStatus>('IDLE');
  const [failure, setFailure] = useState<ProviderFailure | null>(null);
  const [generation, setGeneration] = useState(0);
  const generationRef = useRef(0);
  const bump = useCallback(() => { generationRef.current += 1; setGeneration(generationRef.current); return generationRef.current; }, []);
  const beginWorkspaceTransition = useCallback(() => { setStatus('SWITCHING'); setFailure(null); return bump(); }, [bump]);
  const completeWorkspaceTransition = useCallback((workspace: WorkspaceItem, available?: WorkspaceItem[]) => { const next = bump(); setActiveWorkspace(workspace); if (available) setAvailableWorkspaces(available); setStatus('READY'); setFailure(null); return next; }, [bump]);
  const failWorkspaceTransition = useCallback(() => { bump(); setStatus('ERROR'); setFailure('WORKSPACE_FAILURE'); }, [bump]);
  const clearWorkspace = useCallback(() => { bump(); setActiveWorkspace(emptyWorkspace); setAvailableWorkspaces([]); setStatus('IDLE'); setFailure(null); }, [bump]);
  const value = useMemo(() => ({ status, activeWorkspace, availableWorkspaces, generation, failure, setActiveWorkspace, setAvailableWorkspaces, beginWorkspaceTransition, completeWorkspaceTransition, failWorkspaceTransition, clearWorkspace }), [status, activeWorkspace, availableWorkspaces, generation, failure, beginWorkspaceTransition, completeWorkspaceTransition, failWorkspaceTransition, clearWorkspace]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export interface RoleAssignmentSummary { id: string; role?: string; scopeType?: string; primary?: boolean }
export interface AccessState { status: ProviderStatus; capabilities: readonly string[]; legacyPermissions: readonly string[]; registryVersion: number; assignments: readonly RoleAssignmentSummary[]; personaHint?: Persona; failure: ProviderFailure | null }
export interface AccessActions {
  replaceAccess: (next: Omit<AccessState, 'status' | 'failure'>) => void;
  clearAccess: () => void;
  hasCapability: (key: string) => boolean;
  hasAnyCapability: (keys: readonly string[]) => boolean;
  hasAllCapabilities: (keys: readonly string[]) => boolean;
}
const AccessContext = createContext<(AccessState & AccessActions) | null>(null);

function AccessProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<AccessState>({ status: 'IDLE', capabilities: [], legacyPermissions: [], registryVersion: 0, assignments: [], failure: null });
  const capabilitySet = useMemo(() => new Set(state.capabilities), [state.capabilities]);
  const replaceAccess = useCallback((next: Omit<AccessState, 'status' | 'failure'>) => setState({ ...next, status: 'READY', failure: null }), []);
  const clearAccess = useCallback(() => setState({ status: 'IDLE', capabilities: [], legacyPermissions: [], registryVersion: 0, assignments: [], failure: null }), []);
  const hasCapability = useCallback((key: string) => capabilitySet.has(key), [capabilitySet]);
  const hasAnyCapability = useCallback((keys: readonly string[]) => keys.some((key) => capabilitySet.has(key)), [capabilitySet]);
  const hasAllCapabilities = useCallback((keys: readonly string[]) => keys.every((key) => capabilitySet.has(key)), [capabilitySet]);
  const value = useMemo(() => ({ ...state, replaceAccess, clearAccess, hasCapability, hasAnyCapability, hasAllCapabilities }), [state, replaceAccess, clearAccess, hasCapability, hasAnyCapability, hasAllCapabilities]);
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export interface AcademicSelection { campus: { id: string; name: string } | null; session: AcademicSession | null; term: AcademicTerm | null }
export interface AcademicContextState extends AcademicSelection { status: ProviderStatus; workspaceGeneration: number; failure: ProviderFailure | null }
export interface AcademicContextActions { replaceAcademicContext: (selection: AcademicSelection, generation: number) => void; clearAcademicContext: (generation: number) => void }
const AcademicContext = createContext<(AcademicContextState & AcademicContextActions) | null>(null);

function AcademicProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<AcademicContextState>({ status: 'IDLE', campus: null, session: null, term: null, workspaceGeneration: 0, failure: null });
  const replaceAcademicContext = useCallback((selection: AcademicSelection, generation: number) => setState({ ...selection, status: 'READY', workspaceGeneration: generation, failure: null }), []);
  const clearAcademicContext = useCallback((generation: number) => setState({ status: 'IDLE', campus: null, session: null, term: null, workspaceGeneration: generation, failure: null }), []);
  const value = useMemo(() => ({ ...state, replaceAcademicContext, clearAcademicContext }), [state, replaceAcademicContext, clearAcademicContext]);
  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
}

export function ApplicationStateProviders({ children }: React.PropsWithChildren) {
  return <AuthProvider><WorkspaceProvider><AccessProvider><AcademicProvider>{children}</AcademicProvider></AccessProvider></WorkspaceProvider></AuthProvider>;
}

function required<T>(value: T | null, name: string): T { if (!value) throw new Error(`${name} must be used within ApplicationStateProviders`); return value; }
export const useAuth = () => required(useContext(AuthContext), 'useAuth');
export const useWorkspace = () => required(useContext(WorkspaceContext), 'useWorkspace');
export const useAccess = () => required(useContext(AccessContext), 'useAccess');
export const useAcademicContext = () => required(useContext(AcademicContext), 'useAcademicContext');
