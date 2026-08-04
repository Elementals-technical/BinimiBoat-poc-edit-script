import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { LoggerService } from '../../../../services/logger/logger-service.mjs';
import { MaterialService } from '../../../../services/material/material-service.mjs';
import {
    PRESET_FURNITURE_CLONE_MARKER,
    PRESET_FURNITURE_TEMPLATE
} from '../../../../services/furniture/preset-furniture-service.mjs';
import materialTable from '../../parametric/rockport-furniture-materials.mjs';

/** Applies the spreadsheet material/AO mapping only to LayoutRockportSeries clones. */
export class RuleRockportFurnitureMaterial extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleRockportFurnitureMaterial',
            watchAttributes: ['RockportFurnitureColor', 'LayoutRockportSeries'],
            priority: 50
        });
    }

    async execute({ currentState }) {
        if ((currentState.LayoutRockportSeries || 'none') === 'none') return;
        const color = currentState.RockportFurnitureColor || 'Grey';
        const root = SceneEntityHelper.findByName(this.app.root, 'FurnitureGroup_Main');
        if (!root) return;

        const clones = this._collectClones(root);
        for (const clone of clones) await this._applyToClone(clone, color);
    }

    _collectClones(root) {
        const result = [];
        const pending = [...(root.children || [])];
        while (pending.length > 0) {
            const entity = pending.pop();
            if (entity[PRESET_FURNITURE_CLONE_MARKER] === true) {
                result.push(entity);
                // A marked clone cannot contain another top-level preset clone.
                continue;
            }
            pending.push(...(entity.children || []));
        }
        return result;
    }

    async _applyToClone(clone, color) {
        const template = clone[PRESET_FURNITURE_TEMPLATE];
        const assignments = materialTable[template];
        if (!assignments) {
            LoggerService.warn(this, `[RockportFurnitureMaterial] no table entry for "${template}"`);
            return;
        }

        for (const assignment of assignments) {
            const target = clone.findByName(assignment.node);
            if (!target) {
                LoggerService.warn(this,
                    `[RockportFurnitureMaterial] node "${assignment.node}" not found in clone "${template}"`);
                continue;
            }
            const materialName = assignment[color];
            try {
                const material = await MaterialService.loadMaterialWithAo(materialName, assignment.ao);
                MaterialService.applyToEntity(target, material);
            } catch (error) {
                LoggerService.warn(this,
                    `[RockportFurnitureMaterial] ${template}/${assignment.node}: `
                    + `"${materialName}"${assignment.ao ? ` + "${assignment.ao}"` : ''} failed:`,
                    error?.message || error);
            }
        }
    }
}
