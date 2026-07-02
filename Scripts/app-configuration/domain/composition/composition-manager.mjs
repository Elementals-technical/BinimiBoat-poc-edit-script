import { Script } from 'playcanvas';
import { CompositionStore } from './composition-store.mjs';
import { SceneAggregator } from './scene-aggregator.mjs';
import { ProductRegistry } from '../product/registry/product-registry.mjs';
import { validatePatch, BOAT_ATTRIBUTES } from '../product/attributes/attributes-catalog.mjs';
import { normalizeLayout, diffLayout, elementToPatch } from './layout/furniture-layout.mjs';
import { LoggerService } from '../../services/logger/logger-service.mjs';

/**
 * Центральний оркестратор — ЄДИНА точка зміни стану ("One Way to Change State").
 *
 * Публічний контракт (CONFIGURATION_CONCEPT.md):
 *   - setConfiguration(patch) — ЄДИНИЙ метод зміни: плоский JSON {ключ: значення}.
 *     «Batch» = багато ключів в одному патчі. Shallow-replace по top-level ключу.
 *   - setProductConfig / setProductConfigBatch — ЦУКОР над setConfiguration
 *     (зворотна сумісність з адмінкою; нову логіку сюди не додавати).
 *
 * Пайплайн (гарантований порядок, все тут):
 *   1. validate     — за attributes-catalog
 *   2. store        — конфіг-документ + снапшоти
 *   3. product rules
 *   4. composition rules (чисті: обчислюють derived — DeckPlane, FurnitureLayout:desired)
 *   5. reconcile    — ЄДИНЕ місце структурних мутацій (create/remove/update інстансів)
 *
 * Приватні методи (_writeSnapshot, _runProductRules, _fireAggregation, _reconcile)
 * НЕ викликаються ззовні.
 */
export class CompositionManager extends Script {
    static scriptName = 'compositionManager';

    initialize() {
        CompositionManager.instance = this;
        this.app.compositionManager = this;
        this._composition = new CompositionStore('boat', 'bimini');
        this.aggregator = new SceneAggregator(this.app);
        LoggerService.log(this, '[CompositionManager] Initialized');
    }

    getActiveComposition() { return this._composition; }
    registerCompositionRule(rule) { this.aggregator.registerRule(rule); }

    // ── структура (використовується bootstrap-ом та reconcile; НЕ публічний шлях зміни) ──
    addProduct(productId, snapshot) { this._composition.addProduct(productId, snapshot); }
    removeProduct(productId) { this._composition.removeProduct(productId); }

    // ═══════════════ ЄДИНИЙ ПАЙПЛАЙН ЗМІНИ КОНФІГУРАЦІЇ ═══════════════

    /**
     * ЄДИНИЙ публічний метод зміни конфігурації.
     * @param {object} rawPatch - плоский JSON: boat-атрибути (DeckLength, FenceColor, ...)
     *                            та/або FurnitureLayout (масив елементів ЦІЛКОМ).
     * @returns {Promise<{success:boolean, changed:string[], rejected:string[],
     *                    placementConflicts:string[], layoutIds:string[]}>}
     */
    async setConfiguration(rawPatch) {
        const changed = [];
        const rejected = [];
        const registry = ProductRegistry.instance;

        // ── розщеплення плоского патча по призначенню ──
        const boatPatch = {};
        let rawLayout;
        for (const [key, value] of Object.entries(rawPatch || {})) {
            if (key === 'FurnitureLayout') rawLayout = value;
            else if (BOAT_ATTRIBUTES[key]) boatPatch[key] = value;
            else { rejected.push(key); LoggerService.warn(this, `[CompositionManager] Unknown config key "${key}"`); }
        }

        // ── 1-3: boat-атрибути (validate → store → product rules) ──
        const boat = this._composition.getBoat();
        const mergedChanges = {};
        if (Object.keys(boatPatch).length) {
            if (!boat) {
                rejected.push(...Object.keys(boatPatch));
                LoggerService.warn(this, '[CompositionManager] No boat product for boat keys');
            } else {
                const { patch: clean, rejected: rej } = validatePatch(boat.snapshot.role, boat.snapshot.type ?? 'Boat', boatPatch);
                rejected.push(...rej);
                if (Object.keys(clean).length) {
                    const previousState = { ...boat.snapshot };
                    const currentState = this._writeSnapshot(boat.id, boat.snapshot, clean);
                    await this._runProductRules(boat.id, { changes: clean, currentState, previousState });
                    changed.push(...Object.keys(clean));
                    Object.assign(mergedChanges, clean);
                }
            }
        }

        // ── 2: FurnitureLayout → конфіг-документ (shallow-replace цілим масивом) ──
        if (rawLayout !== undefined) {
            const { layout, rejected: rejL } = normalizeLayout(rawLayout, registry);
            rejected.push(...rejL);
            this._composition.setConfigValue('FurnitureLayout', layout);
            changed.push('FurnitureLayout');
            mergedChanges.FurnitureLayout = layout;
        }

        if (!changed.length) return { success: true, changed, rejected, placementConflicts: [], layoutIds: this._layoutIds() };

        // ── 4: composition rules один раз (DeckPlane → FurnitureLayout:desired → clamp) ──
        const placementConflicts = await this._fireAggregation(boat?.id ?? 'composition', mergedChanges);

        // ── 5: reconcile (єдине місце структурних мутацій) ──
        await this._reconcile();

        LoggerService.log(this, `[CompositionManager] setConfiguration [${changed.join(', ')}]`);
        return { success: true, changed, rejected, placementConflicts, layoutIds: this._layoutIds() };
    }

    /** Поточний конфіг-документ (boat-атрибути + FurnitureLayout) — для UI/адмінки. */
    getConfiguration() {
        const boat = this._composition.getBoat();
        const out = {};
        if (boat) for (const key of Object.keys(BOAT_ATTRIBUTES)) {
            if (key in boat.snapshot) out[key] = boat.snapshot[key];
        }
        out.FurnitureLayout = this._composition.getConfigValue('FurnitureLayout') || [];
        return out;
    }

    // ═══════════════ ЦУКОР (зворотна сумісність з адмінкою) ═══════════════

    /**
     * ЦУКОР над setConfiguration. Boat → пряма трансляція патча;
     * furniture → мердж у відповідний елемент FurnitureLayout (по стабільному id).
     */
    async setProductConfig(productId, patch) {
        const boat = this._composition.getBoat();
        if (boat && productId === boat.id) {
            const r = await this.setConfiguration(patch);
            return { success: r.success, productId, changed: r.changed, placementConflicts: r.placementConflicts };
        }

        const layout = this._composition.getConfigValue('FurnitureLayout') || [];
        const idx = layout.findIndex(el => el.id === productId);
        if (idx === -1) {
            LoggerService.warn(this, `[CompositionManager] Product "${productId}" not found in FurnitureLayout`);
            return { success: false, productId, changed: [], placementConflicts: [] };
        }
        const next = layout.map((el, i) => i === idx ? this._mergeElementPatch(el, patch) : el);
        const r = await this.setConfiguration({ FurnitureLayout: next });
        return { success: r.success, productId, changed: r.changed, placementConflicts: r.placementConflicts };
    }

    /**
     * ЦУКОР над setConfiguration: той самий патч у групу елементів layout (+boat за потреби).
     */
    async setProductConfigBatch(selector, patch) {
        const ids = this._resolveSelector(selector);
        if (!ids.length) return { success: true, updatedIds: [], placementConflicts: [] };

        const boat = this._composition.getBoat();
        const idSet = new Set(ids);
        const configPatch = {};

        if (boat && idSet.has(boat.id)) Object.assign(configPatch, patch);

        const layout = this._composition.getConfigValue('FurnitureLayout') || [];
        if (layout.some(el => idSet.has(el.id))) {
            configPatch.FurnitureLayout = layout.map(el => idSet.has(el.id) ? this._mergeElementPatch(el, patch) : el);
        }

        const r = await this.setConfiguration(configPatch);
        const updatedIds = ids.filter(id => (boat && id === boat.id) || layout.some(el => el.id === id));
        return { success: r.success, updatedIds, placementConflicts: r.placementConflicts };
    }

    // ═══════════════ приватні кроки пайплайну ═══════════════

    /** @private — мапінг патча атрибутів продукту → поля елемента layout. */
    _mergeElementPatch(el, patch) {
        const next = { ...el };
        if (patch.position !== undefined) next.position = { ...patch.position };
        if (patch.rotationY !== undefined) next.rotationY = patch.rotationY;
        if (patch.positionMode !== undefined) next.positionMode = patch.positionMode;
        if (patch.FurnitureColor !== undefined) next.color = patch.FurnitureColor;
        if (patch.Size !== undefined) next.size = patch.Size;
        return next;
    }

    /** @private */
    _layoutIds() {
        return (this._composition.getConfigValue('FurnitureLayout') || []).map(el => el.id);
    }

    /** @private */
    _writeSnapshot(productId, current, clean) {
        const next = { ...current, ...clean };
        this._composition.addProduct(productId, next);
        return next;
    }

    /** @private */
    async _runProductRules(productId, params) {
        const entity = this.app.root.findByName(productId);
        const controller = entity?.script?.productController;
        if (!controller) {
            LoggerService.warn(this, `[CompositionManager] no ProductController on "${productId}"`);
            return;
        }
        await controller.applyChanges(params);
    }

    /** @private — тригерить composition rules один раз і збирає placement-конфлікти. */
    async _fireAggregation(productId, changes) {
        const conflicts = [];
        const handler = (c) => { conflicts.length = 0; conflicts.push(...(c || [])); };
        this.app.once?.('placement:conflicts', handler);
        await this.aggregator.onProductChanged('boat', productId, changes);
        this.app.off?.('placement:conflicts', handler);
        return conflicts;
    }

    /**
     * @private — крок 5: reconcile. Порівнює бажаний layout (derived-ресурс від
     * RuleFurnitureLayout, fallback — конфіг-документ) із фактичними інстансами
     * і застосовує diff. ЄДИНЕ місце create/remove/update furniture-продуктів.
     */
    async _reconcile() {
        const desired = this._composition.getResource('FurnitureLayout:desired')
            ?? this._composition.getConfigValue('FurnitureLayout');
        if (!desired) return;

        const registry = ProductRegistry.instance;
        const currentById = new Map(this._composition.getFurniture().map(({ id, snapshot }) => [id, snapshot]));
        const { create, remove, update } = diffLayout(desired, currentById);

        for (const id of remove) {
            this._composition.removeProduct(id);
            this.app.root.findByName(id)?.destroy();
        }

        for (const el of create) {
            const def = registry.getDefaultConfig(el.type);
            const { patch: clean } = validatePatch('draggable', el.type, elementToPatch(el));
            const snapshot = { ...def, type: el.type, role: 'draggable', layoutId: el.id, ...clean };
            this._composition.addProduct(el.id, snapshot);
            const entity = this._instantiateFurniture(el, snapshot);
            if (entity) {
                await this._runProductRules(el.id, {
                    changes: { ...snapshot }, currentState: snapshot, previousState: {}
                });
            }
        }

        for (const { element, snapshot } of update) {
            const { patch: clean } = validatePatch('draggable', element.type, elementToPatch(element));
            const changesOnly = {};
            for (const [k, v] of Object.entries(clean)) {
                if (JSON.stringify(snapshot[k]) !== JSON.stringify(v)) changesOnly[k] = v;
            }
            if (!Object.keys(changesOnly).length) continue;
            const previousState = { ...snapshot };
            const currentState = this._writeSnapshot(element.id, snapshot, changesOnly);
            const entity = this.app.root.findByName(element.id);
            if (entity && changesOnly.position) {
                entity.setLocalPosition(changesOnly.position.x, entity.getLocalPosition().y, changesOnly.position.z);
            }
            if (entity && changesOnly.rotationY !== undefined) entity.setLocalEulerAngles(0, changesOnly.rotationY, 0);
            await this._runProductRules(element.id, { changes: changesOnly, currentState, previousState });
        }

        // Конфіг-документ = застосований стан (позиції після reflow) — джерело правди актуальне.
        this._composition.setConfigValue('FurnitureLayout', desired);

        if (create.length || remove.length) {
            LoggerService.log(this, `[CompositionManager] reconcile: +${create.length} / -${remove.length} / ~${update.length}`);
        }
    }

    /**
     * @private — інстанціювання entity дивана: клон прихованого шаблону зі сцени
     * (ім'я шаблону = type), синхронно. Без шаблону — продукт живе лише в store (warn).
     */
    _instantiateFurniture(el, snapshot) {
        const template = this.app.root.findByName(el.type);
        if (!template) {
            LoggerService.warn(this, `[CompositionManager] no template entity "${el.type}" for "${el.id}"`);
            return null;
        }
        const entity = template.clone();
        entity.name = el.id;
        entity.enabled = true;
        entity.setLocalPosition(snapshot.position?.x || 0, template.getLocalPosition().y, snapshot.position?.z || 0);
        entity.setLocalEulerAngles(0, snapshot.rotationY || 0, 0);
        template.parent.addChild(entity);
        if (!entity.script) entity.addComponent('script');
        if (!entity.script.productController) entity.script.create('productController');
        this.app.dragModule?.bind?.(el.id);
        return entity;
    }

    /** @private — резолвить selector у список productId (boat + елементи layout). */
    _resolveSelector(selector = {}) {
        if (Array.isArray(selector.ids) && selector.ids.length) return selector.ids;
        const out = [];
        const boat = this._composition.getBoat();
        if (boat && (!selector.role || selector.role === 'platform-parametric') &&
            (!selector.type || selector.type === 'Boat')) out.push(boat.id);
        const layout = this._composition.getConfigValue('FurnitureLayout') || [];
        for (const el of layout) {
            if ((!selector.role || selector.role === 'draggable') &&
                (!selector.type || selector.type === el.type)) out.push(el.id);
        }
        return out;
    }
}
