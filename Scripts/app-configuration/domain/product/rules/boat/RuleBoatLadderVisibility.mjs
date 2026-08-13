import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';

/**
 * Controls pontoon boat ladder visibility from the ladder option.
 */
export class RuleBoatLadderVisibility extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleBoatLadderVisibility',
            watchAttributes: ['AddSureStepPontoonBoatLadder'],
            priority: 37
        });

        this.visibilityMatrix = [
            {
                entityNames: ['Ladder_SureStep'],
                isEnabled: state => state.AddSureStepPontoonBoatLadder === true
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
            AddSureStepPontoonBoatLadder: read('AddSureStepPontoonBoatLadder')
        };
    }
}
