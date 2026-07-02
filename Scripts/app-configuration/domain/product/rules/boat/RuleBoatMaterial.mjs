import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import bindings from '../../parametric/bindings.mjs';
import { MaterialService } from '../../../../services/material/material-service.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';

/**
 * Матеріали Boat: DeckColor + FenceColor.
 * Значення атрибута = ім'я матеріалу (з attributes-catalog). Список target-entities — з bindings.
 * Використовує batch-API MaterialService (один load, кеш, дедуплікація).
 */
export class RuleBoatMaterial extends BaseProductRule {
    constructor() {
        super({ name: 'RuleBoatMaterial', watchAttributes: ['DeckColor', 'FenceColor'], priority: 30 });
    }

    async execute({ changes }) {
        if ('DeckColor' in changes) {
            const targets = SceneEntityHelper.collectByNames(this.entity, bindings.materials.DeckColor.targets);
            await MaterialService.applyMaterialByName(changes.DeckColor, targets);
        }
        if ('FenceColor' in changes) {
            const targets = this._resolveGlobs(bindings.materials.FenceColor.targetGlobs);
            await MaterialService.applyMaterialByName(changes.FenceColor, targets);
        }
    }

    _resolveGlobs(globs) {
        const regexps = globs.map(g => new RegExp('^' + g.replace(/\*/g, '.*') + '$'));
        return SceneEntityHelper.collectByPredicate(this.entity, en => regexps.some(r => r.test(en.name)));
    }
}
