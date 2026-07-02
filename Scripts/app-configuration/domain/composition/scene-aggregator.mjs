import { LoggerService } from '../../services/logger/logger-service.mjs';

/**
 * Агрегатор міжпродуктової логіки. (Порт з Hasting, спрощений.)
 * Реєструє handlers (composition rules) і виконує їх при змінах,
 * із чергою проти паралельного виконання.
 *
 * У Bimini єдина крос-продуктова логіка — площина палуби:
 *   RuleBuildDeckPlane (продюсить DeckPlane) + RuleClampFurniture (кламп furniture).
 */
export class SceneAggregator {
    constructor(app) {
        this.app = app;
        this._handlers = new Map();
        this._isExecuting = false;
        this._pending = null;
    }

    registerHandler(name, config) {
        this._handlers.set(name, { ...config, enabled: true });
    }

    registerRule(rule) {
        this.registerHandler(rule.name, rule.toHandlerConfig());
    }

    async onProductChanged(compositionId, productId, changes) {
        const handlers = this._relevant(compositionId);
        if (!handlers.length) return;

        if (this._isExecuting) {
            this._pending = { compositionId, productId, changes };
            return;
        }
        this._isExecuting = true;
        try {
            const composition = this.app.compositionManager?.getActiveComposition();
            const shared = { composition, allProducts: composition?.getAllProducts() || {} };
            for (const [name, cfg] of handlers) {
                if (changes && cfg.watchParams?.length) {
                    const relevant = cfg.watchParams.some(p => p in changes);
                    if (!relevant) continue;
                }
                try {
                    const result = cfg.aggregateFn({ [compositionId]: composition }, { compositionId, productId, changes, shared });
                    await cfg.applyFn(result, { app: this.app, compositionId, productId, changes, shared });
                } catch (e) {
                    LoggerService.error(this, `[SceneAggregator] handler "${name}" failed:`, e);
                }
            }
        } finally {
            this._isExecuting = false;
        }
        if (this._pending) {
            const p = this._pending; this._pending = null;
            await this.onProductChanged(p.compositionId, p.productId, p.changes);
        }
    }

    _relevant(compositionId) {
        return Array.from(this._handlers.entries())
            .filter(([, c]) => c.enabled && c.watchCompositions.includes(compositionId));
    }
}
