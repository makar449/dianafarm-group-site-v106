import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = (message) => { throw new Error(`[verify:v299-actual-fix] ${message}`); };
const rootPages = fs.readdirSync(root).filter((file) => file.endsWith('.html')).sort();
const legalPages = fs.readdirSync(path.join(root, 'pages')).filter((file) => file.endsWith('.html')).map((file) => `pages/${file}`).sort();
const pages = [...rootPages, ...legalPages];

for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const isAdmin = file === 'admin.html';
  if (!isAdmin) {
    if (!html.includes('dianafarm-final-v299.css?v=299')) fail(`${file}: missing v299 CSS`);
    if (!html.includes('dianafarm-final-v299.js?v=299')) fail(`${file}: missing v299 JS`);
    const forbidden = ['dianafarm-production-v295.css', 'v106-i18n.js', 'v289-public-editor-bridge.js', 'v289-mobile-touch-guard.js', 'v293-mobile-parity.js', 'v294-visual-grid-final.js', 'v295-i18n-links-final.js', 'v296-i18n-overflow-final.js', 'dianafarm-final-v298.js'];
    for (const token of forbidden) if (html.includes(token)) fail(`${file}: forbidden old public asset ${token}`);
  }
}

const css = fs.readFileSync(path.join(root, 'assets/css/dianafarm-final-v299.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/dianafarm-final-v299.js'), 'utf8');
for (const token of ['dfg-v299-premium-scene', 'reviews-vertical .review-card.is-active', 'v299 ACTUAL FIX']) {
  if (!css.includes(token)) fail(`CSS missing ${token}`);
}
for (const token of ['replaceExactText', 'fixReviews', 'removeVisualOvals', 'dianafarm_group_data_v299_actual_fix']) {
  if (token === 'dianafarm_group_data_v299_actual_fix') {
    const data = fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8');
    if (!data.includes(token)) fail(`data.js missing ${token}`);
  } else if (!js.includes(token)) fail(`JS missing ${token}`);
}
console.log(`[verify:v299-actual-fix] passed ${pages.length} html files`);
