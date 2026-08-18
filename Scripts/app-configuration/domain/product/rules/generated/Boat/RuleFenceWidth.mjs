import { BaseProductRule } from '../../../../../core/rule/base-product-rule.mjs';
import { Vec3 } from 'playcanvas';
import { SceneEntityHelper } from '../../../../../helpers/scene-entity-helper.mjs';
import { SceneTransformHelper } from '../../../../../helpers/scene-transform-helper.mjs';
import { KeyframeHelper } from '../../../../../helpers/keyframe-helper.mjs';
import { LoggerService } from '../../../../../services/logger/logger-service.mjs';
import bindings from '../../../parametric/bindings.mjs';

/** AUTO-GENERATED RULE — DO NOT EDIT MANUALLY */
export const ruleDefinition = Object.freeze({
    id: 'fence-width', version: 1, productTypes: ['Boat'], type: 'stretch', priority: 10,
    watchAttributes: ['FenceWidth'],
    sourceBinding: 'dimensions.FenceWidth',
    conditions: [{ attribute: 'FenceWidth', operator: 'hasChange' }],
    actions: bindings.dimensions.FenceWidth.bindings.map(({ variable, fn, targets, keyframes }) => ({
        type: 'interpolateAndTransform', variable, fn, targetAliases: targets, keyframes
    }))
});

export class RuleFenceWidth extends BaseProductRule {
    constructor() {
        super({ name: 'RuleFenceWidth', watchAttributes: ruleDefinition.watchAttributes, priority: ruleDefinition.priority });
    }

    execute({ changes }) {
        const value = changes.FenceWidth;
        for (const action of ruleDefinition.actions) {
            const transformValue = KeyframeHelper.interpolate(action.keyframes, value, bindings.dimensions.FenceWidth.mode);
            const targets = SceneEntityHelper.collectByNames(this.entity, action.targetAliases);
            if (action.variable === 'fenceWstretch') this._ensureSmartStretch(targets);
            for (const entity of targets) SceneTransformHelper.applyTransformFn(entity, action.fn, transformValue);
        }
    }

    _ensureSmartStretch(entities) {
        for (const entity of entities) {
            if (!entity || entity.script?.smartStretch) continue;
            try {
                if (!entity.script) entity.addComponent('script');
                entity.script.create('smartStretch', { attributes: { margin: new Vec3(0.1, 0.1, 0.1), stretchAmount: new Vec3(0, 0, 0) } });
            } catch (error) {
                LoggerService.warn(this, `[RuleFenceWidth] cannot attach smartStretch to "${entity.name}":`, error?.message || error);
            }
        }
    }
}