import { BaseProductRule } from '../../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../../helpers/scene-entity-helper.mjs';
import { LoggerService } from '../../../../../services/logger/logger-service.mjs';
import { MaterialService } from '../../../../../services/material/material-service.mjs';

/**
 * AUTO-GENERATED RULE — DO NOT EDIT MANUALLY
 * Generated from RuleDefinition. The JSON export is the analyzable source
 * snapshot; this class is the PlayCanvas-compatible execution artifact.
 */
export const ruleDefinition = Object.freeze({
    id: 'bimini-fabric-color',
    version: 1,
    productTypes: ['Boat'],
    type: 'material',
    priority: 34,
    watchAttributes: ['BiminiFabricColor'],
    conditions: [{ attribute: 'BiminiFabricColor', operator: 'isTruthy' }],
    actions: [
        { type: 'applyMaterialByName', valueFrom: 'BiminiFabricColor', targetAliases: ['TentO_Fabric'] },
        { type: 'applyMaterialByName', valueFrom: 'BiminiFabricColor', targetAliases: ['TentE_Fabric'] },
        { type: 'applyMaterialByName', valueFrom: 'BiminiFabricColor', targetAliases: ['TentC_Close'] }
    ]
});

export class RuleBiminiFabricColor extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleBiminiFabricColor',
            watchAttributes: ruleDefinition.watchAttributes,
            priority: ruleDefinition.priority
        });
 
        this.fabricTargets = ruleDefinition.actions.map(action => action.targetAliases);
    }

    async execute({ currentState }) {
        debugger
        const materialName = this._readState(currentState, 'BiminiFabricColor');
        if (!materialName) return;
        debugger

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
                    `[RuleBiminiFabricColor] material \"${materialName}\" failed for ${aliases.join(' / ')}:`,
                    error?.message || error);
            }
        }
    }
}