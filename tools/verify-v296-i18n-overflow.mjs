import fs from 'fs';
import path from 'path';
import vm from 'vm';

const root = process.cwd();
const htmlFiles = [
  ...fs.readdirSync(root).filter((name) => name.endsWith('.html')).map((name) => path.join(root, name)),
  ...fs.readdirSync(path.join(root, 'pages')).filter((name) => name.endsWith('.html')).map((name) => path.join(root, 'pages', name))
];
const fail = (message) => { throw new Error(`[verify:v296-i18n-overflow] ${message}`); };

for (const file of htmlFiles) {
  const rel = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8');
  const isLegal = rel.startsWith(`pages${path.sep}`);
  const cssRef = isLegal ? '../assets/css/dianafarm-production-v296.css?v=296' : 'assets/css/dianafarm-production-v296.css?v=296';
  if (rel !== 'admin.html' && !html.includes(cssRef)) fail(`${rel}: missing v296 production CSS`);
  if (!isLegal && rel !== 'admin.html' && !html.includes('assets/js/v296-i18n-overflow-final.js?v=296')) fail(`${rel}: missing v296 i18n script`);
  if (html.includes('v295-i18n-links-final.js')) fail(`${rel}: still loads v295 i18n script`);
  if (html.includes('dianafarm-production-v295.css?v=295')) fail(`${rel}: still loads v295 CSS`);
}

for (const asset of ['assets/css/dianafarm-production-v296.css', 'assets/js/v296-i18n-overflow-final.js']) {
  if (!fs.existsSync(path.join(root, asset))) fail(`missing ${asset}`);
}

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8'), sandbox);
const data = sandbox.window.DFG_DEFAULT_DATA;
if (!data || data.version !== 'v296-i18n-overflow-final') fail('data.js version is not v296');
if (sandbox.window.DFG_STORAGE_KEY !== 'dianafarm_group_data_v296_i18n_overflow') fail('storage key not bumped to v296');

const cyr = /[А-Яа-яЁё]/;
const bad = [];
function walk(value, pathParts = []) {
  if (!value || typeof value !== 'object') return;
  const isLang = ['ru', 'bg', 'ka', 'en'].some((lang) => Object.prototype.hasOwnProperty.call(value, lang));
  if (isLang) {
    for (const lang of ['en', 'ka']) {
      if (typeof value[lang] === 'string' && cyr.test(value[lang])) {
        bad.push(`${pathParts.join('.')}.${lang}: ${value[lang].slice(0, 120)}`);
      }
    }
  }
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, pathParts.concat(index)));
  else Object.entries(value).forEach(([key, item]) => walk(item, pathParts.concat(key)));
}
walk(data);
if (bad.length) fail(`untranslated Cyrillic in EN/KA data:\n${bad.slice(0, 40).join('\n')}`);

const app = fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8');
if (app.includes('სრული сопровождения') || app.includes('сопровождения ფორმატით')) fail('mixed Georgian/Russian static copy remains in app.js');

const css = fs.readFileSync(path.join(root, 'assets/css/dianafarm-production-v296.css'), 'utf8');
for (const required of ['overflow-wrap: anywhere', 'html[lang="ka"]', '.service-card__details-btn', '.premium-filter button']) {
  if (!css.includes(required)) fail(`CSS missing required overflow rule: ${required}`);
}

const js = fs.readFileSync(path.join(root, 'assets/js/v296-i18n-overflow-final.js'), 'utf8');
for (const required of ['buildDynamicMap', 'translateDataRenderedCards', 'hardenClickableDetails', 'SERVICE_LINKS']) {
  if (!js.includes(required)) fail(`v296 script missing ${required}`);
}
console.log('[verify:v296-i18n-overflow] passed', htmlFiles.length, 'HTML files checked');
