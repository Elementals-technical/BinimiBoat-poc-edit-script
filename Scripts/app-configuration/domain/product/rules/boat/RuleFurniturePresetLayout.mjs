import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { KeyframeHelper } from '../../../../helpers/keyframe-helper.mjs';
import { PresetFurnitureService } from '../../../../services/furniture/preset-furniture-service.mjs';
import bindings from '../../parametric/bindings.mjs';
import presetLayouts from '../../parametric/preset-furniture-layouts.mjs';

/**
 * Builds a selected furniture preset from scene templates. Dimension changes move
 * only FurnitureGroup_FL1/FR2/BL3/BR4; individual clone transforms stay intact.
 */
export class RuleFurniturePresetLayout extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleFurniturePresetLayout',
            watchAttributes: ['LayoutRockportSeries', 'FenceLength', 'FenceWidth', 'FrontIndent'],
            priority: 40
        });
    }

    onInitialize() {
        this.service = new PresetFurnitureService(this.app, this.entity, presetLayouts);
    }

    execute({ changes, currentState }) {
        const layoutKey = currentState.LayoutRockportSeries || 'none';
        if ('LayoutRockportSeries' in changes) this.service.rebuild(layoutKey);
        const offsets = layoutKey === 'none'
            ? { frontLength: 0, backLength: 0, leftWidth: 0, rightWidth: 0, frontIndent: 0 }
            : this._calculateOffsets(currentState);
        this.service.updateGroupPositions(layoutKey, offsets);
    }

    _calculateOffsets(state) {
        const fenceLength = state.FenceLength ?? presetLayouts.meta.defaultDimensions.FenceLength;
        const fenceWidth = state.FenceWidth ?? presetLayouts.meta.defaultDimensions.FenceWidth;
        const frontIndent = state.FrontIndent ?? presetLayouts.meta.defaultDimensions.FrontIndent;

        const lengthConfig = bindings.dimensions.FenceLength;
        const widthConfig = bindings.dimensions.FenceWidth;
        const indentConfig = bindings.dimensions.FrontIndent;
        const lengthBinding = lengthConfig.bindings.find(b => b.variable === 'moove_negF1');
        const leftBinding = widthConfig.bindings.find(b => b.variable === 'move_w_pos');
        const rightBinding = widthConfig.bindings.find(b => b.variable === 'move_w_neg');
        const indentBinding = indentConfig.bindings.find(b => b.variable === 'move_ind1');

        const backLengthNow = KeyframeHelper.interpolate(lengthBinding.keyframes, fenceLength, lengthConfig.mode);
        const backLengthBase = KeyframeHelper.interpolate(
            lengthBinding.keyframes,
            presetLayouts.meta.defaultDimensions.FenceLength,
            lengthConfig.mode
        );
        const leftWidthNow = KeyframeHelper.interpolate(leftBinding.keyframes, fenceWidth, widthConfig.mode);
        const leftWidthBase = KeyframeHelper.interpolate(
            leftBinding.keyframes,
            presetLayouts.meta.defaultDimensions.FenceWidth,
            widthConfig.mode
        );
        const rightWidthNow = KeyframeHelper.interpolate(rightBinding.keyframes, fenceWidth, widthConfig.mode);
        const rightWidthBase = KeyframeHelper.interpolate(
            rightBinding.keyframes,
            presetLayouts.meta.defaultDimensions.FenceWidth,
            widthConfig.mode
        );
        const indentNow = KeyframeHelper.interpolate(indentBinding.keyframes, frontIndent, indentConfig.mode);
        const indentBase = KeyframeHelper.interpolate(
            indentBinding.keyframes,
            presetLayouts.meta.defaultDimensions.FrontIndent,
            indentConfig.mode
        );

        return {
            frontLength: 0,
            // moove_negF1 is the full back-wall movement along Fence -Z.
            // FurnitureGroup uses +X toward the back, hence the inverted delta.
            backLength: -(backLengthNow - backLengthBase),
            leftWidth: leftWidthNow - leftWidthBase,
            rightWidth: rightWidthNow - rightWidthBase,
            // Increasing indent moves the whole furniture layout toward the back (+X).
            frontIndent: -(indentNow - indentBase)
        };
    }

    destroy() {
        this.service?.clearClones();
        this.service = null;
        super.destroy();
    }
}
