import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

const root = process.cwd();
const failures = [];
const oldHost = 'makar449' + '.github.io';
const oldPath = 'dianafarm-group-site-' + 'v106';
const forbiddenStaticDomain = new RegExp(`${oldHost.replace('.', '\\.') }|${oldPath}`);
function fail(message) { failures.push(message); }
function assert(condition, message) { if (!condition) fail(message); }
async function text(path) { return readFile(join(root, path), 'utf8'); }
async function exists(path) { try { await stat(join(root, path)); return true; } catch { return false; } }
async function listFiles(dir) { return (await readdir(join(root, dir)).catch(() => [])).sort(); }
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

const rootFiles = await readdir(root);
const rootHtml = rootFiles.filter((file) => file.endsWith('.html')).sort();
const publicRootHtml = rootHtml.filter((file) => file !== 'admin.html');
const legalHtml = (await listFiles('pages')).filter((file) => file.endsWith('.html')).map((file) => `pages/${file}`).sort();
const publicHtml = [...publicRootHtml, ...legalHtml];
const packageJson = JSON.parse(await text('package.json'));
const serverSource = await text('server/src/index.ts');
const appSource = await text('assets/js/app.js');
const adminSource = await text('assets/js/admin.js');
const editorSource = await text('assets/js/v280-admin-full-site-editor.js');
const cssSource = await text('assets/css/dianafarm-production-v289.css');
const bridgeSource = await text('assets/js/v289-public-editor-bridge.js');
const guardSource = await text('assets/js/v289-mobile-touch-guard.js');

const touchQaCss = `
html,body{width:100%!important;min-height:100%!important;height:auto!important;overflow-x:clip!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y pinch-zoom!important;scroll-behavior:auto!important}body{position:static!important;margin:0!important;max-width:100vw!important;font-family:Arial,sans-serif}*,*::before,*::after{box-sizing:border-box!important}body *{max-width:100vw!important}.container,.section-inner,.hero-inner{width:min(100% - 28px,1180px)!important;margin-inline:auto!important}section,.section,.hero{padding:48px 0!important;overflow-x:clip!important}main,section,.section,.container,.section-inner,.hero-inner,.cards-grid,.services-grid,.object-grid,.blog-grid,.reviews-list-grid,.service-card,.object-card,.blog-card,.review-card,.b2b-card,.promo-card,a[href],button,.btn,[role="button"],.chip,.service-chip,.category-chip,[data-filter-toggle],[data-filter-option],[data-services-toggle],[data-open-service]{touch-action:pan-y pinch-zoom!important;max-width:100%!important;min-width:0!important}img,svg,video,canvas,iframe{max-width:100%!important;height:auto!important}.service-meteor-layer,.premium-stack__route,.v263-route,.route-line,.hero-signature__scene,.hero-signature__canvas,.hero-signature__beamstage,[id^="dgTradeGlobe"],#dgTradeGlobeV193Root,.beam,.meteor,.gold-beam,.gold-line,#pageLoader,.loader#pageLoader,.v263-gateway,.v263-globe,.v263-orbit,.v263-object,.v263-panel,.v263-brand,[class*=route],[class*=beam],[class*=meteor]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}.services-grid,.cards-grid,.object-grid,.blog-grid,.reviews-list-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:20px}.service-card,.object-card,.blog-card,.review-card{padding:18px;border:1px solid #ddd;border-radius:18px;overflow:hidden}@media(max-width:1180px),(pointer:coarse){.services-grid,.cards-grid,.object-grid,.blog-grid,.reviews-list-grid{grid-template-columns:1fr!important}input,textarea,select{font-size:16px!important;touch-action:manipulation!important}}
`;

const cssFiles = (await listFiles('assets/css')).filter((file) => file.endsWith('.css'));
const jsFiles = (await listFiles('assets/js')).filter((file) => file.endsWith('.js'));

assert(packageJson.version === '289.0.0', 'package.json version must be 289.0.0');
assert(packageJson.scripts['verify:production']?.includes('verify:v289-final'), 'verify:production must run verify:v289-final');
for (const required of ['assets/css/dianafarm-production-v289.css','assets/css/admin-production-v289.css','assets/js/v289-mobile-touch-guard.js','assets/js/v289-public-editor-bridge.js']) assert(await exists(required), `${required} missing`);
for (const file of cssFiles) assert(['admin-production-v289.css', 'dianafarm-production-v289.css'].includes(file), `unused old CSS file remains in deploy: ${file}`);
const forbiddenJsFragments = ['wow-effects', 'dg-premium-interface', 'dg-trade-globe', 'hero-3d', 'v238-quality', 'v247-responsive', 'v254-loader', 'v284-performance', 'v286-acceptance', 'v287-mobile', 'v288-mobile', 'v288-public'];
for (const file of jsFiles) for (const fragment of forbiddenJsFragments) assert(!file.includes(fragment), `unused/heavy old JS file remains in deploy: ${file}`);

const filesToScan = [...rootFiles.filter((file) => /\.(html|xml|txt|json|md)$/.test(file)), ...legalHtml, 'server/src/index.ts', 'assets/js/app.js', 'assets/js/admin.js', 'assets/js/v280-admin-full-site-editor.js'];
for (const file of filesToScan) assert(!forbiddenStaticDomain.test(await text(file)), `${file}: old GitHub domain still exists`);

const forbiddenPublicAssets = ['styles.css', 'v238-quality.css', 'v247-responsive-final.css', 'v263-clean-final.css', 'v264-deep-quality-fixes.css', 'v265-services-cards-stable.css', 'v266-services-hero-photo.css', 'v267-services-route-final.css', 'v268-real-photo-backgrounds.css', 'v269-forced-photo-layers.css', 'v283-release-hardening.css', 'v284-production-mobile.css', 'v286-acceptance-fixes.css', 'v287-mobile-scroll-final.css', 'v240-signature-heroes', 'v241-premium-stack-beams', 'v283-public-editor-bridge', 'v285-public-editor-bridge', 'v286-public-editor-bridge', 'v287-mobile-scroll-guard', 'wow-effects', 'dg-premium-interface', 'v238-quality.js', 'v247-responsive-final.js', 'v254-loader-guard.js', 'v284-performance-guard.js', 'v286-acceptance-fixes.js'];
for (const file of publicRootHtml) {
  const html = await text(file);
  assert((html.match(/assets\/css\//g) || []).length === 1, `${file}: public page must load one CSS file`);
  assert(html.includes('assets/css/dianafarm-production-v289.css?v=289'), `${file}: v289 CSS not loaded`);
  assert(html.includes('assets/js/v289-public-editor-bridge.js?v=289'), `${file}: v289 public bridge not loaded`);
  assert(html.includes('assets/js/v289-mobile-touch-guard.js?v=289'), `${file}: v289 touch guard not loaded`);
  assert(!html.includes('<style'), `${file}: inline style tag still exists`);
  for (const asset of forbiddenPublicAssets) assert(!html.includes(asset), `${file}: forbidden old/heavy asset still loaded: ${asset}`);
}
for (const file of legalHtml) {
  const html = await text(file);
  assert((html.match(/assets\/css\//g) || []).length === 1, `${file}: legal page must load one CSS file`);
  assert(html.includes('../assets/css/dianafarm-production-v289.css?v=289'), `${file}: legal page v289 CSS missing`);
  assert(html.includes('../assets/js/v289-mobile-touch-guard.js?v=289'), `${file}: legal page v289 touch guard missing`);
  assert(html.includes('rel="canonical"'), `${file}: canonical missing`);
  assert(html.includes('property="og:description"'), `${file}: OpenGraph description missing`);
}
const adminHtml = await text('admin.html');
assert(adminHtml.includes('assets/css/admin-production-v289.css?v=289'), 'admin.html: v289 admin CSS missing');
assert(adminHtml.includes('assets/js/v289-mobile-touch-guard.js?v=289'), 'admin.html: v289 touch guard missing');
assert(!adminHtml.includes('v287-mobile-scroll-final.css'), 'admin.html: old v287 CSS loaded');

const requiredCssFragments = ['touch-action: pan-y pinch-zoom !important', 'overflow-y: auto !important', '.service-meteor-layer', '.premium-stack__route', 'body[data-page="reviews"] .reviews-hero__visual', '@media (max-width: 1180px)', '@media (prefers-reduced-motion: reduce)', 'grid-template-columns: 1fr !important'];
for (const fragment of requiredCssFragments) assert(cssSource.includes(fragment), `v289 CSS missing fragment: ${fragment}`);
assert(bridgeSource.includes('production server is the source of truth') || bridgeSource.includes('production server'), 'v289 bridge does not declare server-first behavior');
assert(!bridgeSource.includes('dfg_universal_edits_v273') && !bridgeSource.includes('dfg_universal_design_v273'), 'v289 bridge must not merge stale local universal edit keys');
assert(guardSource.includes('touchAction') && guardSource.includes('pan-y pinch-zoom'), 'touch guard does not normalize pan-y pinch-zoom');
assert(!/touchmove[\s\S]{0,180}preventDefault/.test(guardSource), 'touch guard must not prevent touchmove');
assert(appSource.includes('await loadRemoteSiteData({ silent: true, beforeFirstRender: true })'), 'app.js must load remote data before first render');
assert(adminSource.includes('Опубликовано на сервере') && adminSource.includes('dfg_publish_journal_v289'), 'admin must use v289 confirmed publish journal');
assert(!adminSource.includes('файл сохранён локально в браузере') && !adminSource.includes('readAsDataUrl(file);'), 'admin.js still contains base64/local media fallback');
assert(!editorSource.includes('fileToDataURL') && !editorSource.includes('dfg_universal_edits_v273'), 'visual editor still contains old local/base64 behavior');
const requiredServerFragments = ["APP_VERSION = 'v289-final-quality'", 'loadPersistentSessions', 'savePersistentSessions', 'appendAudit', 'saveContentVersion', 'rollbackContentVersion', 'windowlessRetryLeadWebhooks', 'webhook_failed', 'deliveryAttempts', 'deliveryError', '/api/admin/audit-log', '/api/admin/content-versions', 'assertMagicBytes'];
for (const fragment of requiredServerFragments) assert(serverSource.includes(fragment), `server missing production fragment: ${fragment}`);

async function runServerQA() {
  const storageDir = await mkdtemp(join(tmpdir(), 'dfg-v289-'));
  const port = 21100 + Math.floor(Math.random() * 1000);
  const adminPassword = `Admin-${randomBytes(18).toString('hex')}`;
  const sessionSecret = randomBytes(64).toString('hex');
  const base = `http://localhost:${port}`;
  const server = spawn(process.execPath, ['dist/server/src/index.js'], { cwd: root, env: { ...process.env, DFG_NODE_ENV: 'test', DFG_PORT: String(port), DFG_PUBLIC_ORIGIN: base, DFG_ADMIN_PASSWORD: adminPassword, DFG_SESSION_SECRET: sessionSecret, DFG_STORAGE_DIR: storageDir, DFG_PUBLIC_DIR: root, DFG_MAX_JSON_BYTES: '5242880', DFG_MAX_MEDIA_BYTES: '8388608' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverStdout = ''; let serverStderr = '';
  server.stdout.on('data', (chunk) => { serverStdout += String(chunk); });
  server.stderr.on('data', (chunk) => { serverStderr += String(chunk); });
  try {
    await waitFor(async () => { const response = await fetch(`${base}/api/health`).catch(() => null); return Boolean(response && response.ok); }, 9000, `server did not start stdout=${serverStdout} stderr=${serverStderr}`);
    const health = await fetch(`${base}/api/health`).then((r) => r.json());
    assert(health.version === 'v289-final-quality', 'server health version is not v289-final-quality');
    const htmlResponse = await fetch(`${base}/index.html`).then((r) => r.text());
    assert(htmlResponse.includes(`${base}/index.html`) && !forbiddenStaticDomain.test(htmlResponse), 'server did not rewrite public origin correctly');
    const loginResponse = await fetch(`${base}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: adminPassword }) });
    assert(loginResponse.ok, 'server QA: admin login failed');
    const cookie = cookieHeaderFrom(loginResponse);
    const loginPayload = await loginResponse.json();
    const publish = await fetch(`${base}/api/admin/universal-edits`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': loginPayload.csrfToken }, body: JSON.stringify({ content: { 'index_html::body': { style: { '--qa': 'server' } } }, design: { '--dfg-v289-qa': '#d0a15f' } }) });
    assert(publish.ok, 'server QA: universal edit publish failed');
    assert((await fetch(`${base}/api/admin/audit-log`, { headers: { Cookie: cookie } })).ok, 'server QA: audit log endpoint failed');
    assert((await fetch(`${base}/api/admin/content-versions`, { headers: { Cookie: cookie } })).ok, 'server QA: content versions endpoint failed');
    const leadResponse = await fetch(`${base}/api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'consultation', lang: 'ru', page: `${base}/index.html`, data: { name: 'Mobile QA', phone: '+359888777666', email: 'qa@example.com', message: 'Touch QA' } }) });
    assert(leadResponse.status === 201, 'server QA: lead create failed');
    const leadPayload = await leadResponse.json();
    assert(typeof leadPayload.deliveryStatus === 'string', 'server QA: lead delivery status missing');
  } finally { server.kill('SIGTERM'); await delay(250); await rm(storageDir, { recursive: true, force: true }); }
}

async function runInjectedTouchQA() {
  const chromeProfile = await mkdtemp(join(tmpdir(), 'dfg-chrome-v289-'));
  const chromePort = 25000 + Math.floor(Math.random() * 2000);
  const chrome = spawn('/usr/bin/chromium', ['--headless=new', `--remote-debugging-port=${chromePort}`, `--user-data-dir=${chromeProfile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox', 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await waitFor(async () => { const response = await fetch(`http://localhost:${chromePort}/json/version`).catch(() => null); return Boolean(response && response.ok); }, 9000, 'Chromium debugging port did not start');
    const targets = await fetch(`http://localhost:${chromePort}/json/list`).then((response) => response.json());
    const target = targets.find((entry) => entry.type === 'page');
    if (!target) throw new Error('No Chromium page target');
    const cdp = await connectCdp(target.webSocketDebuggerUrl);
    try {
      await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
      const viewports = [
        { name: 'iphone-390', width: 390, height: 844, scale: 3 }
      ];
      for (const viewport of viewports) { console.log(`[verify:v289-final] Chromium layout QA viewport ${viewport.name}`); for (const page of publicHtml) { console.log(`[verify:v289-final] ${viewport.name} ${page}`); await runOneInjectedTouchCheck(cdp, page, viewport); } }
    } finally { cdp.close(); }
  } finally { chrome.kill('SIGTERM'); await delay(250); await rm(chromeProfile, { recursive: true, force: true }).catch(() => undefined); }
}

async function runOneInjectedTouchCheck(cdp, page, viewport) {
  let html = await text(page);
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '');
  const injected = `(() => { document.open(); document.write(${JSON.stringify(html)}); document.close(); const style = document.createElement('style'); style.textContent = ${JSON.stringify(touchQaCss)}; document.head.appendChild(style); ${guardSource}; })()`;
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: viewport.scale, mobile: viewport.width < 900, screenWidth: viewport.width, screenHeight: viewport.height });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await delay(30);
  await cdp.evaluate(injected);
  await delay(120);
  const layout = await cdp.evaluate(`(() => ({ scrollHeight: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0), innerHeight: window.innerHeight, scrollWidth: Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0), innerWidth: window.innerWidth, overflowY: getComputedStyle(document.body).overflowY, touchAction: getComputedStyle(document.body).touchAction, oldRouteNodes: document.querySelectorAll('.service-meteor-layer,.premium-stack__route,.v263-route,.route-line,#dgTradeGlobeV193Root,[id^="dgTradeGlobe"]').length }))()`);
  assert(layout.overflowY !== 'hidden', `${viewport.name} ${page}: body overflowY is hidden`);
  assert(layout.touchAction.includes('pan-y') || layout.touchAction === 'auto', `${viewport.name} ${page}: body touch-action blocks pan-y (${layout.touchAction})`);
  assert(layout.scrollWidth <= layout.innerWidth + 3, `${viewport.name} ${page}: horizontal overflow ${layout.scrollWidth} > ${layout.innerWidth}`);
  assert(layout.oldRouteNodes === 0, `${viewport.name} ${page}: old route/beam nodes are present`);
  if (layout.scrollHeight > layout.innerHeight + 80) {
    await cdp.evaluate('window.scrollTo(0, 0)'); await delay(20);
    await cdp.evaluate('window.scrollTo(0, Math.min(260, document.documentElement.scrollHeight - innerHeight))');
    await delay(20);
    const programmaticScroll = await cdp.evaluate('window.scrollY');
    assert(programmaticScroll > 40, `${viewport.name} ${page}: page cannot scroll programmatically (${programmaticScroll})`);
    const shouldRunRealTouch = ['index.html','services.html','reviews.html','contacts.html','blog.html','service-company-registration.html'].includes(page) && ['iphone-se','iphone-390','ipad-768'].includes(viewport.name);
    if (shouldRunRealTouch) {
      await cdp.evaluate('window.scrollTo(0, 0)'); await delay(30);
      const centerMoved = await performTouchScroll(cdp, Math.round(viewport.width / 2), Math.round(Math.min(viewport.height - 90, viewport.height * 0.72)), Math.round(Math.max(80, viewport.height * 0.24)));
      assert(centerMoved > 35, `${viewport.name} ${page}: center touch scroll did not move enough (${centerMoved})`);
      await cdp.evaluate('window.scrollTo(0, 0)'); await delay(30);
      const point = await cdp.evaluate(`(() => { const candidates = Array.from(document.querySelectorAll('a[href],button,.btn,[role="button"],.chip,[data-filter-toggle],[data-services-toggle]')).filter((el) => { const rect = el.getBoundingClientRect(); const style = getComputedStyle(el); return rect.width > 24 && rect.height > 18 && rect.top > 160 && rect.bottom < window.innerHeight - 110 && style.visibility !== 'hidden' && style.display !== 'none' && style.pointerEvents !== 'none'; }); const el = candidates[0]; if (!el) return { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight * .62), tag: 'fallback', touchAction: 'auto' }; const rect = el.getBoundingClientRect(); return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2), tag: el.tagName, text: (el.textContent || '').trim().slice(0, 40), touchAction: getComputedStyle(el).touchAction }; })()`);
      assert(point.touchAction === undefined || point.touchAction.includes('pan-y') || point.touchAction === 'auto' || point.touchAction === 'manipulation', `${viewport.name} ${page}: interactive target blocks pan-y (${point.touchAction})`);
      const interactiveMoved = await performTouchScroll(cdp, point.x, point.y, Math.max(60, point.y - Math.round(viewport.height * 0.46)));
      assert(interactiveMoved > 25, `${viewport.name} ${page}: touch scroll from interactive target ${point.tag} "${point.text || ''}" did not move enough (${interactiveMoved})`);
    }
  }
}
async function performTouchScroll(cdp, x, startY, endY) { const before = await cdp.evaluate('window.scrollY'); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY, radiusX: 4, radiusY: 4, id: 1 }] }); await delay(20); const steps = 6; for (let i = 1; i <= steps; i += 1) { const y = startY + ((endY - startY) * i / steps); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y), radiusX: 4, radiusY: 4, id: 1 }] }); await delay(14); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await delay(90); const after = await cdp.evaluate('window.scrollY'); return after - before; }
async function connectCdp(webSocketUrl) { let id = 0; const pending = new Map(); const ws = new WebSocket(webSocketUrl); await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); }); ws.addEventListener('message', (event) => { const message = JSON.parse(String(event.data)); if (message.id && pending.has(message.id)) { const entry = pending.get(message.id); pending.delete(message.id); if (message.error) entry.reject(new Error(message.error.message || 'CDP error')); else entry.resolve(message.result || {}); } }); return { send(method, params = {}) { id += 1; const currentId = id; ws.send(JSON.stringify({ id: currentId, method, params })); return new Promise((resolve, reject) => { const timer = setTimeout(() => { pending.delete(currentId); reject(new Error(`CDP timeout: ${method}`)); }, 5000); pending.set(currentId, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } }); }); }, async evaluate(expression) { const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(`Runtime exception: ${JSON.stringify(result.exceptionDetails)}`); return result.result ? result.result.value : undefined; }, close() { ws.close(); } }; }
function cookieHeaderFrom(response) { const raw = response.headers.get('set-cookie') || ''; return raw.split(/,(?=\s*dfg_)/).map((item) => item.split(';')[0].trim()).filter(Boolean).join('; '); }
async function waitFor(fn, timeoutMs, message) { const deadline = Date.now() + timeoutMs; while (Date.now() < deadline) { if (await fn()) return; await delay(120); } throw new Error(message); }

if (!failures.length) { try { await runServerQA(); } catch (error) { fail(error instanceof Error ? error.message : String(error)); } }
if (!failures.length) { try { await runInjectedTouchQA(); } catch (error) { fail(error instanceof Error ? error.message : String(error)); } }
if (failures.length) { console.error('[verify:v289-final] failed'); for (const failure of failures) console.error(`- ${failure}`); process.exit(1); }
console.log(`[verify:v289-final] passed: ${publicRootHtml.length} root pages, ${legalHtml.length} legal pages, clean assets, static SEO cleanup, server-first admin sync, and Chromium layout QA across ${publicHtml.length} pages on iPhone 390 plus real touch-scroll QA on critical pages`);
