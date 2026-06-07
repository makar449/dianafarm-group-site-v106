# DIANAFARM GROUP v9 Multi-Page Luxury Platform

Меню теперь открывает отдельные страницы, а не прокручивает одну длинную главную.

## Запуск
```bash
python3 -m http.server 3000
```

Открыть: http://localhost:3000/

Страницы: index.html, services.html, real-estate.html, cars.html, parking.html, uae.html, asia.html, b2b.html, blog.html, about.html, contacts.html, admin.html.

Пароль админки: dianafarm2026

## Visual QA Agent v179

В проект добавлен локальный агент проверки верстки.

```powershell
npm install
npx playwright install chromium
npm run visual:qa
```

Отчет появится в `visual-report/index.html`.

Для ИИ-проверки скриншотов укажи ключ через `.env` или терминал:

```powershell
$env:OPENAI_API_KEY="sk-..."
npm run visual:all
```

Подробная инструкция: `tools/visual-agent/README.md`.
