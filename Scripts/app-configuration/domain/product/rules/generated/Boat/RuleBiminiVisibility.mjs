import { BaseProductRule } from '../../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../../helpers/scene-entity-helper.mjs';

/**
 * AUTO-GENERATED RULE — DO NOT EDIT MANUALLY
 * Generated from RuleDefinition. The JSON export is the analyzable source
 * snapshot; this class is the PlayCanvas-compatible execution artifact.
 */
export const ruleDefinition = Object.freeze({
    id: 'bimini-visibility',
    version: 1,
    productTypes: ['Boat'],
    type: 'visibility',
    priority: 36,
    watchAttributes: [
        'AddPowerBimini',
        'AddBiminiExtension',
        'AddSportArmAttachment',
        'ExtendBimini',
        'OpenBimini'
    ],
    actions: [
        {
            type: 'setEntityEnabled',
            targetAliases: ['TentOpened'],
            when: {
                all: [
                    { attribute: 'AddPowerBimini', operator: 'equals', value: true },
                    { attribute: 'OpenBimini', operator: 'equals', value: true }
                ]
            }
        },
        {
            type: 'setEntityEnabled',
            targetAliases: ['TentClosed', 'TentСlosed'],
            when: {
                all: [
                    { attribute: 'AddPowerBimini', operator: 'equals', value: true },
                    { attribute: 'OpenBimini', operator: 'equals', value: false }
                ]
            }
        },
        {
            type: 'setEntityEnabled',
            targetAliases: ['TentExtension'],
            when: {
                all: [
                    { attribute: 'AddPowerBimini', operator: 'equals', value: true },
                    { attribute: 'AddBiminiExtension', operator: 'equals', value: true },
                    { attribute: 'ExtendBimini', operator: 'equals', value: true }
                ]
            }
        },
        {
            type: 'setEntityEnabled',
            targetAliases: ['TentStand'],
            when: {
                all: [
                    { attribute: 'AddPowerBimini', operator: 'equals', value: true },
                    { attribute: 'AddSportArmAttachment', operator: 'equals', value: true }
                ]
            }
        }
    ]
});

export class RuleBiminiVisibility extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleBiminiVisibility',
            watchAttributes: ruleDefinition.watchAttributes,
            priority: ruleDefinition.priority
        });
    }

    execute({ currentState }) {
        for (const action of ruleDefinition.actions) {
            const enabled = this._matches(currentState, action.when);
            for (const entity of SceneEntityHelper.collectByNames(this.entity, action.targetAliases)) {
                entity.enabled = enabled;
            }
        }
    }

    _matches(state, condition) {
        return condition.all.every(({ attribute, operator, value }) => {
            const actual = typeof state?.get === 'function' ? state.get(attribute) : state?.[attribute];
            return operator === 'equals' && actual === value;
        });
    }
}