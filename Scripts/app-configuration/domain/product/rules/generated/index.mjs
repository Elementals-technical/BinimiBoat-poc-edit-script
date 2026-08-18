/**
 * АВТО-ЗГЕНЕРОВАНО `tools/rules-sync.mjs`. НЕ РЕДАГУВАТИ РУКАМИ:
 * файл переписується цілком при кожній синхронізації.
 *
 * Джерело істини — файли `Rule*.mjs` у цій теці. Додати правило: покласти файл
 * сюди й виконати `npm run rules:sync` (дев-сервер робить це сам).
 */
 
import { RuleBiminiFabricColor } from "./Boat/RuleBiminiFabricColor.mjs";
import { RuleBiminiVisibility } from "./Boat/RuleBiminiVisibility.mjs";
import { RuleFenceLength } from "./Boat/RuleFenceLength.mjs";
import { RuleFenceWidth } from "./Boat/RuleFenceWidth.mjs";


export const GENERATED_RULES = Object.freeze({
    Boat: Object.freeze([
        RuleBiminiFabricColor,
        RuleBiminiVisibility,
        RuleFenceWidth,
        RuleFenceLength
    ])
});
 
/** Правила типу продукту або порожній масив — безпечно для типів без генерації. */
export function generatedRulesFor(productType) {
    return GENERATED_RULES[productType] || [];
}

/** Файли, які синхронізація відкинула: причини — `npm run rules:check`. */
export const GENERATED_RULES_SKIPPED = [];

if (GENERATED_RULES_SKIPPED.length > 0) {
    console.warn('[generated-rules] правил відкинуто: ' + GENERATED_RULES_SKIPPED.length, GENERATED_RULES_SKIPPED);
}
