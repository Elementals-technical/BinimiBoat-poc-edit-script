import { BaseProductRule } from '../../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../../helpers/scene-entity-helper.mjs';
import { SceneTransformHelper } from '../../../../../helpers/scene-transform-helper.mjs';
import { KeyframeHelper } from '../../../../../helpers/keyframe-helper.mjs';
import bindings from '../../../parametric/bindings.mjs';

/** AUTO-GENERATED RULE — DO NOT EDIT MANUALLY */
export const ruleDefinition = Object.freeze({
    id: 'fence-length',
    version: 1,
    productTypes: ['Boat'],
    type: 'stretch',
    priority: 10,
    watchAttributes: ['FenceLength'],
    sourceBinding: 'dimensions.FenceLength',
    conditions: [{ attribute: 'FenceLength', operator: 'hasChange' }],
    actions: bindings.dimensions.FenceLength.bindings.map(({ variable, fn, targets, keyframes }) => ({
        type: 'interpolateAndTransform', variable, fn, targetAliases: targets, keyframes
    }))
});

export class RuleFenceLength extends BaseProductRule {
    constructor() {
        super({ name: 'RuleFenceLength', watchAttributes: ruleDefinition.watchAttributes, priority: ruleDefinition.priority });
    }

    execute({ changes }) {
        const value = changes.FenceLength;
        for (const action of ruleDefinition.actions) {
            const transformValue = KeyframeHelper.interpolate(action.keyframes, value, bindings.dimensions.FenceLength.mode);
            for (const entity of SceneEntityHelper.collectByNames(this.entity, action.targetAliases)) {
                SceneTransformHelper.applyTransformFn(entity, action.fn, transformValue);
            }
        }
    }
}