import { Script } from 'playcanvas';
import { RuleExecutor } from '../rules/rule-executor.mjs';
import { ProductRegistry } from '../registry/product-registry.mjs';
import { LoggerService } from '../../../services/logger/logger-service.mjs';

/**
 * ProductController — скрипт на КОЖНОМУ продукті (Boat + кожен Furniture).
 * (Порт з Hasting.) Створює RuleExecutor і реєструє правила з реєстру за типом.
 */
export class ProductController extends Script {
    static scriptName = 'productController';

    initialize() {
        const productId = this.entity.name;
        const context = { app: this.app, entity: this.entity, productId };
        this.ruleExecutor = new RuleExecutor(context);

        const registry = ProductRegistry.instance;
        const productType = registry.detectProductType(productId);
        if (!productType) {
            LoggerService.warn(this, `[ProductController] Unknown type for "${productId}"`);
            return;
        }
        this.productType = productType;
        const RuleClasses = registry.getRulesForProduct(productType);
        this.ruleExecutor.registerRules(RuleClasses.map(R => new R()));

        LoggerService.log(this, `[ProductController] "${productId}" (${productType}) → ${RuleClasses.length} rules`);
    }

    /** Викликається CompositionManager.updateProduct. */
    async applyChanges({ changes, currentState, previousState }) {
        await this.ruleExecutor.executeRules({ changes, currentState, previousState });
    }
}
