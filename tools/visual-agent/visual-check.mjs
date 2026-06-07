#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const outDir = path.join(rootDir, 'visual-report');
const screenshotDir = path.join(outDir, 'screenshots');
const pagesPath = path.join(__dirname, 'pages.json');

const args = new Set(process.argv.slice(2));
const mobileOnly = args.has('--mobile-only');
const keepServer = args.has('--keep-server');
const port = Number(process.env.VISUAL_QA_PORT || 4179);

const viewports = mobileOnly ? [
  { name: 'mobile-390', width: 390, height: 844, isMobile: true }
] : [
  { name: 'desktop-1440', width: 1440, height: 960, isMobile: false },
  { name: 'tablet-768', width: 768, height: 1024, isMobile: true },
  { name: 'mobile-390', width: 390, height: 844, isMobile: true }
];

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/\.html$/, '')
    .replace(/[^a-z0-9а-яё]+/giu, '-')
    .replace(/^-+|-+$/g, '') || 'page';
}

function escHtml(input) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8'
  }[ext] || 'application/octet-stream';
}

function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const rawUrl = new URL(req.url || '/', `http://localhost:${port}`);
      const requested = decodeURIComponent(rawUrl.pathname === '/' ? '/index.html' : rawUrl.pathname);
      const safePath = path.normalize(requested).replace(/^\.+([/\\]|$)/, '');
      let filePath = path.join(rootDir, safePath);
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      if (!(await fileExists(filePath))) {
        const fallback = path.join(rootDir, 'index.html');
        if (await fileExists(fallback)) filePath = fallback;
      }
      const body = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType(filePath), 'Cache-Control': 'no-store' });
      res.end(body);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(String(error?.stack || error));
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function loadPages() {
  const raw = await fs.readFile(pagesPath, 'utf8');
  const pages = JSON.parse(raw);
  const existing = [];
  for (const item of pages) {
    if (await fileExists(path.join(rootDir, item.path))) existing.push(item);
  }
  return existing;
}

async function runDomAudit(page) {
  return await page.evaluate(() => {
    const issues = [];
    const add = (severity, code, text, meta = {}) => issues.push({ severity, code, text, meta });
    const width = window.innerWidth;
    const doc = document.documentElement;
    const body = document.body;

    if (doc.scrollWidth > width + 2) {
      add('critical', 'horizontal-scroll', `Страница шире viewport на ${Math.round(doc.scrollWidth - width)}px`, {
        viewport: width,
        scrollWidth: doc.scrollWidth
      });
    }

    const all = [...document.querySelectorAll('body *')];
    const visible = all.filter((el) => {
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) !== 0 && r.width > 2 && r.height > 2;
    });

    for (const el of visible) {
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'svg', 'path', 'meta', 'link'].includes(tag)) continue;
      const st = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
      if (!text) continue;

      if (rect.left < -2 || rect.right > width + 2) {
        add('high', 'element-outside-viewport', `Элемент выходит за экран: ${text.slice(0, 120)}`, {
          selector: shortSelector(el),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          viewport: width
        });
      }

      if (el.scrollWidth > el.clientWidth + 4 && !['visible', 'clip'].includes(st.overflowX)) {
        add('high', 'text-horizontal-overflow', `Текст шире контейнера: ${text.slice(0, 120)}`, {
          selector: shortSelector(el),
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth
        });
      }

      if (el.scrollHeight > el.clientHeight + 6 && !['visible', 'clip'].includes(st.overflowY)) {
        add('medium', 'text-vertical-overflow', `Текст выше контейнера: ${text.slice(0, 120)}`, {
          selector: shortSelector(el),
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight
        });
      }

      if (text.length > 18 && rect.width < 70 && rect.height > 170) {
        add('critical', 'squeezed-text-column', `Похоже, текст сжат в вертикальную колонку: ${text.slice(0, 120)}`, {
          selector: shortSelector(el),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }

      if ((st.wordBreak === 'break-all' || st.overflowWrap === 'anywhere') && /[А-Яа-яA-Za-z]{8,}/.test(text)) {
        add('medium', 'aggressive-word-breaking', `Может ломать слова посередине: ${text.slice(0, 120)}`, {
          selector: shortSelector(el),
          wordBreak: st.wordBreak,
          overflowWrap: st.overflowWrap
        });
      }
    }

    const criticalWords = ['Международные', 'Фармацевтический', 'DIANAFARM', 'GROUP', 'Сопровождение', 'Диагностика', 'Реализация'];
    for (const word of criticalWords) {
      const nodes = textNodesContaining(document.body, word);
      for (const node of nodes.slice(0, 5)) {
        const parent = node.parentElement;
        if (!parent) continue;
        const range = document.createRange();
        range.selectNodeContents(parent);
        const rects = [...range.getClientRects()];
        if (rects.length > 0) {
          const tooNarrow = rects.some((r) => r.width < Math.min(90, Math.max(30, word.length * 9)) && r.height > 18);
          if (tooNarrow && parent.innerText.includes(word)) {
            add('medium', 'possible-bad-word-wrap', `Проверь перенос важного слова/заголовка: ${parent.innerText.replace(/\s+/g, ' ').trim().slice(0, 140)}`, {
              selector: shortSelector(parent),
              word
            });
          }
        }
      }
    }

    const buttons = [...document.querySelectorAll('a, button, [role="button"], .btn, .button')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
    });
    for (const btn of buttons) {
      const r = btn.getBoundingClientRect();
      const label = (btn.innerText || btn.getAttribute('aria-label') || btn.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
      if (r.width < 34 || r.height < 30) {
        add('low', 'small-tap-target', `Маленькая кликабельная зона: ${label || shortSelector(btn)}`, {
          selector: shortSelector(btn),
          width: Math.round(r.width),
          height: Math.round(r.height)
        });
      }
    }

    const fixedOrSticky = visible.filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position));
    if (fixedOrSticky.length > 12) {
      add('medium', 'many-fixed-elements', `Слишком много fixed/sticky элементов: ${fixedOrSticky.length}. Это может лагать на телефоне.`);
    }

    const animated = visible.filter((el) => {
      const st = getComputedStyle(el);
      return st.animationName !== 'none' || st.transitionDuration !== '0s';
    });
    if (animated.length > 120) {
      add('medium', 'many-animated-elements', `Много анимированных элементов: ${animated.length}. Проверь лаги на телефоне.`);
    }

    return {
      url: location.href,
      title: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scroll: { width: doc.scrollWidth, height: Math.max(body.scrollHeight, doc.scrollHeight) },
      issues: issues.slice(0, 120)
    };

    function textNodesContaining(root, word) {
      const out = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          return node.nodeValue && node.nodeValue.includes(word) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      while (walker.nextNode()) out.push(walker.currentNode);
      return out;
    }

    function shortSelector(el) {
      if (!el || !el.tagName) return '';
      const id = el.id ? `#${el.id}` : '';
      const cls = [...el.classList].slice(0, 4).map((c) => `.${c}`).join('');
      return `${el.tagName.toLowerCase()}${id}${cls}`;
    }
  });
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch (error) {
    console.error('Playwright не установлен. Выполни: npm install && npx playwright install chromium');
    process.exit(1);
  }

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(screenshotDir, { recursive: true });

  const pages = await loadPages();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const pageInfo of pages) {
      for (const viewport of viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.isMobile,
          deviceScaleFactor: viewport.isMobile ? 2 : 1,
          userAgent: viewport.isMobile
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            : undefined,
          reducedMotion: 'no-preference'
        });
        const page = await context.newPage();
        const url = `http://127.0.0.1:${port}/${pageInfo.path}`;
        const name = `${String(results.length + 1).padStart(2, '0')}-${slugify(pageInfo.path)}-${viewport.name}`;
        const screenshotRel = `screenshots/${name}.png`;
        const screenshotAbs = path.join(outDir, screenshotRel);
        const result = {
          page: pageInfo,
          viewport,
          url,
          screenshot: screenshotRel,
          status: 'ok',
          audit: null,
          consoleErrors: []
        };

        page.on('console', (msg) => {
          if (msg.type() === 'error') result.consoleErrors.push(msg.text());
        });
        page.on('pageerror', (err) => result.consoleErrors.push(String(err?.message || err)));

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(900);
          result.audit = await runDomAudit(page);
          await page.screenshot({ path: screenshotAbs, fullPage: true });
        } catch (error) {
          result.status = 'error';
          result.error = String(error?.stack || error);
        } finally {
          await context.close();
        }
        results.push(result);
        const issueCount = result.audit?.issues?.length || 0;
        console.log(`${pageInfo.path} / ${viewport.name}: ${result.status}, issues=${issueCount}`);
      }
    }
  } finally {
    await browser.close();
    if (!keepServer) server.close();
  }

  const summary = buildSummary(results);
  const report = { generatedAt: new Date().toISOString(), rootDir, pages, viewports, summary, results };
  await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'report.md'), makeMarkdown(report), 'utf8');
  await fs.writeFile(path.join(outDir, 'index.html'), makeHtml(report), 'utf8');
  console.log(`\nГотово: ${path.relative(rootDir, path.join(outDir, 'index.html'))}`);
}

function buildSummary(results) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, consoleErrors: 0, pagesWithIssues: 0 };
  for (const r of results) {
    const issues = r.audit?.issues || [];
    if (issues.length || r.consoleErrors.length || r.status !== 'ok') counts.pagesWithIssues += 1;
    for (const issue of issues) counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    counts.consoleErrors += r.consoleErrors.length;
  }
  counts.totalScreenshots = results.length;
  return counts;
}

function makeMarkdown(report) {
  const lines = [];
  lines.push('# DIANAFARM GROUP — Visual QA Report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push(`Screenshots: ${report.summary.totalScreenshots}`);
  lines.push(`Critical: ${report.summary.critical}, High: ${report.summary.high}, Medium: ${report.summary.medium}, Low: ${report.summary.low}, Console errors: ${report.summary.consoleErrors}`);
  lines.push('');
  for (const r of report.results) {
    const issues = r.audit?.issues || [];
    if (!issues.length && !r.consoleErrors.length && r.status === 'ok') continue;
    lines.push(`## ${r.page.title} — ${r.viewport.name}`);
    lines.push(`- File: ${r.page.path}`);
    lines.push(`- Screenshot: ${r.screenshot}`);
    if (r.status !== 'ok') lines.push(`- Error: ${r.error}`);
    for (const err of r.consoleErrors.slice(0, 5)) lines.push(`- Console error: ${err}`);
    for (const issue of issues.slice(0, 25)) lines.push(`- [${issue.severity}] ${issue.code}: ${issue.text}`);
    lines.push('');
  }
  return lines.join('\n');
}

function makeHtml(report) {
  const cards = report.results.map((r) => {
    const issues = r.audit?.issues || [];
    const issuesHtml = issues.length
      ? `<ul>${issues.slice(0, 25).map((i) => `<li class="${escHtml(i.severity)}"><b>${escHtml(i.severity)}</b> · ${escHtml(i.code)} — ${escHtml(i.text)}</li>`).join('')}</ul>`
      : '<p class="ok">No automatic DOM issues found.</p>';
    const consoleHtml = r.consoleErrors.length
      ? `<details open><summary>Console errors (${r.consoleErrors.length})</summary><ul>${r.consoleErrors.slice(0, 10).map((e) => `<li>${escHtml(e)}</li>`).join('')}</ul></details>`
      : '';
    return `
      <article class="card ${issues.some((i) => i.severity === 'critical') ? 'has-critical' : issues.length ? 'has-issues' : ''}">
        <header>
          <h2>${escHtml(r.page.title)} <span>${escHtml(r.viewport.name)}</span></h2>
          <p>${escHtml(r.page.path)}</p>
        </header>
        <a href="${escHtml(r.screenshot)}" target="_blank"><img src="${escHtml(r.screenshot)}" alt="${escHtml(r.page.title)} ${escHtml(r.viewport.name)}"></a>
        ${consoleHtml}
        ${issuesHtml}
      </article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DIANAFARM Visual QA Report</title>
<style>
:root{color-scheme:dark;--bg:#071228;--panel:#0d1d3b;--line:rgba(221,181,119,.28);--text:#f8f1e4;--muted:#9fb2d0;--gold:#ddb577;--red:#ff7272;--orange:#ffb35c;--green:#7dffb1}
*{box-sizing:border-box}body{margin:0;background:linear-gradient(145deg,#061126,#102d72);font-family:Inter,Arial,sans-serif;color:var(--text)}
.top{padding:32px 36px;border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(7,18,40,.92);backdrop-filter:blur(14px);z-index:10}.top h1{margin:0 0 10px;font-family:Georgia,serif;font-size:34px}.stats{display:flex;gap:12px;flex-wrap:wrap}.stat{border:1px solid var(--line);border-radius:999px;padding:8px 12px;background:rgba(255,255,255,.04)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:22px;padding:28px}.card{border:1px solid var(--line);border-radius:22px;background:rgba(7,18,40,.7);padding:16px;box-shadow:0 20px 70px rgba(0,0,0,.25)}.card.has-issues{border-color:var(--orange)}.card.has-critical{border-color:var(--red)}
h2{margin:0;font-size:20px}h2 span{color:var(--gold);font-size:14px}.card header p{margin:6px 0 14px;color:var(--muted)}img{width:100%;max-height:520px;object-fit:contain;background:#020816;border:1px solid var(--line);border-radius:14px}ul{padding-left:20px}.critical{color:var(--red)}.high{color:#ff9b9b}.medium{color:var(--orange)}.low{color:var(--muted)}.ok{color:var(--green)}details{margin:14px 0;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px}
</style>
</head>
<body>
<section class="top">
  <h1>DIANAFARM GROUP — Visual QA Report</h1>
  <div class="stats">
    <span class="stat">Screenshots: ${report.summary.totalScreenshots}</span>
    <span class="stat">Critical: ${report.summary.critical}</span>
    <span class="stat">High: ${report.summary.high}</span>
    <span class="stat">Medium: ${report.summary.medium}</span>
    <span class="stat">Low: ${report.summary.low}</span>
    <span class="stat">Console errors: ${report.summary.consoleErrors}</span>
  </div>
</section>
<main class="grid">${cards}</main>
</body>
</html>`;
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
