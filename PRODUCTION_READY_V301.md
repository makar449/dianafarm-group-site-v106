# DIANAFARM GROUP v301 — Complete i18n pass

## What changed
- All public HTML pages now use `assets/css/dianafarm-final-v301.css?v=301` and `assets/js/dianafarm-final-v301.js?v=301`.
- Added a deterministic v301 translation layer that translates static HTML text, attributes, generated cards, menu, footer, filters, buttons, cookies, reviews and common content blocks after every language switch and DOM render.
- Service-detail pages now render a clean localized detail layout for BG / EN / KA from structured service data, so old Russian static service sections no longer remain visible after language switch.
- Fixed Georgian fields that still contained Russian words from older data.
- Updated data storage key to `dianafarm_group_data_v301_i18n_complete` to avoid old localStorage content overriding the default translated data.

## Verified
- `npm run build:server`
- `npm run verify:syntax`
- `npm run verify:links`
- `npm run verify:v301-i18n-complete`
- `npm run verify:server-smoke`
