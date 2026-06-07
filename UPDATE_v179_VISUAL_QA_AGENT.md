# UPDATE v179 — Visual QA Agent 1+2

Добавлен локальный visual QA-агент:

- `npm run visual:qa` — Playwright делает скриншоты всех основных страниц в desktop/tablet/mobile и проверяет технические проблемы верстки.
- `npm run visual:mobile` — быстрая мобильная проверка.
- `npm run visual:ai` — ИИ-анализ готовых скриншотов, если указан `OPENAI_API_KEY`.
- `npm run visual:all` — техническая проверка + ИИ-анализ.

Результаты появляются в:

- `visual-report/index.html`
- `visual-report/report.md`
- `visual-report/report.json`
- `visual-report/ai-review.md` при включенном API-ключе.

Ключ не хранить в коде. Для примера добавлен `.env.example`.
