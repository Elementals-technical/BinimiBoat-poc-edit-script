import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';

/**
 * Variant furniture: розмір лавки (Size: 30/36/50) — enable потрібного меша.
 *
 * `withCup` ВИДАЛЕНО (мертвий код): варіант «з чашкою/без» виражений окремими
 * типами Corner3232 / Corner3232Wcup; перемикання = зміна `type` елемента
 * FurnitureLayout, reconciler свапне entity (CONFIGURATION_CONCEPT.md §4).
 */
export class RuleFurnitureVariant extends BaseProductRule {
    constructor() {
        super({ name: 'RuleFurnitureVariant', watchAttributes: ['Size'], priority: 20 });
    }

    execute({ changes, currentState }) {
        const variants = currentState.variantMeshes; // { '30': 'Bench30_EXP', '36': 'Bench_36_EXP', ... }
        if (!variants) return;
        const key = String(changes.Size ?? currentState.Size);
        for (const [k, meshName] of Object.entries(variants)) {
            const e = this.entity.findByName(meshName);
            if (e) e.enabled = (k === key);
        }
    }
}
