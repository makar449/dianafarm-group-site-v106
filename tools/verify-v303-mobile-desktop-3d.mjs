import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicHtml = fs.readdirSync(root).filter(f => f.endsWith('.html') && f !== 'admin.html');
const legalHtml = fs.readdirSync(path.join(root, 'pages')).filter(f => f.endsWith('.html')).map(f => path.join('pages', f));
const htmlFiles = [...publicHtml, ...legalHtml];
const errors = [];
for (const rel of htmlFiles) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!html.includes('width=1280, initial-scale=1, viewport-fit=cover')) errors.push(`${rel}: missing desktop viewport`);
  if (!html.includes('assets/css/dianafarm-final-v303.css?v=303')) errors.push(`${rel}: missing v303 css`);
  if (!html.includes('assets/js/dianafarm-final-v303.js?v=303')) errors.push(`${rel}: missing v303 js`);
  if (/dianafarm-final-v30[0-2]\.css\?v=30[0-2]/.test(html)) errors.push(`${rel}: old final css still referenced`);
  if (/dianafarm-final-v30[0-2]\.js\?v=30[0-2]/.test(html)) errors.push(`${rel}: old final js still referenced`);
}
const css = fs.readFileSync(path.join(root, 'assets/css/dianafarm-final-v303.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/dianafarm-final-v303.js'), 'utf8');
for (const needle of ['--dfg-v303-desktop-width:1280px','touch-action:pan-y pinch-zoom','dfg-v303-scene','grid-template-columns:repeat(3','pointer-events:none']) {
  if (!css.includes(needle)) errors.push(`css: missing ${needle}`);
}
for (const needle of ['ensure3DScenes','unlockScroll','dfg-v303-desktop-parity','touchmove']) {
  if (!js.includes(needle)) errors.push(`js: missing ${needle}`);
}
for (const rel of ['uae.html','asia.html','blog.html','real-estate.html']) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!html.includes('v238-motion-stage')) errors.push(`${rel}: missing v238 motion stage`);
}
for (const rel of ['cars.html','parking.html']) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!html.includes('data-hero-scene')) errors.push(`${rel}: missing hero scene stage`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`verify:v303-mobile-desktop-3d — passed ${htmlFiles.length} html files`);
