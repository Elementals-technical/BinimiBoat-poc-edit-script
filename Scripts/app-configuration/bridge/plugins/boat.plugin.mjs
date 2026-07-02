/**
 * Boat API — ТОНКИЙ делегат. Уся логіка в CompositionManager.setProductConfig.
 * Bridge не читає/не мутує store, не викликає rules/aggregation напряму.
 */
export class BoatPlugin {
    static create({ app }) {
        const cm = () => app.compositionManager;
        const BOAT_ID = 'Boat_PC_Config';
        return {
            // patch: { DeckLength?, DeckWidth?, FenceLength?, FenceWidth?, FrontIndent?,
            //          FenceTypeFront?, FenceTypeBack?, DeckColor?, FenceColor? }
            setBoatConfig: (patch) => cm().setProductConfig(BOAT_ID, patch),
            getBoatConfig: () => cm().getActiveComposition().getProduct(BOAT_ID)
        };
    }
}
