# 02 — Ядро: звідки що витікає

Пояснення з нуля, без відсилок до проекту-предка. Прочитавши цей файл, ти маєш розуміти, що станеться від виклику API до зміни пікселів.

## Ланцюг залежностей (що з чого витікає)

```
attributes-catalog.mjs        ← ЩО можна конфігурувати (ключі, типи, межі, дефолти)
        │ валідація/дефолти
        ▼
CompositionManager            ← ЄДИНИЙ пайплайн зміни стану
        │ снапшоти продуктів
        ▼
CompositionStore              ← ДАНІ (конфіг-документ, снапшоти, derived-ресурси)
        │ changes
        ▼
Product rules (на продукті)   ← ЯК атрибут впливає на СВІЙ продукт
        │ читають дані з bindings.json (згенеровано з таблиці Rules1)
        ▼
Composition rules (глобальні) ← ЯК продукти впливають ОДИН НА ОДНОГО (через DeckPlane)
        ▼
Reconcile                     ← синхронізація інстансів меблів зі складом layout
        ▼
PlayCanvas-сцена (entity, матеріали, smartStretch-деформація мешів)
```

## Компоненти (по одному абзацу)

**SceneManager** (`domain/scene/manager/`) — точка входу. У редакторі PlayCanvas до Root підключені лише два скрипти: `sceneManager` і `globalBridge`; все інше SceneManager створює програмно: CompositionManager, три composition rules, сідінг лодки дефолтами, drag-модуль. На першому кадрі проганяє дефолтний конфіг через пайплайн (бо правила спрацьовують тільки на зміну — без цього сцена стартувала б «як у редакторі»).

**GlobalBridge** (`bridge/`) — виставляє `window.ConfiguratorAPI`. Тонкий: кожен метод — один виклик у CompositionManager. Логіки тут немає і не повинно з'явитися.

**CompositionManager** (`domain/composition/composition-manager.mjs`, ~300 рядків — серце системи) — єдиний публічний метод зміни `setConfiguration(patch)`. Пайплайн з гарантованим порядком: **validate** (за каталогом атрибутів) → **store** (снапшот) → **product rules** → **composition rules** (один раз на патч) → **reconcile** (єдине місце, де створюються/видаляються entity меблів). Приватні кроки (`_writeSnapshot`, `_runProductRules`, `_fireAggregation`, `_reconcile`) ззовні не викликаються ніколи.

**CompositionStore** — тільки дані, про сцену не знає: снапшоти продуктів (id → плоский об'єкт стану), конфіг-документ (`FurnitureLayout` — джерело правди про склад меблів), derived-ресурси (`DeckPlane`, `FurnitureLayout:desired`).

**ProductController + RuleExecutor** — скрипт на кожному продукті. Визначає тип продукту за іменем entity (`ProductRegistry.detectProductType`), бере список правил з реєстру, виконує їх послідовно за `priority` (менше = раніше; конвенція: 10 — розміри, 20 — варіанти, 30 — матеріали), з чергою проти паралельних запусків.

**ProductRegistry + ProductConfigLoader** (`domain/product/registry/`) — мапа «тип продукту → роль, правила, дефолтний конфіг». Один запис для Boat, по запису на кожен тип меблів.

**SceneAggregator + composition rules** (`domain/composition/`) — міжпродуктова логіка. Три правила, порядок реєстрації = порядок виконання: `RuleBuildDeckPlane` (габарити лодки → ресурс DeckPlane) → `RuleFurnitureLayout` (склад + площина → бажані позиції) → `RuleClampFurniture` (кламп у межі, конфлікти → `placementConflicts` у відповіді API). Composition rules **чисті**: обчислюють дані, не створюють/не видаляють entity.

**Шар даних** — уся «математика» лодки не в коді, а в `parametric/bindings.json` (згенеровано з Excel-таблиці Rules1): для кожного розмірного атрибута — список біндингів `{targets: [імена entity], fn: MoveZ|StretchX|..., keyframes: [{at: дюйми, value: метри}]}`. Правило лише інтерполює keyframes і застосовує трансформацію через хелпери. Деформація мешів — скрипт `smartStretch` (9-slice), зсуви — покоординатна композиція офсетів (два правила пишуть різні осі одного entity без конфлікту).

## Приклад наскрізно: `setConfiguration({ DeckLength: 300 })`

1. validate: 300 у межах [168..384] ✓.
2. store: снапшот Boat: `DeckLength: 300`.
3. product rules: `RuleDeckLength` бере `bindings.dimensions.DeckLength` → 3 біндинги: передня секція забору їде вперед (MoveZ), двигун назад (MoveZ), 8 мешів деки тягнуться (StretchZ через smartStretch).
4. composition rules: DeckPlane перерахувалась (стала довшою) → позиції меблів перераховані → кламп не потрібен.
5. reconcile: складу меблів патч не міняв — нічого.
6. Відповідь: `{ success: true, changed: ['DeckLength'], rejected: [], placementConflicts: [], layoutIds: [...] }`.

## Правила гігієни (порушення = зламана архітектура)

1. Зміна стану — тільки `setConfiguration` (і цукор над ним: `setBoatConfig`, `setFurnitureConfig`, `addFurniture`...).
2. Структурні мутації (create/destroy entity) — тільки в reconcile.
3. Дефолти й валідація — тільки з `attributes-catalog.mjs`.
4. Розмірні залежності — тільки через `bindings.json`, не хардкодом у правилах.
5. Меблі не знають про забір, забір про меблі — тільки DeckPlane.
