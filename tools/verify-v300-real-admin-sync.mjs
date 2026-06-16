import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root = process.cwd(); const files = [];
function walk(dir){ for (const name of readdirSync(dir)){ const p=join(dir,name); const st=statSync(p); if(st.isDirectory()) walk(p); else if(p.endsWith('.html')) files.push(p); }}
walk(root); const publicHtml = files.filter((p)=>!p.includes('/pages/')); const errors=[];
for(const file of publicHtml){ const html=readFileSync(file,'utf8');
  if(!html.includes('assets/js/production-config.js?v=300')) errors.push(`${file}: missing production-config v300`);
  if(!html.includes('assets/js/backend-config.js?v=300')) errors.push(`${file}: missing backend-config v300`);
  if(!html.includes('assets/js/remote-backend.js?v=300')) errors.push(`${file}: missing remote-backend v300`);
  if(file.endsWith('admin.html')){ if(!html.includes('assets/js/admin.js?v=300')) errors.push(`${file}: missing admin v300`); }
  else { if(!html.includes('assets/css/dianafarm-final-v300.css?v=300')) errors.push(`${file}: missing final css v300`); if(!html.includes('assets/js/dianafarm-final-v300.js?v=300')) errors.push(`${file}: missing final js v300`); }
}
const backend=readFileSync(join(root,'assets/js/backend-config.js'),'utf8');
if(!backend.includes('allowLocalAdminFallback: false')) errors.push('backend-config: local fallback not disabled');
if(/staticAdminPassword:\s*'dianafarm2026'/.test(backend)) errors.push('backend-config: old static password remains');
const admin=readFileSync(join(root,'assets/js/admin.js'),'utf8');
if(admin.includes('Для GitHub Pages пароль: dianafarm2026')) errors.push('admin.js: old github pages static password message remains');
if(!admin.includes('Remote backend не подключён')) errors.push('admin.js: missing remote required save block');
const remote=readFileSync(join(root,'assets/js/remote-backend.js'),'utf8');
if(!remote.includes('grant_type=password')) errors.push('remote-backend: missing supabase password login');
if(!remote.includes('dfg_admin_profiles')) errors.push('remote-backend: missing admin profile check');
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`verify:v300-real-admin-sync — passed ${publicHtml.length} html files`);
