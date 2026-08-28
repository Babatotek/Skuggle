import { writeFileSync } from 'node:fs';

const PAGE_ID = process.argv[2] || 'B2E3A454C5C85B5762F77F495CE60C80';
const wsUrl = `ws://127.0.0.1:9222/devtools/page/${PAGE_ID}`;

const requests = [];
const responses = [];
const allUrls = [];
let loadFired = false;
let id = 1;
const pending = new Map();

function send(ws, method, params = {}) {
  const messageId = id++;
  return new Promise((resolve, reject) => {
    pending.set(messageId, { resolve, reject });
    ws.send(JSON.stringify({ id: messageId, method, params }));
    setTimeout(() => {
      if (pending.has(messageId)) {
        pending.delete(messageId);
        reject(new Error(`CDP timeout: ${method}`));
      }
    }, 10000);
  });
}

const ws = new WebSocket(wsUrl);

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve);
  ws.addEventListener('error', reject);
});

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve } = pending.get(msg.id);
    pending.delete(msg.id);
    resolve(msg);
    return;
  }
  if (msg.method === 'Network.requestWillBeSent') {
    const url = msg.params.request.url;
    allUrls.push(url);
    if (url.includes('/api/v1/')) {
      requests.push({ url, method: msg.params.request.method });
    }
  }
  if (msg.method === 'Network.responseReceived') {
    const url = msg.params.response.url;
    if (url.includes('/api/v1/')) {
      responses.push({ url, status: msg.params.response.status });
    }
  }
  if (msg.method === 'Page.loadEventFired') {
    loadFired = true;
  }
});

await send(ws, 'Network.enable');
await send(ws, 'Page.enable');
await send(ws, 'Page.navigate', { url: 'http://localhost:3000/' });

const started = Date.now();
while (!loadFired && Date.now() - started < 15000) {
  await new Promise((r) => setTimeout(r, 200));
}
await new Promise((r) => setTimeout(r, 2500));

const cookies = await send(ws, 'Network.getCookies', { urls: ['http://localhost:3000/'] });
const evalResult = await send(ws, 'Runtime.evaluate', {
  expression: '({ href: location.href, cookie: document.cookie, title: document.title })',
  returnByValue: true,
});

const result = {
  loadFired,
  page: evalResult.result?.result?.value,
  cookieNames: (cookies.result?.cookies || []).map((c) => c.name),
  apiRequests: requests,
  apiResponses: responses,
  sampleUrls: allUrls.slice(0, 20),
  totalUrls: allUrls.length,
};

writeFileSync('C:/Skuggle/scripts/guest-landing-cdp-result.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
ws.close();
process.exit(0);
