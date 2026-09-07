import fs from 'node:fs';
import path from 'node:path';
import './assessment-architecture-guard.mjs';

const root = path.resolve(import.meta.dirname, '..');
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'architecture-baseline.json'), 'utf8'));
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const approvedDomainWrites = new Map([
  ['backend/app/Domain/Authorization/RoleAssignmentService.php', {
    count: 2,
    operations: ['RoleAssignment status update under row lock', 'RoleAssignment upsert save under membership lock'],
    reason: 'Wave 5 requires one controlled assignment mutation boundary',
    owner: 'IAM',
    tests: 'backend/tests/Feature/Authorization/RoleAssignmentWaveFiveTest.php',
  }],
]);
const retiredAdmissionsStorageTypes = new Set([
  'admissions-applications',
  'admissions-screening',
  'admissions-decisions',
  'admissions-letters',
  'admissions-waiting',
  'admissions-settings',
]);

// New direct role-name authorization must be explicitly registered, never silently accepted.
const roleRoots = ['backend/app/Http/Controllers', 'backend/app/Http/Middleware', 'backend/app/Policies'];
const phpFiles = roleRoots.flatMap((relative) => walk(relative, '.php'));
for (const file of phpFiles) {
  const source = read(file);
  for (const match of source.matchAll(/(?:role(?:\?->|->)name\s*={2,3}\s*['"][^'"]+['"]|hasRole\s*\(|SchoolRoles::is[A-Za-z]+)/g)) {
    const allowed = baseline.legacyRoleAuthorization.some((entry) => entry.file === file && match[0].includes(entry.token));
    if (!allowed) failures.push(`ROLE_NAME_AUTH ${file}: ${match[0]}`);
  }
}

// Permission strings in routes and canonical navigation must use the frozen legacy vocabulary.
const registrySource = read('backend/app/Domain/Authorization/PermissionRegistry.php');
const registryVocabulary = [...registrySource.matchAll(/'([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+)'/g)].map((match) => match[1]);
const known = new Set([...baseline.permissionVocabulary, ...registryVocabulary]);
for (const [file, regex] of [['backend/routes/api.php', /permission:([a-z0-9_.-]+)/g], ['src/lib/navigation.ts', /permission:\s*['"]([a-z0-9_.-]+)['"]/g]]) {
  for (const match of read(file).matchAll(regex)) if (!known.has(match[1])) failures.push(`UNKNOWN_PERMISSION ${file}: ${match[1]}`);
}

// Navigation metadata is constrained to GROUP -> ITEM and tabs cannot own nested tabs.
const navigation = read('src/lib/navigation.ts');
if (/interface\s+NavItem[\s\S]*?\n}[\s\S]*?children\s*:/m.test(navigation)) failures.push('NAV_DEPTH NavItem may not define children');
if (/\b(?:children|subItems|items)\s*:\s*\[[\s\S]{0,180}\b(?:children|subItems|items)\s*:/m.test(navigation)) failures.push('NAV_DEPTH nested persistent navigation metadata');
for (const file of walk('src/lib', '.ts')) if (/contextTabs[\s\S]{0,300}(?:children|items)\s*:/m.test(read(file))) failures.push(`CONTEXT_TAB_DEPTH ${file}`);

// Transitional generic stores accept only reviewed baseline feature types.
for (const [file, types] of Object.entries(baseline.genericStorageTypes)) {
  const source = read(file);
  for (const type of types) {
    const present = source.includes(`'${type}'`) || source.includes(`"${type}"`);
    if (retiredAdmissionsStorageTypes.has(type)) {
      if (present) failures.push(`LEGACY_ADMISSIONS_GENERIC_STORAGE ${file}:${type}`);
    } else if (!present) {
      failures.push(`GENERIC_STORAGE baseline type removed or renamed without review: ${file}:${type}`);
    }
  }
  const candidates = file.endsWith('ModuleDataController.php') ? source.match(/private const MODULES = \[([^\]]*)]/s)?.[1] ?? '' : source;
  if (file.endsWith('ModuleDataController.php')) for (const match of candidates.matchAll(/['"]([^'"]+)['"]/g)) if (!types.includes(match[1])) failures.push(`GENERIC_STORAGE unregistered type ${match[1]}`);
  if (file.endsWith('SchoolModuleCatalog.php')) for (const match of source.matchAll(/^\s{12}'([^']+)'\s*=>\s*self::module/gm)) if (!types.includes(match[1])) failures.push(`GENERIC_STORAGE unregistered type ${match[1]}`);
}

// Current domain write ownership is explicit. Any new write-bearing Domain file fails until reviewed.
for (const file of walk('backend/app/Domain', '.php')) {
  const writeCount = [...read(file).matchAll(/(?:::query\(\)->create|->(?:save|update|delete)\s*\()/g)].length;
  const allowed = file === 'backend/app/Domain/Library/AI/AIManager.php' ? 6 : (approvedDomainWrites.get(file)?.count ?? 0);
  if (writeCount > allowed) failures.push(`CROSS_DOMAIN_WRITE ${file}: ${writeCount} writes exceeds reviewed ${allowed}`);
}

// Shared primitives may not introduce obvious new interaction/style debt.
const wave2StrictUiFiles = new Set([
  'src/components/ui/Button.tsx', 'src/components/ui/Controls.tsx', 'src/components/ui/FilterBar.tsx',
  'src/components/ui/FormField.tsx', 'src/components/ui/Navigation.tsx', 'src/components/ui/StatusBadge.tsx',
]);
for (const file of wave2StrictUiFiles) {
  if (file.endsWith('Button.tsx')) continue;
  const source = read(file);
  if (/<div[^>]+onClick=/m.test(source) && !baseline.legacyUiDebt.some((entry) => entry.file === file && entry.rule === 'CLICKABLE_DIV')) failures.push(`CLICKABLE_DIV ${file}`);
  if (/(?:#[0-9a-f]{3,8}|rgb\()/i.test(source)) failures.push(`HARDCODED_COLOR ${file}`);
  if (/z-\[(?:[6-9]\d|\d{3,})\]/.test(source)) failures.push(`Z_INDEX_ESCALATION ${file}`);
  if (/outline-(?:none|0)(?![^\n]*(?:focus-visible|ds-focus-ring))/m.test(source)) failures.push(`FOCUS_OUTLINE_REMOVAL ${file}`);
}

// Wave 6 freezes the remaining compatibility collections in AppContext. New
// root collection state belongs to a reviewed feature/server-state owner.
const appContext = read('src/context/AppContext.tsx');
const approvedLegacyRootCollections = new Set(['students', 'staff', 'sessions', 'terms', 'classes', 'subjects', 'assessments', 'cbtQuizzes', 'invoices', 'feeTransactions', 'resultPINs', 'launchChecklist', 'lessonPlans', 'linkedChildren', 'invitations', 'printableCards', 'subscriptionPlans', 'guidedSetupSteps', 'offlineQueue']);
for (const match of appContext.matchAll(/const\s+\[([A-Za-z0-9_]+),\s*set[A-Za-z0-9_]+]\s*=\s*useState<[^>]*\[\]/g)) {
  if (!approvedLegacyRootCollections.has(match[1])) failures.push(`ROOT_CONTEXT_COLLECTION src/context/AppContext.tsx: ${match[1]}`);
}
for (const file of walk('src/state', '.ts').concat(walk('src/state', '.tsx'))) {
  const source = read(file);
  if (/\b(?:role|personaHint)\s*={2,3}\s*['"][^'"]+['"]/.test(source)) failures.push(`FRONTEND_ROLE_AUTH ${file}`);
  if (/localStorage\.setItem\([^,]+,\s*JSON\.stringify/.test(source)) failures.push(`STATE_SENSITIVE_PERSISTENCE ${file}`);
}

// Wave 7 canonical routing: unique IDs/paths, no role-owned URLs, no silent Home fallback.
const routingFiles = walk('src/routing', '.ts').concat(walk('src/routing', '.tsx')).filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'));
const routeIds = [];
const routePaths = [];
for (const file of routingFiles) {
  const source = read(file);
  if (/window\.history\.(?:pushState|replaceState)/.test(source)) failures.push(`MANUAL_HISTORY ${file}`);
  if (/Navigate\s+to=["']\/(?:school|personal|platform)?["']/.test(source) && /unknown/i.test(source)) {
    failures.push(`UNKNOWN_ROUTE_TO_HOME ${file}`);
  }
  for (const match of source.matchAll(/id:\s*'([^']+)'/g)) {
    if (file.endsWith('registry.ts') && match[1].includes('.')) routeIds.push(match[1]);
  }
  for (const match of source.matchAll(/path:\s*'(\/[^']*)'/g)) {
    if (file.endsWith('registry.ts')) routePaths.push(match[1]);
  }
}
if (new Set(routeIds).size !== routeIds.length) failures.push('DUPLICATE_ROUTE_ID registry');
if (new Set(routePaths).size !== routePaths.length) failures.push('DUPLICATE_CANONICAL_PATH registry');
if (routingFiles.some((file) => /(?:teacher|principal|admin)-dashboard/.test(read(file)))) failures.push('ROLE_SPECIFIC_ROUTE src/routing');
const aliases = read('src/routing/aliases.ts');
if (/\*.*\*|oldPath:\s*'[^']*\*'/.test(aliases)) failures.push('WILDCARD_ALIAS src/routing/aliases.ts');
const appSource = read('src/App.tsx');
if (/window\.history\.(?:pushState|replaceState)/.test(appSource)) failures.push('MANUAL_HISTORY src/App.tsx');
if (/default:\s*\n\s*return\s+<SchoolAdminDashboard/.test(appSource)) failures.push('UNKNOWN_ROUTE_TO_HOME src/App.tsx');
const adapter = read('src/routing/LegacyPageAdapter.tsx');
if (!/default:\s*\n\s*return <RouteNotFound/.test(adapter)) failures.push('UNKNOWN_ROUTE_TO_HOME src/routing/LegacyPageAdapter.tsx');

// Wave 8 authenticated shell: chrome is injected navigation, token-driven, and
// must not fetch domain collections or wrap public routes.
const shellFiles = walk('src/shell', '.ts').concat(walk('src/shell', '.tsx')).filter((file) => !file.includes('.test.'));
const allowedShellApi = ['/notifications', '/notifications/read-all'];
for (const file of shellFiles) {
  const source = read(file);
  for (const match of source.matchAll(/apiRequest(?:<[^>]*>)?\(\s*['"]([^'"]+)['"]/g)) {
    if (!allowedShellApi.includes(match[1]) && !match[1].startsWith('/notifications/')) {
      failures.push(`DOMAIN_API_IN_SHELL ${file}: ${match[1]}`);
    }
  }
  if (/\bNAV_GROUPS\b/.test(source)) failures.push(`NAV_EMBEDDED_IN_SHELL ${file}`);
  if (/#[0-9a-fA-F]{3,8}\b/.test(source)) failures.push(`RAW_PALETTE_SHELL ${file}`);
  if (/\b(?:setStudents|setAssessments|setInvoices|students\.map|assessments\.map)\b/.test(source)) {
    failures.push(`DOMAIN_COLLECTION_IN_SHELL ${file}`);
  }
  if (file !== 'src/shell/LegacyNavigationAdapter.ts' && /\brole\s*={2,3}\s*['"][^'"]+['"]/.test(source)) {
    failures.push(`SHELL_ROLE_BRANCH ${file}`);
  }
}
const appRouter = read('src/routing/AppRouter.tsx');
if (/\bAppSidebar\b/.test(appRouter) || /\bAppHeader\b/.test(appRouter)) failures.push('LEGACY_CHROME_IN_ROUTER src/routing/AppRouter.tsx');
if (!/AuthenticatedRoot/.test(appRouter)) failures.push('MISSING_AUTHENTICATED_ROOT src/routing/AppRouter.tsx');
if (/path="\/(?:login|welcome|results)"[\s\S]{0,80}Authenticated(Root|Layout)/.test(appRouter)) {
  failures.push('PUBLIC_ROUTE_IN_AUTH_SHELL src/routing/AppRouter.tsx');
}
const tenantTheme = read('src/lib/designSystem/tenantTheme.ts');
if (/--color-(?:focus-ring|status-|text-primary)/.test(tenantTheme.split('return')[1] ?? '')) {
  failures.push('TENANT_THEME_PROTECTED_SEMANTIC src/lib/designSystem/tenantTheme.ts');
}

// Frontend V2 pilot routes own their page composition and cannot regress to
// legacy layout/navigation or role-name authorization.
const migratedPeoplePaths = [
  'src/domains/people/students',
  'src/domains/people/guardians',
  'src/domains/people/workforce',
];
for (const file of migratedPeoplePaths.flatMap((directory) => walk(directory, '.ts').concat(walk(directory, '.tsx'))).filter((file) => !file.includes('.test.'))) {
  const source = read(file);
  if (/LegacyPageAdapter|ModuleWorkspace|legacy navigation/i.test(source)) failures.push(`V2_LEGACY_LAYOUT ${file}`);
  if (/\b(?:role|currentRole)\s*={2,3}\s*['"][^'"]+['"]/.test(source)) failures.push(`V2_ROLE_NAME_AUTH ${file}`);
  if (/tenantId\s*[:=]\s*['"][^'"]+['"]/.test(source)) failures.push(`V2_HARDCODED_TENANT ${file}`);
}
const studentsV2 = read('src/domains/people/students/StudentsPage.tsx');
if (!/buildRoute\('school\.people\.students\.profile'/.test(studentsV2)) failures.push('V2_RAW_PROFILE_ROUTE StudentsPage');
if (!/GuardiansPage/.test(appRouter) || !/WorkforcePage/.test(appRouter)) failures.push('V2_PEOPLE_ROUTE_INTEGRATION src/routing/AppRouter.tsx');

// Admissions V2 owns all six route compositions and cannot fall back to the
// retired exhaustive module navigation or legacy presentation.
const admissionsFiles = walk('src/domains/admissions', '.ts')
  .concat(walk('src/domains/admissions', '.tsx'))
  .filter((file) => !file.includes('.test.'));
for (const file of admissionsFiles) {
  const source = read(file);
  if (/LegacyPageAdapter|ModuleWorkspace|features\/admissions/i.test(source)) failures.push(`ADMISSIONS_V2_LEGACY_LAYOUT ${file}`);
  if (/\b(?:role|currentRole)\s*={2,3}\s*['"][^'"]+['"]/.test(source)) failures.push(`ADMISSIONS_V2_ROLE_NAME_AUTH ${file}`);
  if (/tenantId\s*[:=]\s*['"][^'"]+['"]/.test(source)) failures.push(`ADMISSIONS_V2_HARDCODED_TENANT ${file}`);
  if (/(?:to|href|navigate)\s*=\s*["']\/school\/admissions/.test(source)) failures.push(`ADMISSIONS_V2_RAW_ROUTE ${file}`);
  if (/(?:text|bg|border)-(?:red|rose|green|emerald|yellow|amber)-(?:[1-9]00|50)\b/.test(source)) failures.push(`ADMISSIONS_V2_STATUS_PALETTE ${file}`);
  if (/\b(?:demoData|mockApplications|sampleApplicants)\b/i.test(source)) failures.push(`ADMISSIONS_V2_DEMO_RECORDS ${file}`);
}
if (fs.existsSync(path.join(root, 'src/features/admissions/AdmissionsView.tsx'))) failures.push('ADMISSIONS_LEGACY_PRESENTATION src/features/admissions/AdmissionsView.tsx');
if (/AdmissionsView|case\s+['"]admissions['"]/.test(adapter)) failures.push('ADMISSIONS_LEGACY_ADAPTER src/routing/LegacyPageAdapter.tsx');
if (/features\/admissions\/AdmissionsView/.test(read('src/routing/pages.ts'))) failures.push('ADMISSIONS_LEGACY_LAZY_IMPORT src/routing/pages.ts');
if (read('src/routing/registry.ts').split('\n').some((line) => line.includes("id: 'school.admissions") && line.includes('legacyNavIds'))) failures.push('ADMISSIONS_LEGACY_ROUTE_COMPATIBILITY src/routing/registry.ts');
if (!/AdmissionsOverviewPage/.test(appRouter) || !/AdmissionsSettingsPage/.test(appRouter)) failures.push('ADMISSIONS_V2_ROUTE_INTEGRATION src/routing/AppRouter.tsx');
if (!/school\.admissions/.test(read('src/shell/WorkspaceShellChrome.tsx').split('usesV2Composition')[1] ?? '')) failures.push('ADMISSIONS_V2_SHELL_COMPOSITION src/shell/WorkspaceShellChrome.tsx');
if (/isAdmissions|admissionsSection/.test(read('src/components/ModuleWorkspace.tsx')) || /admissionsSection|view:\s*['"]admissions['"]/.test(navigation)) failures.push('ADMISSIONS_LEGACY_NAV_OWNERSHIP');

// Wave 2 token definitions own raw values; shared components consume semantic aliases.
for (const file of wave2StrictUiFiles) {
  const source = read(file);
  if (/(?:text|bg|border)-(?:red|rose|green|emerald|yellow|amber)-(?:[1-9]00|50)\b/.test(source)) failures.push(`HARDCODED_STATUS_PALETTE ${file}`);
}

if (failures.length) {
  console.error(`Architecture guard failed (${failures.length}):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('Architecture guard passed: role, tenant vocabulary, navigation, generic storage, and shared UI rules are green.');

function walk(relative, extension) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relative, entry.name).replaceAll('\\', '/');
    return entry.isDirectory() ? walk(child, extension) : child.endsWith(extension) ? [child] : [];
  });
}
