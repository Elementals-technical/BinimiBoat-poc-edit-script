import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { SceneTransformHelper } from '../../../../helpers/scene-transform-helper.mjs';
import { KeyframeHelper } from '../../../../helpers/keyframe-helper.mjs';
import bindings from '../../parametric/bindings.mjs';

/**
 * RuleFrontIndent — передній відступ забору (0…48", lerp, нелінійний). Rules1 рядки 71-73.
 *
 * Логіка (1 binding):
 *   - move_ind1: boat_fence_moove3 → MoveZ 1.2192 м (indent=0) … 0 м (indent=48) —
 *     передня секція забору відступає від носа. Keyframes piecewise
 *     (0"→1.2192, 1"→1.1938, 47"→0.0254, 48"→0) — збережені всі точки джерела.
 */
export class RuleFrontIndent extends BaseProductRule {
    constructor() {
        super({ name: 'RuleFrontIndent', watchAttributes: ['FrontIndent'], priority: 10 });
        this._config = bindings.dimensions.FrontIndent; // дані з Rules1 (єдине джерело)
    }

    execute({ changes }) {
        const value = changes.FrontIndent;
        for (const b of this._config.bindings) {
            const v = KeyframeHelper.interpolate(b.keyframes, value, this._config.mode);
            for (const entity of SceneEntityHelper.collectByNames(this.entity, b.targets)) {
                SceneTransformHelper.applyTransformFn(entity, b.fn, v);
            }
        }
    }
}
