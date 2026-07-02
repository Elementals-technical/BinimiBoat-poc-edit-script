import { FURNITURE_ATTRIBUTES } from '../../product/attributes/attributes-catalog.mjs';

/**
 * FurnitureLayout — схема, нормалізація і diff (CONFIGURATION_CONCEPT.md §5).
 *
 * Елемент layout:
 *   {
 *     id: 'fl-corner3232-1',   // стабільний id: генерує PlayCanvas-сторона ОДИН раз
 *     type: 'Corner3232',      // тип із ProductRegistry
 *     position: { x, z },      // метри, у координатах DeckPlane
 *     rotationY: 0,
 *     color: 'Beige',          // косметика елемента — всередині елемента
 *     size: 36,                // тільки PontoonBench
 *     positionMode: 'auto'     // задел під drag-фазу; зараз завжди 'auto'
 *   }
 *
 * Семантика запису: масив шлеться ЦІЛИМ (shallow-replace top-level ключа
 * FurnitureLayout), UI тримає повну копію. Матчинг інстансів — по стабільних id.
 */

let _idCounter = 0;

/** Генерація стабільного id елемента (один раз, id = слот). */
export function generateLayoutId(type) {
    return `fl-${String(type).toLowerCase()}-${++_idCounter}`;
}

/**
 * Нормалізація сирого масиву layout від UI/правила:
 * - невідомий type → елемент відкидається (rejected);
 * - відсутній id → генерується (повертається у layoutIds результату setConfiguration);
 * - дублікат id → відкидається;
 * - color → валідація за FURNITURE_ATTRIBUTES.FurnitureColor;
 * - дефолти: rotationY 0, positionMode 'auto', position {0,0}.
 * @returns {{ layout: object[], rejected: string[] }}
 */
export function normalizeLayout(rawArray, registry) {
    const layout = [];
    const rejected = [];
    const seen = new Set();
    const colorValues = FURNITURE_ATTRIBUTES.FurnitureColor.values.map(v => v.value);

    for (const raw of Array.isArray(rawArray) ? rawArray : []) {
        if (!raw || typeof raw !== 'object' || !raw.type || !registry.get(raw.type)) {
            rejected.push(`FurnitureLayout[type=${raw?.type}]`);
            console.warn(`[furniture-layout] Unknown furniture type "${raw?.type}" — element dropped`);
            continue;
        }
        const id = raw.id || generateLayoutId(raw.type);
        if (seen.has(id)) {
            rejected.push(`FurnitureLayout[id=${id}]`);
            console.warn(`[furniture-layout] Duplicate id "${id}" — element dropped`);
            continue;
        }
        seen.add(id);

        const el = {
            id,
            type: raw.type,
            position: { x: Number(raw.position?.x) || 0, z: Number(raw.position?.z) || 0 },
            rotationY: Number(raw.rotationY) || 0,
            positionMode: raw.positionMode === 'manual' ? 'manual' : 'auto'
        };
        if (raw.color !== undefined) {
            if (colorValues.includes(raw.color)) el.color = raw.color;
            else console.warn(`[furniture-layout] Bad color "${raw.color}" for "${id}" — ignored`);
        }
        if (raw.size !== undefined) el.size = raw.size; // валідується як Size у validatePatch при reconcile
        layout.push(el);
    }
    return { layout, rejected };
}

/**
 * Diff бажаного layout проти фактичних інстансів (по стабільних id, патерн React keys).
 * @param {object[]} desired - нормалізований масив елементів
 * @param {Map<string, object>|object} currentById - id → snapshot наявних furniture-продуктів
 * @returns {{ create: object[], remove: string[], update: {element: object, snapshot: object}[] }}
 */
export function diffLayout(desired, currentById) {
    const current = currentById instanceof Map ? currentById : new Map(Object.entries(currentById || {}));
    const desiredIds = new Set(desired.map(e => e.id));

    const create = desired.filter(e => !current.has(e.id));
    const remove = [...current.keys()].filter(id => !desiredIds.has(id));
    const update = desired
        .filter(e => current.has(e.id))
        .map(e => ({ element: e, snapshot: current.get(e.id) }));
    return { create, remove, update };
}

/** Перетворення елемента layout → patch атрибутів снапшота продукту. */
export function elementToPatch(element) {
    const patch = {
        position: { ...element.position },
        rotationY: element.rotationY,
        positionMode: element.positionMode
    };
    if (element.color !== undefined) patch.FurnitureColor = element.color;
    if (element.size !== undefined) patch.Size = element.size;
    return patch;
}
