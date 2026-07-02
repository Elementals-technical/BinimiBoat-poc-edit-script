import { BaseCompositionRule } from './base-composition-rule.mjs';

/**
 * RuleBuildDeckPlane — продюсить спільний ресурс DeckPlane з габаритів Boat.
 * Це ЄДИНЕ крос-продуктове зчеплення Boat ↔ Furniture (mediator).
 * DeckPlane = usable-прямокутник палуби, зменшений внутрішнім периметром забору.
 */
export class RuleBuildDeckPlane extends BaseCompositionRule {
    constructor() {
        super({
            name: 'RuleBuildDeckPlane',
            watchCompositions: ['boat'],
            watchParams: ['DeckLength', 'DeckWidth', 'FenceLength', 'FenceWidth', 'FrontIndent',
                          'FenceTypeFront', 'FenceTypeBack']
        });
    }

    aggregateFn(compositions, context) {
        const composition = context.shared.composition;
        const boat = composition?.getBoat();
        return boat ? boat.snapshot : null;
    }

    async applyFn(boatSnap, context) {
        if (!boatSnap) return;
        const IN2M = 0.0254;

        // TODO: відкалібрувати origin/inset під реальну геометрію Deck+Fence.
        // Проста модель: площина по палубі, з відступом на товщину забору + front indent.
        const deckLen = (boatSnap.DeckLength ?? 168) * IN2M;
        const deckWid = (boatSnap.DeckWidth ?? 96) * IN2M;
        const fenceInset = 0.10; // м, TODO з габаритів забору
        const frontIndent = (boatSnap.FrontIndent ?? 0) * IN2M;

        const plane = {
            orientation: 'horizontal',
            origin: { x: 0, y: 0, z: frontIndent / 2 },
            size: {
                x: Math.max(0, deckWid - 2 * fenceInset),
                z: Math.max(0, deckLen - 2 * fenceInset - frontIndent)
            },
            updateMode: 'onStart'
        };

        context.shared.composition.setResource('DeckPlane', plane);
        context.app.fire?.('deckPlane:updated', plane);
    }
}
