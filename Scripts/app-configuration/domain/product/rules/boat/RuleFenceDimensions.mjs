import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { FenceDimensionOverlay } from '../../../../services/dimension/FenceDimensionOverlay.mjs';
import { LoggerService } from '../../../../services/logger/logger-service.mjs';

// Single declarative geometry scope for Fence dimensions. Add a root when its
// meshes must affect the rulers; add an exclusion when an auxiliary subtree is
// nested inside one of those roots but is not part of the Fence envelope.
const FENCE_DIMENSION_GEOMETRY = Object.freeze({
    rootNodeNames: ['boat_fence_front', 'boat_fence_back', 'fence_unip'],
    excludedNodeNames: ['Tent'],
    fallbackRootName: 'boat_fence_moove1'
});

/** Displays FenceWidth and FenceLength as camera-facing dimension lines. */
export class RuleFenceDimensions extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleFenceDimensions',
            watchAttributes: ['ShowFenceDimensions', 'FenceLength', 'FenceWidth', 'FrontIndent', 'DeckLength'],
            priority: 100
        });
    }

    execute({ currentState }) {
        if (!currentState.ShowFenceDimensions) {
            this.app.fenceDimensionOverlay?.destroy();
            this.app.fenceDimensionOverlay = null;
            return;
        }

        const camera = this.app.root.findComponent('camera')?.entity;
        if (!camera) {
            LoggerService.warn(this, '[RuleFenceDimensions] Camera not found');
            return;
        }

        // Resolve inside this product instance. app.root.findByName() can return an
        // inactive duplicate/template with the same name and therefore no live AABB.
        const fenceNodes = Object.fromEntries(FENCE_DIMENSION_GEOMETRY.rootNodeNames.map(name => [
            name,
            this.entity.findByName(name)
        ]));
        fenceNodes.hierarchy = this.entity.findByName(FENCE_DIMENSION_GEOMETRY.fallbackRootName);
        if (!fenceNodes.boat_fence_front) {
            LoggerService.warn(this, '[RuleFenceDimensions] boat_fence_front not found in active product');
        }

        const overlay = this.app.fenceDimensionOverlay
            || (this.app.fenceDimensionOverlay = new FenceDimensionOverlay(
                this.app,
                camera,
                fenceNodes,
                FENCE_DIMENSION_GEOMETRY.excludedNodeNames
            ));
        overlay.fenceNodes = fenceNodes;
        overlay.excludedNodeNames = FENCE_DIMENSION_GEOMETRY.excludedNodeNames;
        overlay.setValues(currentState.FenceLength, currentState.FenceWidth);
    }

    destroy() {
        this.app?.fenceDimensionOverlay?.destroy();
        if (this.app) this.app.fenceDimensionOverlay = null;
        super.destroy();
    }
}
