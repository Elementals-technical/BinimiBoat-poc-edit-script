import { Vec3 } from 'playcanvas';

/**
 * ParametricEngine — data-driven розкладка з bindings.json (згенеровано з Rules1).
 *
 * Кожен binding: { variable, fn: MoveX|MoveZ|StretchX|StretchZ, targets[], keyframes[], mode }.
 * Функція:
 *   - інтерполює значення для поточної дименсії (lerp між keyframes або step-lookup),
 *   - резолвить targets (точні імена або glob '*_center_plane*'),
 *   - застосовує transform: Move* → local position, Stretch* → smartStretch script.
 *
 * SmartStretch вже присутній у проєкті BiminiBoat (на deck-панелях).
 */
export class ParametricEngine {
    /**
     * @param {pc.Entity} rootEntity - корінь продукту Boat (Boat_PC_Config)
     * @param {object} bindings - вміст bindings.json
     */
    constructor(rootEntity, bindings) {
        this.root = rootEntity;
        this.bindings = bindings;
        this._baseCache = new Map(); // name -> {pos: Vec3}
    }

    /** Застосувати одну дименсію (напр. DeckLength=240). */
    applyDimension(dimName, value) {
        const dim = this.bindings.dimensions?.[dimName];
        if (!dim) { console.warn(`[ParametricEngine] Unknown dimension ${dimName}`); return; }
        const mode = dim.mode || 'lerp';
        for (const b of dim.bindings) {
            const v = this._interpolate(b.keyframes, value, mode);
            for (const entity of this._resolveTargets(b.targets)) {
                this._applyTransform(entity, b.fn, v);
            }
        }
    }

    _interpolate(keyframes, x, mode) {
        const kf = [...keyframes].sort((a, b) => a.at - b.at);
        if (mode === 'step') {
            let best = kf[0];
            for (const k of kf) if (x >= k.at) best = k;
            return best.value;
        }
        if (x <= kf[0].at) return kf[0].value;
        if (x >= kf[kf.length - 1].at) return kf[kf.length - 1].value;
        for (let i = 0; i < kf.length - 1; i++) {
            const a = kf[i], b = kf[i + 1];
            if (x >= a.at && x <= b.at) {
                const t = (x - a.at) / (b.at - a.at);
                return a.value + t * (b.value - a.value);
            }
        }
        return kf[0].value;
    }

    _resolveTargets(targets) {
        const out = [];
        const all = [];
        this._collectAll(this.root, all);
        for (const t of targets) {
            if (t.includes('*')) {
                const re = new RegExp('^' + t.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
                for (const e of all) if (re.test(e.name)) out.push(e);
            } else {
                const found = this.root.findByName(t);
                if (found) out.push(found);
            }
        }
        return out;
    }

    _collectAll(entity, acc) {
        acc.push(entity);
        for (const c of entity.children) this._collectAll(c, acc);
    }

    _applyTransform(entity, fn, value) {
        const base = this._base(entity);
        switch (fn) {
            case 'MoveX': entity.setLocalPosition(base.pos.x + value, base.pos.y, base.pos.z); break;
            case 'MoveZ': entity.setLocalPosition(base.pos.x, base.pos.y, base.pos.z + value); break;
            case 'StretchX': this._stretch(entity, 'x', value); break;
            case 'StretchZ': this._stretch(entity, 'z', value); break;
            default: console.warn(`[ParametricEngine] Unknown fn ${fn}`);
        }
    }

    _stretch(entity, axis, amount) {
        const ss = entity.script?.smartStretch;
        if (!ss) { console.warn(`[ParametricEngine] ${entity.name} has no smartStretch`); return; }
        // Очікуваний контракт SmartStretch (як у проєкті BiminiBoat): stretchAmount: Vec3.
        const cur = ss.stretchAmount ? ss.stretchAmount.clone() : new Vec3();
        cur[axis] = amount;
        if (typeof ss.setStretch === 'function') ss.setStretch(cur);
        else ss.stretchAmount = cur;
    }

    _base(entity) {
        if (!this._baseCache.has(entity.name)) {
            this._baseCache.set(entity.name, { pos: entity.getLocalPosition().clone() });
        }
        return this._baseCache.get(entity.name);
    }
}
