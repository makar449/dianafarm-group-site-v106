#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const outDir = path.join(rootDir, 'visual-report');
const reportPath = path.join(outDir, 'report.json');
const checklistPath = path.join(__dirname, 'checklist.json');

const DEFAULT_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';
const MAX_SHOTS = Number(process.env.VISUAL_AI_MAX_SHOTS || 12);

function escMd(input) {
  return String(input ?? '').replace(/\r/g, '').trim();
}

async function loadDotEnv() {
  const envPath = path.join(rootDir, '.env');
  try {
    const raw = await fs.readFile(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const clean = line.trim();
      if (!clean || clean.startsWith('#') || !clean.includes('=')) continue;
      const idx = clean.indexOf('=');
      const key = clean.slice(0, idx).trim();
      let value = clean.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function scoreResult(r) {
  const issues = r.audit?.issues || [];
  const severity = issues.reduce((sum, i) => sum + ({ critical: 50, high: 25, medium: 8, low: 2 }[i.severity] || 1), 0);
  const priority = r.page?.priority === 'high' ? 15 : r.page?.priority === 'medium' ? 6 : 0;
  const mobile = r.viewport?.name?.includes('mobile') ? 12 : 0;
  const keyPage = ['index.html', 'services.html', 'blog.html', 'contacts.html', 'reviews.html', 'uae.html', 'asia.html'].includes(r.page?.path) ? 12 : 0;
  return severity + priority + mobile + keyPage;
}

async function imagePart(relPath) {
  const abs = path.join(outDir, relPath);
  const data = await fs.readFile(abs);
  return { type: 'input_image', image_url: `data:image/png;base64,${data.toString('base64')}` };
}

async function main() {
  await loadDotEnv();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!(await fileExists(reportPath))) {
    console.error('Нет visual-report/report.json. Сначала выполни: npm run visual:qa');
    process.exit(1);
  }

  const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  const checklist = JSON.parse(await fs.readFile(checklistPath, 'utf8'));

  if (!apiKey) {
    const skipped = [
      '# AI Visual Review пропущен',
      '',
      'OPENAI_API_KEY не найден. Техническая проверка уже готова в `visual-report/index.html`.',
      '',
      'Чтобы включить ИИ-проверку скриншотов:',
      '',
      '```powershell',
      '$env:OPENAI_API_KEY="sk-..."',
      'npm run visual:ai',
      '```',
      '',
      'Или создай `.env` рядом с `package.json`:',
      '',
      '```env',
      'OPENAI_API_KEY=sk-...',
      'OPENAI_VISION_MODEL=gpt-4o-mini',
      'VISUAL_AI_MAX_SHOTS=12',
      '```'
    ].join('\n');
    await fs.writeFile(path.join(outDir, 'ai-review.md'), skipped, 'utf8');
    console.log('AI Visual Review пропущен: нет OPENAI_API_KEY');
    return;
  }

  const candidates = [...report.results]
    .sort((a, b) => scoreResult(b) - scoreResult(a))
    .slice(0, MAX_SHOTS);

  const content = [{
    type: 'input_text',
    text: [
      'Проведи визуальный QA сайта DIANAFARM GROUP по скриншотам.',
      'Отвечай строго по-русски, как frontend QA lead: конкретно, без воды.',
      'Главная цель: найти визуальные баги, наслоения, пустые зоны, плохую читаемость, сломанные mobile/desktop сетки, непремиальный вид.',
      '',
      'НЕЛЬЗЯ просить генерировать изображения. Нужно оценивать именно сайт.',
      '',
      'Что обязательно сохранить:',
      checklist.mustKeep.map((x) => `- ${x}`).join('\n'),
      '',
      'Чек-лист:',
      checklist.visualChecks.map((x) => `- ${x}`).join('\n'),
      '',
      'Автоматический DOM-отчет:',
      `Critical: ${report.summary.critical}, High: ${report.summary.high}, Medium: ${report.summary.medium}, Low: ${report.summary.low}, Console errors: ${report.summary.consoleErrors}`,
      '',
      'Скриншоты ниже. Перед каждым скриншотом указан файл страницы и viewport.',
      'Верни отчет в формате:',
      '1. Критично исправить',
      '2. Желательно улучшить',
      '3. Что выглядит хорошо и не трогать',
      '4. Быстрый список CSS/HTML-правок'
    ].join('\n')
  }];

  for (const r of candidates) {
    const issues = (r.audit?.issues || []).slice(0, 8).map((i) => `[${i.severity}] ${i.code}: ${i.text}`).join('\n') || 'Автоматические DOM-ошибки не найдены.';
    content.push({
      type: 'input_text',
      text: `\n---\nСтраница: ${r.page.title}\nФайл: ${r.page.path}\nViewport: ${r.viewport.name}\nDOM issues:\n${issues}\n`
    });
    content.push(await imagePart(r.screenshot));
  }

  const payload = {
    model: DEFAULT_MODEL,
    input: [
      { role: 'system', content: 'Ты строгий визуальный QA frontend-интерфейсов премиальных сайтов. Ищешь баги верстки и даешь точные правки.' },
      { role: 'user', content }
    ]
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  if (!response.ok) {
    await fs.writeFile(path.join(outDir, 'ai-review-error.json'), raw, 'utf8');
    throw new Error(`OpenAI API error ${response.status}: ${raw.slice(0, 500)}`);
  }

  const json = JSON.parse(raw);
  const text = json.output_text || extractOutputText(json) || 'AI review returned no text.';
  const md = [
    '# AI Visual Review — DIANAFARM GROUP',
    '',
    `Model: ${DEFAULT_MODEL}`,
    `Screenshots reviewed: ${candidates.length}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    escMd(text)
  ].join('\n');

  await fs.writeFile(path.join(outDir, 'ai-review.json'), JSON.stringify(json, null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'ai-review.md'), md, 'utf8');
  await appendAiLinkToIndex(md);
  console.log('Готово: visual-report/ai-review.md');
}

function extractOutputText(json) {
  const parts = [];
  for (const item of json.output || []) {
    for (const c of item.content || []) {
      if (c.type === 'output_text' && c.text) parts.push(c.text);
    }
  }
  return parts.join('\n\n');
}

async function appendAiLinkToIndex(md) {
  const indexPath = path.join(outDir, 'index.html');
  if (!(await fileExists(indexPath))) return;
  const html = await fs.readFile(indexPath, 'utf8');
  const safe = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const insert = `<section class="top" style="position:static"><h1>AI Visual Review</h1><p><a style="color:#ddb577" href="ai-review.md" target="_blank">Открыть Markdown-отчет</a></p><pre style="white-space:pre-wrap;line-height:1.55;background:rgba(0,0,0,.25);border:1px solid rgba(221,181,119,.28);border-radius:18px;padding:18px;max-height:520px;overflow:auto">${safe}</pre></section>`;
  await fs.writeFile(indexPath, html.replace('</body>', `${insert}</body>`), 'utf8');
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
