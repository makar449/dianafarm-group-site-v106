# Visual QA Agent for DIANAFARM GROUP

Этот агент добавляет два уровня проверки сайта:

1. **Техническая visual QA-проверка без API** — Playwright открывает все страницы, делает desktop/tablet/mobile скриншоты и ищет типовые баги верстки.
2. **ИИ-проверка скриншотов** — если указан `OPENAI_API_KEY`, агент отправляет важные скриншоты в ИИ и получает человеческий QA-отчет по премиальности, пустым зонам, наездам текста и мобильной читаемости.

## Первый запуск

```powershell
cd $env:USERPROFILE\Downloads\dianafarm_v179_run\папка_с_сайтом
npm install
npx playwright install chromium
npm run visual:qa
```

После проверки открой:

```text
visual-report/index.html
```

## Запуск с ИИ-проверкой

Вариант через текущий терминал:

```powershell
$env:OPENAI_API_KEY="sk-..."
npm run visual:all
```

Вариант через `.env` рядом с `package.json`:

```env
OPENAI_API_KEY=sk-...
OPENAI_VISION_MODEL=gpt-4o-mini
VISUAL_AI_MAX_SHOTS=12
```

Потом:

```powershell
npm run visual:all
```

ИИ-отчет будет здесь:

```text
visual-report/ai-review.md
```

## Быстрые команды

```powershell
npm run visual:qa      # скриншоты + техническая проверка
npm run visual:mobile  # только мобильная проверка
npm run visual:ai      # только ИИ-проверка по уже готовым скринам
npm run visual:all     # техническая + ИИ-проверка
```

## Что агент ловит автоматически

- горизонтальный скролл;
- текст, который вылезает за контейнер;
- сжатые карточки, где слова становятся вертикальными;
- агрессивный перенос слов;
- слишком маленькие кнопки/тап-зоны;
- ошибки в консоли;
- слишком много fixed/sticky и анимированных элементов, которые могут лагать на телефоне.

## Важно

`OPENAI_API_KEY` нельзя коммитить в GitHub. Храни его только в `.env` или вводи через `$env:OPENAI_API_KEY` в терминале.
