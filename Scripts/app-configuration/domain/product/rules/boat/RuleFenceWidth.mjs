import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { SceneTransformHelper } from '../../../../helpers/scene-transform-helper.mjs';
import { KeyframeHelper } from '../../../../helpers/keyframe-helper.mjs';
import bindings from '../../parametric/bindings.mjs';

/**
 * RuleFenceWidth — ширина забору (86…100", lerp). Rules1 рядки 45-66.
 *
 * Логіка (3 binding-и):
 *   - fenceWstretch: центральні панелі/труби всіх варіантів переднього забору
 *     (*_front_center_plane, *_front_center_tube) → StretchX 0…0.1778 м;
 *   - move_w_neg: праві секції (*_right усіх варіантів front/back + fence_unip_right)
 *     → MoveX 0…-0.1778 м (права стінка назовні);
 *   - move_w_pos: ліві секції (*_left) → MoveX 0…+0.1778 м (ліва назовні).
 *
 * Move-осі композяться в SceneTransformHelper.setLocalOffset — не затирають
 * Z-зсуви цих же entity від RuleFenceLength.
 */
export class RuleFenceWidth extends BaseProductRule {
    constructor() {
        super({ name: 'RuleFenceWidth', watchAttributes: ['FenceWidth'], priority: 10 });
        this._config = bindings.dimensions.FenceWidth; // дані з Rules1 (єдине джерело)
    }

    execute({ changes }) {
        const value = changes.FenceWidth;
        for (const b of this._config.bindings) {
            const v = KeyframeHelper.interpolate(b.keyframes, value, this._config.mode);
            for (const entity of SceneEntityHelper.collectByNames(this.entity, b.targets)) {
                SceneTransformHelper.applyTransformFn(entity, b.fn, v);
            }
        }
    }
}
