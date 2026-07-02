import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { ParametricEngine } from '../../parametric/parametric-engine.mjs';
import bindings from '../../parametric/bindings.mjs';

/**
 * Data-driven параметрика Boat. Замінює десятки хардкод-правил Hasting.
 * Слухає всі 5 дименсій; делегує ParametricEngine (bindings.json з Rules1).
 */
export class RuleParametricDimensions extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleParametricDimensions',
            watchAttributes: ['DeckLength', 'DeckWidth', 'FenceLength', 'FenceWidth', 'FrontIndent'],
            priority: 10
        });
    }

    onInitialize() {
        this._engine = new ParametricEngine(this.entity, bindings);
    }

    execute({ changes }) {
        for (const dim of this.watchAttributes) {
            if (dim in changes) this._engine.applyDimension(dim, changes[dim]);
        }
    }
}
