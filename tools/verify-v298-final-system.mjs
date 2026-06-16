
import fs from 'fs';
import path from 'path';
import vm from 'vm';
const root = process.cwd();
const fail = (m) => { throw new Error(`[verify:v298-final-system] ${m}`); };
const rootHtml = fs.readdirSync(root).filter((name)=>name.endsWith('.html'));
const legalHtml = fs.existsSync(path.join(root,'pages')) ? fs.readdirSync(path.join(root,'pages')).filter((name)=>name.endsWith('.html')).map((name)=>path.join('pages',name)) : [];
const managedOld = /(dianafarm-production-v29[0-7]\.css|v252-full-site-i18n|v289-public-editor-bridge|v289-mobile-touch-guard|v290-safe-premium-motion|v291-details-final|v293-mobile-parity|v294-visual-grid-final|v295-i18n-links-final|v296-i18n-overflow-final|v297-dubai-catalog-final)\.js\?v=/;
for (const rel of [...rootHtml, ...legalHtml]) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  const prefix = rel.startsWith('pages/') ? '../' : '';
  if (!html.includes(`${prefix}assets/css/dianafarm-final-v298.css?v=298`)) fail(`${rel}: missing final v298 CSS`);
  if (!rel.startsWith('pages/') && rel !== 'admin.html' && !html.includes('assets/js/dianafarm-final-v298.js?v=298')) fail(`${rel}: missing final v298 JS`);
  if (rel.startsWith('pages/') && !html.includes('../assets/js/dianafarm-final-v298.js?v=298')) fail(`${rel}: missing legal final v298 JS`);
  if (managedOld.test(html)) fail(`${rel}: old patch JS reference remains`);
  if (/dianafarm-production-v29[0-7]\.css\?v=/.test(html)) fail(`${rel}: old production CSS reference remains`);
  if (/categories\.[a-z]/i.test(html)) fail(`${rel}: technical category key in static HTML`);
}
for (const asset of ['assets/css/dianafarm-final-v298.css','assets/js/dianafarm-final-v298.js']) {
  if (!fs.existsSync(path.join(root, asset))) fail(`missing ${asset}`);
}
const css = fs.readFileSync(path.join(root,'assets/css/dianafarm-final-v298.css'),'utf8');
for (const needle of ['v298 FINAL SYSTEM CLEANUP','cards-grid--home .service-card','gold-line','rge-dubai-section','overflow-wrap:anywhere']) {
  if (!css.includes(needle)) fail(`final CSS missing ${needle}`);
}
if (/@import/i.test(css)) fail('final CSS still contains @import');
const js = fs.readFileSync(path.join(root,'assets/js/dianafarm-final-v298.js'),'utf8');
for (const needle of ['v298-final-system','renderRge','removeOvalShells','hardenServiceLinks','v295-i18n-links-final','v296-i18n-overflow-final']) {
  if (!js.includes(needle)) fail(`final JS missing ${needle}`);
}
const uae = fs.readFileSync(path.join(root,'uae.html'),'utf8');
for (const needle of ['data-rge-dubai','data-rge-categories','data-rge-services','data-rge-packages','dubai-export-catalog']) {
  if (!uae.includes(needle)) fail(`uae.html missing ${needle}`);
}
const app = fs.readFileSync(path.join(root,'assets/js/app.js'),'utf8');
for (const needle of ['href="${esc(servicePageFor(item.id))}"','data-card-link="${esc(servicePageFor(item.id))}"']) {
  if (!app.includes(needle)) fail(`app.js service links not hard href-backed: ${needle}`);
}
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/data.js'),'utf8'), sandbox);
if (sandbox.window.DFG_STORAGE_KEY !== 'dianafarm_group_data_v298_final_system') fail('storage key not bumped to v298');
if (!sandbox.window.DFG_DEFAULT_DATA || sandbox.window.DFG_DEFAULT_DATA.version !== 'v298-final-system') fail('data version not v298');
console.log('[verify:v298-final-system] passed', rootHtml.length, 'root HTML and', legalHtml.length, 'legal pages');
