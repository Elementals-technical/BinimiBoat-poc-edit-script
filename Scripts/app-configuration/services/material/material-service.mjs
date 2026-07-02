import { LoggerService } from '../logger/logger-service.mjs';

/**
 * Сервіс для роботи з матеріалами в PlayCanvas. (Порт з Hasting, адаптований під Bimini.)
 *
 * Кешує, завантажує та застосовує матеріали. Не потребує прив'язки до entity.
 * Ініціалізується один раз у SceneManager: MaterialService.init(app).
 *
 * АДАПТАЦІЇ ВІД HASTING:
 * - без auto-discover глобального `pc` (Bimini — ESM; app передається через init);
 * - прибрано SSAO-proxy guard і тригери TriPlanar/MeshBoolean (cabinet-специфіка);
 *   лишився тригер smartStretch (є в Bimini).
 *
 * ПОДІЛ ВІДПОВІДАЛЬНОСТІ: сервіс = пошук asset-а, async-завантаження матеріалу
 * та його ресурсів (текстур), кеш, дедуплікація, застосування до meshInstances.
 * Правила (RuleBoatMaterial, RuleFurnitureColor) — ТОНКІ: знаходять target-entities
 * і викликають loadMaterial / applyToEntity / applyMaterialByName.
 *
 * @example
 * const material = await MaterialService.loadMaterial('Navy');
 * MaterialService.applyToEntity(entity, material);
 * await MaterialService.applyMaterialByName('Deck Grey', [entity1, entity2]);
 */
export class MaterialService {

    /** @type {import('playcanvas').Application|null} */
    static _app = null;

    /** @type {Map<string, object>} Кеш завантажених матеріалів за іменем */
    static _cache = new Map();

    /** @type {Map<string, Promise<object>>} Pending завантаження (дедуплікація) */
    static _pending = new Map();

    /**
     * Ініціалізація сервісу. Викликати один раз при старті (SceneManager).
     * @param {import('playcanvas').Application} app
     */
    static init(app) {
        MaterialService._app = app;
        LoggerService.log(null, '[MaterialService] Initialized');
    }

    /** @private */
    static _getApp() { return MaterialService._app; }

    // ═══════════════════════════════════════════════════════════
    //  STATIC API
    // ═══════════════════════════════════════════════════════════

    /**
     * Завантажує матеріал за іменем. Кешує — повторний виклик повертає кеш;
     * паралельні виклики дедуплікуються одним Promise.
     * @param {string} materialName — ім'я матеріалу (як в PlayCanvas assets)
     * @returns {Promise<object>}
     */
    static loadMaterial(materialName) {
        const app = MaterialService._getApp();
        if (!app) return Promise.reject(new Error('MaterialService: app not set — виклич MaterialService.init(app)'));
        return MaterialService._loadMaterial(materialName);
    }

    /**
     * Завантажує матеріал і застосовує до масиву entities.
     * @param {string} materialName
     * @param {object[]} entities
     * @param {{triggerScripts?: boolean}} [options]
     * @returns {Promise<number>} — кількість оновлених entities
     */
    static async applyMaterialByName(materialName, entities, options = {}) {
        if (!entities || entities.length === 0) return 0;

        const material = await MaterialService.loadMaterial(materialName);
        let appliedCount = 0;
        for (const entity of entities) {
            if (MaterialService.applyToEntity(entity, material, options)) appliedCount++;
        }
        LoggerService.log(null, `[MaterialService] Applied "${materialName}"`, { appliedCount, totalEntities: entities.length });
        return appliedCount;
    }

    /**
     * Застосовує вже завантажений матеріал до entity (render + legacy model).
     * @param {object} entity
     * @param {object} material
     * @param {{triggerScripts?: boolean}} [options]
     * @returns {boolean} — true якщо матеріал було змінено
     */
    static applyToEntity(entity, material, options = {}) {
        const { triggerScripts = true } = options;
        let changed = false;

        if (entity?.render?.meshInstances) {
            entity.render.meshInstances.forEach(mi => { mi.material = material; changed = true; });
        }
        if (entity?.model?.meshInstances) {
            entity.model.meshInstances.forEach(mi => { mi.material = material; changed = true; });
        }

        if (changed && triggerScripts && entity.script) {
            MaterialService._triggerRelatedScripts(entity);
        }
        return changed;
    }

    /**
     * Матеріал з кешу (без завантаження).
     * @returns {object|null}
     */
    static getCached(materialName) {
        return MaterialService._cache.get(materialName) ?? null;
    }

    /**
     * Очищає кеш: конкретний матеріал або весь.
     * @param {string} [materialName]
     */
    static clearCache(materialName) {
        if (materialName) MaterialService._cache.delete(materialName);
        else MaterialService._cache.clear();
    }

    // ═══════════════════════════════════════════════════════════
    //  INTERNAL
    // ═══════════════════════════════════════════════════════════

    /** @private */
    static _loadMaterial(materialName) {
        if (MaterialService._cache.has(materialName)) {
            return Promise.resolve(MaterialService._cache.get(materialName));
        }
        if (MaterialService._pending.has(materialName)) {
            return MaterialService._pending.get(materialName);
        }
        const promise = MaterialService._doLoadMaterial(materialName);
        MaterialService._pending.set(materialName, promise);
        promise.finally(() => MaterialService._pending.delete(materialName));
        return promise;
    }

    /** @private */
    static _doLoadMaterial(materialName) {
        return new Promise((resolve, reject) => {
            const app = MaterialService._getApp();
            const matAsset = app.assets.find(materialName, 'material');

            if (!matAsset) {
                LoggerService.warn(null, `[MaterialService] Material asset not found: "${materialName}"`);
                reject(new Error(`Material asset not found: "${materialName}"`));
                return;
            }

            const settle = (resource) => {
                MaterialService._waitForTextures(resource)
                    .then(material => {
                        MaterialService._cache.set(materialName, material);
                        resolve(material);
                    })
                    .catch(reject);
            };

            if (matAsset.resource) { settle(matAsset.resource); return; }

            app.assets.load(matAsset);
            matAsset.ready((loadedAsset) => {
                const resource = loadedAsset.resource || matAsset.resource;
                if (!resource) {
                    reject(new Error(`Material loaded but resource is null: "${materialName}"`));
                    return;
                }
                settle(resource);
            });
            matAsset.on('error', (err) => {
                LoggerService.warn(null, `[MaterialService] Failed to load: "${materialName}"`, err);
                reject(err);
            });
        });
    }

    /**
     * Чекає, поки текстури матеріалу завантажаться (diffuseMap).
     * @private
     */
    static _waitForTextures(materialResource) {
        return new Promise((resolve) => {
            const diffuseRef = materialResource._assetReferences?.diffuseMap?.asset;
            if (!diffuseRef || diffuseRef.resource) { resolve(materialResource); return; }
            diffuseRef.ready(() => resolve(materialResource));
        });
    }

    /**
     * Тригерить пов'язані скрипти після зміни матеріалу (Bimini: smartStretch).
     * @private
     */
    static _triggerRelatedScripts(entity) {
        if (typeof entity.script.smartStretch?.refreshMaterials === 'function') {
            entity.script.smartStretch.refreshMaterials();
        }
    }
}
