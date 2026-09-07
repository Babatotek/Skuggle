import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const pages = await fetch('http://127.0.0.1:9222/json/list').then((response) => response.json());
const page = pages.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl) || pages.find((entry) => entry.webSocketDebuggerUrl);
if (!page?.webSocketDebuggerUrl) throw new Error('No Chrome debugging page is available on port 9222.');

const ws = new WebSocket(page.webSocketDebuggerUrl);
let sequence = 0;
const pending = new Map();
const consoleLines = [];

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

function send(method, params = {}, timeoutMs = 20000) {
  const id = ++sequence;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, timeoutMs);
  });
}

const capabilities = [
  'admissions.application.view',
  'admissions.application.create',
  'admissions.application.update',
  'admissions.screening.manage',
  'admissions.decision.manage',
  'admissions.enrolment.convert',
  'admissions.document.manage',
  'admissions.settings.update',
  'students.view',
  'settings.configure',
];

const applications = [
  ['app-1', 'FGA/2026/0048', 'Amina Abdul', 'JSS 1', 'screening', 'female', '2026-09-02T09:00:00Z'],
  ['app-2', 'FGA/2026/0047', 'Kofi Owusu', 'Grade 7', 'offered', 'male', '2026-09-01T09:00:00Z'],
  ['app-3', 'FGA/2026/0046', 'Esi Yeboah', 'JSS 1', 'submitted', 'female', '2026-08-31T09:00:00Z'],
  ['app-4', 'FGA/2026/0045', 'Nana Adwoa', 'Grade 8', 'accepted', 'female', '2026-08-30T09:00:00Z'],
  ['app-5', 'FGA/2026/0044', 'Kwame Kusi', 'JSS 2', 'screening', 'male', '2026-08-29T09:00:00Z'],
].map(([id, reference, fullName, className, status, gender, submittedAt]) => ({
  id,
  reference,
  fullName,
  status,
  gender,
  submittedAt,
  requestedClass: { id: `class-${id}`, name: className },
  guardianName: 'Guardian contact',
  guardianPhone: '+233 20 000 0000',
  screenings: status === 'screening' ? [{ id: `${id}-s`, status: 'under_review', score: null }] : [],
}));

const overview = {
  metrics: [
    { id: 'totalApplications', label: 'Total applications', value: 48 },
    { id: 'submittedThisMonth', label: 'Submitted this month', value: 16 },
    { id: 'awaitingScreening', label: 'Awaiting screening', value: 12 },
    { id: 'offersAndAcceptances', label: 'Offers and acceptances', value: 18 },
  ],
  pipeline: [
    { status: 'draft', count: 0 },
    { status: 'submitted', count: 8 },
    { status: 'screening', count: 4 },
    { status: 'screened', count: 2 },
    { status: 'waitlisted', count: 0 },
    { status: 'offered', count: 10 },
    { status: 'accepted', count: 8 },
    { status: 'declined', count: 0 },
    { status: 'rejected', count: 0 },
    { status: 'withdrawn', count: 0 },
    { status: 'enrolled', count: 15 },
  ],
  recentApplications: applications,
  trend: [
    { label: 'Mar', applications: 10 },
    { label: 'Apr', applications: 15 },
    { label: 'May', applications: 19 },
    { label: 'Jun', applications: 23 },
    { label: 'Jul', applications: 29 },
    { label: 'Aug', applications: 35 },
  ],
  tasks: [
    { id: 'screening', label: 'Applications awaiting screening', count: 12 },
    { id: 'decisions', label: 'Screened applications awaiting decision', count: 10 },
    { id: 'enrolment', label: 'Accepted applicants awaiting enrolment', count: 8 },
  ],
  conversion: { converted: 15, decided: 36, rate: 31.3 },
};

const emptyList = { data: [], meta: { currentPage: 1, perPage: 100, total: 0, lastPage: 1 } };
const applicationList = {
  data: applications,
  meta: { currentPage: 1, perPage: 10, total: applications.length, lastPage: 1 },
};

function responseFor(url) {
  const parsed = new URL(url, BASE);
  const pathname = parsed.pathname.replace('/api/v1', '');
  if (pathname === '/auth/me' || pathname === '/auth/me/') {
    return {
      success: true,
      data: {
        user: {
          id: 'visual-user',
          name: 'DemoTenant',
          email: 'reviewer@skuggle.test',
          role: 'school_super_admin',
          emailVerified: true,
          personaHint: 'school',
          tenant: { id: 'visual-tenant', name: 'Fiwasaye Girls Grammar School', code: 'FGGS', type: 'school' },
          memberships: [{
            tenantId: 'visual-tenant',
            tenantName: 'Fiwasaye Girls Grammar School',
            tenantCode: 'FGGS',
            tenantType: 'school',
            role: 'school_super_admin',
          }],
          access: { capabilities, legacyPermissions: ['admissions.manage', 'students.view', 'settings.configure'], registryVersion: 1 },
          permissions: ['admissions.manage', 'students.view', 'settings.configure'],
          assignments: [],
          context: {
            session: { id: 'session-2026', name: '2025/2026' },
            term: { id: 'term-1', name: 'First Term' },
          },
        },
      },
    };
  }
  if (pathname === '/admissions/overview') return { success: true, data: overview };
  if (pathname === '/admissions/applications') return { success: true, data: applicationList };
  if (pathname === '/admissions/screening' || pathname === '/admissions/decisions' || pathname === '/admissions/enrolment') {
    return { success: true, data: applicationList };
  }
  if (pathname === '/admissions/settings') {
    return {
      success: true,
      data: {
        cycles: [{
          id: 'cycle-1',
          name: '2026 Intake',
          status: 'active',
          opensAt: '2026-03-01',
          closesAt: '2026-09-30',
          currency: 'NGN',
          applicationFeeMinor: 1500000,
          settings: {},
        }],
      },
    };
  }
  if (pathname === '/notifications') return { success: true, data: { unreadCount: 0, data: [] } };
  if (pathname === '/academic-sessions' || pathname === '/classes' || pathname === '/subjects' || pathname === '/students') {
    return { success: true, data: emptyList };
  }
  if (pathname === '/onboarding') return { success: true, data: {} };
  if (pathname === '/plans') return { success: true, data: [] };
  return { success: true, data: emptyList };
}

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id).resolve(message);
    pending.delete(message.id);
    return;
  }
  if (message.method === 'Runtime.consoleAPICalled') {
    const text = (message.params.args || []).map((arg) => arg.value ?? arg.description ?? '').join(' ');
    consoleLines.push(`${message.params.type}: ${text}`);
    return;
  }
  if (message.method === 'Fetch.requestPaused') {
    const url = message.params.request.url;
    try {
      const payload = JSON.stringify(responseFor(url));
      void send('Fetch.fulfillRequest', {
        requestId: message.params.requestId,
        responseCode: 200,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Access-Control-Allow-Origin', value: '*' },
          { name: 'Cache-Control', value: 'no-store' },
        ],
        body: Buffer.from(payload).toString('base64'),
      });
    } catch (error) {
      void send('Fetch.failRequest', { requestId: message.params.requestId, errorReason: 'Failed' });
      consoleLines.push(`fetch-error: ${url} ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

await send('Page.enable');
await send('Runtime.enable');
await send('Console.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*://*/api/v1/*', requestStage: 'Request' }] });
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: "localStorage.setItem('skuggle_authenticated','1'); document.cookie='XSRF-TOKEN=visual; path=/';",
});

async function pageText() {
  const evaluated = await send('Runtime.evaluate', {
    expression: 'document.body ? document.body.innerText.slice(0, 4000) : ""',
    returnByValue: true,
  });
  return evaluated.result?.result?.value || '';
}

async function waitForReady(expected, timeoutMs = 25000) {
  const started = Date.now();
  let last = '';
  while (Date.now() - started < timeoutMs) {
    last = await pageText();
    if (expected.every((token) => last.includes(token))) return last;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Timed out waiting for ${expected.join(', ')}. Last page text:\n${last}\nConsole:\n${consoleLines.join('\n')}`);
}

async function capture(name, width, height, mobile) {
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  await new Promise((resolve) => setTimeout(resolve, 900));
  const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  });
  writeFileSync(`C:/Skuggle/docs/frontend-v2/evidence/admissions-${name}.png`, Buffer.from(screenshot.result.data, 'base64'));
}

async function openRoute(path, expected) {
  await send('Page.navigate', { url: `${BASE}${path}` });
  return waitForReady(expected);
}

mkdirSync('C:/Skuggle/docs/frontend-v2/evidence', { recursive: true });
await openRoute('/school/admissions', ['Admissions', 'Total Applications', 'Admissions pipeline', 'Conversion summary']);
await capture('desktop-1440x900', 1440, 900, false);
await capture('tablet-1024x768', 1024, 768, false);
await capture('tablet-768x1024', 768, 1024, true);
await capture('mobile-390x844', 390, 844, true);

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await openRoute('/school/admissions/applications', ['Applications', 'Applicant']);
await capture('applications-1440x900', 1440, 900, false);
await openRoute('/school/admissions/screening', ['Screening']);
await capture('screening-1440x900', 1440, 900, false);
await openRoute('/school/admissions/decisions', ['Decisions']);
await capture('decisions-1440x900', 1440, 900, false);
await openRoute('/school/admissions/enrolment', ['Enrolment']);
await capture('enrolment-1440x900', 1440, 900, false);
await openRoute('/school/admissions/settings', ['Settings']);
await capture('settings-1440x900', 1440, 900, false);

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await openRoute('/school/admissions/applications', ['Applications']);
await capture('applications-390x844', 390, 844, true);

console.log('Admissions viewport evidence written.');
console.log(consoleLines.slice(-20).join('\n'));
ws.close();
