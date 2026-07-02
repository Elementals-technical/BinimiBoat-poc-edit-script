import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { MaterialService } from '../../../../services/material/material-service.mjs';
import { LoggerService } from '../../../../services/logger/logger-service.mjs';

/**
 * Колір furniture (Beige/Grey). Замінює дублікати _Gray/_Beige одним продуктом.
 * materialMap: { Beige: {submesh: matName,...}, Grey: {...} } — з Rules1 122-133 (TODO вивести у json).
 *
 * ТОНКЕ правило: пошук/завантаження/кеш/текстури — усе в MaterialService;
 * правило лише знаходить target-entity і викликає сервіс.
 */
export class RuleFurnitureColor extends BaseProductRule {
    constructor() {
        super({ name: 'RuleFurnitureColor', watchAttributes: ['FurnitureColor'], priority: 30 });
    }

    async execute({ changes, currentState }) {
        const color = changes.FurnitureColor;
        const map = currentState.materialMap?.[color];
        if (!map) return;

        for (const [submesh, matName] of Object.entries(map)) {
            const e = this.entity.findByName(submesh);
            if (!e) continue;
            try {
                const material = await MaterialService.loadMaterial(matName);
                MaterialService.applyToEntity(e, material);
            } catch (err) {
                LoggerService.warn(this, `[RuleFurnitureColor] "${matName}" → "${submesh}" failed:`, err?.message || err);
            }
        }
    }
}
