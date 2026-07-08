# Onboarding-документація BiminiBoat Configurator

Набір для розробника, який бачить проект уперше і **не знає Hasting** (проект-предок). Читати по порядку:

| # | Файл | Про що |
|---|---|---|
| 1 | [01-vision.md](01-vision.md) | Основна ідея і куди йде проект (roadmap) |
| 2 | [02-core.md](02-core.md) | Ядро з нуля: звідки що витікає, пайплайн зміни стану |
| 3 | [03-deck-plane-and-furniture.md](03-deck-plane-and-furniture.md) | Площина DeckPlane, розстановка меблів: фіксовані позиції зараз, drag-and-drop у майбутньому |
| 4 | [04-rules-as-units.md](04-rules-as-units.md) | Правила як унікальні юніти: контракт, як писати нові, напрям на автогенерацію |
| 5 | [05-current-state.md](05-current-state.md) | Поточний стан, відомі проблеми (тріпланар), TODO |

Довідкові документи глибшого рівня: `../HANDOVER.md` (повна карта системи), `../API_CONTRACT.md` (публічний API), `../CONFIGURATION_CONCEPT.md` (модель конфігурації), `../drag-and-droup.md` (специфікація drag-модуля).

Швидкий старт: код у `src/Scripts/app-configuration/`, запуск сцени з `?testui` в URL дає dev-панель усіх атрибутів.
