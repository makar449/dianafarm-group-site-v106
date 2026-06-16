import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const jsFiles = [];
function walk(dir) {
  for (const item of readdirSync(dir)) {
    const path = join(dir, item);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (['node_modules', 'dist', 'data'].includes(item)) continue;
      walk(path);
    } else if (path.endsWith('.js') || path.endsWith('.mjs')) {
      jsFiles.push(path);
    }
  }
}
walk(root);
for (const file of jsFiles) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log(`[verify:syntax] checked ${jsFiles.length} JS files`);
