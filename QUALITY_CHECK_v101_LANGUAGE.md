# DIANAFARM GROUP v10.1 — Language Switcher Polish

Updated language selector and multilingual support:

- Added fourth language: KA / Georgian.
- Header language switcher now shows RU / BG / KA / EN in a premium framed control.
- Removed the old compact-only behavior where only the active language looked available.
- Added Georgian translations for core UI: navigation, buttons, hero copy, page heroes, forms, filters, labels, footer, cookies, and legal/service labels.
- Added Georgian fallback pass for localized catalog objects so cards change language instead of staying fixed.
- Updated admin language field list to RU / BG / KA / EN for future content editing.
- Updated storage key to avoid cached old language settings overriding the new version.

Checks performed:

- node --check assets/js/data.js
- node --check assets/js/app.js
- node --check assets/js/admin.js
- HTML files checked for KA language switcher in public pages.
- Local asset/page reference scan performed.
