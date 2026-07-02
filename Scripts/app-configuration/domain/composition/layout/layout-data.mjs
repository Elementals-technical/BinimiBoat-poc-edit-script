/**
 * ЗАХАРДКОДЖЕНИЙ об'єкт даних розкладки (тимчасово, CONFIGURATION_CONCEPT.md §5).
 * Пізніше переїде у layouts.json (патерн parametric/bindings.json), коли клієнт
 * підтвердить формат таблиці розкладок і поняття «пакет комплектації» (§7).
 *
 * Одиниці: дюйми (як усі габарити в Rules1); конвертація в метри — на споживачі.
 */

/** Габарити footprint меблів по типах (дюйми): X — поперек палуби, Z — вздовж. */
export const FURNITURE_FOOTPRINTS = {
    // TODO: відкалібрувати за реальними мешами (traverseAabb по шаблонах)
    ChaiseLoungeLeft:  { x: 30, z: 72 },
    ChaiseLoungeRight: { x: 30, z: 72 },
    Corner3232:        { x: 32, z: 32 },
    Corner3232Wcup:    { x: 32, z: 32 },
    FlipFlopBench:     { x: 46, z: 24 },
    HelmStand:         { x: 24, z: 20 },
    RockportHelms:     { x: 26, z: 22 },
    BucketSeat:        { x: 22, z: 22 },
    PontoonLeftArm:    { x: 12, z: 30 },
    PontoonRightArm:   { x: 12, z: 30 },
    CupHolder:         { x: 10, z: 10 },
    PontoonBench:      { x: 24, z: 36 } // z залежить від Size — уточнюється у резолвері
};

/** Зазор між меблями у потоковій розкладці (дюйми). */
export const FLOW_GAP = 6;

/** Footprint елемента layout з урахуванням Size (для PontoonBench). */
export function footprintFor(element) {
    const base = FURNITURE_FOOTPRINTS[element.type] || { x: 24, z: 24 };
    if (element.type === 'PontoonBench' && element.size) {
        return { x: base.x, z: Number(element.size) };
    }
    return base;
}
