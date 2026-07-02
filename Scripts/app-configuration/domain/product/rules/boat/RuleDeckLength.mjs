import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { SceneTransformHelper } from '../../../../helpers/scene-transform-helper.mjs';
import { KeyframeHelper } from '../../../../helpers/keyframe-helper.mjs';
import bindings from '../../parametric/bindings.mjs';

/**
 * RuleDeckLength — довжина деки (168…384", lerp). Rules1 рядки 20-30.
 *
 * Логіка (3 binding-и):
 *   - moove_posD1: boat_fence_moove1 → MoveZ 0…+2.7432 м (передня секція забору вперед);
 *   - moove_negD1: boat_engine → MoveZ 0…-2.7432 м (двигун назад);
 *   - deck_stretch: 8 деко-entity (Deck/Deck_frame/Under_deck/Pontoon front+back)
 *     → StretchZ 0…2.7432 м (розтяжка палуби по довжині через smartStretch).
 *
 * Не конфліктує з RuleDeckWidth: та пише StretchX/ті ж entity — інша вісь.
 */
export class RuleDeckLength extends BaseProductRule {
    constructor() {
        super({ name: 'RuleDeckLength', watchAttributes: ['DeckLength'], priority: 10 });
        this._config = bindings.dimensions.DeckLength; // дані з Rules1 (єдине джерело)
    }

    execute({ changes }) {
        const value = changes.DeckLength;
        for (const b of this._config.bindings) {
            const v = KeyframeHelper.interpolate(b.keyframes, value, this._config.mode);
            for (const entity of SceneEntityHelper.collectByNames(this.entity, b.targets)) {
                SceneTransformHelper.applyTransformFn(entity, b.fn, v);
            }
        }
    }
}
