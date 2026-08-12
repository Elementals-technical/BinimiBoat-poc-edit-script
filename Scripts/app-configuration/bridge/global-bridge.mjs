import { Script } from "playcanvas";
import { CompositionPlugin } from "./plugins/composition.plugin.mjs";
import { BoatPlugin } from "./plugins/boat.plugin.mjs";
import { FurniturePlugin } from "./plugins/furniture.plugin.mjs";
import { ARExportPlugin } from "./plugins/ar-export.plugin.mjs";
import { LoggerService } from "../services/logger/logger-service.mjs";

/**
 * GlobalBridge — єдиний контракт для фронтенду: window.ConfiguratorAPI.
 * (Порт з Hasting, зачищений: тільки Boat + Furniture плагіни.)
 */
export class GlobalBridge extends Script {
  static scriptName = "globalBridge";

  initialize() {
    window.ConfiguratorAPI = {
      ...CompositionPlugin.create({ app: this.app }), // цільовий контракт: setConfiguration
      ...BoatPlugin.create({ app: this.app }), // цукор (сумісність з адмінкою)
      ...FurniturePlugin.create({ app: this.app }), // цукор (сумісність з адмінкою)
      AR: ARExportPlugin.create({ app: this.app, bridge: this }), // AR Export (Plugin)
    };
    this.app.fire("bridge:ready");
    LoggerService.log(this, "[GlobalBridge] ConfiguratorAPI exposed");
  }
}
