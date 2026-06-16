import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter((f)=>f.endsWith('.html')).concat(fs.readdirSync(path.join(root,'pages')).filter((f)=>f.endsWith('.html')).map((f)=>`pages/${f}`));
const missing=[];
for(const file of htmlFiles){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  if(file==='admin.html') continue;
  if(!html.includes('dianafarm-production-v293.css?v=293')) missing.push(`${file}: no v293 css`);
  if(/dianafarm-production-v(289|290|291|292)\.css/.test(html)) missing.push(`${file}: stale production css link`);
}
if(missing.length){ console.error(missing.join('\n')); process.exit(1); }
const css=fs.readFileSync(path.join(root,'assets/css/dianafarm-production-v293.css'),'utf8');
for(const token of ['@media (max-width:760px)', 'grid-template-columns:1fr!important', 'aspect-ratio:16 / 10', 'object-fit:cover!important']){
  if(!css.includes(token)){ console.error(`v293 css missing ${token}`); process.exit(1); }
}
const data=fs.readFileSync(path.join(root,'assets/js/data.js'),'utf8');
for(const token of ['"cars": "Автомобили"','"parking": "Паркинги"']){
  if(!data.includes(token)){ console.error(`data.js missing ${token}`); process.exit(1); }
}
console.log(`verify:v293-mobile-parity passed (${htmlFiles.length} html files)`);
