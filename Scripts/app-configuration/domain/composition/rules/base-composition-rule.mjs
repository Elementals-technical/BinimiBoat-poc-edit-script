/**
 * Базовий клас composition rules. (Порт з Hasting.)
 * Працюють на рівні всієї композиції (міжпродуктова логіка), виконуються після product rules.
 */
export class BaseCompositionRule {
    constructor(config) {
        this.name = config?.name || this.constructor.name;
        this.watchCompositions = config?.watchCompositions || ['boat'];
        this.watchParams = config?.watchParams || [];
        this.enabled = true;
    }

    aggregateFn(compositions, context) {
        throw new Error(`${this.name}: aggregateFn() must be implemented`);
    }

    async applyFn(result, context) {
        throw new Error(`${this.name}: applyFn() must be implemented`);
    }

    toHandlerConfig() {
        return {
            watchCompositions: this.watchCompositions,
            watchParams: this.watchParams,
            aggregateFn: this.aggregateFn.bind(this),
            applyFn: this.applyFn.bind(this)
        };
    }
}
