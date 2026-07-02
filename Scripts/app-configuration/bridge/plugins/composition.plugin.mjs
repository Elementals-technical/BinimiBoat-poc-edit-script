/**
 * Composition API — ЦІЛЬОВИЙ публічний контракт (CONFIGURATION_CONCEPT.md §2).
 * ОДИН метод зміни: setConfiguration(patch) — плоский JSON {ключ: значення}.
 * ТОНКИЙ делегат: уся логіка в CompositionManager.
 */
export class CompositionPlugin {
    static create({ app }) {
        const cm = () => app.compositionManager;
        return {
            // patch: { DeckLength?, FenceColor?, ..., FurnitureLayout?: [...] }
            // → { success, changed, rejected, placementConflicts, layoutIds }
            setConfiguration: (patch) => cm().setConfiguration(patch),
            getConfiguration: () => cm().getConfiguration(),
            serializeComposition: () => cm().getActiveComposition().serialize()
        };
    }
}
