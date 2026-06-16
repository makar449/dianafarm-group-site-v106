# DIANAFARM GROUP v289 Final Quality

Это финальная production-capable сборка сайта с серверным режимом. Запускать только через Node production server, не через `python -m http.server`, иначе серверная админка, общие обновления для всех устройств, загрузка фото и заявки не будут работать корректно.

## Запуск

```bash
npm install
npm run env:generate
npm run verify:production
npm run start:production
```

После запуска:
- сайт: `http://localhost:8080/index.html`
- админка: `http://localhost:8080/admin.html`

## Что закрыто в v289

- публичные страницы грузят один production CSS-файл;
- старые декоративные route/beam/wow/dg анимационные JS/CSS-файлы удалены из deploy-папки;
- старый GitHub Pages домен удалён из статических HTML/sitemap/robots;
- canonical/robots/sitemap используют `__DFG_PUBLIC_ORIGIN__`, сервер подставляет `DFG_PUBLIC_ORIGIN`;
- mobile scroll/touch guard не блокирует вертикальный свайп на ссылках, кнопках, карточках и чипах;
- админская публикация ждёт ответ backend;
- base64/local fallback для фото запрещён в production;
- server-first логика правок для всех устройств сохранена;
- заявки идут через backend с delivery status/retry;
- legal pages получили canonical, description и OpenGraph.

## Проверка

`npm run verify:production` выполняет TypeScript build, syntax check, link check, server smoke и v289 final QA.


## v292 GitHub Pages admin fix

На GitHub Pages вход в админку выполняется в статическом режиме без `/api`. Пароль: `dianafarm2026`.



## v300 real admin sync

Local/demo admin publishing is disabled. Configure Supabase in `assets/js/production-config.js` or host the Node production backend. See `REAL_ADMIN_SYNC_SETUP_V300.md`.
