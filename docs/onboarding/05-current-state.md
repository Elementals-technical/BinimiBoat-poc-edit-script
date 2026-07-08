# 05 — Поточний стан і відомі проблеми

Станом на 2026-07-08.

## Що працює

- Ядро і пайплайн `setConfiguration` повністю: валідація за каталогом, снапшоти, product rules, composition rules, reconcile.
- Параметрика лодки: всі 5 розмірних атрибутів + типи забору + кольори деки/забору (дані з `bindings.json`).
- `MaterialService` — портований повністю (кеш, дедуплікація, batch).
- Декларативний склад меблів: `FurnitureLayout` + reconcile (створення/видалення клонів шаблонів).
- Dev-панель `?testui`, діагностика `?stretchlog`.

## Що НЕ зроблено

- **Меблі не розставлені.** Reconcile-механіка готова, але реальних початкових позицій немає — чекаємо таблиці фіксованих позицій від **ROMA** (див. [03](03-deck-plane-and-furniture.md)). Потокова розкладка в `RuleFurnitureLayout` — заглушка.
- **Drag-and-drop** — каркас без ключових шматків: `_pick` (raycast), колізії, touch.
- Калібрування: `fenceInset` у DeckPlane (0.10 м — заглушка), `FURNITURE_FOOTPRINTS` (на око), візуальна верифікація SmartStretch-калібрувань (×2, recenter).
- `furniture-materials.json` (submesh→material мапа, Rules1 рядки 122-133) — не винесено з коду.
- Fence-with-door варіант (Rules1 рядки 311-348) — не в bindings.
- Портовані, але не інтегровані сервіси: camera, ar-export.

## ⚠️ Актуальна проблема: тріпланар — немає блиску від світла

**Симптом:** на поверхнях із тріпланарним мапінгом відсутній спекулярний відблиск (glossiness ≈ 0), матеріал виглядає пласким/матовим.

**Що таке тріпланар тут:** кастомні GLSL-чанки в `src/Scripts/chunks/` (`TriplanarDiffuse.mjs`, `TriplanarGloss.mjs`, `TriplanarNormal.mjs`) — проєкція текстур по трьох осях у model-space (щоб текстура не пливла при SmartStretch-деформації), з grain-flip логікою.

**Головний підозрюваний (з читання коду):** `TriplanarGloss.mjs` перевизначає `getGlossiness()` і **безумовно** семплить `tri_glossTex`:

```glsl
float gX = texture2D(tri_glossTex, uvX).r;  // немає прапорця tri_hasGloss!
...
dGlossiness = textureVal * tri_glossiness * 2.0;
```

На відміну від diffuse-чанка (який має `tri_hasDiffuse` і fallback), у gloss-чанку прапорця `tri_hasGloss` **немає**: якщо gloss-текстура не прив'язана, семпл дає 0 → `dGlossiness = 0` → жодного відблиску незалежно від `tri_glossiness` матеріалу. Перший крок дебага: перевірити, чи біндиться `tri_glossTex` для проблемних матеріалів, і додати `tri_hasGloss` з fallback на `tri_glossiness` (симетрично до diffuse).

**Супутні спостереження:**

- Скрипт, який ці чанки підключає (`triPlanarMapping`), у репозиторії **відсутній** — живе лише в PlayCanvas-редакторі. Чанки в `src/Scripts/chunks/` ніхто з repo-коду не імпортує (крім `scene-collector` AR-експорту, який тріпланар навпаки вичищає). Ризик розсинхрону редактор ↔ repo; скрипт варто затягнути в репозиторій.
- `MaterialService._getTriPlanarScript` вгадує ім'я скрипта з 5+ варіантів (`triPlanarMapping` / `triplanarMapping` / ...) — після заміни матеріалу викликає його refresh; якщо ім'я в редакторі інше, refresh мовчки не відбудеться.

## Операційні борги

- Git-репозиторій без комітів (вся робота — один екземпляр на диску). Перший крок: init-коміт + remote.
- Нуль автотестів. Мінімум: `node --check` по всіх .mjs у CI + юніти на catalog/layout/keyframes.

## Пріоритет найближчих робіт

1. Тріпланар: повернути блиск (див. вище).
2. Отримати таблиці позицій від ROMA → `positions.json`/`layouts.json` → розставити меблі.
3. Калібрування DeckPlane і footprints.
4. Drag-and-drop MVP (pick + колізії).
