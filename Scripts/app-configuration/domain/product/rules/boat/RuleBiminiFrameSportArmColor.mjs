import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { LoggerService } from '../../../../services/logger/logger-service.mjs';
import { MaterialService } from '../../../../services/material/material-service.mjs';

/**
 * Applies Bimini frame and sport-arm materials.
 * SportArmColor owns TentS_* nodes and is reapplied after frame changes.
 */
export class RuleBiminiFrameSportArmColor extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleBiminiFrameSportArmColor',
            watchAttributes: ['BiminiFrameColor', 'SportArmColor'],
            priority: 35
        });

        this.frameRows = [
            { entityName: 'TentO_Tubes', materials: { Black: 'black parts', Silver: 'pontoon_steel_blur_BoatM' } },
            { entityName: 'TentC_Tubes', materials: { Black: 'black parts', Silver: 'pontoon_steel_blur_BoatM' } },
            { entityName: 'TentC_Connector', materials: { Black: 'black parts', Silver: 'Chrome_BoatM' } },
            { entityName: 'TentO_Connector', materials: { Black: 'black parts', Silver: 'Chrome_BoatM' } },
            { entityName: 'TentC_Bolt', materials: { Black: 'black parts', Silver: 'Chrome_BoatM' } },
            { entityName: 'TentO_Bolt', materials: { Black: 'black parts', Silver: 'Chrome_BoatM' } },
            { entityName: 'TentE_Chrome', materials: { Black: 'black parts', Silver: 'Chrome_BoatM' } }
        ];

        this.sportArmRows = [
            { entityName: 'TentS_Aluminium', materials: { Black: 'black parts', Silver: 'pontoon_steel_blur_BoatM' } },
            { entityName: 'TentS_Chrome', materials: { Black: 'black parts', Silver: 'pontoon_steel_blur_BoatM' } }
        ];
    }

    async execute({ changes, currentState }) {
        if ('BiminiFrameColor' in changes) {
            await this._applyRows(this.frameRows, this._readState(currentState, 'BiminiFrameColor'));
        }

        if ('SportArmColor' in changes || 'BiminiFrameColor' in changes) {
            await this._applyRows(this.sportArmRows, this._readState(currentState, 'SportArmColor'));
        }
    }

    _readState(state, key) {
        return typeof state?.get === 'function' ? state.get(key) : state?.[key];
    }

    async _applyRows(rows, color) {
        if (!color) return;

        for (const { entityName, materials } of rows) {
            const materialName = materials[color];
            if (!materialName) continue;

            const targets = SceneEntityHelper.collectByNames(this.entity, [entityName]);
            if (!targets.length) {
                LoggerService.warn(this, `[RuleBiminiFrameSportArmColor] target "${entityName}" not found`);
                continue;
            }

            try {
                await MaterialService.applyMaterialByName(materialName, targets);
            } catch (error) {
                LoggerService.warn(this,
                    `[RuleBiminiFrameSportArmColor] ${entityName}: material "${materialName}" failed:`,
                    error?.message || error);
            }
        }
    }
}
