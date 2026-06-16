# DIANAFARM GROUP — v296 i18n & overflow final pass

## Исправлено

- Сменён storage key на v296, чтобы старые localStorage-данные с непереведёнными строками не перекрывали новую сборку.
- Исправлены EN/KA переводы в `sitePages`, `blogTopics`, проблемных `advantages` и service fields.
- Добавлен финальный `v296-i18n-overflow-final.js`:
  - строит словарь переводов из всех multilingual-полей `DFG_DEFAULT_DATA`;
  - переводит статичные чипы, меню, футер, hero-блоки, фильтры, карточки услуг, блог, отзывы;
  - исправляет технические строки `categories.*`;
  - закрепляет кликабельность `Подробнее` для карточек услуг;
  - повторно применяет переводы после MutationObserver/renderAll/lang switch.
- Добавлен финальный CSS `dianafarm-production-v296.css`:
  - защита от горизонтального overflow;
  - перенос длинных слов и грузинских строк;
  - уменьшение/адаптация длинных заголовков;
  - защита карточек услуг, отзывов, фильтров, чипов, footer/nav.

## Проверки

- `npm run verify:production` — passed.
- Static data audit: в EN/KA multilingual fields не осталось кириллицы.
- Browser CDP smoke QA:
  - root public pages KA — no suspicious untranslated Cyrillic / no detected horizontal overflow in scanned visible viewport;
  - root public pages EN — no Cyrillic/Georgian leftovers in scanned visible viewport;
  - root public pages BG — no obvious RU fallback tokens in scanned visible viewport;
  - legal pages KA/EN/BG — passed.

## Важно для GitHub Pages

GitHub Pages запускает только static frontend. Админка в static mode входит по паролю `dianafarm2026`, но изменения сохраняются локально в браузере. Для глобального сохранения на всех устройствах нужен backend hosting или Supabase.
