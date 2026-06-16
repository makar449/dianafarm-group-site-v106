import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root=process.cwd();
const failures=[];
const fail=(m)=>failures.push(m);
const assert=(c,m)=>{if(!c)fail(m);};
const read=(p)=>readFileSync(join(root,p),'utf8');
function walk(dir,files=[]){for(const item of readdirSync(join(root,dir))){const full=join(root,dir,item);const rel=dir==='.'?item:`${dir}/${item}`;const st=statSync(full);if(st.isDirectory()){if(['node_modules','dist','data','.git'].includes(item))continue;walk(rel,files);}else files.push(rel);}return files;}
const htmlFiles=walk('.').filter(f=>f.endsWith('.html')).sort();
const publicRoot=htmlFiles.filter(f=>!f.startsWith('pages/')&&f!=='admin.html');
const legal=htmlFiles.filter(f=>f.startsWith('pages/'));
const pkg=JSON.parse(read('package.json'));
assert(pkg.version==='291.0.0','package version must be 291.0.0');
assert(existsSync(join(root,'assets/css/dianafarm-production-v291.css')),'v291 CSS missing');
assert(existsSync(join(root,'assets/js/v291-details-final.js')),'v291 detail fix missing');
assert(read('assets/js/app.js').includes("cars: 'Автомобили'"),'category fallback for cars missing');
assert(read('assets/js/app.js').includes("parking: 'Паркинги'"),'category fallback for parking missing');
assert(read('assets/js/backend-config.js').includes("allowLocalAdminFallback: true"),'static admin fallback not enabled');
assert(read('assets/js/backend-config.js').includes("staticAdminPassword: 'dianafarm2026'"),'static admin password not documented in config');
assert(read('assets/js/admin.js').includes('tryStaticFallback'),'admin static fallback logic missing');
const css=read('assets/css/dianafarm-production-v291.css');
assert(css.includes('#servicesGrid.cards-grid--home') && css.includes('grid-template-columns:repeat(3'), 'home grid 3-column equal layout missing');
assert(css.includes('--dfg-v291-card-min'), 'v291 equal card variables missing');
assert(css.includes('.dfg-v290-hero-visual'), 'safe motion CSS from v290 not included in v291 css');
assert(css.includes('.site-header .brand__seal::before') && css.includes('content:"DF"'), 'header polish missing');
for(const file of publicRoot){const h=read(file);assert(h.includes('assets/css/dianafarm-production-v291.css?v=291'),`${file}: v291 css missing`);assert(!h.includes('dianafarm-production-v289.css'),`${file}: old v289 css remains`);assert(!h.includes('dianafarm-production-v290.css'),`${file}: separate old v290 css remains`);assert(h.includes('assets/js/v290-safe-premium-motion.js?v=291'),`${file}: safe motion missing`);assert(h.includes('assets/js/v291-details-final.js?v=291'),`${file}: v291 detail script missing`);}
for(const file of legal){const h=read(file);assert(h.includes('../assets/css/dianafarm-production-v291.css?v=291'),`${file}: v291 legal css missing`);assert(h.includes('../assets/js/v291-details-final.js?v=291'),`${file}: v291 legal detail script missing`);}
const app=read('assets/js/app.js');
assert(app.includes('href="${esc(servicePageFor(item.id))}"'),'service renderer must use anchor href');
const detail=read('assets/js/v291-details-final.js');
assert(detail.includes('window.location.assign') && detail.includes('stopImmediatePropagation'),'details script must force navigation against card handlers');
for(const f of walk('.').filter(f=>/\.(html|js|css|json|xml|md|ts)$/.test(f))){const t=read(f);assert(!t.includes('categories.cars'),`${f}: raw categories.cars remains`);assert(!t.includes('categories.parking'),`${f}: raw categories.parking remains`);}
if(failures.length){console.error('[verify:v291-final] failed');for(const f of failures)console.error('- '+f);process.exit(1);}console.log(`[verify:v291-final] passed (${publicRoot.length} root pages, ${legal.length} legal pages)`);
