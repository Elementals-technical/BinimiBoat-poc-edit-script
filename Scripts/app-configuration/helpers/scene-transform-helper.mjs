import { Vec3 } from 'playcanvas';
import { LoggerService } from '../services/logger/logger-service.mjs';

/**
 * Універсальний helper сценових трансформацій. (Порт з Hasting, адаптований під Bimini.)
 * Застосовує payload-и MeshRuleConfigBuilder: stretch { x?,y?,z? }, visibility 'Enable'/'Disable'.
 *
 * АДАПТАЦІЇ ВІД HASTING:
 * - import з 'playcanvas' (був битий шлях до playcanvas-stable.min.mjs);
 * - викинуто rebuild MeshBoolean після stretch (cabinet-специфіка, у Bimini немає CSG);
 * - викинуто window.*-дебаг хуки і мертві вирази;
 * - setLocalPosition: базова позиція кешується ОДИН раз (у Hasting перезаписувалась
 *   щовиклику — повторний виклик з тим самим offset давав дрейф).
 */
export class SceneTransformHelper {

    // ===================== STRETCH =====================

    /**
     * Поточний stretch entity.
     * @returns {{x:number, y:number, z:number}|null}
     */
    static getStretch(entity) {
        if (!entity) return null;
        const smartStretch = entity.script?.smartStretch;
        if (!smartStretch) {
            LoggerService.log(this, '[SceneTransformHelper] entity has no smartStretch:', { entityName: entity.name });
            return null;
        }
        const vec = smartStretch.stretchAmount || new Vec3(0, 0, 0);
        return { x: vec.x, y: vec.y, z: vec.z };
    }

    /**
     * Встановити/оновити stretch. Непередані осі НЕ змінюються.
     * @example SceneTransformHelper.setStretch(entity, { x: 0.1 });
     * @returns {{x,y,z}|null} нові значення або null при помилці
     */
    static setStretch(entity, stretchXYZ) {
        if (!entity) return null;
        const smartStretch = entity.script?.smartStretch;
        if (!smartStretch) {
            LoggerService.log(this, '[SceneTransformHelper.setStretch] no smartStretch:', { entityName: entity.name });
            return null;
        }
        const current = smartStretch.stretchAmount || new Vec3(0, 0, 0);
        const next = new Vec3(
            stretchXYZ.x !== undefined ? stretchXYZ.x : current.x,
            stretchXYZ.y !== undefined ? stretchXYZ.y : current.y,
            stretchXYZ.z !== undefined ? stretchXYZ.z : current.z
        );
        if (typeof smartStretch.setStretch === 'function') smartStretch.setStretch(next);
        else smartStretch.stretchAmount = next;
        return { x: next.x, y: next.y, z: next.z };
    }

    // ===================== POSITION =====================

    /** @returns {{x,y,z}|null} локальна позиція */
    static getLocalPosition(entity) {
        if (!entity) return null;
        const pos = entity.getLocalPosition();
        return { x: pos.x, y: pos.y, z: pos.z };
    }

    /**
     * Локальна позиція = базова (кешується один раз) + передані осі.
     * Непередані осі лишаються базовими. Ідемпотентно: повторний виклик
     * з тим самим offset не накопичує дрейф.
     * @param {{x?:number, y?:number, z?:number}} offset
     * @returns {{x,y,z}|null}
     */
    static setLocalPosition(entity, offset) {
        if (!entity) return null;
        if (!entity.__baseLocalPosition) {
            entity.__baseLocalPosition = entity.getLocalPosition().clone();
        }
        const base = entity.__baseLocalPosition;
        const nextX = offset.x !== undefined ? offset.x : base.x;
        const nextY = offset.y !== undefined ? offset.y : base.y;
        const nextZ = offset.z !== undefined ? offset.z : base.z;
        entity.setLocalPosition(nextX, nextY, nextZ);
        return { x: nextX, y: nextY, z: nextZ };
    }

    /**
     * Move з КОМПОЗИЦІЄЮ осей: позиція = базова (кешується один раз) +
     * накопичені offset-и по осях. Різні правила пишуть різні осі одного
     * entity без взаємного затирання (FenceWidth → x, FenceLength → z).
     * @param {{x?:number, y?:number, z?:number}} offset - оновлює лише передані осі
     * @returns {{x,y,z}|null}
     */
    static setLocalOffset(entity, offset) {
        if (!entity) return null;
        if (!entity.__baseLocalPosition) {
            entity.__baseLocalPosition = entity.getLocalPosition().clone();
        }
        if (!entity.__localOffsets) entity.__localOffsets = { x: 0, y: 0, z: 0 };
        const off = entity.__localOffsets;
        if (offset.x !== undefined) off.x = offset.x;
        if (offset.y !== undefined) off.y = offset.y;
        if (offset.z !== undefined) off.z = offset.z;
        const base = entity.__baseLocalPosition;
        entity.setLocalPosition(base.x + off.x, base.y + off.y, base.z + off.z);
        return { x: base.x + off.x, y: base.y + off.y, z: base.z + off.z };
    }

    /**
     * Диспетчер variable function з таблиці Rules1:
     * MoveX/MoveZ → setLocalOffset (композиція), StretchX/StretchZ → setStretch (патч осі).
     * @param {object} entity
     * @param {'MoveX'|'MoveZ'|'StretchX'|'StretchZ'} fn
     * @param {number} value
     */
    static applyTransformFn(entity, fn, value) {
        switch (fn) {
            case 'MoveX': return SceneTransformHelper.setLocalOffset(entity, { x: value });
            case 'MoveZ': return SceneTransformHelper.setLocalOffset(entity, { z: value });
            case 'StretchX': return SceneTransformHelper.setStretch(entity, { x: value });
            case 'StretchZ': return SceneTransformHelper.setStretch(entity, { z: value });
            default:
                LoggerService.log(this, `[SceneTransformHelper] Unknown fn "${fn}"`);
                return null;
        }
    }

    // ===================== VISIBILITY =====================

    /** @returns {boolean|null} */
    static getVisible(entity) {
        return entity ? !!entity.enabled : null;
    }

    /** @returns {boolean|null} фінальний enabled */
    static setVisible(entity, visible) {
        if (!entity) return null;
        entity.enabled = !!visible;
        return entity.enabled;
    }

    /**
     * Visibility за string-станом з таблиці: 'Enable' | 'Disable'.
     * @returns {boolean|null}
     */
    static setVisibleByState(entity, state) {
        if (!entity || !state) return null;
        entity.enabled = (state === 'Enable' || state === true);
        return entity.enabled;
    }

    // ===================== ASYNC =====================

    /**
     * Чекає N кадрів для стабілізації трансформацій (перед читанням AABB тощо).
     * @example await SceneTransformHelper.waitForFrames(2);
     */
    static waitForFrames(frameCount = 2) {
        return new Promise((resolve) => {
            let currentFrame = 0;
            const checkFrame = () => {
                currentFrame++;
                if (currentFrame >= frameCount) resolve();
                else requestAnimationFrame(checkFrame);
            };
            requestAnimationFrame(checkFrame);
        });
    }
}
