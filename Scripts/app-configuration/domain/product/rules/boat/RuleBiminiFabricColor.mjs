import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { LoggerService } from '../../../../services/logger/logger-service.mjs';
import { MaterialService } from '../../../../services/material/material-service.mjs';

/**
 * Applies Fabric Color to existing tent fabric nodes.
 */
export class RuleBiminiFabricColor extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleBiminiFabricColor',
            watchAttributes: ['BiminiFabricColor'],
            priority: 34
        });

        this.fabricTargets = [
            ['TentO_Fabric'],
            ['TentE_Fabric'],
            ['TentC_Close']
        ];
    }

    async execute({ currentState }) {
        const materialName = this._readState(currentState, 'BiminiFabricColor');
        if (!materialName) return;

        await this._applyTargets(this.fabricTargets, materialName);
    }

    _readState(state, key) {
        return typeof state?.get === 'function' ? state.get(key) : state?.[key];
    }

    async _applyTargets(targetsByAliases, materialName) {
        for (const aliases of targetsByAliases) {
            const targets = SceneEntityHelper.collectByNames(this.entity, aliases);
            if (!targets.length) {
                LoggerService.warn(this, `[RuleBiminiFabricColor] target not found: ${aliases.join(' / ')}`);
                continue;
            }

            try {
                await MaterialService.applyMaterialByName(materialName, targets);
            } catch (error) {
                LoggerService.warn(this,
                    `[RuleBiminiFabricColor] material "${materialName}" failed for ${aliases.join(' / ')}:`,
                    error?.message || error);
            }
        }
    }
}
