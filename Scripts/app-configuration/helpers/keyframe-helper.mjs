/**
 * KeyframeHelper — інтерполяція значень по keyframes із таблиці Rules1.
 * (Використовується dimension-правилами Boat: RuleDeckLength/Width, RuleFence*, RuleFrontIndent.)
 *
 * keyframes: [{ at: <input-inches>, value: <transform-units> }, ...]
 * mode:
 *   - 'lerp' — лінійна інтерполяція між сусідніми keyframes (безперервні розміри);
 *   - 'step' — дискретний lookup: останній keyframe, чий at <= x (позиції типу 96|102).
 */
export class KeyframeHelper {

    /**
     * @param {{at:number, value:number}[]} keyframes
     * @param {number} x - вхідне значення атрибута (дюйми)
     * @param {'lerp'|'step'} [mode='lerp']
     * @returns {number}
     */
    static interpolate(keyframes, x, mode = 'lerp') {
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
}
