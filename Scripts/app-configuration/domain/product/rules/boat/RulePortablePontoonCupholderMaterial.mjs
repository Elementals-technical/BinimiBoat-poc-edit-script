import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { LoggerService } from '../../../../services/logger/logger-service.mjs';
import { MaterialService } from '../../../../services/material/material-service.mjs';
import materialTable from '../../parametric/rockport-furniture-materials.mjs';
import { PORTABLE_PONTOON_CUPHOLDER_CLONE_MARKER } from './RulePortablePontoonCupholder.mjs';

/**
 * Applies Rockport furniture color materials to portable pontoon cupholder clones.
 */
export class RulePortablePontoonCupholderMaterial extends BaseProductRule {
    constructor() {
        super({
            name: 'RulePortablePontoonCupholderMaterial',
            watchAttributes: ['RockportFurnitureColor', 'LayoutRockportSeries', 'PortablePontoonCupholder'],
            priority: 42
        });
    }

    async execute({ currentState }) {
        const color = this._readState(currentState, 'RockportFurnitureColor') || 'Grey';
        const clones = this._collectCupholderClones();

        for (const clone of clones) await this._applyMaterials(clone, color);
    }

    _collectCupholderClones() {
        return SceneEntityHelper.collectByPredicate(
            this.app.root,
            entity => entity[PORTABLE_PONTOON_CUPHOLDER_CLONE_MARKER] === true
        );
    }

    async _applyMaterials(clone, color) {
        const assignments = materialTable.CupHolder || [];
        for (const assignment of assignments) {
            const target = clone.findByName(assignment.node);
            if (!target) {
                LoggerService.warn(this,
                    `[RulePortablePontoonCupholderMaterial] node "${assignment.node}" not found in clone "${clone.name}"`);
                continue;
            }

            const materialName = assignment[color];
            try {
                const material = await MaterialService.loadMaterialWithAo(materialName, assignment.ao);
                MaterialService.applyToEntity(target, material);
            } catch (error) {
                LoggerService.warn(this,
                    `[RulePortablePontoonCupholderMaterial] ${clone.name}/${assignment.node}: `
                    + `"${materialName}"${assignment.ao ? ` + "${assignment.ao}"` : ''} failed:`,
                    error?.message || error);
            }
        }
    }

    _readState(state, key) {
        return typeof state?.get === 'function' ? state.get(key) : state?.[key];
    }
}
