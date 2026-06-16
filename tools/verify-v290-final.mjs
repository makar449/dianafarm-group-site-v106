import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const fail = (message) => failures.push(message);
const assert = (condition, message) => { if (!condition) fail(message); };
const read = (path) => readFileSync(join(root, path), 'utf8');

function walk(dir, files = []) {
  for (const item of readdirSync(join(root, dir))) {
    const full = join(root, dir, item);
    const rel = dir === '.' ? item : `${dir}/${item}`;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', 'dist', 'data', '.git'].includes(item)) continue;
      walk(rel, files);
    } else files.push(rel);
  }
  return files;
}

const htmlFiles = walk('.').filter((file) => file.endsWith('.html')).sort();
const publicRootHtml = htmlFiles.filter((file) => !file.startsWith('pages/') && file !== 'admin.html');
const legalHtml = htmlFiles.filter((file) => file.startsWith('pages/'));
const packageJson = JSON.parse(read('package.json'));
const app = read('assets/js/app.js');
const touchGuard = read('assets/js/v289-mobile-touch-guard.js');
const motion = read('assets/js/v290-safe-premium-motion.js');
const clickFix = read('assets/js/v290-click-fix.js');
const css = read('assets/css/dianafarm-production-v290.css');

assert(packageJson.version === '290.0.0', 'package.json version must be 290.0.0');
assert(packageJson.scripts['verify:production']?.includes('verify:v290-final'), 'verify:production must include verify:v290-final');
for (const file of [
  'assets/css/dianafarm-production-v290.css',
  'assets/js/v290-safe-premium-motion.js',
  'assets/js/v290-click-fix.js',
  'assets/js/v289-mobile-touch-guard.js',
  'assets/js/app.js'
]) assert(existsSync(join(root, file)), `${file} is missing`);

for (const file of publicRootHtml) {
  const html = read(file);
  assert(html.includes('assets/css/dianafarm-production-v289.css?v=289'), `${file}: base v289 CSS missing`);
  assert(html.includes('assets/css/dianafarm-production-v290.css?v=290'), `${file}: v290 CSS missing`);
  assert(html.includes('assets/js/v290-safe-premium-motion.js?v=290'), `${file}: safe premium motion missing`);
  assert(html.includes('assets/js/v290-click-fix.js?v=290'), `${file}: click fix missing`);
}
for (const file of legalHtml) {
  const html = read(file);
  assert(html.includes('../assets/css/dianafarm-production-v290.css?v=290'), `${file}: legal v290 CSS missing`);
  assert(html.includes('../assets/js/v290-safe-premium-motion.js?v=290'), `${file}: legal safe premium motion missing`);
  assert(html.includes('../assets/js/v290-click-fix.js?v=290'), `${file}: legal click fix missing`);
}

assert(app.includes('<a class="btn btn--small service-card__details-btn" href="${esc(servicePageFor(item.id))}"'), 'service details must render as real anchor links');
assert(!app.includes('<button class="btn btn--small service-card__details-btn" type="button" data-open-service="${esc(item.id)}"'), 'old service details button renderer still exists');
assert(clickFix.includes('convertDetailsButtons') && clickFix.includes('MutationObserver') && clickFix.includes('data-service-link'), 'v290 click fix does not convert detail buttons reliably');
assert(!/touchmove[\s\S]{0,220}preventDefault/.test(touchGuard), 'touch guard must not prevent touchmove');
assert(!touchGuard.includes("'.hero-signature__scene'"), 'touch guard still removes full hero 3D scene');
assert(!touchGuard.includes("'.hero-signature__canvas'"), 'touch guard still removes full hero canvas scene');
assert(touchGuard.includes('pan-y pinch-zoom'), 'touch guard must preserve vertical pan');
assert(motion.includes('dfg-v290-hero-visual') && motion.includes('ensureHeroVisuals') && motion.includes('ensureReviewVisible'), 'safe premium motion does not restore visual scenes/reviews');
assert(css.includes('.dfg-v290-hero-visual'), 'v290 CSS missing hero visual scene');
assert(css.includes('body[data-page="reviews"] .reviews-vertical .review-card:first-child'), 'v290 CSS must prevent empty reviews card area');
assert(css.includes('a.service-card__details-btn'), 'v290 CSS missing detail link styling');
assert(css.includes('.site-header .brand__seal::before') && css.includes('content:"DF"'), 'v290 CSS missing polished header seal');
assert(!css.includes('gold-beam{display:block') && !css.includes('route-line{display:block'), 'v290 CSS must not restore old gold beam/route lines');

const allTextFiles = walk('.').filter((file) => /\.(html|css|js|json|xml|txt|md|ts)$/.test(file));
for (const file of allTextFiles) {
  const text = read(file);
  assert(!text.includes('makar449.github.io/dianafarm-group-site-v106'), `${file}: old GitHub Pages full URL remains`);
}

if (failures.length) {
  console.error('[verify:v290-final] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`[verify:v290-final] passed: ${publicRootHtml.length} public root pages, ${legalHtml.length} legal pages, v290 visuals restored, detail links fixed, header polished, mobile touch guard preserved`);
