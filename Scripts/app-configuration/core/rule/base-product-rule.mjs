/**
 * Базовий клас для всіх правил продукту. (Порт з Hasting 1:1.)
 *
 * Кожне правило реагує на зміни конфігурації продукту, виконує бізнес-логіку
 * і має доступ до PlayCanvas API через context. Виконуються послідовно за priority.
 */
export class BaseProductRule {
    /**
     * @param {{name?:string, watchAttributes?:string[], priority?:number}} config
     */
    constructor(config) {
        this.name = config?.name || this.constructor.name;
        this.watchAttributes = config?.watchAttributes || [];
        this.priority = config?.priority ?? 100;
        this.enabled = true;
        this.context = null;
    }

    /** @param {{app:object, entity:object, productId:string}} context */
    initialize(context) {
        this.context = context;
        this.onInitialize();
    }

    onInitialize() { /* override */ }

    shouldExecute(changes, currentState, previousState) {
        if (!this.enabled) return false;
        if (this.watchAttributes.length === 0) return true;
        return this.watchAttributes.some(attr => attr in changes);
    }

    /** ОБОВʼЯЗКОВО перевизначити. */
    execute({ changes, currentState, previousState }) {
        throw new Error(`Rule "${this.name}" must implement execute()`);
    }

    get app() { return this.context?.app; }
    get entity() { return this.context?.entity; }
    get productId() { return this.context?.productId; }

    destroy() { this.context = null; }
}
