import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const config = fs.readFileSync(path.join(root, 'assets/js/backend-config.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'assets/js/admin.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');

if (!config.includes('isGitHubPages') || !config.includes('enabled: !useStaticMode')) {
  throw new Error('backend-config.js does not disable production API on GitHub Pages');
}
if (!admin.includes('isStaticHost') || !admin.includes('Для GitHub Pages пароль: dianafarm2026')) {
  throw new Error('admin.js does not have static-first GitHub Pages login');
}
if (!html.includes('backend-config.js?v=292') || !html.includes('admin.js?v=292')) {
  throw new Error('admin.html does not cache-bust v292 admin scripts');
}
console.log('verify:v292-github-admin — passed');
