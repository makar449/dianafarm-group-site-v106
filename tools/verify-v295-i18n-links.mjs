import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const htmls=fs.readdirSync(root).filter((f)=>f.endsWith('.html')).map((f)=>path.join(root,f));
const errors=[];
for(const file of htmls){
  const html=fs.readFileSync(file,'utf8');
  const base=path.basename(file);
  if(base!=='admin.html' && !html.includes('dianafarm-production-v295.css?v=295')) errors.push(`${base} does not load v295 css`);
  if(base!=='admin.html' && !html.includes('v295-i18n-links-final.js?v=295')) errors.push(`${base} does not load v295 i18n final`);
  if(html.includes('v252-full-site-i18n.js')) errors.push(`${path.basename(file)} still loads v252 broad transliteration script`);
  if(html.includes('dianafarm-production-v293.css') || html.includes('dianafarm-production-v294.css?v=294')) errors.push(`${path.basename(file)} still references old production css`);
}
const css=fs.readFileSync(path.join(root,'assets/css/dianafarm-production-v295.css'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/js/v295-i18n-links-final.js'),'utf8');
['wow-home-rail','about-keyword-tape','service-hero-tags','data-open-blog','categories.cars','categories.parking'].forEach((needle)=>{
  if(!js.includes(needle)&&!css.includes(needle)) errors.push(`v295 final missing ${needle}`);
});
['reviews.html','services.html','index.html','about.html','uae.html','real-estate.html','blog.html'].forEach((f)=>{
  if(!fs.existsSync(path.join(root,f))) errors.push(`missing ${f}`);
});
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('v295 i18n/link verification passed');
