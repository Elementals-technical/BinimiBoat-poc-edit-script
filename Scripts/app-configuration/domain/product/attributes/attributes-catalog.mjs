/**
 * ЄДИНЕ ДЖЕРЕЛО ПРАВДИ для конфігурованих атрибутів (UI + валідація + дефолти).
 * Значення enum — це вже фінальні токени (ім'я entity для fence, ім'я матеріалу для кольору).
 *
 * Використовується CompositionManager.setConfiguration (та цукром setProductConfig/Batch)
 * для валідації patch, і фронтендом для побудови контролів.
 *
 * Поля атрибута:
 *   - scope: 'product' | 'composition' (дефолт 'product'). РЕЗЕРВ: composition-scope
 *     атрибутів зараз немає (див. CONFIGURATION_CONCEPT.md §4).
 *   - appliesTo: [productType] — per-type атрибут; без поля = для всіх типів ролі.
 */

export const BOAT_ATTRIBUTES = {
    LayoutRockportSeries: {
        key: 'LayoutRockportSeries', label: 'Layout Rockport Series', type: 'enum', default: 'none',
        values: [
            { label: 'No Selection', value: 'none' },
            { label: 'Lounger Kit', value: 'lounger-kit' },
            { label: 'Cruiser Kit', value: 'cruiser-kit' },
            { label: 'Voyager Kit', value: 'voyager-kit' },
            { label: 'Explorer Kit', value: 'explorer-kit' }
        ]
    },
    FenceTypeFront: {
        key: 'FenceTypeFront', label: 'Fence Type Front', type: 'enum', default: 'round_fence_front',
        values: [
            { label: 'Square fence',   value: 'square_fence_front' },
            { label: 'Round fence',    value: 'round_fence_front' },
            { label: 'Round fence 36', value: 'round_fence_36_front' }
        ]
    },
    FenceTypeBack: {
        key: 'FenceTypeBack', label: 'Fence Type Back', type: 'enum', default: 'round_fence_back',
        values: [
            { label: 'Square fence',   value: 'square_fence_back' },
            { label: 'Round fence',    value: 'round_fence_back' },
            { label: 'Round fence 36', value: 'round_fence_36_back' }
        ]
    },
    DeckLength:  { key: 'DeckLength',  label: 'Deck Length',  type: 'number', min: 168, step: 1, max: 384, default: 240 },
    FenceLength: { key: 'FenceLength', label: 'Fence Length', type: 'number', min: 96,  step: 1, max: 335, default: 216 },
    FenceWidth:  { key: 'FenceWidth',  label: 'Fence Width',  type: 'number', min: 86,  step: 1, max: 100, default: 90 },
    FrontIndent: { key: 'FrontIndent', label: 'Front Indent', type: 'number', min: 0,   step: 1, max: 48,  default: 0 },
    DeckWidth:   { key: 'DeckWidth',   label: 'Deck Width',   type: 'number', min: 96,  step: 6, max: 102, default: 96 },
    DeckColor: {
        key: 'DeckColor', label: 'Deck Color', type: 'enum',
        values: [ { label: 'Beige', value: 'Deck Beige' }, { label: 'Grey', value: 'Deck Grey' } ]
    },
    FenceColor: {
        key: 'FenceColor', label: 'Fence Color', type: 'enum',
        values: [
            { label: 'Black', value: 'Black' }, { label: 'Navy', value: 'Navy' },
            { label: 'Maroon', value: 'Maroon' }, { label: 'Red', value: 'Red' },
            { label: 'Blue', value: 'Blue' }, { label: 'Gray', value: 'Gray' },
            { label: 'Tan', value: 'Tan' }, { label: 'White', value: 'White' }
        ]
    }
};

export const FURNITURE_ATTRIBUTES = {
    FurnitureColor: {
        key: 'FurnitureColor', label: 'Furniture Color', type: 'enum',
        values: [ { label: 'Beige', value: 'Beige' }, { label: 'Grey', value: 'Grey' } ]
    },
    // Per-type: розмір лавки. Був structural `size` (без валідації) — тепер повноцінний enum.
    Size: {
        key: 'Size', label: 'Bench Size', type: 'enum',
        appliesTo: ['PontoonBench'],
        default: 36,
        values: [
            { label: '30"', value: 30 },
            { label: '36"', value: 36 },
            { label: '50"', value: 50 }
        ]
    }
};

// Структурні (не-каталогові) ключі, які дозволені у patch без enum/number-валідації.
// `size` ВИКЛЮЧЕНО — тепер це каталоговий атрибут `Size` (appliesTo: PontoonBench).
const STRUCTURAL_KEYS = new Set(['position', 'rotationY', 'entityName', 'type', 'role', 'layoutId', 'positionMode']);

/** Каталог атрибутів за роллю продукту. */
export function getAttributesForRole(role) {
    return role === 'platform-parametric' ? BOAT_ATTRIBUTES : FURNITURE_ATTRIBUTES;
}

/** Прив'язка значення number до кроку сітки: min + round((v-min)/step)*step, clamp [min,max]. */
function coerceNumber(attr, value) {
    let v = Number(value);
    if (Number.isNaN(v)) return null;
    const steps = Math.round((v - attr.min) / attr.step);
    v = attr.min + steps * attr.step;
    return Math.max(attr.min, Math.min(attr.max, v));
}

function isValidEnum(attr, value) {
    return attr.values.some(o => o.value === value);
}

/**
 * Валідує/коерсить patch за каталогом ролі + типу.
 * - number → clamp + snap до step;
 * - enum → значення має бути з values (інакше відкидається з warn);
 * - appliesTo → ключ відкидається, якщо productType не у списку;
 * - структурні ключі (position/rotationY/...) → passthrough;
 * - невідомі ключі → відкидаються з warn.
 * @param {string} role - роль продукту ('platform-parametric' | 'draggable')
 * @param {string|null} productType - тип продукту ('Boat', 'PontoonBench', ...) для appliesTo
 * @param {object} rawPatch
 * @returns {{ patch: object, rejected: string[] }}
 */
export function validatePatch(role, productType, rawPatch) {
    const catalog = getAttributesForRole(role);
    const out = {};
    const rejected = [];

    for (const [key, value] of Object.entries(rawPatch || {})) {
        if (STRUCTURAL_KEYS.has(key)) { out[key] = value; continue; }
        const attr = catalog[key];
        if (!attr) { rejected.push(key); console.warn(`[attributes] Unknown key "${key}" for role "${role}"`); continue; }
        if (attr.appliesTo && !attr.appliesTo.includes(productType)) {
            rejected.push(key);
            console.warn(`[attributes] Key "${key}" not applicable to type "${productType}" (appliesTo: ${attr.appliesTo.join(', ')})`);
            continue;
        }

        if (attr.type === 'number') {
            const c = coerceNumber(attr, value);
            if (c === null) { rejected.push(key); console.warn(`[attributes] Bad number for "${key}": ${value}`); continue; }
            out[key] = c;
        } else if (attr.type === 'enum') {
            if (!isValidEnum(attr, value)) { rejected.push(key); console.warn(`[attributes] Bad enum for "${key}": ${value}`); continue; }
            out[key] = value;
        } else {
            out[key] = value;
        }
    }
    return { patch: out, rejected };
}

/**
 * Дефолти з каталогу для ролі (+типу, з урахуванням appliesTo).
 * number → default; enum → default ?? перше значення.
 */
export function defaultsForRole(role, productType = null) {
    const catalog = getAttributesForRole(role);
    const out = {};
    for (const attr of Object.values(catalog)) {
        if (attr.appliesTo && !attr.appliesTo.includes(productType)) continue;
        if (attr.type === 'number') out[attr.key] = attr.default;
        else if (attr.type === 'enum') out[attr.key] = attr.default ?? attr.values[0].value;
    }
    return out;
}
