import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { EmailVerificationModal } from '../components/EmailVerificationModal';
import { DashboardLoading } from '../components/dashboard/DashboardPrimitives';
import { useApp } from '../context/AppContext';
import { useAccess, useWorkspace } from '../state/ApplicationStateProviders';
import { apiRequest, ApiError, describeApiError, hasLikelyBrowserSession, initializeCsrf } from '../lib/apiClient';
import { schoolKeyFromLocation } from '../lib/sessionAuth';
import { backendRoleToUi } from '../lib/roles';
import { UserRole } from '../types';
import { findNavItem } from '../lib/navigation';
import { AuthenticatedRoot } from '../shell/AuthenticatedRoot';
import { buildRoute, matchCanonicalPath, matchLegacyAlias, routeFromLegacyNavId, workspaceDefaultRoute } from './builders';
import { evaluateGuard } from './guards';
import { bindRouterNavigate } from './historyCompatibility';
import { LegacyPageAdapter } from './LegacyPageAdapter';
const AssessmentDomainWorkspace = React.lazy(() => import('../domains/assessment/AssessmentDomainWorkspace'));
const StudentCbtList = React.lazy(() => import('../domains/student-cbt/StudentCbtList'));
const StudentCbtPlayerPage = React.lazy(() => import('../domains/student-cbt/StudentCbtPlayer'));
import { StudentsPage } from '../domains/people/students/StudentsPage';
import { GuardiansPage } from '../domains/people/guardians/GuardiansPage';
import { WorkforcePage } from '../domains/people/workforce/WorkforcePage';
import {
  AdmissionsApplicationsPage,
  AdmissionsDecisionsPage,
  AdmissionsEnrolmentPage,
  AdmissionsOverviewPage,
  AdmissionsScreeningPage,
  AdmissionsSettingsPage,
} from '../domains/admissions/AdmissionsPages';
import { normalizeLocation } from './normalize';
import { parseRouteParams } from './params';
import {
  PersonalAuthPage,
  PublicLanding,
  PublicResultChecker,
  ResetPasswordPage,
  SchoolAuthPage,
  SchoolRegistrationStepper,
  TenantLogin,
  TenantWelcome,
  VerificationStatusPage,
} from './pages';
import { recordRedirect } from './redirectLoop';
import { readReturnTo, sanitizeReturnTo, withReturnTo } from './returnTo';
import { RouteAccessDenied, RouteLoading, RouteNotFound } from './RouteSurfaces';
import { reportRoutingSignal } from './telemetry';
import { documentTitleFor } from './titles';
import type { CanonicalRouteDefinition } from './types';

interface SessionResponse {
  success: true;
  data: { user: { role: string; email?: string; emailVerified?: boolean } };
}

let restoreSessionPromise: Promise<SessionResponse | null> | null = null;

function restoreSession(force = false): Promise<SessionResponse | null> {
  if (!force && !hasLikelyBrowserSession()) return Promise.resolve(null);
  if (!restoreSessionPromise) {
    restoreSessionPromise = apiRequest<SessionResponse>('/auth/me', {
      suppressErrorNotification: true,
      signal: AbortSignal.timeout(30000),
    }).catch((error) => {
      if (error instanceof ApiError && error.status === 401) localStorage.removeItem('skuggle_authenticated');
      if (error instanceof ApiError && error.status !== 401) console.error('Session restoration failed', error.code, error.requestId);
      return null;
    });
  }
  return restoreSessionPromise;
}

function sessionRole(role: string): UserRole {
  return backendRoleToUi(role);
}

const NavigatorBinder: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    bindRouterNavigate(navigate);
    return () => bindRouterNavigate(null);
  }, [navigate]);
  return null;
};

const NormalizePath: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const normalized = normalizeLocation(location.pathname, location.search);
    if (normalized.changed) {
      if (recordRedirect()) {
        reportRoutingSignal('redirect_loop_prevented', { stage: 'normalize' });
        return;
      }
      navigate(`${normalized.pathname}${normalized.search}`, { replace: true, preventScrollReset: true });
    }
  }, [location.pathname, location.search, navigate]);
  return null;
};

const DocumentTitleAndFocus: React.FC<{ route: CanonicalRouteDefinition | null }> = ({ route }) => {
  const { currentWorkspace } = useApp();
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (route) document.title = documentTitleFor(route, currentWorkspace.type === 'school' ? currentWorkspace.name : undefined);
    else document.title = 'Page not found | Skuggle';
  }, [route, currentWorkspace.name, currentWorkspace.type]);
  useEffect(() => {
    const pathChanged = previousPath.current !== location.pathname;
    previousPath.current = location.pathname;
    if (!pathChanged) return;
    const main = document.getElementById('main-content');
    main?.focus();
  }, [location.pathname]);
  return null;
};

const LegacyRedirect: React.FC = () => {
  const location = useLocation();
  const matched = matchLegacyAlias(location.pathname);
  if (!matched) {
    reportRoutingSignal('unknown_route', { path: location.pathname.slice(0, 80) });
    return <RouteNotFound />;
  }
  if (recordRedirect()) {
    reportRoutingSignal('redirect_loop_prevented', { alias: matched.alias.id });
    return <RouteNotFound />;
  }
  reportRoutingSignal('legacy_alias_used', { alias: matched.alias.id, target: matched.canonical.id });
  const search = matched.alias.preserveQuery === false ? '' : location.search;
  const href = matched.href;
  const join = href.includes('?') ? (search.startsWith('?') ? '&' : '') : search;
  const next = `${href}${join}${search.startsWith('?') && href.includes('?') ? search.slice(1) : search.startsWith('?') && !href.includes('?') ? search : ''}`;
  return <Navigate to={next || href} replace />;
};

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { currentUser } = useApp();
  const authenticated = Boolean(currentUser.id) || localStorage.getItem('skuggle_authenticated') === '1' || hasLikelyBrowserSession();
  if (!authenticated) {
    const login = location.pathname.startsWith('/school') ? '/school/login' : '/login';
    return <Navigate to={withReturnTo(login, `${location.pathname}${location.search}`)} replace />;
  }
  return <>{children}</>;
};

const WorkspaceDefaultRedirect: React.FC = () => {
  const workspace = useWorkspace();
  const type = workspace.activeWorkspace.type;
  if (workspace.status !== 'READY' && workspace.status !== 'ERROR') return <RouteLoading />;
  if (type !== 'school' && type !== 'personal' && type !== 'platform') return <Navigate to={buildRoute('personal.home')} replace />;
  return <Navigate to={buildRoute(workspaceDefaultRoute(type).id)} replace />;
};

const GuardedPage: React.FC<{ route: CanonicalRouteDefinition; params: Record<string, string>; onNavigateTab: (tab: string) => void }> = ({
  route,
  params,
  onNavigateTab,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const access = useAccess();
  const { switchWorkspace, currentUser } = useApp();
  const authenticated = Boolean(currentUser.id) || localStorage.getItem('skuggle_authenticated') === '1';
  const parsed = parseRouteParams(route, params, location.search);
  const decision = evaluateGuard({
    route,
    authenticated,
    workspaceType: workspace.activeWorkspace.type,
    workspaceStatus: workspace.status,
    capabilities: access.capabilities,
  });

  useEffect(() => {
    if (decision.reason !== 'workspace_mismatch') return;
    const targetType = route.workspace;
    if (targetType !== 'school' && targetType !== 'personal' && targetType !== 'platform') return;
    const hinted = new URLSearchParams(location.search).get('school');
    const available = currentUser.availableWorkspaces || [];
    const hintedWorkspace = hinted
      ? available.find((item) => item.schoolCode === hinted || item.portalSlug === hinted || item.id === hinted)
      : undefined;
    const target = hintedWorkspace && hintedWorkspace.type === targetType
      ? hintedWorkspace
      : available.find((item) => item.type === targetType);
    if (target && workspace.status !== 'SWITCHING') {
      reportRoutingSignal('workspace_route_mismatch', { from: workspace.activeWorkspace.type, to: targetType });
      switchWorkspace(target.id);
    }
  }, [decision.reason, route.workspace, currentUser.availableWorkspaces, location.search, switchWorkspace, workspace.activeWorkspace.type, workspace.status]);

  if (!parsed.ok) return <RouteNotFound />;
  if (decision.reason === 'unauthenticated') {
    return <Navigate to={withReturnTo(route.workspace === 'school' ? '/school/login' : '/login', `${location.pathname}${location.search}`)} replace />;
  }
  if (decision.reason === 'workspace_mismatch') {
    const targetType = route.workspace;
    const available = currentUser.availableWorkspaces || [];
    const target = available.find((item) => item.type === targetType);
    if (workspace.status === 'SWITCHING' || target) return <RouteLoading />;
    return <RouteAccessDenied onHome={() => navigate(buildRoute(workspaceDefaultRoute(workspace.activeWorkspace.type === 'platform' ? 'platform' : workspace.activeWorkspace.type === 'personal' ? 'personal' : 'school').id))} />;
  }
  if (decision.reason === 'capability_denied') {
    return <RouteAccessDenied onHome={() => navigate(buildRoute('school.home'))} />;
  }
  if (route.id === 'auth.continue') return <WorkspaceDefaultRedirect />;
  const surface = route.id === 'school.student-cbt'
    ? <Suspense fallback={<RouteLoading />}><StudentCbtList /></Suspense>
    : route.id === 'school.student-cbt.take'
    ? <Suspense fallback={<RouteLoading />}><StudentCbtPlayerPage /></Suspense>
    : route.domain === 'assessment'
    ? <Suspense fallback={<RouteLoading />}><AssessmentDomainWorkspace route={route} assessmentPublicId={parsed.params.assessmentPublicId} /></Suspense>
    : route.id === 'school.people.students' || route.id === 'school.people.students.profile'
    ? <StudentsPage studentPublicId={parsed.params.studentPublicId} />
    : route.id === 'school.people.guardians'
      ? <GuardiansPage />
      : route.id === 'school.people.workforce' || route.id === 'school.people.workforce.teachers'
        ? <WorkforcePage view={route.id.endsWith('.teachers') || parsed.query.view === 'teachers' ? 'teachers' : 'staff'} />
        : route.id === 'school.admissions'
          ? <AdmissionsOverviewPage />
          : route.id === 'school.admissions.applications'
            ? <AdmissionsApplicationsPage />
            : route.id === 'school.admissions.screening'
              ? <AdmissionsScreeningPage />
              : route.id === 'school.admissions.decisions'
                ? <AdmissionsDecisionsPage />
                : route.id === 'school.admissions.enrolment'
                  ? <AdmissionsEnrolmentPage />
                  : route.id === 'school.admissions.settings'
                    ? <AdmissionsSettingsPage />
        : <LegacyPageAdapter route={route} params={parsed.params} onNavigateTab={onNavigateTab} />;
  return (
    <>
      <DocumentTitleAndFocus route={route} />
      {surface}
    </>
  );
};

const AuthenticatedLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <RequireAuth>
    <AuthenticatedRoot onLogout={onLogout} />
  </RequireAuth>
);

const CanonicalRouteElement: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const location = useLocation();
  const matched = matchCanonicalPath(location.pathname);
  if (!matched) {
    if (matchLegacyAlias(location.pathname)) return <LegacyRedirect />;
    reportRoutingSignal('unknown_route', { path: location.pathname.slice(0, 80) });
    return <RouteNotFound />;
  }
  return <GuardedPage route={matched.route} params={matched.params} onNavigateTab={onNavigateTab} />;
};

export function AppRouter() {
  const { setCurrentRole, toast, hideToast, showToast, currentUser } = useApp();
  const workspace = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const [verifyGateEmail, setVerifyGateEmail] = useState<string | null>(null);
  const [isSessionChecking, setIsSessionChecking] = useState(false);
  const isVerificationSuccess = location.pathname.replace(/\/+$/, '') === '/verify-email' && new URLSearchParams(location.search).get('status') === 'success';
  const schoolNameFromLocation = new URLSearchParams(location.search).get('schoolName') || undefined;
  const schoolKey = schoolKeyFromLocation() || undefined;

  const navigateTab = useCallback((tab: string) => {
    const resolved = findNavItem(tab)?.id || tab;
    const route = routeFromLegacyNavId(resolved);
    if (!route) {
      reportRoutingSignal('unknown_route', { source: 'nav', tab: resolved.slice(0, 40) });
      navigate('/not-found');
      return;
    }
    navigate(buildRoute(route.id));
  }, [navigate]);

  useEffect(() => {
    const onApiError = (event: Event) => {
      const error = (event as CustomEvent<ApiError>).detail;
      if (error.code === 'EMAIL_UNVERIFIED') {
        const email = error.fields.email?.[0] || '';
        if (email) setVerifyGateEmail(email);
        localStorage.removeItem('skuggle_authenticated');
        navigate(buildRoute('auth.personal-login'), { replace: true });
        void (async () => {
          try {
            await initializeCsrf();
            await apiRequest('/auth/logout', { method: 'POST', suppressErrorNotification: true });
          } catch { /* ignore */ }
          restoreSessionPromise = null;
        })();
        return;
      }
      const publicAuth = ['/', '/login', '/school/login', '/welcome', '/welcome/login', '/register'].includes(location.pathname);
      if (error.status === 401 && publicAuth) return;
      showToast(error.status === 401 ? 'Session expired' : 'Request failed', describeApiError(error), error.status >= 500 ? 'failed' : 'error');
    };
    window.addEventListener('skuggle:api-error', onApiError);
    return () => window.removeEventListener('skuggle:api-error', onApiError);
  }, [location.pathname, navigate, showToast]);

  useEffect(() => {
    if (toast?.show) {
      void import('../lib/notificationAudio').then((mod) => mod.playNotificationTone(toast.type));
    }
  }, [toast]);

  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/school/login' || location.pathname === '/welcome/login') {
      void initializeCsrf().catch(() => { /* Sign-in will retry. */ });
    }
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    void restoreSession(isVerificationSuccess).then(async (response) => {
      if (!active) return;
      if (response) {
        if (response.data.user.emailVerified === false) {
          setVerifyGateEmail(response.data.user.email || 'your account');
          localStorage.removeItem('skuggle_authenticated');
          try {
            await initializeCsrf();
            await apiRequest('/auth/logout', { method: 'POST', suppressErrorNotification: true });
          } catch { /* ignore */ }
          restoreSessionPromise = null;
          navigate(buildRoute('auth.personal-login'), { replace: true });
          return;
        }
        setCurrentRole(sessionRole(response.data.user.role));
        window.dispatchEvent(new Event('skuggle:authenticated'));
        if (isVerificationSuccess) navigate(buildRoute('auth.continue'), { replace: true });
        return;
      }
      if (schoolKeyFromLocation() && location.pathname === '/') {
        navigate(`${buildRoute('public.tenant-welcome')}?school=${encodeURIComponent(schoolKeyFromLocation() || '')}`, { replace: true });
      }
    }).finally(() => { if (active) setIsSessionChecking(false); });
    return () => { active = false; };
  }, [isVerificationSuccess, location.pathname, navigate, setCurrentRole]);

  const handleLogout = () => {
    restoreSessionPromise = null;
    localStorage.removeItem('skuggle_authenticated');
    window.dispatchEvent(new Event('skuggle:logged-out'));
    navigate(buildRoute('public.landing'), { replace: true });
    void (async () => {
      try {
        await initializeCsrf();
        await apiRequest('/auth/logout', { method: 'POST', suppressErrorNotification: true });
      } catch { /* local session already closed */ }
    })();
  };

  const enterAuthenticatedApp = (role: UserRole) => {
    restoreSessionPromise = null;
    localStorage.setItem('skuggle_authenticated', '1');
    setCurrentRole(role);
    window.dispatchEvent(new Event('skuggle:authenticated'));
    const intended = sanitizeReturnTo(readReturnTo(location.search));
    navigate(intended || buildRoute('auth.continue'), { replace: true });
  };

  if (isSessionChecking) {
    return <div className="min-h-screen bg-[#FFFCF7] p-6"><DashboardLoading /></div>;
  }

  const workspaceHome = workspace.activeWorkspace.type === 'platform'
    ? buildRoute('platform.overview')
    : workspace.activeWorkspace.type === 'personal'
      ? buildRoute('personal.home')
      : buildRoute('school.home');

  return (
    <div className="min-h-screen bg-[#FFFCF7] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <NavigatorBinder />
      <NormalizePath />
      <AnimatePresence>
        {toast?.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            role={toast.type === 'error' || toast.type === 'failed' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' || toast.type === 'failed' ? 'assertive' : 'polite'}
            className={`fixed top-4 right-4 z-50 w-[min(92vw,390px)] text-white p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${toast.type === 'success' ? 'bg-emerald-700 border-emerald-500' : toast.type === 'warning' ? 'bg-amber-700 border-amber-500' : toast.type === 'info' ? 'bg-indigo-700 border-indigo-500' : toast.type === 'failed' ? 'bg-rose-950 border-rose-700' : 'bg-rose-700 border-rose-500'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : toast.type === 'warning' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : toast.type === 'info' ? <Info className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs text-white">{toast.title}</h4>
              {toast.description && <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.description}</p>}
            </div>
            <button type="button" onClick={hideToast} aria-label="Dismiss notification" className="p-1 rounded-lg hover:bg-white/15"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
      {verifyGateEmail && (
        <EmailVerificationModal
          email={verifyGateEmail}
          title="Verify your email to continue"
          onClose={() => setVerifyGateEmail(null)}
          closeLabel={location.pathname === '/register' ? 'Got it — I will check my email' : undefined}
        />
      )}
      <Suspense fallback={<div className="min-h-screen bg-[#FFFCF7] p-6"><DashboardLoading /></div>}>
        <Routes>
          <Route path="/" element={<PublicLanding onSelectRole={(persona) => navigate(persona === 'school' ? buildRoute('public.register-school') : buildRoute('auth.personal-login'))} onOpenResultChecker={() => navigate(buildRoute('public.results'))} onTenantLogin={() => navigate(buildRoute('auth.school-login'))} onEnterAppDirectly={() => navigate(buildRoute('auth.school-login'))} onOpenPersonalAuth={() => navigate(buildRoute('auth.personal-login'))} onOpenSchoolAuth={() => navigate(buildRoute('auth.school-login'))} />} />
          <Route path="/login" element={<PersonalAuthPage onSuccess={enterAuthenticatedApp} onBack={() => navigate(buildRoute('public.landing'))} />} />
          <Route path="/school/login" element={<SchoolAuthPage onSuccess={enterAuthenticatedApp} onBack={() => navigate(buildRoute('public.landing'))} onRegisterSchool={() => navigate(buildRoute('public.register-school'))} />} />
          <Route path="/register" element={<SchoolRegistrationStepper onCancel={() => navigate(buildRoute('public.landing'))} onVerificationRequired={(email) => setVerifyGateEmail(email)} />} />
          <Route path="/welcome" element={<TenantWelcome previewOnly={false} onContinue={() => navigate(buildRoute('public.tenant-login'))} onOpenResultChecker={() => navigate(buildRoute('public.results'))} onBackToLanding={() => navigate(buildRoute('public.landing'))} onAuthenticated={enterAuthenticatedApp} schoolName={schoolNameFromLocation} schoolKey={schoolKey} />} />
          <Route path="/welcome/login" element={<TenantLogin onSuccess={enterAuthenticatedApp} onBackToLanding={() => navigate(buildRoute('public.landing'))} onOpenResultChecker={() => navigate(buildRoute('public.results'))} />} />
          <Route path="/results" element={<PublicResultChecker onBack={() => navigate(currentUser.id ? workspaceHome : buildRoute('public.landing'))} />} />
          <Route path="/reset-password" element={<ResetPasswordPage onDone={() => navigate(buildRoute('auth.personal-login'), { replace: true })} />} />
          <Route path="/verify-email" element={<VerificationStatusPage status={new URLSearchParams(location.search).get('status')} onSignIn={() => navigate(buildRoute('auth.personal-login'), { replace: true })} />} />
          <Route path="/join" element={<SchoolAuthPage onSuccess={enterAuthenticatedApp} onBack={() => navigate(buildRoute('public.landing'))} onRegisterSchool={() => navigate(buildRoute('public.register-school'))} />} />
          <Route path="/not-found" element={<RouteNotFound homeHref={currentUser.id ? workspaceHome : buildRoute('public.landing')} />} />
          <Route element={<AuthenticatedLayout onLogout={() => void handleLogout()} />}>
            <Route path="/session" element={<WorkspaceDefaultRedirect />} />
            <Route path="/school" element={<CanonicalRouteElement onNavigateTab={navigateTab} />} />
            <Route path="/school/*" element={<CanonicalRouteElement onNavigateTab={navigateTab} />} />
            <Route path="/personal" element={<CanonicalRouteElement onNavigateTab={navigateTab} />} />
            <Route path="/personal/*" element={<CanonicalRouteElement onNavigateTab={navigateTab} />} />
            <Route path="/platform" element={<CanonicalRouteElement onNavigateTab={navigateTab} />} />
            <Route path="/platform/*" element={<CanonicalRouteElement onNavigateTab={navigateTab} />} />
            <Route path="/relate" element={<CanonicalRouteElement onNavigateTab={navigateTab} />} />
          </Route>
          <Route path="/app" element={<LegacyRedirect />} />
          <Route path="/app/:tab" element={<LegacyRedirect />} />
          <Route path="/s/:schoolKey" element={<LegacyRedirect />} />
          <Route path="/s/:schoolKey/app" element={<LegacyRedirect />} />
          <Route path="/s/:schoolKey/app/:tab" element={<LegacyRedirect />} />
          <Route path="/t/:schoolKey" element={<LegacyRedirect />} />
          <Route path="/t/:schoolKey/app" element={<LegacyRedirect />} />
          <Route path="/t/:schoolKey/app/:tab" element={<LegacyRedirect />} />
          <Route path="*" element={<UnknownOrLegacy />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function UnknownOrLegacy() {
  const location = useLocation();
  const alias = matchLegacyAlias(location.pathname);
  if (alias) return <LegacyRedirect />;
  reportRoutingSignal('unknown_route', { path: location.pathname.slice(0, 80) });
  return (
    <div className="min-h-screen bg-[#FFFCF7] px-4">
      <DocumentTitleAndFocus route={null} />
      <RouteNotFound />
    </div>
  );
}

export { restoreSessionPromise };
export function resetRestoreSession() {
  restoreSessionPromise = null;
}
