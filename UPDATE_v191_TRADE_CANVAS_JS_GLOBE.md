# UPDATE v191 — International Trade Canvas/JS 3D Globe

Сделано только для `service-international-trade.html`.

- Реальный `<canvas>` внутри hero-секции.
- Внешний JS: `assets/js/dg-trade-globe-v191.js?v=191`.
- Canvas-рендер: 3D-глобус, широты/долготы, светящиеся узлы, торговые маршруты, импульсы по дугам.
- Наведение на карточки `01 / 02 / 03` ускоряет/подсвечивает маршруты.
- Canvas не занимает место в сетке и не создаёт пустой отступ: это абсолютный слой между текстом и правыми карточками.
- ПК/ноутбуки/планшеты: включено. Телефон ≤640px: скрыто.

Проверка перед пушем:

```powershell
powershell -ExecutionPolicy Bypass -File .\VERIFY_V191_TRADE_GLOBE.ps1
```

Ожидаемый результат:

```text
RESULT: 10 / 10 checks passed for v191 trade canvas globe
```
