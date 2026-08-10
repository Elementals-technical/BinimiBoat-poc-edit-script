import { Vec3, math } from 'playcanvas';

const CAMERA_VIEWS = {
    iso: {
        cameraPointName: 'CameraPosISO',
        focusPointName: 'CameraFocusISO'
    },
    front: {
        cameraPointName: 'CameraPosFront',
        focusPointName: 'CameraFocusFront'
    }
};

const easeInOutCubic = (t) => t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Анімує orbit-камеру між визначеними у сцені позиціями та точками фокуса.
 */
export class CameraTransitionService {
    constructor({ orbitCamera, sceneRoot, mouseInput = null, touchInput = null, defaultDuration = 1 }) {
        this._orbitCamera = orbitCamera;
        this._sceneRoot = sceneRoot;
        this._mouseInput = mouseInput;
        this._touchInput = touchInput;
        this._defaultDuration = defaultDuration;

        this._startPivot = new Vec3();
        this._targetPivot = new Vec3();
        this._tmpPivot = new Vec3();
        this._tmpDirection = new Vec3();
        this._isTransitioning = false;
        this._savedInertiaFactor = null;
        this._savedInputState = null;
        this._onComplete = null;
    }

    /**
     * Переходить до ракурсу `iso` або `front`, заданого парою scene entities.
     */
    transitionTo(viewId, options = {}) {
        const view = CAMERA_VIEWS[viewId];
        if (!view) {
            console.warn(`[CameraTransitionService] Unknown camera view: "${viewId}"`);
            return false;
        }

        const cameraPoint = this._sceneRoot.findByName(view.cameraPointName);
        const focusPoint = this._sceneRoot.findByName(view.focusPointName);
        if (!cameraPoint || !focusPoint) {
            console.warn(
                `[CameraTransitionService] Camera points not found: "${view.cameraPointName}" / "${view.focusPointName}"`
            );
            return false;
        }

        const cameraPosition = cameraPoint.getPosition();
        const focusPosition = focusPoint.getPosition();
        const direction = this._tmpDirection.sub2(cameraPosition, focusPosition);
        const distance = direction.length();
        if (distance === 0) {
            console.warn(`[CameraTransitionService] Camera view "${viewId}" has zero distance`);
            return false;
        }

        direction.normalize();
        return this.transitionToValues({
            yaw: Math.atan2(direction.x, direction.z) * math.RAD_TO_DEG,
            pitch: -Math.asin(math.clamp(direction.y, -1, 1)) * math.RAD_TO_DEG,
            distance,
            pivotPoint: focusPosition
        }, options);
    }

    /**
     * Запускає плавний перехід до орбітальних параметрів камери.
     */
    transitionToValues(target, options = {}) {
        const orbit = this._orbitCamera;
        this._startYaw = orbit._yaw;
        this._startPitch = orbit._pitch;
        this._startDistance = orbit._distance;
        this._startPivot.copy(orbit._pivotPoint);

        let yawDelta = target.yaw - this._startYaw;
        yawDelta = ((yawDelta + 180) % 360 + 360) % 360 - 180;

        this._targetYaw = this._startYaw + yawDelta;
        this._targetPitch = target.pitch;
        this._targetDistance = target.distance;
        this._targetPivot.copy(target.pivotPoint);
        this._yawDelta = yawDelta;
        this._duration = options.duration ?? this._defaultDuration;
        this._onComplete = options.onComplete || null;
        this._elapsed = 0;
        this._isTransitioning = true;

        if (!this._savedInputState) {
            this._savedInputState = {
                mouse: this._mouseInput?.enabled,
                touch: this._touchInput?.enabled
            };
        }
        if (this._mouseInput) this._mouseInput.enabled = false;
        if (this._touchInput) this._touchInput.enabled = false;

        if (this._savedInertiaFactor === null) {
            this._savedInertiaFactor = orbit.inertiaFactor;
        }
        orbit.inertiaFactor = 0;
        return true;
    }

    update(dt) {
        if (!this._isTransitioning) return;

        this._elapsed += dt;
        const raw = this._duration > 0 ? Math.min(this._elapsed / this._duration, 1) : 1;
        const t = easeInOutCubic(raw);
        const orbit = this._orbitCamera;

        orbit._targetYaw = this._startYaw + this._yawDelta * t;
        orbit._targetPitch = math.lerp(this._startPitch, this._targetPitch, t);
        orbit._targetDistance = math.lerp(this._startDistance, this._targetDistance, t);
        this._tmpPivot.lerp(this._startPivot, this._targetPivot, t);
        orbit._pivotPoint.copy(this._tmpPivot);

        if (raw >= 1) this._finishTransition();
    }

    cancel() {
        if (!this._isTransitioning) return;
        this._isTransitioning = false;
        this._onComplete = null;
        this._restoreCameraControl();
    }

    get isTransitioning() {
        return this._isTransitioning;
    }

    _finishTransition() {
        const orbit = this._orbitCamera;
        orbit._targetYaw = this._targetYaw;
        orbit._targetPitch = this._targetPitch;
        orbit._targetDistance = this._targetDistance;
        orbit._pivotPoint.copy(this._targetPivot);
        this._isTransitioning = false;
        this._restoreCameraControl();

        const onComplete = this._onComplete;
        this._onComplete = null;
        onComplete?.();
    }

    _restoreCameraControl() {
        if (this._savedInertiaFactor !== null) {
            this._orbitCamera.inertiaFactor = this._savedInertiaFactor;
            this._savedInertiaFactor = null;
        }
        if (this._mouseInput && this._savedInputState?.mouse !== undefined) {
            this._mouseInput.enabled = this._savedInputState.mouse;
        }
        if (this._touchInput && this._savedInputState?.touch !== undefined) {
            this._touchInput.enabled = this._savedInputState.touch;
        }
        this._savedInputState = null;
    }
}
