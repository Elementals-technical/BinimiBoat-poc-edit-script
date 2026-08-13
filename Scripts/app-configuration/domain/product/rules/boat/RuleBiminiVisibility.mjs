import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';

/**
 * Controls Bimini visibility from installed options and later functional states.
 */
export class RuleBiminiVisibility extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleBiminiVisibility',
            watchAttributes: [
                'AddPowerBimini',
                'AddBiminiExtension',
                'AddSportArmAttachment',
                'ExtendBimini',
                'OpenBimini'
            ],
            priority: 36
        });

        this.visibilityMatrix = [
            {
                entityNames: ['TentOpened'],
                isEnabled: state => state.AddPowerBimini === true && state.OpenBimini === true
            },
            {
                entityNames: ['TentClosed', 'TentСlosed'],
                isEnabled: state => state.AddPowerBimini === true && state.OpenBimini === false
            },
            {
                entityNames: ['TentExtension'],
                isEnabled: state => (
                    state.AddPowerBimini === true
                    && state.AddBiminiExtension === true
                    && state.ExtendBimini === true
                )
            },
            {
                entityNames: ['TentStand'],
                isEnabled: state => (
                    state.AddPowerBimini === true
                    && state.AddSportArmAttachment === true
                )
            }
        ];
    }

    execute({ currentState }) {
        const state = this._readState(currentState);

        for (const row of this.visibilityMatrix) {
            const enabled = row.isEnabled(state);
            for (const entity of SceneEntityHelper.collectByNames(this.entity, row.entityNames)) {
                entity.enabled = enabled;
            }
        }
    }

    _readState(state) {
        const read = key => (typeof state?.get === 'function' ? state.get(key) : state?.[key]);
        return {
            AddPowerBimini: read('AddPowerBimini'),
            AddBiminiExtension: read('AddBiminiExtension'),
            AddSportArmAttachment: read('AddSportArmAttachment'),
            ExtendBimini: read('ExtendBimini'),
            OpenBimini: read('OpenBimini')
        };
    }
}
