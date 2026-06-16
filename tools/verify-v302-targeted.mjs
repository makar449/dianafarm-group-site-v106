import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root = process.cwd();
const html = readdirSync(root).filter(f=>f.endsWith('.html'));
let bad=[];
for (const f of html) {
  const s = readFileSync(join(root,f),'utf8');
  if (!f.includes('admin') && !s.includes('dianafarm-final-v302.css?v=302')) bad.push(`${f}: missing v302 CSS`);
  if (!f.includes('admin') && !s.includes('dianafarm-final-v302.js?v=302')) bad.push(`${f}: missing v302 JS`);
  if (s.includes('dianafarm-final-v301.css?v=301') || s.includes('dianafarm-final-v301.js?v=301')) bad.push(`${f}: stale v301 final ref`);
}
const css = readFileSync(join(root,'assets/css/dianafarm-final-v302.css'),'utf8');
const js = readFileSync(join(root,'assets/js/dianafarm-final-v302.js'),'utf8');
['dfg-v302-3d-stage','dfg-v302-dubai-catalog','body[data-page="reviews"] .review-card p','.hero-feature__icon'].forEach(token=>{ if(!css.includes(token)) bad.push(`css missing ${token}`); });
['restoreDubai3D','addDubaiCatalog','fixReviews','removeIconOvals'].forEach(token=>{ if(!js.includes(token)) bad.push(`js missing ${token}`); });
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log(`verify:v302-targeted — passed ${html.length} root html files`);
