import { LoggerService } from '../logger/logger-service.mjs';

/**
 * Сервіс для роботи з матеріалами в PlayCanvas. (Порт з Hasting, адаптований під Bimini.)
 *
 * Кешує, завантажує та застосовує матеріали. Не потребує прив'язки до entity.
 * Ініціалізується один раз у SceneManager: MaterialService.init(app).
 *
 * АДАПТАЦІЇ ВІД HASTING:
 * - без auto-discover глобального `pc` (Bimini — ESM; app передається через init);
 * - прибрано SSAO-proxy guard і MeshBoolean (cabinet-специфіка);
 *   лишились тригери smartStretch + triPlanarMapping (є в Bimini).
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

    static _textureCache = new Map();

    static _variantCache = new Map();

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

    /** Loads a texture asset by its exact PlayCanvas asset name. */
    static loadTexture(textureName) {
        if (!textureName) return Promise.resolve(null);
        if (MaterialService._textureCache.has(textureName)) {
            return Promise.resolve(MaterialService._textureCache.get(textureName));
        }
        const app = MaterialService._getApp();
        if (!app) return Promise.reject(new Error('MaterialService: app not set'));
        const asset = MaterialService._findTextureAsset(textureName);
        if (!asset) return Promise.reject(new Error(`Texture asset not found: "${textureName}"`));
        return new Promise((resolve, reject) => {
            const settle = () => {
                if (!asset.resource) return reject(new Error(`Texture loaded but resource is null: "${textureName}"`));
                MaterialService._textureCache.set(textureName, asset.resource);
                resolve(asset.resource);
            };
            if (asset.resource) { settle(); return; }
            asset.ready(settle);
            asset.once('error', reject);
            app.assets.load(asset);
        });
    }

    /** Returns an isolated material variant with the requested ambient-occlusion texture. */
    static async loadMaterialWithAo(materialName, textureName) {
        if (!textureName) return MaterialService.loadMaterial(materialName);
        const key = `${materialName}\u0000${textureName}`;
        if (MaterialService._variantCache.has(key)) return MaterialService._variantCache.get(key);
        // Load the material first. Missing optional AO must never prevent the
        // requested color material from being applied to the furniture node.
        const source = await MaterialService.loadMaterial(materialName);
        let texture;
        try {
            texture = await MaterialService.loadTexture(textureName);
        } catch (error) {
            LoggerService.warn(null,
                `[MaterialService] Optional AO "${textureName}" unavailable for "${materialName}":`,
                error?.message || error);
            return source;
        }
        const variant = source.clone();
        variant.name = `${source.name || materialName} [AO: ${textureName}]`;
        variant.aoMap = texture;
        variant.update();
        MaterialService._variantCache.set(key, variant);
        return variant;
    }

    /** @private */
    static _findTextureAsset(textureName) {
        const app = MaterialService._getApp();
        const exact = app?.assets?.find(textureName, 'texture');
        if (exact) return exact;

        // Spreadsheet values can be either Editor asset names or source
        // filenames. Compare both forms, ignoring path, case and extension.
        const normalize = value => String(value || '')
            .replace(/\\/g, '/')
            .split('/').pop()
            .replace(/\.[^.]+$/, '')
            .toLowerCase();
        const wanted = normalize(textureName);
        return app?.assets?.list?.().find(asset => asset.type === 'texture' && (
            normalize(asset.name) === wanted
            || normalize(asset.file?.filename) === wanted
            || normalize(asset.file?.url) === wanted
        )) || null;
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
        if (materialName) {
            MaterialService._cache.delete(materialName);
            for (const key of MaterialService._variantCache.keys()) {
                if (key.startsWith(`${materialName}\u0000`)) MaterialService._variantCache.delete(key);
            }
        } else {
            MaterialService._cache.clear();
            MaterialService._textureCache.clear();
            MaterialService._variantCache.clear();
        }
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
     * Тригерить пов'язані скрипти після зміни матеріалу.
     * @private
     */
    static _triggerRelatedScripts(entity) {
        if (typeof entity.script.smartStretch?.refreshMaterials === 'function') {
            entity.script.smartStretch.refreshMaterials();
        }

        const triPlanar = MaterialService._getTriPlanarScript(entity);
        if (!triPlanar) return;

        if (typeof triPlanar.refreshMaterials === 'function') {
            triPlanar.refreshMaterials();
        } else if (typeof triPlanar.applyTriplanar === 'function') {
            triPlanar.applyTriplanar();
        } else if (typeof triPlanar.updateUniforms === 'function') {
            triPlanar.updateUniforms();
        }
    }

    /**
     * PlayCanvas script name у проєкті може бути triPlanarMapping, але лишаємо
     * fallback-и для старих експортів/референсних скриптів.
     * @private
     */
    static _getTriPlanarScript(entity) {
        return entity?.script?.triPlanarMapping
            || entity?.script?.triplanarMapping
            || entity?.script?.TriplanarMapping
            || entity?.script?.triplanarMaterial
            || entity?.script?.TriplanarMaterial
            || null;
    }
}
