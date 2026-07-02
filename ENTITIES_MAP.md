# Схема сутностей кодової бази PlayCanvas Hasting

> **131 сутність** у 14 категоріях — повна архітектурна карта проєкту

---

## 1. COMPOSITOR (Система композиції)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 1 | **CompositionManager** | `domain/composition/composition-manager.mjs` | Центральний хаб: композиції, продукти, агрегація, правила |
| 2 | **CompositionStore** | `domain/composition/composition-store.mjs` | Сховище однієї композиції (products, sceneEntities, order) |
| 3 | **SceneAggregator** | `domain/composition/scene-aggregator.mjs` | Міжпродуктові залежності через handlers + shared context |

## 2. SCENE MANAGER (Управління сценою)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 4 | **SceneManager** | `domain/scene/manager/scene-manager.mjs` | Оркестратор: ініціалізація всіх сервісів, CRUD продуктів, камера |
| 5 | **SelectTool** | `domain/scene/tools/SelectTool.mjs` | Вибір entity з outline-підсвічуванням |
| 6 | **DimensionTool** | `domain/scene/tools/DimensionTool.mjs` | Відображення розмірів (Width, Height, Depth) |
| 7 | **SimpleDimensionRenderer** | `domain/scene/tools/DimensionRenderer.mjs` | Рендеринг HTML-лейблів розмірів у 3D-просторі |

## 3. PRODUCTS (Система продуктів)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 8 | **ProductRegistry_V2** | `domain/product/registry/product-registry-v2.mjs` | Центральний реєстр типів продуктів (singleton) |
| 9 | **ProductConfigLoader** | `domain/product/registry/product-config-loader.mjs` | Завантаження конфігурацій всіх типів продуктів |
| 10 | **ProductController** | `domain/product/controller/product-controller.mjs` | PlayCanvas Script на кожній entity — lifecycle продукту |
| 11 | **ProductFactory** | `domain/product/factory/product-factory.mjs` | Фабрика створення entity з шаблонів |
| 12 | **ProductEntityBuilder** | `domain/product/registry/product-entity-builder.mjs` | Збірка мешів за meshConfig (single/composite/variants) |
| 13 | **SubProductManager** | `domain/product/registry/sub-product-manager.mjs` | Батьківсько-дочірні зв'язки (мийка в шафі) |
| 14 | **ProductTagService** | `domain/product/registry/product-tag-service.mjs` | Запити продуктів за тегами |
| 15 | **ProductQueryService** | `domain/product/registry/product-query-service.mjs` | Розширені запити (за типом, категорією, тегами) |
| 16 | **PostCloneHooks** | `domain/product/hooks/post-clone-hooks.mjs` | Ремап посилань MeshBoolean після клонування |
| 17 | **LogicService** | `domain/product/logic/logic-service.mjs` | Deprecated legacy логіка продуктів |
| 18 | **ProductRegistry** | `domain/product/registry/product-registry.mjs` | Deprecated v1 реєстр (замінений на V2) |

## 4. RULES — Product-Level (extends BaseProductRule)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 19 | **BaseProductRule** | `domain/product/rules/base-product-rule.mjs` | Базовий клас: watchAttributes, priority, shouldExecute, execute |
| 20 | **RuleExecutor** | `domain/product/rules/rule-executor.mjs` | Виконання правил за пріоритетом з async чергою |
| — | **CabinetUniBox** | | |
| 21 | RuleScaleWidthCabinetUniBox | `rules/CabinetUniBox/` | Масштабування ширини шафи |
| 22 | RuleScaleHeightCabinetUniBox | `rules/CabinetUniBox/` | Масштабування висоти |
| 23 | RuleScaleDepthCabinetUniBox | `rules/CabinetUniBox/` | Масштабування глибини |
| 24 | RuleHandleVisibility | `rules/CabinetUniBox/` | Видимість ручок |
| 25 | RuleHandleDrawers | `rules/CabinetUniBox/` | Позиціювання та варіанти ручок |
| 26 | RuleVisibleSinkBase | `rules/CabinetUniBox/` | Видимість основи мийки |
| 27 | RuleVisibleSinkCabinet | `rules/CabinetUniBox/` | Видимість шафи-мийки |
| 28 | RuleTypeSlink | `rules/CabinetUniBox/` | Зміна типу мийки |
| 29 | RuleSlinkPosition | `rules/CabinetUniBox/` | Позиціювання мийки |
| — | **OpenShelves** | | |
| 30 | RuleScaleWidthOpenShelves | `rules/OpenShelves/` | Ширина відкритих полиць |
| 31 | RuleScaleHeightOpenShelves | `rules/OpenShelves/` | Висота |
| 32 | RuleScaleDepthOpenShelves | `rules/OpenShelves/` | Глибина |
| — | **UniSideShelves** | | |
| 33 | RuleScaleHeightUniSideShelves | `rules/UniSideShelves/` | Висота бічних полиць |
| 34 | RuleScaleDepthUniSideShelves | `rules/UniSideShelves/` | Глибина |
| — | **Color / Material** | | |
| 35 | RuleChangeCabinetColor | `rules/` | Колір шафи |
| 36 | RuleChangeCountertopColor | `rules/` | Колір стільниці |
| 37 | RuleChangeHandleGrooveColor | `rules/` | Колір канавки ручки |
| 38 | RuleChangeTowelBarColor | `rules/` | Колір рушникотримача |
| 39 | RuleChangeSlinkColor | `rules/Slink/` | Колір мийки |
| — | **Countertop** | | |
| 40 | RuleChangeCountertopHeight | `rules/` | Висота стільниці |
| 41 | RuleChangeCountertopDepth | `rules/` | Глибина стільниці |
| 42 | RuleChangeCountertopPosition | `rules/` | Позиція стільниці |
| — | **SidePanel** | | |
| 43 | RuleChangeSidePanelVariant | `rules/variants/` | Зміна варіанту панелі |
| 44 | RuleChangeSidePanelDepth | `rules/SidePanel/` | Глибина панелі |
| 45 | RuleChangeSidePanelHeight | `rules/SidePanel/` | Висота панелі |
| 46 | RuleChangeCabinetColorSidePanel | `rules/SidePanel/` | Колір панелі = колір шафи |
| 47 | RuleSidePanelOverlayVariant | `rules/variants/` | Оверлей за варіантом |
| 48 | RuleSidePanelOverlayDepth | `rules/SidePanel/` | Глибина оверлею |
| 49 | RuleSidePanelOverlayHeight | `rules/SidePanel/` | Висота оверлею |
| — | **TowelBar** | | |
| 50 | RuleChangeTowelBarVariant | `rules/variants/` | Зміна варіанту рушникотримача |
| 51 | RuleChangeTowelBarHeight | `rules/TowelBar/` | Висота рушникотримача |
| — | **Dividers** | | |
| 52 | RuleDividersTopDrawer | `rules/Dividers/` | Дівайдери верхньої шухляди |
| 53 | RuleDividersTopFullDrawer | `rules/Dividers/` | Дівайдери повної верхньої шухляди |
| 54 | RuleDividersBotDrawer | `rules/Dividers/` | Дівайдери нижньої шухляди |
| — | **Overlay / Texture** | | |
| 55 | RuleGrainDirection | `rules/Overlay/` | Напрям текстури деревини |
| 56 | RuleDrawerPanelFluting | `rules/Overlay/` | Флютинг панелі шухляди |
| 57 | RuleDrawerOverlayLayout | `rules/Overlay/` | Розкладка оверлею шухляди |
| 58 | RuleHandleOverlayVisibility | `rules/Overlay/` | Видимість оверлею ручки |
| — | **Helpers** | | |
| 59 | OverlayRuleHelper | `rules/Overlay/overlay-rule-helper.mjs` | Утиліти для overlay-правил |
| 60 | OverlayTextureConfig | `rules/Overlay/overlay-texture-config.mjs` | Конфігурація текстур оверлеїв |
| — | **Validation** | | |
| 61 | RuleValidateProduct | `rules/` | Валідація конфігурації продукту |

## 5. RULES — Composition-Level (extends BaseCompositionRule)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 62 | **BaseCompositionRule** | `domain/composition/rules/base-composition-rule.mjs` | Базовий клас: aggregateFn + applyFn |
| 63 | RuleCountertopWidth | `composition/rules/` | Розтяг стільниці по ширині шаф |
| 64 | RuleCountertopBooleanCutouts | `composition/rules/` | Boolean-вирізи під мийки |
| 65 | RuleSidePanels | `composition/rules/` | Позиціювання бічних панелей (AABB) |
| 66 | RuleTowelBars | `composition/rules/` | Позиціювання рушникотримачів |
| 67 | RuleChangeBasinStyleMaterial | `composition/rules/` | Матеріал мийки по композиції |
| 68 | RuleHandleStretchForSideShelf | `composition/rules/` | Розтяг ручок для бічних полиць |

## 6. ADDONS (Аддони)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 69 | **AddonManager** | `domain/addons/addon-manager.mjs` | Реєстр та lifecycle всіх аддонів |
| 70 | **AddonStateMachine** | `domain/addons/addon-state-machine.mjs` | Базова стейт-машина (idle → creating → active → updating → removing) |
| 71 | **SidePanelAddon** | `domain/addons/side-panel-addon.mjs` | Бічні панелі L/R, синхронізація з шафою |
| 72 | **TowelBarAddon** | `domain/addons/towel-bar-addon.mjs` | Рушникотримачі L/R, глобальний колір |

## 7. DIVIDERS (Дівайдери)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 73 | **DividerFacade** | `services/drawer-divider/DividerFacade.mjs` | Єдина точка входу (singleton) |
| 74 | **DividerController** | `services/drawer-divider/services/DividerController.mjs` | CRUD + UI View Model |
| 75 | **DividerCalculator** | `services/drawer-divider/core/DividerCalculator.mjs` | Обчислення слотів + conflict detection |
| 76 | **SlotEngine** | `services/drawer-divider/core/SlotEngine.mjs` | Низькорівнева логіка сітки слотів |
| 77 | **DividerDefinitions** | `services/drawer-divider/core/DividerDefinitions.mjs` | Конфігурація типів/розмірів |
| 78 | **DividerCompositionAdapter** | `services/drawer-divider/adapters/DividerCompositionAdapter.mjs` | Міст до CompositionStore |

## 8. DRAWERS (Шухляди)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 82 | **DrawerAnimationService** | `services/drawer-animation/drawer-animation-service.mjs` | Анімація відкриття/закриття (400ms) |
| 83 | **DrawerViewService** | `services/drawer-view/drawer-view-service.mjs` | Top-view режим, ізоляція шухляди |
| 84 | **DrawerOverlaySystem** | `services/OverlaySystem/drawer-overlay-system.mjs` | UI оверлей шухляд (open/close кнопки) |

## 9. OVERLAY SYSTEMS (Оверлеї)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 85 | **BaseOverlayManager** | `services/OverlaySystem/BaseOverlayManager.mjs` | Базовий клас: 3D → 2D позиціювання віджетів |
| 86 | **DividerSlotOverlaySystem** | `services/OverlaySystem/divider-slot-overlay-system.mjs` | Оверлей слотів дівайдерів (Plus + Checkmark SVG) |
| 87 | **PositionCalculator** | `services/OverlaySystem/PositionCalculator.mjs` | Обчислення екранних позицій з anchor-типами |
| 88 | **PlusButtonManager** | `services/anchorCalculator/plus-button-manager.mjs` | Кнопки "+" для додавання продуктів |

## 10. CAMERA (Камера)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 89 | **CameraController** | `services/camera/camera-controller.mjs` | Координація manual zoom + auto-framing |
| 90 | **CameraService** | `services/camera/camera-service.mjs` | Ручне управління зумом orbit-камери |
| 91 | **CameraStore** | `services/camera/camera-store.mjs` | Стан камери (distance, pivot, pitch, yaw, cooldown) |
| 92 | **CameraFramingService** | `services/cameraFraming/camera-framing-service.mjs` | Авто-фреймінг на entities з padding |

## 11. BRIDGE (API для фронтенду)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 93 | **GlobalBridge** | `bridge/global-bridge.mjs` | PlayCanvas Script → window.ConfiguratorAPI |
| 94 | **ProductPlugin** | `bridge/plugins/product.plugin.mjs` | CRUD продуктів |
| 95 | **ProductConfigPlugin** | `bridge/plugins/product-config.plugin.mjs` | Get/Set конфігурації продуктів |
| 96 | **SelectionPlugin** | `bridge/plugins/selection.plugin.mjs` | Вибір entity через API |
| 97 | **DividerPlugin** | `bridge/plugins/divider.plugin.mjs` | API дівайдерів |
| 98 | **DrawerPlugin** | `bridge/plugins/drawer.plugin.mjs` | API шухляд (view + animation) |
| 99 | **CameraPlugin** | `bridge/plugins/camera.plugin.mjs` | API камери (zoom, focus, snapshot) |
| 100 | **ARExportPlugin** | `bridge/plugins/ar-export.plugin.mjs` | API AR-експорту |
| 101 | **DividerViewGuard** | `bridge/helpers/divider-view-guard.mjs` | Захист від конфліктів UI під час операцій |

## 12. SERVICES (Інфраструктура)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 102 | **MaterialService** | `services/material/material-service.mjs` | Завантаження, кешування, застосування матеріалів |
| 103 | **SelectionService** | `services/selectionService/selection-service.mjs` | Мульти/одиничний вибір entity |
| 104 | **AutoPlacementService** | `services/autoPlacement/auto-placement-service.mjs` | Автоматичне позиціювання entity |
| 105 | **AnchorCalculator** | `services/anchorCalculator/anchor-calculator.mjs` | Обчислення anchor-точок для кнопок |
| 106 | **LoggerService** | `services/logger/logger-service.mjs` | Централізоване логування з кольорами |
| 107 | **ARExportService** | `services/ar-export/ar-export-service.mjs` | Оркестрація GLB/USDZ експорту |
| 108 | **SceneCollector** | `services/ar-export/scene-collector.mjs` | Збирання геометрії для експорту |
| 109 | **GLBExporter** | `services/ar-export/glb-exporter.mjs` | Експорт у GLB формат |
| 110 | **USDZExporter** | `services/ar-export/usdz-exporter.mjs` | Експорт у USDZ формат (Apple AR) |
| 111 | **SidePanelsService** | `services/side-panels/side-panels-service.mjs` | Deprecated — замінений SidePanelAddon |

## 13. CORE & HELPERS

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 112 | **ConditionEvaluator** | `core/rule/condition-evaluator/condition-evaluator.mjs` | Обчислення умов (==, !=, >, <, oneOf, changed) |
| 113 | **EventBus** | `core/events/event-bus.mjs` | Deprecated система подій |
| 114 | **BaseRule** | `core/rule/base-rule/base-rule.mjs` | Deprecated legacy базовий клас правил |
| 115 | **PositionBuilder** | `builder/position-builder.mjs` | Fluent builder позиціювання entity |
| 116 | **SceneEntityHelper** | `helpers/scene-entity-helper.mjs` | Обхід entity, збір мешів, AABB |
| 117 | **SceneTransformHelper** | `helpers/scene-transform-helper.mjs` | Stretch, position, visibility операції |
| 118 | **MeshRuleConfigBuilder** | `helpers/mesh-rule-config-builder.mjs` | Fluent builder конфігурацій мешів для правил |
| 119 | **DownloadHelper** | `helpers/download-helper.mjs` | Завантаження файлів (GLB, USDZ, USD) |

## 14. PLAYCANVAS SCRIPTS (Top-level)

| # | Сутність | Файл | Призначення |
|---|----------|------|-------------|
| 120 | **RootAppConfiguration** | `root-app-configuration.mjs` | Точка входу, bootstrap |
| 121 | **SmartStretch** | `Scripts/SmartStretch.mjs` | Інтелектуальне розтягування мешів |
| 122 | **MeshBoolean** | `Scripts/MeshBoolean.mjs` | Boolean операції над мешами |
| 123 | **TriplanarMapping** | `Scripts/TriplanarMapping2.js` | Тріпланарне текстурування |
| 124 | **tri-planar-mapping** | `Scripts/tri-planar-mapping.mjs` | Розширене тріпланарне текстурування |
| 125 | **stretchRegion** | `Scripts/stretchRegion.mjs` | Визначення регіонів розтягування |
| 126 | **orbit-camera** | `Scripts/orbit-camera.js` | Орбітальна камера |
| 127 | **mouse-input** | `Scripts/mouse-input.js` | Обробка мишки |
| 128 | **loader** | `Scripts/loader.js` | Завантаження ресурсів |
| 129 | **bloom** | `Scripts/bloom.js` | Post-ефект bloom |
| 130 | **SSAOm** | `Scripts/SSAOm.js` | Screen Space Ambient Occlusion |
| 131 | **arGround** | `Scripts/arGround.js` | AR ground plane |

---

## Деревоподібна схема залежностей

```
RootAppConfiguration (bootstrap)
│
├── GlobalBridge → window.ConfiguratorAPI
│   ├── ProductPlugin
│   ├── ProductConfigPlugin
│   ├── SelectionPlugin
│   ├── DividerPlugin
│   ├── DrawerPlugin
│   ├── CameraPlugin
│   ├── ARExportPlugin
│   └── DividerViewGuard (helper)
│
└── SceneManager (Script)
    │
    ├── CompositionManager (Compositor)
    │   ├── CompositionStore (per composition)
    │   │   ├── _products: Map<productId, snapshot>
    │   │   ├── _sceneEntities: Map<entityId, data>
    │   │   └── _orderProductIds
    │   │
    │   ├── SceneAggregator
    │   │   ├── _handlers: Map<name, config>
    │   │   └── Shared Context: {entities, allProducts, cabinetsAabb}
    │   │
    │   ├── AddonManager
    │   │   ├── SidePanelAddon (AddonStateMachine)
    │   │   │   └── States: idle → creating → active → updating → removing
    │   │   └── TowelBarAddon (AddonStateMachine)
    │   │       └── _globalColor
    │   │
    │   ├── Composition Rules (BaseCompositionRule)
    │   │   ├── RuleCountertopWidth
    │   │   ├── RuleCountertopBooleanCutouts
    │   │   ├── RuleSidePanels
    │   │   ├── RuleTowelBars
    │   │   ├── RuleChangeBasinStyleMaterial
    │   │   └── RuleHandleStretchForSideShelf
    │   │
    │   └── PositionBuilder (layout)
    │
    ├── ProductRegistry_V2 (singleton)
    │   ├── ProductConfigLoader
    │   ├── ProductEntityBuilder
    │   ├── ProductTagService
    │   ├── ProductQueryService
    │   └── SubProductManager
    │
    ├── ProductFactory
    │   └── PostCloneHooks
    │
    ├── Product Entities (per entity)
    │   └── ProductController (Script)
    │       └── RuleExecutor
    │           ├── CabinetUniBox Rules (9)
    │           ├── OpenShelves Rules (3)
    │           ├── UniSideShelves Rules (2)
    │           ├── Color/Material Rules (5)
    │           ├── Countertop Rules (3)
    │           ├── SidePanel Rules (7)
    │           ├── TowelBar Rules (2)
    │           ├── Divider Rules (3)
    │           ├── Overlay/Texture Rules (4)
    │           └── RuleValidateProduct
    │
    ├── DividerFacade (singleton)
    │   ├── DividerController
    │   │   └── DividerCalculator
    │   │       └── SlotEngine
    │   ├── DividerCompositionAdapter
    │   └── DividerDefinitions
    │
    ├── DrawerAnimationService (400ms easeInOutCubic)
    ├── DrawerViewService (top-view isolation)
    │
    ├── Camera System
    │   ├── CameraController (coordinator)
    │   ├── CameraService (manual zoom)
    │   ├── CameraStore (state + cooldown 3000ms)
    │   └── CameraFramingService (auto-frame)
    │
    ├── Overlay Systems
    │   ├── BaseOverlayManager
    │   │   ├── DrawerOverlaySystem (open/close buttons)
    │   │   └── DividerSlotOverlaySystem (slot icons: +, ✓)
    │   ├── PositionCalculator (3D → 2D)
    │   └── PlusButtonManager (+ buttons for products)
    │
    ├── SelectionService (multi/single select)
    ├── SelectTool + DimensionTool + DimensionRenderer
    ├── MaterialService (cache + apply)
    ├── AutoPlacementService + AnchorCalculator
    ├── LoggerService (singleton)
    │
    └── ARExportService
        ├── SceneCollector
        ├── GLBExporter
        ├── USDZExporter
        └── DownloadHelper

Core & Helpers (shared utilities)
├── ConditionEvaluator
├── SceneEntityHelper
├── SceneTransformHelper
├── MeshRuleConfigBuilder
├── OverlayRuleHelper
└── OverlayTextureConfig

PlayCanvas Scripts (rendering & input)
├── SmartStretch, MeshBoolean, TriplanarMapping
├── stretchRegion, tri-planar-mapping
├── orbit-camera, mouse-input, loader
├── bloom, SSAOm, arGround
└── EventBus, BaseRule (deprecated)
```

---

## Патерни проектування

| Патерн | Де використовується |
|--------|---------------------|
| **Singleton** | LoggerService, CompositionManager, CameraController, DividerFacade, ProductRegistry_V2 |
| **Facade** | GlobalBridge, DividerFacade, ARExportService, всі Bridge Plugins |
| **Plugin** | Product, Selection, Config, Divider, Drawer, AR Export, Camera |
| **Builder** | MeshRuleConfigBuilder, PositionBuilder, ProductEntityBuilder |
| **State Machine** | AddonStateMachine → SidePanelAddon, TowelBarAddon |
| **Observer** | CameraStore (subscribe), SelectionService (events), DrawerViewService |
| **Adapter** | DividerCompositionAdapter |
| **Strategy** | SceneEntityHelper (mesh strategies), ConditionEvaluator (comparators) |

## Статистика

| Категорія | Кількість |
|-----------|-----------|
| Compositor | 3 |
| Scene Manager | 4 |
| Products | 11 |
| Rules (Product) | 43 |
| Rules (Composition) | 7 |
| Addons | 4 |
| Dividers | 9 |
| Drawers | 3 |
| Overlays | 4 |
| Camera | 4 |
| Bridge (API) | 9 |
| Services | 10 |
| Core & Helpers | 8 |
| PlayCanvas Scripts | 12 |
| **TOTAL** | **131** |
