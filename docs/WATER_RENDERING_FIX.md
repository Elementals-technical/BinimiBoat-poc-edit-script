# Water rendering: виправлення сумісності з PlayCanvas 2.21.1

## Призначення документа

Цей документ фіксує початковий стан імпортованого Water-модуля, помилки,
відтворені у PlayCanvas 2.21.1, та зміни в пайплайні planar reflection.

Фактична Git-історія складається з трьох послідовних етапів:

1. Remote commit `09b53ae` додав `water_03.js` із частковим виправленням:
   проблемний renderer call був закоментований, а comma-uniforms нормалізувалися
   в JavaScript під час запуску.
2. Commit `cc06267` (`initial:water-shader`) додав відсутні початкові normal,
   blur і fragment shaders та `ObjectRocking.js`.
3. Наступний commit окремо завершує виправлення reflection-пайплайна.

Тимчасова діагностика не входить до жодного опублікованого коміту.

## Перевірене середовище

- PlayCanvas: `2.21.1`
- revision: `2827828`
- graphics device: `webgl2`
- `app.renderer.updateCameraFrustum`: `undefined`

## Початкові симптоми

### 1. Відсутній метод renderer

Оригінальний `water_03.js` реєстрував глобальний `prerender` callback і
викликав:

```js
self.app.renderer.updateCameraFrustum(cam.camera);
```

Під час кожного render pass виникала помилка:

```text
Uncaught TypeError: self.app.renderer.updateCameraFrustum is not a function
```

У PlayCanvas 2.21.1 такого renderer API немає. Reflection camera вже має
підтримувані точки розширення `calculateTransform` і `calculateProjection`.
Рушій сам використовує ці callback-функції під час оновлення матриць камери та
frustum. Окремий ручний виклик для оновлення frustum не потрібен.

Видалення `updateCameraFrustum()` не зупиняє анімацію води. Вона працює
незалежно через:

- збільшення shader uniform `globalTime` у `update(dt)`;
- рендер `waterNormalPS` у `rtNormal`;
- рендер `waterNormal2PS` у `rtNormal2`.

### 2. Непідтримувані uniform-оголошення через кому

Імпортований `waterPS.glsl` оголошував кілька uniform в одному рядку:

```glsl
uniform float globalTime, waterHeight;
uniform sampler2D waterReflTex, waterReflTexBlur, waterNormalTex, waterNormalTex2, noiseTex;
```

ShaderMaterial parser виводив:

```text
A comma on a uniform line is not supported, split it into multiple uniforms
```

Такий синтаксис є валідним GLSL, але його не приймає parser ShaderMaterial,
який використовується в цьому проєкті.

### 3. Feedback loop reflection-текстури

Після усунення першої помилки WebGL багаторазово повідомляв:

```text
Trying to bind current color buffer as a texture
```

Це означає, що draw call намагається читати текстуру, яка в цей момент
під'єднана як color buffer активного render target. У planar reflection типовий
сценарій такий: Water mesh рендериться в `rt`, а його матеріал одночасно читає
`rt.colorBuffer` через `waterReflTex`.

Імпортована реалізація допускала цей стан у двох місцях:

- `cam.camera.copy(mainCamera.camera.camera)` копіював повний внутрішній стан
  камери, зокрема layers, замість лише потрібних параметрів проєкції;
- глобальний `scene.postrender` callback запускав blur chain після кожної
  камери, а не лише після `Reflection Camera`.

Water entity не повинен рендеритися камерою, яка створює `waterReflTex`.
Копіювання layers із головної камери може непомітно порушити цей інваріант,
коли головна камера містить Water layer.

### 4. Життєвий цикл events і render targets

`_updateReflectionCamera()` повторно викликається після `resizecanvas`.
Початкова версія кожного разу додавала нові scene listeners і не прибирала їх
під час знищення скрипта. Старі callbacks могли посилатися на вже знищені
render targets або запускати blur кілька разів за кадр.

## Реалізоване виправлення

### Публічні camera callbacks

Reflection callbacks задаються один раз безпосередньо на camera component:

```js
cam.calculateTransform = _customTransformFunc;
cam.calculateProjection = _customProjFunc;
```

Застарілий `renderer.updateCameraFrustum()` і глобальний `prerender` listener
видалені.

### Вибіркова синхронізація камер

Повний внутрішній `Camera.copy()` замінено на
`_syncReflectionCameraProperties()`. Функція копіює лише параметри проєкції та
експозиції, потрібні reflection camera:

- `projection`
- `fov`
- `horizontalFov`
- `orthoHeight`
- `nearClip`
- `farClip`
- `aperture`
- `sensitivity`
- `shutter`

Навмисно не копіюються:

- `layers`
- `renderTarget`
- `calculateTransform`
- `calculateProjection`
- reflection-specific face settings

Синхронізація виконується під час ініціалізації та в кожному Water update.
Зміни оптики головної камери поширюються на reflection camera, але не
перезаписують її власний render state.

### Обробка winding після віддзеркалення

Reflection camera налаштована так:

```js
cam.cullFaces = true;
cam.flipFaces = true;
```

`cullFaces` керує відсіканням граней, а не оновленням frustum. Його вимкнення не
замінює frustum update. Віддзеркалена transform-матриця змінює winding, тому
правильним reflection-specific параметром є `flipFaces`.

### Blur лише для reflection camera

`postrender` callback тепер отримує camera component і завершується для всіх
камер, крім reflection camera:

```js
const postRender = (cameraComponent) => {
    if (cameraComponent !== cam) {
        return;
    }

    // rt -> rtBlurH -> rtBlur
};
```

EventHandle зберігається і видаляється перед перебудовою render targets та під
час destroy.

### Cleanup ресурсів

Виправлений скрипт:

- відписується від `resizecanvas` під час destroy;
- видаляє активний reflection `postrender` handle;
- видаляє попередній handle перед перебудовою після resize;
- знищує reflection, blur і normal render targets.

### Shader uniforms

Кожен uniform у `waterPS.glsl` оголошено окремим рядком. Це прибирає warnings
ShaderMaterial parser без зміни поведінки GLSL.

Після виправлення самого shader source runtime-helper
`normalizeWaterUniformDeclarations()` із `09b53ae` більше не потрібен і
видалений із `water_03.js`.

### Orthographic projection

Orthographic-гілка використовує `cam.aspectRatio` замість неіснуючого
`cam.aspect`.

## Обов'язкова конфігурація PlayCanvas scene

Ці умови є частиною контракту реалізації:

- Entity `Main Camera` повинна мати camera component.
- Entity `Reflection Camera` повинна мати camera component.
- Entity зі скриптом Water повинна мати render component і mesh instance.
- Shader assets повинні називатися `waterPS`, `waterNormalPS`,
  `waterNormal2PS` та `blurPS`.
- `Reflection Camera` повинна виключати всі layers, на яких є Water mesh.
- Головна камера може містити Water layer, бо вона читає вже готову reflection
  texture, а не створює її.

Під час діагностики Water mesh був на layer `1000` (`Reflection`), а reflection
camera рендерила `World` і `Skybox`. Перетину між цими наборами layers не було.
Це розділення потрібно зберігати після змін scene layers.

## Результат діагностики

Тимчасова інструментація підтвердила:

- PlayCanvas `2.21.1`, revision `2827828`, WebGL2;
- завантаження shader source з окремими uniform-рядками;
- reflection callbacks мають тип `function`;
- reflection, horizontal blur, vertical blur і normal render targets мають
  різні текстури;
- Water і `Reflection Camera` не мають спільного layer.

Після цього користувач перевірив Launch build і підтвердив відсутність помилок.
Тимчасові logger, wrapper для `device.setTexture` і глобальний helper
`getWaterDebugLog()` видалені.

## Checklist перевірки

Статичні перевірки:

```bash
node --check Scripts/Water/water_03.js
node /Users/personal/.codex/skills/playcanvas-configurator/scripts/check-runtime-scripts.mjs .
git diff --check
```

Перевірки після hard reload PlayCanvas Launch:

1. У console немає `updateCameraFrustum is not a function`.
2. У console немає warning про uniform-оголошення через кому.
3. У console немає `Trying to bind current color buffer as a texture`.
4. Water normals продовжують рухатися з часом.
5. Planar reflection реагує на рух головної камери.
6. Reflection texture не містить саму поверхню води.
7. Reflection і blur продовжують працювати після canvas resize.
8. Perspective та orthographic camera modes мають коректну проєкцію.

## Фактична послідовність комітів

### Remote baseline: `09b53ae`

Commit `Add to repo script water_03 and fix errors` уже був на `origin/main`
перед інтеграцією shader-набору. Він:

- додав лише `Scripts/Water/water_03.js`;
- закоментував відсутній `updateCameraFrustum()`;
- додав runtime-нормалізацію comma-separated uniforms;
- залишив повний `Camera.copy()`, глобальні scene events, нефільтрований blur і
  помилковий `cam.aspect`.

Цей опублікований commit не переписувався і не force-push-ився.

### Початковий shader-набір: `cc06267`

Commit `initial:water-shader` додає рівно п'ять відсутніх файлів:

```text
Scripts/Water/ObjectRocking.js
Scripts/Water/shader/blurPS.glsl
Scripts/Water/shader/waterNormal2PS.glsl
Scripts/Water/shader/waterNormalPS.glsl
Scripts/Water/shader/waterPS.glsl
```

`waterPS.glsl` у цьому commit зберігає початкові comma-uniform declarations.
Runtime-normalізація з `09b53ae` дозволяє цьому проміжному стану компілюватися.

### Завершальне виправлення сумісності

До завершального commit входять лише:

```bash
git add Scripts/Water/water_03.js
git add Scripts/Water/shader/waterPS.glsl
git add docs/WATER_RENDERING_FIX.md
```

Commit message:

```text
Fix Water reflection rendering on PlayCanvas 2.21.1

- replace the removed renderer frustum call with supported camera callbacks
- preserve reflection layers by synchronizing only camera projection properties
- run the blur chain only after the reflection camera
- clean up scene hooks and render targets across resize and destroy
- split ShaderMaterial uniform declarations and fix orthographic aspectRatio
```

Binary assets `water material.zip` і `waterTile.png`, локальні certificates та
`package.json` не входять до цих комітів. Для цієї інтеграції не
використовувався `git add -A`.

## Ризики регресії

- Додавання Water layer до `Reflection Camera` повторно створить render-target
  feedback loop навіть без змін JavaScript.
- Повернення повного `Camera.copy()` може перезаписати reflection-specific
  state і layers.
- Видалення camera filter із `postrender` запустить blur chain для сторонніх
  камер.
- Перебудова targets без видалення старого EventHandle залишить callbacks на
  знищені GPU-ресурси.
- Поточний код передбачає один Water script instance та одну reflection camera.
  Для кількох незалежних water planes потрібні окремі cameras, targets і
  per-instance shader parameters.
