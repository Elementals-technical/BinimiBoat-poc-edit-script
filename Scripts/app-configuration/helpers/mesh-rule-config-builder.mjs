/**
 * Universal builder для конфігів правил такого вигляду: (Порт з Hasting 1:1.)
 * {
 *   breakpoints: [...],
 *   values: {
 *     MeshA: { 25: payload, 35: payload, ... },
 *     MeshB: { ... }
 *   }
 * }
 *
 * Payload — будь-що:
 *  - { x: -0.35 } для stretch
 *  - { y: 0.02 } для move
 *  - { visible: true } або 'Enable' для visibility
 *
 * ⚠️ ІНВАРІАНТ №5 (CLAUDE.md): для РОЗМІРНИХ залежностей Boat основний шлях —
 * parametric/bindings.mjs (data-driven з Rules1), НЕ хардкод у правилі.
 * Builder — для дискретних правил, які не лягають у bindings-формат
 * (breakpoint-visibility, per-mesh дискретні пресети тощо).
 */
export class MeshRuleConfigBuilder {
    constructor(initialMeshes = []) {
        this._breakpoints = [];
        this._valuesByMesh = {};                  // { meshName: { bp: payload } }
        this._pendingMeshes = [...initialMeshes]; // mesh-и, для яких наступний .values()
    }

    /**
     * Статичний конструктор: MeshRuleConfigBuilder.meshes([...])
     * (зворотна сумісність з Hasting-кодом).
     */
    static meshes(meshNames) {
        return new MeshRuleConfigBuilder(meshNames);
    }

    /** Альтернативний вхід без стартових mesh-ів: MeshRuleConfigBuilder.create() */
    static create() {
        return new MeshRuleConfigBuilder();
    }

    /** Спільні breakpoints для всіх mesh-ів. */
    breakpoints(list) {
        this._breakpoints = Array.isArray(list) ? [...list] : [];
        return this;
    }

    /**
     * Група mesh-ів, для яких наступний виклик .values(...) застосує
     * один і той самий набір значень.
     * @example .meshes(['Deck_front','Deck_back']).values({ 168:{z:0}, 384:{z:2.74} })
     */
    meshes(meshNames) {
        this._pendingMeshes = [...meshNames];
        return this;
    }

    /**
     * Один mesh для наступного .values(...)
     * @example .mesh('TopDrawer_Point').values({ 56:{y:0}, 50:{y:-0.03} })
     */
    mesh(meshName) {
        this._pendingMeshes = [meshName];
        return this;
    }

    /**
     * Набір значень (по breakpoints) для поточної групи mesh-ів.
     * Клонить values для КОЖНОГО mesh окремо (без спільних посилань);
     * очищає pending-групу після застосування.
     */
    values(valuesByBreakpoint) {
        if (!this._pendingMeshes || this._pendingMeshes.length === 0) {
            throw new Error(
                'MeshRuleConfigBuilder.values() called without meshes()/mesh(). ' +
                'Спочатку виклич .meshes([...]) або .mesh(name).'
            );
        }
        this._pendingMeshes.forEach((meshName) => {
            this._valuesByMesh[meshName] = MeshRuleConfigBuilder._cloneValues(valuesByBreakpoint);
        });
        this._pendingMeshes = [];
        return this;
    }

    /** Фінальний об'єкт: { breakpoints, values: { MeshA: { bp: payload } } } */
    build() {
        return {
            breakpoints: [...this._breakpoints],
            values: this._valuesByMesh
        };
    }

    /**
     * @private Клонування мапи { breakpoint: payload }:
     * об'єкт → shallow copy; примітив → як є.
     */
    static _cloneValues(values) {
        const out = {};
        Object.keys(values).forEach((key) => {
            const v = values[key];
            out[key] = v && typeof v === 'object' ? { ...v } : v;
        });
        return out;
    }
}
