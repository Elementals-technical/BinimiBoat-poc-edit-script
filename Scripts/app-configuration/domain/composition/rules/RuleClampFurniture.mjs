import { BaseCompositionRule } from './base-composition-rule.mjs';

/**
 * RuleClampFurniture — після зміни DeckPlane ре-кламп кожного Furniture в нові межі.
 * Furniture, що не влазить, потрапляє у placementConflicts.
 */
export class RuleClampFurniture extends BaseCompositionRule {
    constructor() {
        super({
            name: 'RuleClampFurniture',
            watchCompositions: ['boat'],
            watchParams: ['DeckLength', 'DeckWidth', 'FenceLength', 'FenceWidth', 'FrontIndent']
        });
    }

    aggregateFn(compositions, context) {
        return context.shared.composition;
    }

    async applyFn(composition, context) {
        if (!composition) return;
        const plane = composition.getResource('DeckPlane');
        if (!plane) return;

        const halfX = plane.size.x / 2;
        const halfZ = plane.size.z / 2;
        const conflicts = [];

        for (const { id, snapshot } of composition.getFurniture()) {
            const pos = snapshot.position || { x: 0, z: 0 };
            const cx = Math.max(plane.origin.x - halfX, Math.min(plane.origin.x + halfX, pos.x));
            const cz = Math.max(plane.origin.z - halfZ, Math.min(plane.origin.z + halfZ, pos.z));
            if (cx !== pos.x || cz !== pos.z) {
                snapshot.position = { x: cx, z: cz };
                composition.addProduct(id, snapshot);
                const entity = context.app.root.findByName(id);
                entity?.setLocalPosition(cx, entity.getLocalPosition().y, cz);
                if (halfX <= 0 || halfZ <= 0) conflicts.push(id);
            }
        }
        if (conflicts.length) context.app.fire?.('placement:conflicts', conflicts);
    }
}
