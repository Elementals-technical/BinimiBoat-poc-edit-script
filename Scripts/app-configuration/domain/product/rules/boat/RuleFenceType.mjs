import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { BOAT_ATTRIBUTES } from '../../attributes/attributes-catalog.mjs';

/**
 * Variant-правило типу забору (Front/Back).
 * Значення атрибута = ім'я entity, яку треба enable; сіблінги (інші option-значення) → disable.
 * (Rules1 рядки 1-10; токени з attributes-catalog.)
 */
export class RuleFenceType extends BaseProductRule {
    constructor() {
        super({ name: 'RuleFenceType', watchAttributes: ['FenceTypeFront', 'FenceTypeBack'], priority: 20 });
    }

    execute({ changes }) {
        if ('FenceTypeFront' in changes) this._apply('FenceTypeFront', changes.FenceTypeFront);
        if ('FenceTypeBack' in changes)  this._apply('FenceTypeBack',  changes.FenceTypeBack);
    }

    _apply(attrKey, value) {
        const options = BOAT_ATTRIBUTES[attrKey].values.map(o => o.value);
        for (const entName of options) this._setEnabled(entName, entName === value);
    }

    _setEnabled(name, on) {
        const e = this.entity.findByName(name);
        if (e) e.enabled = on;
    }
}
