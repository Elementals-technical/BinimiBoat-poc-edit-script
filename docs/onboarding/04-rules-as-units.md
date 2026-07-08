# 04 — Правила як унікальні юніти

## Стратегічний напрям

Кожне бізнес-правило проекту — **унікальний, замкнений юніт**: окремий файл (або замкнена функція) з єдиною відповідальністю, який виконується у стеку один за одним. До чого йдемо:

1. **Зараз:** юніти реєструються статично (import у `product-config-loader.mjs` / `scene-manager.mjs`).
2. **Далі:** сервер додає юніти в стек **програмно** — без редагування ядра і без перезбирання: юніт приходить як код/дескриптор, реєструється в позицію за `priority`, виконується у своєму місці черги.
3. **Мета:** **автономна генерація правил** — AI створює новий юніт за специфікацією (наприклад, новим рядком таблиці Rules1), юніт валідується і додається в стек.

Звідси головна вимога: **правило має бути самодостатнім**. Все, що ядру треба знати про юніт — його декларативна шапка (що слухає, коли виконувати). Все, що юніту треба від світу — приходить через контекст. Юніт можна додати, вимкнути (`enabled = false`) або прибрати, не торкаючись інших.

## Контракт юніта (вже реалізований у ядрі)

### Product rule — вплив атрибута на свій продукт

```js
import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';

export class RuleMyFeature extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleMyFeature',
            watchAttributes: ['MyAttr'],   // виконуватись лише коли ці ключі в патчі
            priority: 20                   // 10 розміри, 20 варіанти, 30 матеріали
        });
    }
    // усе потрібне — з аргумента і this.context (app, entity, productId)
    async execute({ changes, currentState, previousState }) { ... }
}
```

Виконання: `RuleExecutor` сортує стек за `priority` і жене **послідовно, один за одним** (await кожного), з чергою проти повторного входу. Помилка юніта логується і не валить стек.

### Composition rule — міжпродуктова логіка

```js
export class RuleMyGlobal extends BaseCompositionRule {
    constructor() {
        super({ name: '...', watchCompositions: ['boat'], watchParams: ['DeckLength'] });
    }
    aggregateFn(compositions, context) { /* ЧИСТЕ обчислення → результат */ }
    async applyFn(result, context)     { /* запис ресурсу / реакція сцени */ }
}
```

## Правила написання юніта (чеклист)

1. **Один юніт = одна відповідальність.** Не об'єднуй кілька атрибутів у одне правило, якщо їх можна слухати окремо.
2. **Логіка — в юніті, дані — в JSON.** Юніт не містить чисел/імен entity — бере їх зі свого слайса `bindings.json` (чи іншого data-файла). Тоді генератору правил достатньо продукувати короткий юніт + запис даних.
3. **Механіка — в хелперах.** Інтерполяція (`KeyframeHelper`), пошук entity (`SceneEntityHelper`), трансформації (`SceneTransformHelper`), матеріали (`MaterialService`). Юніт — тонка обгортка: «взяти дані → викликати хелпери». Спільний код живе в хелперах, а не в ієрархії правил — це навмисно: юніти залишаються незалежними один від одного.
4. **Жодних побічних каналів.** Юніт не пише в store, не викликає інші юніти, не тригерить пайплайн. Тільки: читає `changes`/`currentState`/дані, діє на сцену через хелпери (product rule) або обчислює derived-ресурс (composition rule).
5. **Ідемпотентність.** Повторний виклик з тим самим значенням = той самий результат (композиція офсетів у SceneTransformHelper це гарантує для трансформацій — користуйся нею, не пиши в `setLocalPosition` напряму).
6. **Декларативна шапка повна.** `watchAttributes`/`watchParams` мають перелічувати ВСЕ, на що юніт реагує — ядро фільтрує виконання лише за ними.

## Поточний стек юнітів

| Юніт | Слухає | Priority | Файл |
|---|---|---|---|
| RuleDeckLength | DeckLength | 10 | `rules/boat/RuleDeckLength.mjs` |
| RuleDeckWidth | DeckWidth | 10 | `rules/boat/RuleDeckWidth.mjs` |
| RuleFenceLength | FenceLength | 10 | `rules/boat/RuleFenceLength.mjs` |
| RuleFenceWidth | FenceWidth | 10 | `rules/boat/RuleFenceWidth.mjs` |
| RuleFrontIndent | FrontIndent | 10 | `rules/boat/RuleFrontIndent.mjs` |
| RuleFenceType | FenceTypeFront/Back | 20 | `rules/boat/RuleFenceType.mjs` |
| RuleBoatMaterial | DeckColor, FenceColor | 30 | `rules/boat/RuleBoatMaterial.mjs` |
| RuleFurnitureVariant | Size | 20 | `rules/furniture/RuleFurnitureVariant.mjs` |
| RuleFurnitureColor | FurnitureColor | 30 | `rules/furniture/RuleFurnitureColor.mjs` |
| — composition — | | порядок реєстрації | |
| RuleBuildDeckPlane | габарити лодки | 1-й | `composition/rules/RuleBuildDeckPlane.mjs` |
| RuleFurnitureLayout | габарити + FurnitureLayout | 2-й | `composition/rules/RuleFurnitureLayout.mjs` |
| RuleClampFurniture | габарити лодки | 3-й | `composition/rules/RuleClampFurniture.mjs` |

## Що потрібно ядру для «програмних» юнітів (майбутня робота)

Зараз реєстрація статична. Для динамічного стека знадобиться:

1. Публічний метод реєстрації юніта в рантаймі (`registerProductRule(productType, ruleInstance)` — RuleExecutor уже вміє `registerRule`, бракує шляху від registry до живих контролерів).
2. Формат-дескриптор юніта для передачі з сервера (name/watch/priority + код або посилання на data-слайс) і його валідація перед включенням у стек.
3. Пісочниця/контроль: що дозволено юніту (хелпери, контекст), заборона прямих мутацій store.
4. Версіонування стека: який набір юнітів був активний для конкретної конфігурації.

Свідомий трейдофф: п'ять dimension-правил зараз структурно схожі. Це **не** зливається в одне generic-правило — унікальність юніта важливіша за DRY, бо саме вона робить стек придатним до автономної генерації (шаблон «схожого юніта» — це якраз те, що генератор продукуватиме найкраще). Спільне тримаємо в хелперах.
