import { BoundingBox, Vec3 } from 'playcanvas';
import { SceneEntityHelper } from '../../helpers/scene-entity-helper.mjs';

const DIMENSION_COLOR = '#ffffff';
const LINE_GAP = 0.12;
const HEIGHT_GAP = 0.15;

/**
 * Camera-projected Fence rulers rendered in a transparent canvas above PlayCanvas.
 * World-space endpoints follow the Fence AABB; screen-space rendering guarantees
 * that neither the boat nor water can occlude the rulers.
 */
export class FenceDimensionOverlay {
    constructor(app, cameraEntity, fenceNodes) {
        this.app = app;
        this.cameraEntity = cameraEntity;
        this.fenceNodes = fenceNodes;
        this.values = { length: 0, width: 0 };
        this._lastBoundsSource = null;
        this._screen = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
        this._canvas = document.createElement('canvas');
        this._canvas.id = 'fence-dimension-overlay';
        this._canvas.style.cssText = [
            'position:fixed', 'pointer-events:none', 'z-index:9998',
            'background:transparent'
        ].join(';');
        document.body.appendChild(this._canvas);
        this._ctx = this._canvas.getContext('2d');
    }

    setValues(length, width) {
        this.values.length = length;
        this.values.width = width;
        this.update();
    }

    update() {
        if (!this._canvas?.isConnected || !this.cameraEntity?.camera) return;
        const { bounds, frontBounds, source } = this._getFenceBounds();
        if (!bounds) { this._clear(); return; }
        if (source !== this._lastBoundsSource) {
            this._lastBoundsSource = source;
            console.log(`[FenceDimensionOverlay] bounds source: ${source}`, {
                center: bounds.center, halfExtents: bounds.halfExtents
            });
        }

        const sourceCanvas = this.app.graphicsDevice.canvas;
        const rect = sourceCanvas.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.round(rect.width * pixelRatio));
        const height = Math.max(1, Math.round(rect.height * pixelRatio));
        if (this._canvas.width !== width || this._canvas.height !== height) {
            this._canvas.width = width;
            this._canvas.height = height;
        }
        this._canvas.style.left = `${rect.left}px`;
        this._canvas.style.top = `${rect.top}px`;
        this._canvas.style.width = `${rect.width}px`;
        this._canvas.style.height = `${rect.height}px`;

        const ctx = this._ctx;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Attribute values are labels only. Geometry determines the real ruler
        // endpoints after DeckLength, FenceLength, FenceWidth and FrontIndent rules.
        const c = bounds.center;
        const h = bounds.halfExtents;
        const cameraPos = this.cameraEntity.getPosition();
        const y = c.y + h.y + HEIGHT_GAP;
        const lengthZ = cameraPos.z <= c.z
            ? c.z - h.z - LINE_GAP
            : c.z + h.z + LINE_GAP;

        // boat_fence_front is the authoritative moving front edge. The direction
        // from the Fence center to that node tells us which X side is "forward".
        // X is the longitudinal Fence axis in this model; using Z here made the
        // sign oscillate around zero and moved the ruler between opposite sides.
        const frontCenterX = frontBounds?.center.x ?? c.x + h.x;
        const frontDirection = Math.sign(frontCenterX - c.x) || 1;
        const frontOuterX = frontBounds
            ? frontCenterX + frontDirection * frontBounds.halfExtents.x
            : c.x + frontDirection * h.x;
        const widthX = frontOuterX + frontDirection * LINE_GAP;

        const lengthPoints = [
            new Vec3(c.x - h.x, y, lengthZ),
            new Vec3(c.x + h.x, y, lengthZ)
        ];
        const widthPoints = [
            new Vec3(widthX, y, c.z - h.z),
            new Vec3(widthX, y, c.z + h.z)
        ];
        const worldPoints = [...widthPoints, ...lengthPoints];
        for (let i = 0; i < worldPoints.length; i++) {
            this.cameraEntity.camera.worldToScreen(worldPoints[i], this._screen[i]);
            this._screen[i].x *= rect.width / this.app.graphicsDevice.width;
            this._screen[i].y *= rect.height / this.app.graphicsDevice.height;
        }

        this._drawRuler(this._screen[0], this._screen[1], `${this.values.width}"`);
        this._drawRuler(this._screen[2], this._screen[3], `${this.values.length}"`);
    }

    destroy() {
        this._canvas?.remove();
        this._canvas = null;
        this._ctx = null;
    }

    _getFenceBounds() {
        const combined = new BoundingBox();
        let found = false;
        const nodes = this.fenceNodes || {};
        const frontBounds = SceneEntityHelper.traverseAabb(nodes.boat_fence_front);
        for (const node of [nodes.boat_fence_front, nodes.boat_fence_back, nodes.fence_unip]) {
            const bounds = SceneEntityHelper.traverseAabb(node);
            if (!bounds) continue;
            if (!found) {
                combined.copy(bounds);
                found = true;
            } else {
                combined.add(bounds);
            }
        }
        if (found && this._isValidBounds(combined)) {
            return { bounds: combined, frontBounds, source: 'active-product/fence-parts' };
        }
        const hierarchyBounds = SceneEntityHelper.traverseAabb(nodes.hierarchy);
        if (hierarchyBounds && this._isValidBounds(hierarchyBounds)) {
            return { bounds: hierarchyBounds, frontBounds, source: 'active-product/fence-hierarchy' };
        }
        console.warn('[FenceDimensionOverlay] No valid scene bounds found');
        return { bounds: null, frontBounds: null, source: 'none' };
    }

    _isValidBounds(bounds) {
        const values = [
            bounds.center.x, bounds.center.y, bounds.center.z,
            bounds.halfExtents.x, bounds.halfExtents.y, bounds.halfExtents.z
        ];
        return values.every(Number.isFinite)
            && bounds.halfExtents.x > 0
            && bounds.halfExtents.z > 0;
    }

    _drawRuler(a, b, text) {
        const ctx = this._ctx;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy);
        if (length < 2) return;
        const midX = (a.x + b.x) * 0.5;
        const midY = (a.y + b.y) * 0.5;

        ctx.save();
        ctx.strokeStyle = DIMENSION_COLOR;
        ctx.fillStyle = DIMENSION_COLOR;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textGap = ctx.measureText(text).width + 12;
        const gapHalf = Math.min(textGap * 0.5, length * 0.4);
        const ux = dx / length;
        const uy = dy / length;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(midX - ux * gapHalf, midY - uy * gapHalf);
        ctx.moveTo(midX + ux * gapHalf, midY + uy * gapHalf);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        const endpointRadius = 4;
        ctx.beginPath();
        ctx.moveTo(a.x + endpointRadius, a.y);
        ctx.arc(a.x, a.y, endpointRadius, 0, Math.PI * 2);
        ctx.moveTo(b.x + endpointRadius, b.y);
        ctx.arc(b.x, b.y, endpointRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillText(text, midX, midY);
        ctx.restore();
    }

    _clear() {
        this._ctx?.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
}
