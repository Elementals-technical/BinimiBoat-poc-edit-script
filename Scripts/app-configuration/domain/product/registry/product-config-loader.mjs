import { RuleDeckLength } from '../rules/boat/RuleDeckLength.mjs';
import { RuleDeckWidth } from '../rules/boat/RuleDeckWidth.mjs';
import { RuleFenceLength } from '../rules/boat/RuleFenceLength.mjs';
import { RuleFenceWidth } from '../rules/boat/RuleFenceWidth.mjs';
import { RuleFrontIndent } from '../rules/boat/RuleFrontIndent.mjs';
import { RuleFenceType } from '../rules/boat/RuleFenceType.mjs';
import { RuleBoatMaterial } from '../rules/boat/RuleBoatMaterial.mjs';
import { RuleFurniturePresetLayout } from '../rules/boat/RuleFurniturePresetLayout.mjs';
import { RuleRockportFurnitureMaterial } from '../rules/boat/RuleRockportFurnitureMaterial.mjs';
import { RuleFurnitureColor } from '../rules/furniture/RuleFurnitureColor.mjs';
import { RuleFurnitureVariant } from '../rules/furniture/RuleFurnitureVariant.mjs';
import { defaultsForRole } from '../attributes/attributes-catalog.mjs';

/**
 * Дефолтні конфіги продуктів Bimini. Дефолти беруться з attributes-catalog (єдине джерело).
 */
export class ProductConfigLoader {
    static load(registry) {
        // ---- BOAT (platform-parametric) ----
        registry.register('Boat', {
            role: 'platform-parametric',
            category: 'boat',
            rules: [RuleDeckLength, RuleDeckWidth, RuleFenceLength, RuleFenceWidth, RuleFrontIndent,
                    RuleFenceType, RuleBoatMaterial, RuleFurniturePresetLayout, RuleRockportFurnitureMaterial],
            defaultConfig: { role: 'platform-parametric', type: 'Boat', ...defaultsForRole('platform-parametric', 'Boat') }
        });

        // ---- FURNITURE (draggable) ----
        const furniture = [
            'ChaiseLoungeLeft', 'ChaiseLoungeRight', 'Corner3232', 'Corner3232Wcup',
            'FlipFlopBench', 'HelmStand', 'RockportHelms', 'BucketSeat',
            'PontoonLeftArm', 'PontoonRightArm', 'CupHolder'
        ];
        for (const type of furniture) {
            registry.register(type, {
                role: 'draggable',
                category: 'furniture',
                rules: [RuleFurnitureColor, RuleFurnitureVariant],
                defaultConfig: {
                    role: 'draggable', type,
                    ...defaultsForRole('draggable', type),
                    position: { x: 0, z: 0 }, rotationY: 0, positionMode: 'auto'
                }
            });
        }

        // Bench з розмірними варіантами (Size: 30/36/50 — з каталогу, appliesTo: PontoonBench)
        registry.register('PontoonBench', {
            role: 'draggable',
            category: 'furniture',
            rules: [RuleFurnitureColor, RuleFurnitureVariant],
            defaultConfig: {
                role: 'draggable', type: 'PontoonBench',
                ...defaultsForRole('draggable', 'PontoonBench'), // включає Size: 36
                position: { x: 0, z: 0 }, rotationY: 0, positionMode: 'auto',
                variantMeshes: { '30': 'Bench30_EXP', '36': 'Bench_36_EXP', '50': 'Bench37_EXP' }
            }
        });
    }
}
