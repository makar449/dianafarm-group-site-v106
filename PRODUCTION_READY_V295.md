# DIANAFARM GROUP v295 — i18n and details links final pass

## Fixed

- Added final multilingual runtime layer for static chips, route lines, hero feature cards, footer headings/links, filters, review labels and CTA buttons.
- Removed broad v252 transliteration layer from public HTML because it produced mixed/incorrect Georgian text in static zones.
- Added `assets/js/v295-i18n-links-final.js` after app rendering so newly rendered cards are translated again after language changes and DOM updates.
- Ensured `Отзывы` in the header is translated through `data-i18n="nav.reviews"` and the v295 final layer.
- Added exact translations for main chips/lines shown in QA screenshots: ВНЖ / ПМЖ, Регистрация компаний, Банки, UAE / Dubai, Азия, Недвижимость, Фармацевтика, Эффективность, Рост, Аналитика, Конфиденциальность, Международное сопровождение, Инвестиции, Результат, Фильтр and related page hero labels.
- Reinforced category cleanup for `categories.cars`, `categories.parking`, `categories.business`, `categories.realEstate`.
- Reinforced all service/blog detail buttons; blog buttons keep modal behavior, but if the modal fails to open, they fall back to the closest related service/page.
- All public root pages and legal pages now load `assets/css/dianafarm-production-v295.css?v=295` and `assets/js/v295-i18n-links-final.js?v=295`.

## Verified

`npm run verify:production` passed:

- TypeScript server build
- JS syntax check
- HTML local links check
- v295 i18n/link inclusion check

