/**
 * Застосовує обчислену позицію до продукту + collision (стуб).
 * TODO: collision furniture↔furniture (AABB overlap) → snap/clamp/last-valid.
 */
export class MovementController {
    constructor(app) { this.app = app; }

    apply(entity, worldPos) {
        const parent = entity.parent;
        const local = parent ? parent.getWorldTransform().clone().invert().transformPoint(worldPos) : worldPos;
        entity.setLocalPosition(local.x, entity.getLocalPosition().y, local.z);
    }

    checkCollision(entity, others) {
        // TODO: реальна перевірка перекриття AABB.
        return false;
    }
}
