import { Vec3 } from 'playcanvas';
import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';
import { KeyframeHelper } from '../../../../helpers/keyframe-helper.mjs';
import { SceneEntityHelper } from '../../../../helpers/scene-entity-helper.mjs';
import { SceneTransformHelper } from '../../../../helpers/scene-transform-helper.mjs';
import { LoggerService } from '../../../../services/logger/logger-service.mjs';

/**
 * Stretches Bimini tent parts in sync with FenceWidth.
 */
export class RuleBiminiFenceWidth extends BaseProductRule {
    constructor() {
        super({
            name: 'RuleBiminiFenceWidth',
            watchAttributes: ['FenceWidth'],
            priority: 11
        });

        this.config = {
            mode: 'lerp',
            fn: 'StretchX',
            keyframes: [
                { at: 86, value: 0 },
                { at: 100, value: 0.1778 }
            ],
            targets: [
                'TentE_Black_M',
                'TentE_Chrome',
                'TentE_Fabric',
                'TentE_Strap',
                'TentO_Bolt',
                'TentO_Buttons',
                'TentO_Connector',
                'TentO_Fabric',
                'TentO_Mount',
                'TentO_PlasticPanel',
                'TentO_Tubes',
                'TentS_Aluminium',
                'TentS_BlackPlastic',
                'TentS_Chrome',
                'TentC_Bolt',
                'TentC_Buttons',
                'TentC_Fabric',
                'TentC_Connector',
                'TentC_Mount',
                'TentC_PlasticPanel',
                'TentC_Tubes'
            ]
        };
    }

    execute({ currentState }) {
        const fenceWidth = this._readState(currentState, 'FenceWidth');
        if (fenceWidth === undefined || fenceWidth === null) return;

        const value = KeyframeHelper.interpolate(this.config.keyframes, fenceWidth, this.config.mode);
        const namedTargets = SceneEntityHelper.collectByNames(this.entity, this.config.targets);
        const stretchTargets = this._resolveMeshTargets(namedTargets);

        this._ensureSmartStretch(stretchTargets);

        for (const entity of stretchTargets) {
            SceneTransformHelper.applyTransformFn(entity, this.config.fn, value);
        }
    }

    _readState(state, key) {
        return typeof state?.get === 'function' ? state.get(key) : state?.[key];
    }

    _resolveMeshTargets(namedTargets) {
        const out = [];
        const seen = new Set();
        const add = entity => {
            if (!entity || seen.has(entity)) return;
            if (this._meshInstanceCount(entity) > 0) {
                out.push(entity);
                seen.add(entity);
            }
        };
        const walk = entity => {
            add(entity);
            for (const child of entity.children || []) walk(child);
        };

        for (const entity of namedTargets) walk(entity);
        return out;
    }

    _meshInstanceCount(entity) {
        return entity?.render?.meshInstances?.length
            ?? entity?.model?.meshInstances?.length
            ?? 0;
    }

    _ensureSmartStretch(entities) {
        for (const entity of entities) {
            if (!entity) continue;
            try {
                if (!entity.script) {
                    entity.addComponent('script');
                }

                let smartStretch = entity.script.smartStretch;
                if (!smartStretch) {
                    const marginData = new Vec3(0.7, 0.1, 0.1) // The data was manually copied from the TentO_PlasticPanel node; there were no restrictions on editing it.  
                    const stretchAmountData = new Vec3(0.7, 0.1, 0.1) // The data was manually copied from the TentO_PlasticPanel node; there were no restrictions on editing it. 
                    
                    smartStretch = entity.script.create('smartStretch', {
                        attributes: {
                            margin: marginData,
                            stretchAmount: stretchAmountData
                        }
                    });
                }

                if (!smartStretch?._basePositions && this._meshInstanceCount(entity) > 0) {
                    smartStretch?._initClone?.();
                }
            } catch (error) {
                LoggerService.warn(this,
                    `[RuleBiminiFenceWidth] cannot attach smartStretch to "${entity.name}":`,
                    error?.message || error);
            }
        }
    }
}
