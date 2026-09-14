import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({path: path.join(root, '.env'), quiet: true});
const target = new URL(process.env.SKUGGLE_BACKEND_URL || 'http://127.0.0.1:8010');
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
function launch(command, args, cwd) {
  const child = spawn(command, args, {cwd, stdio: 'inherit', windowsHide: true});
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => stop(code ?? 1));
  return child;
}
async function identifyBackend() {
  try {
    const response = await fetch(new URL('/version', target), {signal: AbortSignal.timeout(1500)});
    const body = await response.json();
    if (body.application !== 'skuggle') throw new Error('Unexpected backend');
    return true;
  } catch { return false; }
}
if (!await identifyBackend()) {
  if (!['127.0.0.1', 'localhost'].includes(target.hostname)) {
    throw new Error('SKUGGLE_BACKEND_URL must point to a running Skuggle backend.');
  }
  const backend = path.join(root, 'backend');
  launch(process.env.PHP_BIN || 'php', [
    '-S', `${target.hostname}:${target.port || '80'}`,
    '-t', path.join(backend, 'public'),
    path.join(backend, 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php'),
  ], path.join(backend, 'public'));
  let ready = false;
  for (let attempt = 0; attempt < 30 && !stopping; attempt++) {
    if (await identifyBackend()) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) { console.error(`Skuggle backend did not start at ${target.origin}. Check the port and backend configuration.`); stop(1); }
}
if (!stopping) {
  console.log(`Skuggle API: ${target.origin}`);
  launch(process.execPath, ['--import', 'tsx', 'server.ts'], root);
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
