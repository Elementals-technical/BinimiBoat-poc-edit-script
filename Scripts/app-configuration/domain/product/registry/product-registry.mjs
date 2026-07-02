import { ProductConfigLoader } from './product-config-loader.mjs';

/**
 * Реєстр типів продуктів. (Порт з Hasting ProductRegistry_V2, спрощений.)
 * Мапить тип продукту → { role, category, rules[], defaultConfig, variants, materials }.
 * detectProductType визначає тип за назвою entity (Boat_PC_Config, PontoonBench36_Gray, ...).
 */
export class ProductRegistry {
    static _instance = null;
    static get instance() {
        if (!ProductRegistry._instance) ProductRegistry._instance = new ProductRegistry();
        return ProductRegistry._instance;
    }

    constructor() {
        this._configs = new Map();
        ProductConfigLoader.load(this);
    }

    register(productType, config) {
        this._configs.set(productType, {
            productType,
            role: config.role || 'draggable',
            category: config.category || 'furniture',
            rules: config.rules || [],
            defaultConfig: config.defaultConfig || {},
            variants: config.variants || {},
            materials: config.materials || {}
        });
    }

    get(productType) { return this._configs.get(productType); }
    getProductTypes() { return [...this._configs.keys()]; }
    getRulesForProduct(productType) { return this.get(productType)?.rules || []; }
    getDefaultConfig(productType) { return { ...(this.get(productType)?.defaultConfig || {}) }; }

    /** Визначає тип продукту за назвою entity. */
    detectProductType(entityName) {
        if (this._configs.has(entityName)) return entityName;
        if (entityName === 'Boat_PC_Config') return 'Boat';
        // Furniture: 'PontoonBench36_Gray' -> базовий тип 'PontoonBench'
        for (const type of this._configs.keys()) {
            if (type !== 'Boat' && entityName.startsWith(type)) return type;
        }
        // fallback: до першого '_'
        const base = entityName.split('_')[0];
        return this._configs.has(base) ? base : null;
    }
}
