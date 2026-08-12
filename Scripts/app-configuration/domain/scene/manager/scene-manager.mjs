import { Script } from "playcanvas";
import { CompositionManager } from "../../composition/composition-manager.mjs";
import { RuleBuildDeckPlane } from "../../composition/rules/RuleBuildDeckPlane.mjs";
import { RuleFurnitureLayout } from "../../composition/rules/RuleFurnitureLayout.mjs";
import { RuleClampFurniture } from "../../composition/rules/RuleClampFurniture.mjs";
import { ProductRegistry } from "../../product/registry/product-registry.mjs";
import { ProductController } from "../../product/controller/product-controller.mjs";
import { defaultsForRole } from "../../product/attributes/attributes-catalog.mjs";
import { MaterialService } from "../../../services/material/material-service.mjs";
import { DragMovementModule } from "../../../modules/drag-movement/DragMovementModule.mjs";
import { TestUIPanel } from "../../../modules/test-ui/test-ui.mjs";
import { LoggerService } from "../../../services/logger/logger-service.mjs";
import { CameraTransitionService } from "../../../services/camera/camera-transition-service.mjs";
import { ARExportService } from "../../../services/ar-export/index.mjs";

/**
 * SceneManager — bootstrap застосунку. (Порт з Hasting, зачищений.)
 *
 * У РЕДАКТОРІ до Root підключаються лише ДВА скрипти: sceneManager + globalBridge.
 * Усе інше — програмно звідси: CompositionManager, composition rules,
 * сідінг Boat + навішування productController на Boat_PC_Config, drag module.
 * ProductController на furniture-клони навішує reconcile (CompositionManager).
 *
 * Класи скриптів передаються у script.create ЯК КЛАСИ (через import) —
 * не залежимо від реєстрації за іменем/preload порядку.
 */
export class SceneManager extends Script {
  static scriptName = "sceneManager";

  initialize() {
    // 0. Сервіси
    MaterialService.init(this.app);

    // 1. CompositionManager (створює стор + aggregator)
    this.entity.script.create(CompositionManager);
    const cm = this.app.compositionManager;

    // 2. Composition rules — порядок реєстрації = порядок виконання:
    //    площина → reflow розкладки (пише FurnitureLayout:desired) → кламп
    cm.registerCompositionRule(new RuleBuildDeckPlane());
    cm.registerCompositionRule(new RuleFurnitureLayout());
    cm.registerCompositionRule(new RuleClampFurniture());

    // 3. Boat: сідінг у стор (дефолти з каталогу) + програмне навішування
    //    productController. Furniture НЕ сідиться — його породжує reconcile
    //    із FurnitureLayout (декларативна модель).
    const boatEntity = this.app.root.findByName("Boat_PC_Config");
    if (boatEntity) {
      cm.addProduct(
        "Boat_PC_Config",
        ProductRegistry.instance.getDefaultConfig("Boat"),
      );
      if (!boatEntity.script) boatEntity.addComponent("script");
      if (!boatEntity.script.productController)
        boatEntity.script.create(ProductController);
    } else {
      LoggerService.warn(
        this,
        "[SceneManager] Boat_PC_Config entity not found — boat не засіяно",
      );
    }

    // 3.1. Застосувати ДЕФОЛТНИЙ конфіг через пайплайн на першому кадрі
    //      (коли всі скрипти, включно зі smartStretch, вже ініціалізовані).
    //      Без цього правила спрацьовують лише на ЗМІНУ атрибута, і сцена
    //      стартує "як в редакторі" — напр., усі 3 варіанти забору enabled
    //      одночасно, поки користувач не торкнеться FenceType.
    if (boatEntity) {
      this.app.once("update", () => {
        cm.setConfiguration(
          defaultsForRole("platform-parametric", "Boat"),
        ).then((r) =>
          LoggerService.log(
            this,
            "[SceneManager] Default config applied",
            r.changed,
          ),
        );
      });
    }

    // 4. Drag module
    const cameraEntity = this.app.root.findComponent("camera")?.entity;
    this.app.dragModule = new DragMovementModule(this.app, cameraEntity);
    this.app.dragModule.register();

    const cameraScripts = cameraEntity?.script;
    const orbitCamera =
      cameraScripts?.orbitCameraNew || cameraScripts?.orbitCamera;
    if (orbitCamera) {
      this.app.cameraTransitionService = new CameraTransitionService({
        orbitCamera,
        sceneRoot: this.app.root,
        mouseInput: cameraScripts.mouseInputNew || cameraScripts.mouseInput,
        touchInput: cameraScripts.touchInputNew || cameraScripts.touchInput,
      });
    } else {
      LoggerService.warn(
        this,
        "[SceneManager] Orbit camera not found — reset view is unavailable",
      );
    }

    // 5. Тест-режим: ?testui в URL → дефолтна dev-панель усіх атрибутів.
    //    Монтується після bridge:ready (потрібен ConfiguratorAPI) на першому
    //    update (після застосування дефолтного конфіга).
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("testui")
    ) {
      const mountUI = () =>
        this.app.once("update", () => TestUIPanel.mount(this.app));
      if (window.ConfiguratorAPI) mountUI();
      else this.app.once("bridge:ready", mountUI);
    }

    // Initialize AR Export Service
    this.app.arExportService = new ARExportService(this.app);

    this.app.sceneManager = this;
    LoggerService.log(this, "[SceneManager] Bootstrapped");
  }

  update(dt) {
    this.app.cameraTransitionService?.update(dt);
    this.app.fenceDimensionOverlay?.update();
  }
}
