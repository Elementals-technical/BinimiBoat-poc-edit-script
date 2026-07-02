import { DragPlaneCalculator } from './DragPlaneCalculator.mjs';
import { MovementController } from './MovementController.mjs';
import { LoggerService } from '../../services/logger/logger-service.mjs';

/**
 * DragMovementModule — MVP drag-and-drop для Furniture (з drag-and-droup.md §9).
 *  - одна активна площина (DeckPlane) на сесію;
 *  - freeze площини на pointerDown, clamp+collision на move, sync стану на up.
 * Layers / merge / transition — future extension.
 */
export class DragMovementModule {
    constructor(app, cameraEntity) {
        this.app = app;
        this.camera = cameraEntity?.camera;
        this.planeCalc = new DragPlaneCalculator(app);
        this.mover = new MovementController(app);
        this._session = null;
        this._bindings = new Map(); // productId -> binding
    }

    register() {
        this.app.mouse?.on('mousedown', this._onDown, this);
        this.app.mouse?.on('mousemove', this._onMove, this);
        this.app.mouse?.on('mouseup', this._onUp, this);
        // TouchInput: аналогічно, TODO.
    }

    bind(productId, binding = { handleType: 'productCenter' }) {
        this._bindings.set(productId, { productId, ...binding });
    }

    _onDown(e) {
        const entity = this._pick(e.x, e.y);
        if (!entity) return;
        const productId = this._resolveProductId(entity);
        if (!productId || !this._bindings.has(productId)) return;
        this.planeCalc.freeze();
        this._session = { productId, entity: this.app.root.findByName(productId) };
        LoggerService.log(this, `[Drag] start ${productId}`);
    }

    _onMove(e) {
        if (!this._session) return;
        const world = this.planeCalc.screenToPlane(this.camera, e.x, e.y);
        if (!world) return;
        this.planeCalc.clamp(world);
        this.mover.apply(this._session.entity, world);
    }

    _onUp() {
        if (!this._session) return;
        const { productId, entity } = this._session;
        const p = entity.getLocalPosition();
        // sync стану у стор
        const cm = this.app.compositionManager;
        const snap = cm?.getActiveComposition()?.getProduct(productId);
        if (snap) { snap.position = { x: p.x, z: p.z }; cm.getActiveComposition().addProduct(productId, snap); }
        this.planeCalc.release();
        this._session = null;
        LoggerService.log(this, `[Drag] end ${productId}`);
    }

    _pick(x, y) {
        // TODO: реальний raycast по render-компонентах. Стуб.
        return null;
    }

    _resolveProductId(entity) {
        let e = entity;
        while (e) {
            if (this._bindings.has(e.name)) return e.name;
            e = e.parent;
        }
        return null;
    }
}
