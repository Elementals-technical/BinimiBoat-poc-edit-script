import { SceneCollector } from "./scene-collector.mjs";
import { GLBExporter } from "./glb-exporter.mjs";
import { USDZExporter } from "./usdz-exporter.mjs";
import { DownloadHelper } from "../../helpers/download-helper.mjs";
import { CompositionManager } from "../../domain/composition/composition-manager.mjs";
import { LoggerService } from "../logger/logger-service.mjs";
import { MaterialService } from "../material/material-service.mjs";
import rockportFurnitureMaterials from "../../domain/product/parametric/rockport-furniture-materials.mjs";
import {
  PRESET_FURNITURE_CLONE_MARKER,
  PRESET_FURNITURE_TEMPLATE,
} from "../furniture/preset-furniture-service.mjs";

/**
 * @class ARExportService
 * @classdesc Main service for orchestrating AR export workflow
 */
class ARExportService {
  constructor(app) {
    this.app = app;
    this.sceneCollector = new SceneCollector(app);
    this._generatedTintedTextures = [];
  }
  /**
   * Creates a temporary root entity with all products for export
   */
  async _createExportEntity() {
    const compositionManager = CompositionManager.instance;
    const composition = compositionManager?.getActiveComposition();
    if (!composition) throw new Error("No active composition");
    await this._syncRockportFurnitureMaterialsForExport(composition);
    const pc = window.pc || this.app.constructor;
    const rootEntity = new pc.Entity("AR_ExportRoot");
    this.app.root.addChild(rootEntity);
    const allProducts = composition.getAllProducts();
    const movedEntities = [];
    const furnitureGroup = this.app.root.findByName("FurnitureGroup_Main");
    if (furnitureGroup?.enabled) {
      this._addRuntimeCloneToExportRoot(furnitureGroup, rootEntity);
    } else {
      const directPresetClones = this._collectPresetFurnitureClones(this.app.root);
      if (directPresetClones.length) {
        this._addPresetClonesToExportRoot(directPresetClones, rootEntity);
      }
    }
    for (const productId of Object.keys(allProducts)) {
      const productEntity = this.app.root.findByName(productId);
      if (productEntity && productEntity.enabled) {
        const originalParent = productEntity.parent;
        const originalLocalPosition = productEntity.getLocalPosition().clone();
        const originalLocalRotation = productEntity.getLocalRotation().clone();
        const originalLocalScale = productEntity.getLocalScale().clone();
        movedEntities.push({
          entity: productEntity,
          originalParent: originalParent,
          originalLocalPosition: originalLocalPosition,
          originalLocalRotation: originalLocalRotation,
          originalLocalScale: originalLocalScale,
        });
        rootEntity.addChild(productEntity);
      }
    }
    return {
      rootEntity,
      movedEntities,
    };
  }

  _addRuntimeCloneToExportRoot(source, rootEntity) {
    const clone = source.clone();
    const worldPosition = source.getPosition().clone();
    const worldRotation = source.getRotation().clone();
    const worldScale = this._extractWorldScale(source);

    clone.name = source.name;
    clone.enabled = true;
    rootEntity.addChild(clone);
    clone.setPosition(worldPosition);
    clone.setRotation(worldRotation);
    clone.setLocalScale(worldScale.x, worldScale.y, worldScale.z);
    return clone;
  }

  _addPresetClonesToExportRoot(clones, rootEntity) {
    const pc = window.pc || this.app.constructor;
    const group = new pc.Entity("AR_PresetFurniture_Direct");
    rootEntity.addChild(group);
    for (const source of clones) {
      if (!source?.enabled || this._isUnderEntity(source, rootEntity)) continue;
      this._addRuntimeCloneToExportRoot(source, group);
    }
  }

  _collectPresetFurnitureClones(root) {
    const out = [];
    const pending = [...(root?.children || [])];
    while (pending.length > 0) {
      const entity = pending.shift();
      if (this._isPresetFurnitureClone(entity)) out.push(entity);
      pending.push(...(entity?.children || []));
    }
    return out;
  }

  _isPresetFurnitureClone(entity) {
    if (!entity) return false;
    return (
      entity[PRESET_FURNITURE_CLONE_MARKER] === true ||
      Boolean(entity[PRESET_FURNITURE_TEMPLATE]) ||
      Boolean(this._templateFromPresetName(entity.name))
    );
  }

  async _syncRockportFurnitureMaterialsForExport(composition) {
    const boat = composition?.getBoat?.();
    const state = boat?.snapshot || {};
    const layout = state.LayoutRockportSeries || "none";
    const color = state.RockportFurnitureColor || "Grey";
    const root = this.app.root.findByName("FurnitureGroup_Main");
    const clones = this._collectPresetFurnitureClones(root || this.app.root);
    if (layout === "none" || !clones.length) return;

    for (const clone of clones) {
      const template = clone[PRESET_FURNITURE_TEMPLATE] || this._templateFromPresetName(clone.name);
      const assignments = rockportFurnitureMaterials[template];
      if (!assignments) continue;
      for (const assignment of assignments) {
        const target = clone.findByName(assignment.node);
        const expected = assignment[color];
        if (!target || !expected) continue;
        const material = await MaterialService.loadMaterialWithAo(expected, assignment.ao);
        MaterialService.applyToEntity(target, material);
      }
    }
  }

  _isUnderEntity(entity, ancestor) {
    let current = entity;
    while (current) {
      if (current === ancestor) return true;
      current = current.parent;
    }
    return false;
  }

  _templateFromPresetName(name) {
    const parts = String(name || "").split("__");
    const template = parts.length >= 3 && /^FurnitureGroup_/i.test(parts[1]) ? parts[2] : null;
    return template && rockportFurnitureMaterials[template] ? template : null;
  }

  _extractWorldScale(entity) {
    const worldTransform = entity.getWorldTransform();
    const pc = window.pc || this.app.constructor;
    if (worldTransform?.getScale && pc?.Vec3) {
      const scale = new pc.Vec3();
      worldTransform.getScale(scale);
      return scale;
    }

    const d = worldTransform.data;
    return {
      x: Math.hypot(d[0], d[1], d[2]),
      y: Math.hypot(d[4], d[5], d[6]),
      z: Math.hypot(d[8], d[9], d[10]),
    };
  }

  /**
   * Reconstructs a clean PC Entity hierarchy from raw Geometry Data.
   * Used specifically for generating the USDZ file via PlayCanvas UsdzExporter.
   */
  _createCleanHierarchyFromData(geometryData) {
    const pc = window.pc || this.app.constructor;
    const cleanRoot = new pc.Entity("USDZ_Clean_Root");
    this.app.root.addChild(cleanRoot);
    geometryData.forEach((productData) => {
      productData.meshes.forEach((meshData) => {
        meshData.meshes.forEach((meshInfo) => {
          const mesh = new pc.Mesh(this.app.graphicsDevice);
          mesh.setPositions(meshInfo.positions);
          mesh.setNormals(meshInfo.normals);
          if (meshInfo.uvs && meshInfo.uvs.length > 0) {
            mesh.setUvs(0, meshInfo.uvs);
          }
          mesh.setIndices(meshInfo.indices);
          mesh.update();
          const matData = meshInfo.material;
          const material = new pc.StandardMaterial();
          material.name = matData.name;
          const col = matData.baseColor;
          material.diffuse.set(col[0], col[1], col[2]);
          material.opacity = col[3];
          if (col[3] < 1.0) {
            material.blendType = pc.BLEND_NORMAL;
          }
          if (matData.diffuseMap) {
            material.diffuseMap = matData.diffuseMapTint
              ? this._createTintedTexture(matData.diffuseMap, matData.diffuseMapTint)
              : matData.diffuseMap;
            if (matData.diffuseMapTint) {
              material.diffuse.set(1, 1, 1);
            }
          }
          if (matData.normalMap) {
            material.normalMap = matData.normalMap;
          }
          if (matData.occlusionMap) {
            material.aoMap = matData.occlusionMap;
            material.lightMap = matData.occlusionMap;
          }
          if (matData.roughnessMap) {
            material.glossMap = matData.roughnessMap;
            material.metalnessMap = matData.roughnessMap;
          } else if (matData.metallicMap) {
            material.metalnessMap = matData.metallicMap;
            material.glossMap = matData.metallicMap;
          }
          material.useMetalness = true;
          material.metalness = matData.metallic;
          material.gloss = 1.0 - matData.roughness;
          if (matData.emissive && (matData.emissive[0] > 0 || matData.emissive[1] > 0)) {
            material.emissive.set(matData.emissive[0], matData.emissive[1], matData.emissive[2]);
          }
          material.update();
          const entity = new pc.Entity(meshInfo.name);
          entity.addComponent("render", {
            meshInstances: [new pc.MeshInstance(mesh, material)],
          });
          entity.setPosition(
            meshData.transform.position[0],
            meshData.transform.position[1],
            meshData.transform.position[2],
          );
          entity.setRotation(
            meshData.transform.rotation[0],
            meshData.transform.rotation[1],
            meshData.transform.rotation[2],
            meshData.transform.rotation[3],
          );
          entity.setLocalScale(meshData.transform.scale[0], meshData.transform.scale[1], meshData.transform.scale[2]);
          cleanRoot.addChild(entity);
        });
      });
    });
    return cleanRoot;
  }

  _createTintedTexture(texture, tint) {
    if (!texture || !tint || typeof document === "undefined") return texture;
    let source = texture.getSource?.();
    if (!source && texture._levels?.[0]) source = texture._levels[0];
    const pc = window.pc || this.app.constructor;
    const isValidSource =
      source &&
      (source instanceof HTMLImageElement ||
        source instanceof HTMLCanvasElement ||
        (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) ||
        source instanceof HTMLVideoElement);
    if (!isValidSource) {
      return texture;
    }
    try {
      const width = source.width || texture.width;
      const height = source.height || texture.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(source, 0, 0, width, height);
      const pixels = ctx.getImageData(0, 0, width, height);
      const data = pixels.data;
      const r = tint[0] ?? 1;
      const g = tint[1] ?? 1;
      const b = tint[2] ?? 1;
      const a = tint[3] ?? 1;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.round(data[i] * r);
        data[i + 1] = Math.round(data[i + 1] * g);
        data[i + 2] = Math.round(data[i + 2] * b);
        data[i + 3] = Math.round(data[i + 3] * a);
      }
      ctx.putImageData(pixels, 0, 0);
      const tintedTexture = new pc.Texture(this.app.graphicsDevice, {
        width,
        height,
        format: pc.PIXELFORMAT_R8_G8_B8_A8,
      });
      tintedTexture.name = `${texture.name || "diffuse"}_ar_tinted`;
      tintedTexture.setSource(canvas);
      this._generatedTintedTextures.push(tintedTexture);
      return tintedTexture;
    } catch (error) {
      LoggerService.warn(this, "[ARExport] Failed to tint diffuse texture", {
        texture: texture.name,
        tint,
        error: error?.message || String(error),
      });
      return texture;
    }
  }

  async exportToAR(format = "both", options = {}) {
    let exportData = null;
    let usdzTempRoot = null;
    try {
      const exportOptions = {
        scaleToMeters: options.scaleToMeters || 1,
        metersPerUnit: options.metersPerUnit || 1,
        upAxis: options.upAxis || "Y",
        maxTextureSize: options.maxTextureSize || 1024,
        filename: options.filename,
      };
      await this._waitForSceneSettled();
      exportData = await this._createExportEntity();
      const { rootEntity } = exportData;
      const geometryData = this.sceneCollector.collectGeometryFromEntity(rootEntity);
      const result = {};
      if (format === "glb" || format === "both") {
        const glbData = await GLBExporter.export(geometryData, exportOptions);
        result.glb = DownloadHelper.createBlob(glbData, "model/gltf-binary");
      }
      if (format === "usdz" || format === "both") {
        usdzTempRoot = this._createCleanHierarchyFromData(geometryData);
        const scale = exportOptions.scaleToMeters;
        usdzTempRoot.setLocalScale(scale, scale, scale);
        const usdzData = await USDZExporter.export(this.app, usdzTempRoot, exportOptions);
        result.usdz = DownloadHelper.createBlob(usdzData, "model/vnd.usdz+zip");
      }
      return result;
    } finally {
      if (usdzTempRoot) {
        usdzTempRoot.destroy();
      }
      if (this._generatedTintedTextures.length) {
        this._generatedTintedTextures.forEach((texture) => texture.destroy?.());
        this._generatedTintedTextures.length = 0;
      }
      if (exportData && exportData.movedEntities) {
        exportData.movedEntities.forEach(
          ({ entity, originalParent, originalLocalPosition, originalLocalRotation, originalLocalScale }) => {
            originalParent.addChild(entity);
            entity.setLocalPosition(originalLocalPosition);
            entity.setLocalRotation(originalLocalRotation);
            entity.setLocalScale(originalLocalScale);
          },
        );
      }
      if (exportData && exportData.rootEntity) {
        exportData.rootEntity.destroy();
      }
    }
  }

  _waitForSceneSettled() {
    if (typeof requestAnimationFrame !== "function") return Promise.resolve();
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  async downloadARFiles(format = "both", options = {}) {
    try {
      const result = await this.exportToAR(format, options);
      const timestamp = Date.now();
      const baseName = options.filename || `composition_${timestamp}`;
      if (result.glb) {
        const glbData = await result.glb.arrayBuffer();
        DownloadHelper.downloadGLB(glbData, `${baseName}.glb`);
      }
      if (result.usdz) {
        const usdzData = await result.usdz.arrayBuffer();
        DownloadHelper.download(usdzData, `${baseName}.usdz`, "model/vnd.usdz+zip");
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  getExportPreview() {
    return this.sceneCollector.getExportPreview ? this.sceneCollector.getExportPreview() : {};
  }

  validate() {
    return this.sceneCollector.validate
      ? this.sceneCollector.validate()
      : {
          valid: true,
        };
  }
}

export { ARExportService };
