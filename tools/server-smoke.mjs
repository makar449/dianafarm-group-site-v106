import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

const root = process.cwd();
const storageDir = await mkdtemp(join(tmpdir(), 'dfg-v303-smoke-'));
const port = 19080 + Math.floor(Math.random() * 1000);
const adminPassword = `Admin-${randomBytes(18).toString('hex')}`;
const sessionSecret = randomBytes(64).toString('hex');
const base = `http://localhost:${port}`;

const child = spawn(process.execPath, ['dist/server/src/index.js'], {
  cwd: root,
  env: {
    ...process.env,
    DFG_NODE_ENV: 'test',
    DFG_PORT: String(port),
    DFG_PUBLIC_ORIGIN: base,
    DFG_ADMIN_PASSWORD: adminPassword,
    DFG_SESSION_SECRET: sessionSecret,
    DFG_STORAGE_DIR: storageDir,
    DFG_PUBLIC_DIR: root,
    DFG_MAX_JSON_BYTES: '5242880',
    DFG_MAX_MEDIA_BYTES: '8388608'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';
child.stdout.on('data', (chunk) => { stdout += String(chunk); });
child.stderr.on('data', (chunk) => { stderr += String(chunk); });

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function waitForServer() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {}
    await delay(150);
  }
  throw new Error(`Server did not start. stdout=${stdout}\nstderr=${stderr}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cookieHeaderFrom(response) {
  const raw = response.headers.get('set-cookie') || '';
  const parts = raw.split(/,(?=\s*dfg_)/).map((item) => item.split(';')[0].trim()).filter(Boolean);
  return parts.join('; ');
}

try {
  await waitForServer();

  const health = await fetch(`${base}/api/health`).then((r) => r.json());
  assert(health.ok === true, 'health failed');

  const index = await fetch(`${base}/index.html`);
  assert(index.ok, 'index.html failed');
  assert((await index.text()).includes('dianafarm-final-v303.css'), 'v303 final CSS not injected');

  const universalPublic = await fetch(`${base}/api/universal-edits`).then((r) => r.json());
  assert(universalPublic.content && universalPublic.design, 'public universal edits shape failed');

  const loginResponse = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminPassword })
  });
  assert(loginResponse.ok, 'login failed');
  const login = await loginResponse.json();
  assert(login.csrfToken, 'csrf missing');
  const cookie = cookieHeaderFrom(loginResponse);
  assert(cookie.includes('dfg_session') && cookie.includes('dfg_csrf'), 'cookies missing');

  const adminUniversal = await fetch(`${base}/api/admin/universal-edits`, { headers: { Cookie: cookie } });
  assert(adminUniversal.ok, 'admin universal GET failed');

  const putUniversal = await fetch(`${base}/api/admin/universal-edits`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': login.csrfToken },
    body: JSON.stringify({ content: { 'index_html::main h1': { text: 'Smoke title' } }, design: { '--dfg-site-accent': '#c9a15f' } })
  });
  assert(putUniversal.ok, 'admin universal PUT failed');

  const csrfBlocked = await fetch(`${base}/api/admin/universal-edits`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ content: {}, design: {} })
  });
  assert(csrfBlocked.status === 403, 'admin universal PUT without CSRF must be blocked');

  const universalAfterPut = await fetch(`${base}/api/universal-edits`).then((r) => r.json());
  assert(universalAfterPut.content?.['index_html::main h1']?.text === 'Smoke title', 'public universal edits did not expose saved admin edits');

  const audit = await fetch(`${base}/api/admin/audit-log`, { headers: { Cookie: cookie } });
  assert(audit.ok, 'admin audit log failed');
  const versions = await fetch(`${base}/api/admin/content-versions`, { headers: { Cookie: cookie } });
  assert(versions.ok, 'admin content versions failed');

  const leadResponse = await fetch(`${base}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'consultation', lang: 'ru', page: `${base}/index.html`, data: { name: 'Smoke Test', phone: '+359888777666', email: 'test@example.com', message: 'Check' } })
  });
  assert(leadResponse.status === 201, 'lead create failed');

  const leads = await fetch(`${base}/api/admin/leads`, { headers: { Cookie: cookie } }).then((r) => r.json());
  assert(Array.isArray(leads) && leads.length >= 1, 'admin leads failed');

  console.log('v303 server smoke passed');
} finally {
  child.kill('SIGTERM');
  await delay(250);
  await rm(storageDir, { recursive: true, force: true });
}
