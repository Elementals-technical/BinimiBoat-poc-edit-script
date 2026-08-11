import { BaseProductRule } from '../../../../core/rule/base-product-rule.mjs';

/**
 * Переміщує камеру до ракурсу, вибраного в загальній конфігурації.
 */
export class RuleCameraView extends BaseProductRule {
    constructor() {
        super({ name: 'RuleCameraView', watchAttributes: ['CameraView'], priority: 5 });
    }

    execute({ changes }) {
        if ('CameraView' in changes) {
            this.app.cameraTransitionService?.transitionTo(changes.CameraView);
        }
    }
}
