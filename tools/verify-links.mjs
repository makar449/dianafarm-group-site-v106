import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

const root = process.cwd();
const htmlFiles = [];
function walk(dir) {
  for (const item of readdirSync(dir)) {
    const path = join(dir, item);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (['node_modules', 'dist', 'data'].includes(item)) continue;
      walk(path);
    } else if (path.endsWith('.html')) htmlFiles.push(path);
  }
}
walk(root);
const missing = [];
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const regex = /(?:href|src)=['"]([^'"]+)['"]/g;
  for (const match of html.matchAll(regex)) {
    const raw = match[1];
    if (!raw || raw.startsWith('__DFG_PUBLIC_ORIGIN__') || raw.startsWith('http') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('whatsapp:') || raw.startsWith('#') || raw.startsWith('data:')) continue;
    const clean = raw.split('#')[0].split('?')[0];
    if (!clean || clean.startsWith('/api/') || clean.startsWith('/uploads/')) continue;
    const candidate = normalize(join(dirname(file), clean));
    if (!existsSync(candidate)) missing.push(`${file.replace(root + '/', '')} -> ${raw}`);
  }
}
if (missing.length) {
  console.error('[verify:links] missing local files:');
  for (const item of missing) console.error(`  ${item}`);
  process.exit(1);
}
console.log(`[verify:links] checked ${htmlFiles.length} HTML files`);
