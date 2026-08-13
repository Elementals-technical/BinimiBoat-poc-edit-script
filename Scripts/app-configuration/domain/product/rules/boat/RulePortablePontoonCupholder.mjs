import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';

export const PORTABLE_PONTOON_CUPHOLDER_CLONE_MARKER = '__portablePontoonCupholderClone';

/**
 * Controls Portable Pontoon Cupholder positions by Rockport layout and quantity.
 */
export class RulePortablePontoonCupholder extends BaseProductRule {
    constructor() {
        super({
            name: 'RulePortablePontoonCupholder',
            watchAttributes: ['LayoutRockportSeries', 'PortablePontoonCupholder'],
            priority: 41
        });

        this.cupholderMatrix = {
            'cruiser-kit': [
                'CupHolderP_FL1_1',
                'CupHolderP_FR2_1',
                'CupHolderP_BL3_3',
                'CupHolderP_BL3_4',
                'CupHolderP_BL3_5'
            ],
            'explorer-kit': [
                'CupHolderP_FL1_3',
                'CupHolderP_FR2_3',
                'CupHolderP_BL3_6',
                'CupHolderP_BL3_7',
                'CupHolderP_BL3_8'
            ],
            'lounger-kit': [
                'CupHolderP_BL3_1',
                'CupHolderP_BL4_2',
                'CupHolderP_BL3_2',
                'CupHolderP_BL4_1'
            ],
            'voyager-kit': [
                'CupHolderP_FL1_2',
                'CupHolderP_FR2_2',
                'CupHolderP_BL4_3',
                'CupHolderP_BL4_4',
                'CupHolderP_BL4_5'
            ]
        };

        this.allCupholders = [
            ...new Set([
                ...Object.values(this.cupholderMatrix).flat(),
                'CupHolderP_BL3_5',
                'CupHolderP_BL3_8',
                'CupHolderP_BL4_5'
            ])
        ];
    }

    execute({ currentState }) {
        const state = this._readState(currentState);
        const selected = new Set(this._selectedCupholders(state));
        const locators = this._collectCupholderLocators();
        const template = this._findTemplate();

        for (const locator of locators) {
            locator.enabled = true;

            this._clearOwnedClones(locator);

            if (!selected.has(locator.name)) {
                continue;
            }

            if (!template) continue;

            const clone = template.clone();
            clone.name = `PortableCupHolder__${locator.name}`;
            clone[PORTABLE_PONTOON_CUPHOLDER_CLONE_MARKER] = true;
            clone.enabled = false;
            locator.addChild(clone);
            clone.setLocalPosition(0, 0, 0);
            clone.setLocalEulerAngles(0, 0, 0);
            this._normalizeTemplateTransform(clone);
            clone.enabled = true;
        }
    }

    _selectedCupholders(state) {
        const row = this.cupholderMatrix[this._normalizeLayoutKey(state.LayoutRockportSeries)] || [];
        const count = Math.max(0, Math.min(5, Number(state.PortablePontoonCupholder) || 0));
        return row.slice(0, count);
    }

    _collectCupholderLocators() {
        return SceneEntityHelper.collectByNames(this.app.root, this.allCupholders);
    }

    _findTemplate() {
        return SceneEntityHelper.collectByPredicate(
            this.app.root,
            entity => entity.name === 'CupHolder'
                && entity.parent?.name === 'Root'
                && entity[PORTABLE_PONTOON_CUPHOLDER_CLONE_MARKER] !== true
        )[0] || null;
    }

    _collectOwnedClones(locator) {
        return [...(locator.children || [])]
            .filter(child => child[PORTABLE_PONTOON_CUPHOLDER_CLONE_MARKER] === true);
    }

    _clearOwnedClones(locator) {
        for (const clone of this._collectOwnedClones(locator)) clone.destroy();
    }

    _normalizeTemplateTransform(clone) {
        const inner = clone.children?.find(child => child.name === 'CupHolder');
        if (!inner) return;

        inner.setLocalPosition(0, 0, 0);
        inner.setLocalEulerAngles(-90, 0, 0);
        inner.setLocalScale(1, 1, 1);
    }

    _normalizeLayoutKey(value) {
        const aliases = {
            'Cruiser Kit': 'cruiser-kit',
            'Explorer Kit': 'explorer-kit',
            'Lounger Kit': 'lounger-kit',
            'Voyager Kit': 'voyager-kit'
        };
        return aliases[value] || value || 'none';
    }

    _readState(state) {
        const read = key => (typeof state?.get === 'function' ? state.get(key) : state?.[key]);
        return {
            LayoutRockportSeries: read('LayoutRockportSeries') || 'none',
            PortablePontoonCupholder: read('PortablePontoonCupholder') || 0
        };
    }
}
