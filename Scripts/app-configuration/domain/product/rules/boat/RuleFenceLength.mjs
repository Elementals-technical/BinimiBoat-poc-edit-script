import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { SceneTransformHelper } from '../../../../helpers/scene-transform-helper.mjs';
import { KeyframeHelper } from '../../../../helpers/keyframe-helper.mjs';
import bindings from '../../parametric/bindings.mjs';

/**
 * RuleFenceLength — довжина забору (96…335", lerp). Rules1 рядки 32-42.
 *
 * Логіка:
 *   - moove_negF1: boat_fence_back + fence_unip → MoveZ 0…-3.0353 м
 *     (round/square back variants НЕ рухаємо окремо, бо це descendants
 *     boat_fence_back; інакше видимий back wall отримує offset двічі);
 *   - fence_stretch: бокові панелі/труби (fence_unip_right/left_plane+tube)
 *     → StretchZ 0…3.0353 м (боковини розтягуються по довжині).
 *   - fence_stretch_recenter: компенсація SmartStretch pivot для боковин.
 */
export class RuleFenceLength extends BaseProductRule {
    constructor() {
        super({ name: 'RuleFenceLength', watchAttributes: ['FenceLength'], priority: 10 });
        this._config = bindings.dimensions.FenceLength; // дані з Rules1 (єдине джерело)
    }

    execute({ changes }) {
        const value = changes.FenceLength;
        for (const b of this._config.bindings) {
            const v = KeyframeHelper.interpolate(b.keyframes, value, this._config.mode);
            for (const entity of SceneEntityHelper.collectByNames(this.entity, b.targets)) {
                SceneTransformHelper.applyTransformFn(entity, b.fn, v);
            }
        }
    }
}
