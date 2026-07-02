import { Script } from 'playcanvas';
import { RuleBuildDeckPlane } from '../../composition/rules/RuleBuildDeckPlane.mjs';
import { RuleFurnitureLayout } from '../../composition/rules/RuleFurnitureLayout.mjs';
import { RuleClampFurniture } from '../../composition/rules/RuleClampFurniture.mjs';
import { ProductRegistry } from '../../product/registry/product-registry.mjs';
import { MaterialService } from '../../../services/material/material-service.mjs';
import { DragMovementModule } from '../../../modules/drag-movement/DragMovementModule.mjs';
import { LoggerService } from '../../../services/logger/logger-service.mjs';

/**
 * SceneManager — bootstrap застосунку. (Порт з Hasting, зачищений.)
 * Порядок: CompositionManager → composition rules → drag module.
 * ProductController навішується на кожну product-entity (Boat + Furniture) в редакторі
 * або програмно при інстанціюванні.
 */
export class SceneManager extends Script {
    static scriptName = 'sceneManager';

    initialize() {
        // 0. Сервіси
        MaterialService.init(this.app);

        // 1. CompositionManager (створює стор + aggregator)
        this.entity.script.create('compositionManager');
        const cm = this.app.compositionManager;

        // 2. Composition rules — порядок реєстрації = порядок виконання:
        //    площина → reflow розкладки (пише FurnitureLayout:desired) → кламп
        cm.registerCompositionRule(new RuleBuildDeckPlane());
        cm.registerCompositionRule(new RuleFurnitureLayout());
        cm.registerCompositionRule(new RuleClampFurniture());

        // 3. Сідінг Boat у стор (дефолти з каталогу) — інакше setConfiguration
        //    з boat-ключами не має продукту. Furniture НЕ сідиться — його породжує
        //    reconcile із FurnitureLayout (декларативна модель).
        const boatEntity = this.app.root.findByName('Boat_PC_Config');
        if (boatEntity) {
            cm.addProduct('Boat_PC_Config', ProductRegistry.instance.getDefaultConfig('Boat'));
        } else {
            LoggerService.warn(this, '[SceneManager] Boat_PC_Config entity not found — boat не засіяно');
        }

        // 4. Drag module
        const cameraEntity = this.app.root.findComponent('camera')?.entity;
        this.app.dragModule = new DragMovementModule(this.app, cameraEntity);
        this.app.dragModule.register();

        this.app.sceneManager = this;
        LoggerService.log(this, '[SceneManager] Bootstrapped');
    }
}
