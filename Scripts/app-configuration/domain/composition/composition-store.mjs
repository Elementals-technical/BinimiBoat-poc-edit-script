/**
 * Store однієї композиції. (Порт з Hasting, адаптований під Bimini.)
 *
 * ВІДМІННОСТІ ВІД HASTING:
 * - Прибрано _orderProductIds (лінійний порядок не потрібен — furniture стоять вільно).
 * - Додано _sceneResources для спільних ресурсів (DeckPlane), які продюсить Boat
 *   і споживає drag-модуль. Це заміна неявного "порядку в ряду" на явний mediator.
 * - Додано _config — композиційний КОНФІГ-ДОКУМЕНТ (декларативна модель,
 *   CONFIGURATION_CONCEPT.md §1): top-level ключі setConfiguration, які не належать
 *   жодному продукту (зараз: FurnitureLayout — джерело правди про склад меблів).
 *
 * Продукти:
 *   - Boat (1 шт, role='platform-parametric')
 *   - Furniture (N шт, role='draggable'; породжуються reconcile-кроком із FurnitureLayout)
 */
export class CompositionStore {
    constructor(compositionId = 'boat', compositionType = 'bimini') {
        this.compositionId = compositionId;
        this.compositionType = compositionType;
        this._products = new Map();        // Map<productId, snapshot>
        this._sceneResources = new Map();  // Map<name, data>  напр. 'DeckPlane', 'FurnitureLayout:desired'
        this._config = new Map();          // Map<key, value>  конфіг-документ: 'FurnitureLayout'
        this.meta = { createdAt: Date.now(), lastModified: Date.now(), isActive: true };
    }

    // ---- продукти ----
    addProduct(id, snapshot) { this._products.set(id, snapshot); this._touch(); }
    removeProduct(id) { const d = this._products.delete(id); this._touch(); return d; }
    getProduct(id) { return this._products.get(id); }
    getAllProducts() { return Object.fromEntries(this._products); }

    getProductsByRole(role) {
        return Array.from(this._products.entries())
            .filter(([, s]) => s.role === role)
            .map(([id, s]) => ({ id, snapshot: s }));
    }
    getBoat() { return this.getProductsByRole('platform-parametric')[0] || null; }
    getFurniture() { return this.getProductsByRole('draggable'); }

    // ---- конфіг-документ (top-level ключі setConfiguration) ----
    setConfigValue(key, value) { this._config.set(key, value); this._touch(); }
    getConfigValue(key) { return this._config.get(key); }

    // ---- спільні ресурси (DeckPlane, derived layout) ----
    setResource(name, data) { this._sceneResources.set(name, data); this._touch(); }
    getResource(name) { return this._sceneResources.get(name); }

    _touch() { this.meta.lastModified = Date.now(); }

    serialize() {
        return {
            compositionId: this.compositionId,
            compositionType: this.compositionType,
            config: Object.fromEntries(this._config),
            products: Object.fromEntries(this._products),
            sceneResources: Object.fromEntries(this._sceneResources),
            meta: this.meta
        };
    }
}
