import { Script, Asset } from "playcanvas";
import diffuseChunk from "./chunks/TriplanarDiffuse.mjs";
import normalChunk from "./chunks/TriplanarNormal.mjs";
import glossChunk from "./chunks/TriplanarGloss.mjs";

export class TriPlanarMapping extends Script {
  static scriptName = "triPlanarMapping";

  // --- OVERRIDES ---
  /** @attribute
   * @type {Asset}
   * @resource material
   * @title Override Material
   * */ mat;
  /** @attribute
   * @type {Asset}
   * @resource texture
   * @title Override Texture
   * */
  texture_0;

  // --- DETAIL SETTINGS ---
  /** @attribute
   * @type {Asset}
   * @resource texture
   * @title Detail AO Map
   * */
  aoMap;

  /** @attribute
   * @type {Asset}
   * @resource texture
   * @title Detail Normal Map
   * */
  detailNormalMap;

  /** @attribute
   * @title Detail Tiling
   * @default 1.0
   * */
  detailTiling = 1.0;

  /** @attribute
   * @title AO Intensity
   * @range [0, 2]
   * @default 1.0
   * */
  aoIntensity = 1.0;

  /** @attribute
   * @title Detail Bumpiness
   * @range [0, 2]
   * @default 1.0
   * */
  detailBumpiness = 1.0;

  // --- INTERNAL STATE ---
  _textureSize = 0.5;
  _rotationAngle = 0.0;
  _makeUnique = true;
  _useTagsForScale = false;
  _tagScale = null;

  _overrideParams = false;
  _glossiness = 100.0;
  _bumpiness = 1.0;
  _useTriplanarNormal = true;
  _useTriplanarGloss = false;

  _dummyWhite = null;
  _dummyNormal = null;

  activeMaterials = [];

  initialize() {
    if (!diffuseChunk?.length) {
      console.error("TriPlanarMapping: Diffuse Chunk is missing!");
      return;
    }

    this.activeMaterials = [];
    this.applyTriplanar();

    this.on("attr", () => this.updateUniforms());
    this.on("attr:aoMap", () => this.applyTriplanar());
    this.on("attr:detailNormalMap", () => this.applyTriplanar());
    this.on("attr:useTriplanarNormal", () => this.applyTriplanar());
    this.on("attr:useTriplanarGloss", () => this.applyTriplanar());

    if (this.activeMaterials.length === 0) this.ensureModelReady();
  }

  // --- GETTERS & SETTERS ---

  /** @attribute
   * @title Use Tags for Scale
   * @type {boolean}
   * */
  get useTagsForScale() {
    return this._useTagsForScale;
  }
  set useTagsForScale(value) {
    this._useTagsForScale = value;
    this.updateUniforms();
  }

  /** @attribute
   * @title Size (Meters)
   * @range [0.01, 100.0]
   * @default 0.5
   * */
  get textureSize() {
    return this._textureSize;
  }
  set textureSize(value) {
    this._textureSize = value;
    this.updateUniforms();
  }

  /** @attribute
   * @title Rotation (Degrees)
   * @range [-360.0, 360.0]
   * */
  get rotationAngle() {
    return this._rotationAngle;
  }
  set rotationAngle(value) {
    this._rotationAngle = value;
    this.updateUniforms();
  }

  /** @attribute
   * @title Make Unique
   * @type {boolean}
   * */
  get makeUnique() {
    return this._makeUnique;
  }
  set makeUnique(value) {
    this._makeUnique = value;
    this.applyTriplanar();
  }

  /** @attribute
   * @title Override Mat Params
   * @type {boolean}
   * */
  get overrideParams() {
    return this._overrideParams;
  }
  set overrideParams(value) {
    this._overrideParams = value;
    this.updateUniforms();
  }

  /** @attribute
   * @title Glossiness
   * @range [0, 100]
   * */
  get glossiness() {
    return this._glossiness;
  }
  set glossiness(value) {
    this._glossiness = value;
    if (this._overrideParams) this.updateUniforms();
  }

  /** @attribute
   * @title Bumpiness
   * @range [0, 2]
   * */
  get bumpiness() {
    return this._bumpiness;
  }
  set bumpiness(value) {
    this._bumpiness = value;
    if (this._overrideParams) this.updateUniforms();
  }

  /** @attribute
   * @title Triplanar Normal
   * @type {boolean}
   * */
  get useTriplanarNormal() {
    return this._useTriplanarNormal;
  }
  set useTriplanarNormal(value) {
    this._useTriplanarNormal = value;
    this.applyTriplanar();
  }

  /** @attribute
   * @title Triplanar Gloss
   * @type {boolean}
   * */
  get useTriplanarGloss() {
    return this._useTriplanarGloss;
  }
  set useTriplanarGloss(value) {
    this._useTriplanarGloss = value;
    this.applyTriplanar();
  }

  ensureModelReady() {
    const onLoaded = () => this.applyTriplanar();
    if (this.entity.model && !this.entity.model.model) {
      this.entity.model.on("model:loaded", onLoaded, this);
    }
    if (this.entity.render && this.entity.render.asset) {
      const asset = this.app.assets.get(this.entity.render.asset);
      if (asset && !asset.loaded) asset.once("load", onLoaded);
    }
  }

  get dummyWhite() {
    if (!this._dummyWhite) {
      const device = this.app.graphicsDevice;
      this._dummyWhite = new pc.Texture(device, {
        width: 1,
        height: 1,
        format: pc.PIXELFORMAT_R8_G8_B8_A8,
        minFilter: pc.FILTER_NEAREST,
        magFilter: pc.FILTER_NEAREST,
      });
      const pixels = this._dummyWhite.lock();
      pixels.set([255, 255, 255, 255]); // Белый
      this._dummyWhite.unlock();
    }
    return this._dummyWhite;
  }

  get dummyNormal() {
    if (!this._dummyNormal) {
      const device = this.app.graphicsDevice;
      this._dummyNormal = new pc.Texture(device, {
        width: 1,
        height: 1,
        format: pc.PIXELFORMAT_R8_G8_B8_A8,
        minFilter: pc.FILTER_NEAREST,
        magFilter: pc.FILTER_NEAREST,
      });
      const pixels = this._dummyNormal.lock();
      pixels.set([128, 128, 255, 255]); // Сиреневый (Нормаль вверх)
      this._dummyNormal.unlock();
    }
    return this._dummyNormal;
  }

  update(dt) {}

  resolveTexture(source) {
    if (!source) return null;
    if (source.device && source.width) return source;
    if (source.resource) return source.resource;
    if (typeof source === "number") {
      const asset = this.app.assets.get(source);
      return asset?.resource || null;
    }
    return null;
  }

  getGlossMap(material) {
    return (
      this.resolveTexture(material.glossMap) ||
      this.resolveTexture(material._assetReferences?.glossMap?.asset) ||
      null
    );
  }

  getNormalMap(material) {
    return (
      this.resolveTexture(material.normalMap) ||
      this.resolveTexture(material._assetReferences?.normalMap?.asset) ||
      null
    );
  }

  getMaterialGlossiness(material) {
    if (this._overrideParams) return this._glossiness / 100.0;
    if (typeof material.gloss === "number") return material.gloss;
    if (typeof material.shininess === "number") return material.shininess / 100.0;
    if (typeof material.roughness === "number") return 1.0 - material.roughness;
    return this._glossiness / 100.0;
  }

  getMaterialBumpiness(material) {
    if (this._overrideParams) return this._bumpiness;
    if (typeof material.bumpiness === "number") return material.bumpiness;
    return this._bumpiness;
  }

  refreshMaterials() {
    this.applyTriplanar();
  }

  applyTriplanar() {
    this.activeMaterials = [];
    const meshInstancesToUpdate = [];

    const renders = this.entity.findComponents("render");
    renders.forEach((c) => {
      if (c.meshInstances) meshInstancesToUpdate.push(...c.meshInstances);
    });
    const models = this.entity.findComponents("model");
    models.forEach((c) => {
      if (c.model && c.model.meshInstances)
        meshInstancesToUpdate.push(...c.model.meshInstances);
    });

    if (meshInstancesToUpdate.length === 0) return;

    const materialCache = new Map();
    const findAsset = (res) => {
      if (this.mat && this.mat.resource === res) return this.mat;
      return this.app.assets.list().find((a) => a.resource === res);
    };

    for (const mesh of meshInstancesToUpdate) {
      let sourceMat =
        this.mat && this.mat.resource ? this.mat.resource : mesh.material;
      if (!sourceMat) continue;

      if (this._tagScale === null) {
        const asset = findAsset(sourceMat);
        if (asset && asset.tags) {
          const list = asset.tags.list();
          for (let i = 0; i < list.length; i++) {
            const parsed = parseFloat(list[i]);
            if (!isNaN(parsed) && isFinite(parsed) && parsed > 0) {
              this._tagScale = parsed;
              break;
            }
          }
        }
      }

      let finalMat;
      if (this.makeUnique) {
        if (materialCache.has(sourceMat.id)) {
          finalMat = materialCache.get(sourceMat.id);
        } else {
          if (sourceMat.name.includes("_triplanar_unique")) {
            finalMat = sourceMat;
          } else {
            finalMat = sourceMat.clone();
            finalMat.name = sourceMat.name + "_triplanar_unique";
          }
          materialCache.set(sourceMat.id, finalMat);
        }
        mesh.material = finalMat;
      } else {
        finalMat = sourceMat;
      }

      this.setupMaterial(finalMat);
      if (!this.activeMaterials.includes(finalMat))
        this.activeMaterials.push(finalMat);
    }

    this.updateUniforms();
  }

  setupMaterial(material) {
    const initialNormalMap = this.getNormalMap(material);
    const initialGlossMap = this.getGlossMap(material);
    const hasInitialDetailNormal = this.detailNormalMap && this.detailNormalMap.resource;

    if (diffuseChunk) {
      material.chunks.diffusePS = diffuseChunk;
    }
    if (this.useTriplanarNormal && normalChunk && (initialNormalMap || hasInitialDetailNormal)) {
      material.chunks.normalMapPS = normalChunk;
    } else {
      delete material.chunks.normalMapPS;
    }
    if (this.useTriplanarGloss && glossChunk && initialGlossMap) {
      material.chunks.glossPS = glossChunk;
    } else {
      delete material.chunks.glossPS;
    }

    let textureResource = null;
    if (this.texture_0 && this.texture_0.resource)
      textureResource = this.texture_0.resource;
    else if (material.diffuseMap) textureResource = material.diffuseMap;

    let hasDiffuse = 0.0;
    if (textureResource) {
      material.setParameter("tri_diffuseTex", textureResource);
      hasDiffuse = 1.0;
    } else {
      material.setParameter("tri_diffuseTex", this.dummyWhite);
      hasDiffuse = 0.0;
    }
    material.setParameter("tri_hasDiffuse", hasDiffuse);

    if (normalChunk) {
      const normalMap = this.getNormalMap(material);
      material.setParameter("tri_normalTex", normalMap || this.dummyNormal);
      material.setParameter("tri_hasNormal", normalMap ? 1.0 : 0.0);
    }

    if (glossChunk) {
      const glossMap = this.getGlossMap(material);
      material.setParameter("tri_glossTex", glossMap || this.dummyWhite);
      material.setParameter("tri_hasGloss", glossMap ? 1.0 : 0.0);
    }

    if (this.aoMap && this.aoMap.resource) {
      material.setParameter("tri_aoTex", this.aoMap.resource);
      material.setParameter("tri_hasAO", 1.0);
    } else {
      material.setParameter("tri_aoTex", this.dummyWhite);
      material.setParameter("tri_hasAO", 0.0);
    }

    if (this.detailNormalMap && this.detailNormalMap.resource) {
      material.setParameter(
        "tri_detailNormalTex",
        this.detailNormalMap.resource,
      );
      material.setParameter("tri_hasDetailNormal", 1.0);
    } else {
      material.setParameter("tri_detailNormalTex", this.dummyNormal);
      material.setParameter("tri_hasDetailNormal", 0.0);
    }

    if (!this._overrideParams) {
      this._glossiness = this.getMaterialGlossiness(material) * 100.0;
      this._bumpiness = this.getMaterialBumpiness(material);
    }
    material.update();
  }

  updateUniforms() {
    if (!this.activeMaterials) return;
    for (const mat of this.activeMaterials) {
      this.updateMaterialUniforms(mat);
      mat.update();
    }
  }

  updateMaterialUniforms(material) {
    let size = this.textureSize;
    if (this._useTagsForScale && this._tagScale !== null) size = this._tagScale;
    if (size < 0.001) size = 1.0;
    let rad = this.rotationAngle * (Math.PI / 180.0);

    material.setParameter("tri_scale", size);
    material.setParameter("tri_rotation", rad);

    material.setParameter("tri_bumpiness", this.getMaterialBumpiness(material));
    material.setParameter("tri_glossiness", this.getMaterialGlossiness(material));
    const invertVal = !this._overrideParams && material.glossInvert ? 1.0 : 0.0;
    material.setParameter("tri_glossInvert", invertVal);

    const normalMap = this.getNormalMap(material);
    material.setParameter("tri_normalTex", normalMap || this.dummyNormal);
    material.setParameter("tri_hasNormal", normalMap ? 1.0 : 0.0);

    const glossMap = this.getGlossMap(material);
    material.setParameter("tri_glossTex", glossMap || this.dummyWhite);
    material.setParameter("tri_hasGloss", glossMap ? 1.0 : 0.0);

    material.setParameter("tri_detailTiling", this.detailTiling);
    material.setParameter("tri_aoIntensity", this.aoIntensity);
    material.setParameter("tri_detailBumpiness", this.detailBumpiness);

    const hasAO = this.aoMap && this.aoMap.resource ? 1.0 : 0.0;
    const hasDetailNormal =
      this.detailNormalMap && this.detailNormalMap.resource ? 1.0 : 0.0;

    material.setParameter("tri_hasAO", hasAO);
    material.setParameter("tri_hasDetailNormal", hasDetailNormal);
  }
}
