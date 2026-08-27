import { BaseProductRule } from '../../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../../helpers/scene-entity-helper.mjs';
import { LoggerService } from '../../../../../services/logger/logger-service.mjs';
import { MaterialService } from '../../../../../services/material/material-service.mjs';

/**
 * AUTO-GENERATED RULE — DO NOT EDIT MANUALLY
 * Source of truth: RuleDefinition stored by the Rule Editor.
 */
export const ruleDefinition = Object.freeze({
        "id": "bimini-fabric-color",
        "version": 1,
        "productTypes": [
            "Boat"
        ],
        "type": "attributeValueMaterial",
        "priority": 34,
        "watchAttributes": [
            "BiminiFabricColor"
        ],
        "conditions": [
            {
                "attribute": "BiminiFabricColor",
                "operator": "isTruthy"
            }
        ],
        "actions": [
            {
                "type": "applyMaterialByName",
                "valueFrom": "BiminiFabricColor",
                "targetAliases": [
                    "TentO_Fabric"
                ]
            },
            {
                "type": "applyMaterialByName",
                "valueFrom": "BiminiFabricColor",
                "targetAliases": [
                    "TentC_Close1"
                ]
            }
        ]
    });

function reportRuntimeEvent() {}

reportRuntimeEvent('rule-module-loaded', { className: "RuleBiminiFabricColor" });

export class RuleBiminiFabricColor extends BaseProductRule {
    constructor() {
        super({
            name: "RuleBiminiFabricColor",
            watchAttributes: ruleDefinition.watchAttributes,
            priority: ruleDefinition.priority
        });
    }

    async execute({ currentState }) {
        const selectedValue = this._readState(currentState, "BiminiFabricColor");
        if (!selectedValue) return;

        reportRuntimeEvent('rule-execution-started', { selectedValue });
        for (const action of ruleDefinition.actions) {
            await this._applyAction(action, selectedValue);
        }
        reportRuntimeEvent('rule-executed', { selectedValue });
    }

    _readState(state, key) {
        return typeof state?.get === 'function' ? state.get(key) : state?.[key];
    }

    async _applyAction(action, materialName) {
        const aliases = action.targetAliases;
        const targets = SceneEntityHelper.collectByNames(this.entity, aliases);
        const foundAliases = new Set(targets.map((target) => target.name));
        const missingAliases = aliases.filter((alias) => !foundAliases.has(alias));

        if (missingAliases.length) {
            const message = '[' + this.name + '] target not found: ' + missingAliases.join(' / ');
            LoggerService.warn(this, message);
            reportRuntimeEvent('warning', { message, aliases: missingAliases, requestedAliases: aliases, foundCount: targets.length });
        }
        if (!targets.length) {
            return;
        }

        try {
            const appliedCount = await MaterialService.applyMaterialByName(materialName, targets);
            reportRuntimeEvent('action-applied', { materialName, aliases, appliedCount });
        } catch (error) {
            const message = '[' + this.name + '] material "' + materialName + '" failed for ' + aliases.join(' / ') + ': ' + (error?.message || error);
            LoggerService.warn(this, message);
            reportRuntimeEvent('warning', { message, aliases, materialName });
        }
    }
}
