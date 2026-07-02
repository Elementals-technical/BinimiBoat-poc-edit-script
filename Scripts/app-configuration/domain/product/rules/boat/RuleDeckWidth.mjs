import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { SceneTransformHelper } from '../../../../helpers/scene-transform-helper.mjs';
import { KeyframeHelper } from '../../../../helpers/keyframe-helper.mjs';
import bindings from '../../parametric/bindings.mjs';

/**
 * RuleDeckWidth — ширина деки (дискретно 96 | 102", mode 'step'). Rules1 рядки 75-85.
 *
 * Логіка (1 binding):
 *   - deck_width_stretch: ті самі 8 деко-entity, що й у RuleDeckLength
 *     → StretchX: 96" → 0, 102" → 0.0762 м.
 *
 * ⚠️ Вісь: у Rules1 колонка підписана StretchZ, але Z займає deck_stretch
 * (довжина) — ширина застосовується по X (виправлено в bindings з нотаткою).
 * Завдяки різним осям stretchAmount довжина і ширина не конфліктують.
 */
export class RuleDeckWidth extends BaseProductRule {
    constructor() {
        super({ name: 'RuleDeckWidth', watchAttributes: ['DeckWidth'], priority: 10 });
        this._config = bindings.dimensions.DeckWidth; // дані з Rules1 (єдине джерело)
    }

    execute({ changes }) {
        const value = changes.DeckWidth;
        for (const b of this._config.bindings) {
            const v = KeyframeHelper.interpolate(b.keyframes, value, this._config.mode); // 'step'
            for (const entity of SceneEntityHelper.collectByNames(this.entity, b.targets)) {
                SceneTransformHelper.applyTransformFn(entity, b.fn, v);
            }
        }
    }
}
