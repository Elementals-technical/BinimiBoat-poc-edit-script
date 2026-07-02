import { Vec3, Plane, Ray } from 'playcanvas';

/**
 * Рахує точку перетину променя камери з горизонтальною DeckPlane.
 * Читає ресурс DeckPlane зі стора (продюсить RuleBuildDeckPlane).
 */
export class DragPlaneCalculator {
    constructor(app) {
        this.app = app;
        this._frozen = null; // заморожена площина на час drag (MVP: onStart)
    }

    freeze() {
        this._frozen = this._current();
        return this._frozen;
    }
    release() { this._frozen = null; }

    _current() {
        return this.app.compositionManager?.getActiveComposition()?.getResource('DeckPlane') || null;
    }

    getPlane() { return this._frozen || this._current(); }

    /**
     * Екранні координати → точка на площині (world).
     * @returns {Vec3|null}
     */
    screenToPlane(camera, screenX, screenY) {
        const plane = this.getPlane();
        if (!plane) return null;
        const from = camera.screenToWorld(screenX, screenY, camera.nearClip);
        const to = camera.screenToWorld(screenX, screenY, camera.farClip);
        const dir = new Vec3().sub2(to, from).normalize();
        const ray = new Ray(from, dir);
        const y = plane.origin.y;
        const pcPlane = new Plane(new Vec3(0, 1, 0), -y);
        const hit = new Vec3();
        if (pcPlane.intersectsRay(ray, hit)) return hit;
        return null;
    }

    /** Кламп world-позиції в межі площини. */
    clamp(pos) {
        const plane = this.getPlane();
        if (!plane) return pos;
        const hx = plane.size.x / 2, hz = plane.size.z / 2;
        pos.x = Math.max(plane.origin.x - hx, Math.min(plane.origin.x + hx, pos.x));
        pos.z = Math.max(plane.origin.z - hz, Math.min(plane.origin.z + hz, pos.z));
        return pos;
    }
}
