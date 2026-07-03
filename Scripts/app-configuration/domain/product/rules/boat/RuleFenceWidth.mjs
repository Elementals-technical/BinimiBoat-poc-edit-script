import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { Vec3 } from 'playcanvas';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { SceneTransformHelper } from '../../../../helpers/scene-transform-helper.mjs';
import { KeyframeHelper } from '../../../../helpers/keyframe-helper.mjs';
import { LoggerService } from '../../../../services/logger/logger-service.mjs';
import bindings from '../../parametric/bindings.mjs';

/**
 * RuleFenceWidth — ширина забору (86…100", lerp). Rules1 рядки 45-66.
 *
 * Логіка (3 binding-и):
 *   - fenceWstretch: центральні панелі/труби front+back варіантів
 *     (*_center_plane, *_center_tube) → StretchX 0…0.3556 м
 *     (SmartStretch amount ×2, бо side-секції рухаються на ±0.1778 м);
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
            const targets = SceneEntityHelper.collectByNames(this.entity, b.targets);
            if (b.variable === 'fenceWstretch') this._ensureSmartStretch(targets);
            for (const entity of targets) {
                SceneTransformHelper.applyTransformFn(entity, b.fn, v);
            }
        }
    }

    _ensureSmartStretch(entities) {
        for (const entity of entities) {
            if (!entity || entity.script?.smartStretch) continue;
            try {
                if (!entity.script) entity.addComponent('script');
                entity.script.create('smartStretch', {
                    attributes: {
                        margin: new Vec3(0.1, 0.1, 0.1),
                        stretchAmount: new Vec3(0, 0, 0)
                    }
                });
            } catch (err) {
                LoggerService.warn(this, `[RuleFenceWidth] cannot attach smartStretch to "${entity.name}":`, err?.message || err);
            }
        }
    }
}
