import { LoggerService } from '../../../services/logger/logger-service.mjs';

/**
 * Виконавець правил продукту. (Порт з Hasting.)
 * Реєстрація, сортування за priority, послідовне виконання з чергою.
 */
export class RuleExecutor {
    constructor(context) {
        this.context = context;
        this.rules = [];
        this.isExecuting = false;
        this.executionQueue = [];
    }

    registerRule(rule) {
        rule.initialize(this.context);
        this.rules.push(rule);
        this.rules.sort((a, b) => a.priority - b.priority);
    }

    registerRules(rules) { rules.forEach(r => this.registerRule(r)); }

    async executeRules({ changes, currentState, previousState }) {
        if (this.isExecuting) {
            this.executionQueue.push({ changes, currentState, previousState });
            return;
        }
        this.isExecuting = true;
        try {
            await this._run({ changes, currentState, previousState });
            while (this.executionQueue.length > 0) {
                await this._run(this.executionQueue.shift());
            }
        } finally {
            this.isExecuting = false;
        }
    }

    async _run({ changes, currentState, previousState }) {
        for (const rule of this.rules) {
            try {
                if (!rule.shouldExecute(changes, currentState, previousState)) continue;
                await rule.execute({ changes, currentState, previousState });
            } catch (error) {
                LoggerService.error(this, `[RuleExecutor] Error in rule "${rule.name}":`, error);
            }
        }
    }

    clearRules() { this.rules.forEach(r => r.destroy()); this.rules = []; this.executionQueue = []; }
    destroy() { this.clearRules(); this.context = null; }
}
