
import fs from 'fs';
import path from 'path';
import vm from 'vm';
const root = process.cwd();
const fail = (m) => { throw new Error(`[verify:v297-dubai-catalog] ${m}`); };
const rootHtml = fs.readdirSync(root).filter((name)=>name.endsWith('.html'));
const legalHtml = fs.existsSync(path.join(root,'pages')) ? fs.readdirSync(path.join(root,'pages')).filter((name)=>name.endsWith('.html')).map((name)=>path.join('pages',name)) : [];
for (const rel of [...rootHtml, ...legalHtml]) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (rel !== 'admin.html') {
    const cssRef = rel.startsWith('pages/') ? '../assets/css/dianafarm-production-v297.css?v=297' : 'assets/css/dianafarm-production-v297.css?v=297';
    if (!html.includes(cssRef)) fail(`${rel}: missing v297 CSS`);
  }
  if (!rel.startsWith('pages/') && rel !== 'admin.html' && !html.includes('assets/js/v297-dubai-catalog-final.js?v=297')) fail(`${rel}: missing v297 JS`);
  if (html.includes('dianafarm-production-v296.css?v=296')) fail(`${rel}: old v296 CSS still referenced`);
}
for (const asset of ['assets/css/dianafarm-production-v297.css','assets/js/v297-dubai-catalog-final.js']) {
  if (!fs.existsSync(path.join(root, asset))) fail(`missing ${asset}`);
}
const uae = fs.readFileSync(path.join(root,'uae.html'),'utf8');
for (const needle of ['data-rge-dubai','data-rge-categories','data-rge-services','data-rge-packages','dubai-export-catalog']) {
  if (!uae.includes(needle)) fail(`uae.html missing ${needle}`);
}
const css = fs.readFileSync(path.join(root,'assets/css/dianafarm-production-v297.css'),'utf8');
for (const needle of ['v297 — Dubai catalog + no oval icon wrappers', '.rge-dubai-section', '.rge-dubai-services', 'border-radius:0 !important', '.hero-feature__icon', '.card-icon']) {
  if (!css.includes(needle)) fail(`v297 CSS missing ${needle}`);
}
const js = fs.readFileSync(path.join(root,'assets/js/v297-dubai-catalog-final.js'),'utf8');
for (const needle of ['RusGlobalExport', 'renderRge', 'removeOvalShells', 'Экспорт и продажи в ОАЭ', 'Product registration in the UAE']) {
  if (!js.includes(needle)) fail(`v297 JS missing ${needle}`);
}
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/data.js'),'utf8'), sandbox);
if (sandbox.window.DFG_STORAGE_KEY !== 'dianafarm_group_data_v297_dubai_catalog') fail('storage key not bumped to v297');
if (!sandbox.window.DFG_DEFAULT_DATA || sandbox.window.DFG_DEFAULT_DATA.version !== 'v297-dubai-catalog-no-ovals') fail('data version not v297');
console.log('[verify:v297-dubai-catalog] passed', rootHtml.length, 'root HTML and', legalHtml.length, 'legal pages');
