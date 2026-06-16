# DIANAFARM GROUP v289 Final Quality Pass

Закрыто:
- старый GitHub-домен удалён из статических HTML/sitemap/robots и заменён на `__DFG_PUBLIC_ORIGIN__`, который сервер подставляет из `DFG_PUBLIC_ORIGIN`;
- публичные страницы грузят один production CSS-файл и только минимальный набор JS;
- старые route/beam/wow/dg декоративные JS/CSS-файлы удалены из deploy-папки;
- mobile touch QA расширен на все публичные root-страницы и legal-страницы;
- свайп проверяется от центра страницы и от интерактивных элементов;
- admin publish ожидает подтверждение backend;
- base64/local fallback для фото запрещён в production;
- legal SEO, sitemap и robots пересобраны.

Запуск:
```bash
npm install
npm run env:generate
npm run verify:production
npm run start:production
```
