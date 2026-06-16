
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const css = fs.readFileSync(path.join(root,'assets/css/dianafarm-production-v294.css'),'utf8');
const js = fs.readFileSync(path.join(root,'assets/js/v294-visual-grid-final.js'),'utf8');
const html = fs.readdirSync(root).filter(f=>f.endsWith('.html') && f !== 'admin.html');
const failures=[];
for (const f of html) {
  const s=fs.readFileSync(path.join(root,f),'utf8');
  if(!s.includes('dianafarm-production-v294.css?v=294')) failures.push(`${f}: missing v294 css`);
  if(!s.includes('v294-visual-grid-final.js?v=294')) failures.push(`${f}: missing v294 visual js`);
}
if(!css.includes('--dfg-v294-card-height')) failures.push('v294 compact card css missing');
if(!css.includes('content:"D"!important')) failures.push('brand D restore missing');
if(!css.includes('@keyframes dfg-v294-review-glow')) failures.push('review animation missing');
if(!js.includes('ensureHeroVisuals')) failures.push('visual repair js missing ensureHeroVisuals');
if(failures.length){ console.error(failures.join('\n')); process.exit(1); }
console.log(`verify:v294-final — passed (${html.length} root pages, v294 css/js connected)`);
