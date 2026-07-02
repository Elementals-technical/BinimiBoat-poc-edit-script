import { generateLayoutId } from '../../domain/composition/layout/furniture-layout.mjs';

/**
 * Furniture API — ЦУКОР над setConfiguration (зворотна сумісність з адмінкою).
 * Склад меблів декларативний: єдине джерело правди — FurnitureLayout у конфіг-документі.
 * add/remove редагують масив layout; інстанціюванням займається reconcile-крок CM.
 */
export class FurniturePlugin {
    static create({ app }) {
        const cm = () => app.compositionManager;
        const layout = () => cm().getActiveComposition().getConfigValue('FurnitureLayout') || [];
        return {
            addFurniture: async (type, config = {}) => {
                const id = generateLayoutId(type);
                const element = {
                    id, type,
                    position: config.position ?? { x: 0, z: 0 },
                    rotationY: config.rotationY ?? 0,
                    ...(config.FurnitureColor !== undefined && { color: config.FurnitureColor }),
                    ...(config.Size !== undefined && { size: config.Size })
                };
                await cm().setConfiguration({ FurnitureLayout: [...layout(), element] });
                return id;
            },
            removeFurniture: (id) =>
                cm().setConfiguration({ FurnitureLayout: layout().filter(el => el.id !== id) }),
            setFurnitureConfig: (id, patch) => cm().setProductConfig(id, patch),
            // групова зміна (напр. колір усіх меблів): setFurnitureConfigBatch({role:'draggable'}, {FurnitureColor:'Beige'})
            setFurnitureConfigBatch: (selector, patch) => cm().setProductConfigBatch(selector, patch),
            getFurnitureConfig: (id) => cm().getActiveComposition().getProduct(id),
            getFurnitureLayout: () => layout(),
            getDeckPlane: () => cm().getActiveComposition().getResource('DeckPlane')
        };
    }
}
