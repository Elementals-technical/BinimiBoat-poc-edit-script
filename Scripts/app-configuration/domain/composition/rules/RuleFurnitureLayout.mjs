import { BaseCompositionRule } from './base-composition-rule.mjs';
import { footprintFor, FLOW_GAP } from '../layout/layout-data.mjs';

/**
 * RuleFurnitureLayout — reflow позицій меблів «один за одним» (CONFIGURATION_CONCEPT.md §5).
 *
 * ЧИСТЕ правило: НЕ створює/не видаляє entity. Читає конфіг-документ
 * (FurnitureLayout) + габарити з DeckPlane, обчислює нові позиції auto-елементів
 * із захардкодженого об'єкта даних (layout-data.mjs) і кладе БАЖАНИЙ layout
 * у store як derived-ресурс 'FurnitureLayout:desired'. Структурні мутації
 * робить reconcile-крок CompositionManager.
 *
 * Реагує на: зміну розмірів лодки/забора (reflow наявних елементів)
 * та на прямий запис FurnitureLayout (нормалізація позицій нових елементів).
 * manual-елементи (drag-фаза, майбутнє) reflow оминає.
 */
export class RuleFurnitureLayout extends BaseCompositionRule {
    constructor() {
        super({
            name: 'RuleFurnitureLayout',
            watchCompositions: ['boat'],
            watchParams: ['DeckLength', 'DeckWidth', 'FenceLength', 'FenceWidth', 'FrontIndent',
                          'FurnitureLayout']
        });
    }

    aggregateFn(compositions, context) {
        const composition = context.shared.composition;
        return {
            layout: composition?.getConfigValue('FurnitureLayout') || [],
            plane: composition?.getResource('DeckPlane') || null
        };
    }

    async applyFn({ layout, plane }, context) {
        const composition = context.shared.composition;
        if (!composition) return;

        const IN2M = 0.0254;
        // Межі площини (метри); без DeckPlane reflow не виконуємо — лишаємо позиції як є.
        const halfX = plane ? plane.size.x / 2 : Infinity;
        const halfZ = plane ? plane.size.z / 2 : Infinity;
        const originZ = plane ? plane.origin.z : 0;

        // Потокова розкладка: auto-елементи один за одним уздовж Z, від корми до носа.
        let cursorZ = originZ - halfZ;
        const desired = layout.map(el => {
            if (el.positionMode === 'manual') return { ...el }; // drag-фаза: не чіпаємо

            const fp = footprintFor(el);
            const depth = fp.z * IN2M;
            const gap = FLOW_GAP * IN2M;
            const z = cursorZ + depth / 2;
            cursorZ += depth + gap;

            return {
                ...el,
                position: {
                    x: Math.max(-halfX, Math.min(halfX, el.position?.x || 0)),
                    z: plane ? Math.min(z, originZ + halfZ) : (el.position?.z || 0)
                }
            };
        });

        composition.setResource('FurnitureLayout:desired', desired);
    }
}
