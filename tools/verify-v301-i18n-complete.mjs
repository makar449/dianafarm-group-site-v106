import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const publicHtml = fs.readdirSync(root).filter((f)=>f.endsWith('.html') && f !== 'admin.html');
const legalHtml = fs.readdirSync(path.join(root,'pages')).filter((f)=>f.endsWith('.html')).map((f)=>`pages/${f}`);
const htmlFiles = [...publicHtml, ...legalHtml];
const errors = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root,file),'utf8');
  const prefix = file.startsWith('pages/') ? '../' : '';
  if (!html.includes(`${prefix}assets/js/data.js?v=301`)) errors.push(`${file}: missing data.js v301`);
  if (!html.includes(`${prefix}assets/js/app.js?v=301`)) errors.push(`${file}: missing app.js v301`);
  if (!html.includes(`${prefix}assets/css/dianafarm-final-v301.css?v=301`)) errors.push(`${file}: missing final css v301`);
  if (!html.includes(`${prefix}assets/js/dianafarm-final-v301.js?v=301`)) errors.push(`${file}: missing final i18n js v301`);
  if (/dianafarm-final-v300|\?v=300/.test(html)) errors.push(`${file}: contains stale v300 public assets`);
}
const finalJs = fs.readFileSync(path.join(root,'assets/js/dianafarm-final-v301.js'),'utf8');
for (const required of ['SERVICE_BY_FILE','renderServicePage','buildDataDictionary','DFG_V301_TRANSLATE_NOW']) {
  if (!finalJs.includes(required)) errors.push(`final js missing ${required}`);
}
const dataJs = fs.readFileSync(path.join(root,'assets/js/data.js'),'utf8');
if (!dataJs.includes('dianafarm_group_data_v301_i18n_complete')) errors.push('data.js missing v301 storage key');
const dataModule = await import('node:vm').then(({runInNewContext}) => { const sandbox = { window: {} }; runInNewContext(dataJs, sandbox); return sandbox.window.DFG_DEFAULT_DATA; });
const cyr = /[А-Яа-яЁё]/;
const kaBad = [];
function walkKa(value, pathParts = []) {
  if (typeof value === 'string') { if (pathParts.includes('ka') && cyr.test(value)) kaBad.push(pathParts.join('.') + ': ' + value); return; }
  if (Array.isArray(value)) return value.forEach((item, index) => walkKa(item, pathParts.concat(String(index))));
  if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => walkKa(item, pathParts.concat(key)));
}
walkKa(dataModule);
if (kaBad.length) errors.push('Georgian translation contains Russian leftovers: ' + kaBad.slice(0, 3).join(' | '));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`verify:v301-i18n-complete — passed ${htmlFiles.length} html files`);
