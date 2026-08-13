import { CompositionManager } from "../../domain/composition/composition-manager.mjs";

function _define_property(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
class SceneCollector {
  collectAllGeometry() {
    const compositionManager = CompositionManager.instance;
    const composition = compositionManager?.getActiveComposition();
    if (!composition) {
      console.warn("[SceneCollector] No active composition found");
      return [];
    }
    const allGeometry = [];
    const allProducts = composition.getAllProducts();
    this._analyzeSceneForExclusions(this.app.root);
    Object.entries(allProducts).forEach(([productId, snapshot]) => {
      const entity = this.app.root.findByName(productId);
      if (!entity) return;
      const geometry = this.collectProductGeometry(entity, snapshot);
      if (geometry.meshes.length > 0) {
        allGeometry.push({
          productId: productId,
          productType: snapshot.entityName || snapshot.productType,
          category: snapshot.category,
          config: snapshot,
          transform: this.getWorldTransform(entity),
          meshes: geometry.meshes,
          bounds: geometry.bounds,
        });
      }
    });
    this.excludedGuids.clear();
    return allGeometry;
  }

  collectGeometryFromEntity(rootEntity) {
    const allGeometry = [];
    this._analyzeSceneForExclusions(rootEntity);
    rootEntity.children.forEach((productEntity) => {
      const geometry = this.collectProductGeometry(productEntity, {});
      if (geometry.meshes.length > 0) {
        allGeometry.push({
          productId: productEntity.name,
          productType: productEntity.name.replace("_clone", ""),
          category: "product",
          config: {},
          transform: this.getWorldTransform(productEntity),
          meshes: geometry.meshes,
          bounds: geometry.bounds,
        });
      }
    });
    this.excludedGuids.clear();
    return allGeometry;
  }

  _analyzeSceneForExclusions(rootNode) {
    if (!rootNode) return;
    this.excludedGuids.clear();
    const findCutters = (node) => {
      if (node.script && node.script.meshBoolean) {
        const cutters = node.script.meshBoolean.cutters;
        if (cutters && Array.isArray(cutters)) {
          cutters.forEach((cutterEntity) => {
            if (cutterEntity) {
              this.excludedGuids.add(cutterEntity.getGuid());
              this._markChildrenAsExcluded(cutterEntity);
            }
          });
        }
      }
      const isCutterName = ["_cutter", "cutter_"].some((p) =>
        node.name.toLowerCase().includes(p),
      );
      if (isCutterName) {
        this.excludedGuids.add(node.getGuid());
        this._markChildrenAsExcluded(node);
      }
      if (node.children) node.children.forEach((child) => findCutters(child));
    };
    findCutters(rootNode);
  }

  _markChildrenAsExcluded(entity) {
    entity.children.forEach((child) => {
      this.excludedGuids.add(child.getGuid());
      this._markChildrenAsExcluded(child);
    });
  }

  collectProductGeometry(productEntity, productSnapshot) {
    const meshes = [];
    let bounds = null;
    const traverse = (entity, depth = 0) => {
      if (!this.isExportable(entity)) return;
      const meshData = this.extractMeshData(entity, depth);
      if (meshData) {
        meshes.push(meshData);
        if (meshData.aabb) {
          if (!bounds) bounds = meshData.aabb.clone();
          else bounds.add(meshData.aabb);
        }
      }
      entity.children.forEach((child) => traverse(child, depth + 1));
    };
    traverse(productEntity);
    return {
      meshes,
      bounds,
    };
  }

  isExportable(entity) {
    if (!entity) return false;
    if (this.excludedGuids.has(entity.getGuid())) return false;
    if (!entity.enabled) return false;
    if (entity.camera || entity.light) return false;
    const nameLower = entity.name.toLowerCase();
    const hasExcludedName = SceneCollector.EXCLUDE_PATTERNS.some((pattern) =>
      nameLower.includes(pattern.toLowerCase()),
    );
    if (hasExcludedName) return false;
    return true;
  }

  extractMeshData(entity, depth) {
    const meshInstances =
      entity.render?.meshInstances || entity.model?.meshInstances;
    if (!meshInstances || meshInstances.length === 0) return null;
    const result = {
      entityName: entity.name,
      transform: this.getWorldTransform(entity),
      meshes: [],
      depth: depth,
    };
    const isTriplanar = entity.script && entity.script.triPlanarMapping;
    let tilingFactor = 1.0;
    if (isTriplanar) {
      if (entity.script.triPlanarMapping.tiling)
        tilingFactor = entity.script.triPlanarMapping.tiling;
      if (tilingFactor === 0) tilingFactor = 1.0;
    }
    meshInstances.forEach((mi, index) => {
      const mesh = mi.mesh;
      if (!mesh) return;
      const positions = [];
      const normals = [];
      let uvs = [];
      const indices = [];
      try {
        mesh.getPositions(positions);
        mesh.getNormals(normals);
        mesh.getUvs(0, uvs);
        mesh.getIndices(indices);
        if (isTriplanar || uvs.length === 0) {
          uvs = this._generateBoxUVs(positions, normals, tilingFactor);
        }
        const materialData = this.extractMaterialData(mi.material, entity);
        const exportUvs = this._applyDiffuseUvTransform(uvs, materialData);
        const entityPath = this._entityPath(entity);
        result.meshes.push({
          name: `${entity.name}_mesh_${index}`,
          entityName: entity.name,
          entityPath,
          presetClone: this._presetCloneFromPath(entityPath),
          positions: positions,
          normals: normals,
          uvs: exportUvs,
          indices: indices,
          material: materialData,
          aabb: mi.aabb ? mi.aabb.clone() : null,
          vertexCount: positions.length / 3,
          indexCount: indices.length,
        });
        if (!result.aabb && mi.aabb) {
          result.aabb = mi.aabb.clone();
        } else if (result.aabb && mi.aabb) {
          result.aabb.add(mi.aabb);
        }
      } catch (error) {}
    });
    return result.meshes.length > 0 ? result : null;
  }

  /**
   * Generates simple UV coordinates based on normals (Box Projection)
   */
  _generateBoxUVs(positions, normals, tiling = 1.0) {
    const uvs = [];
    const numVertices = positions.length / 3;
    for (let i = 0; i < numVertices; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const nx = Math.abs(normals[i * 3]);
      const ny = Math.abs(normals[i * 3 + 1]);
      const nz = Math.abs(normals[i * 3 + 2]);
      let u = 0;
      let v = 0;
      if (nx >= ny && nx >= nz) {
        u = z;
        v = y;
      } else if (ny >= nx && ny >= nz) {
        u = x;
        v = z;
      } else {
        u = x;
        v = y;
      }
      uvs.push(u * tiling);
      uvs.push(v * tiling);
    }
    return uvs;
  }
  extractMaterialData(material, entity = null) {
    if (!material) {
      return this._getDefaultMaterial();
    }
    const resolveTexture = (source) => {
      if (!source) return null;
      if (source.device && source.width) return source;
      if (typeof source === "number") {
        const asset = this.app.assets.get(source);
        if (asset && asset.resource) return asset.resource;
        return null;
      }
      if (source.data) return resolveTexture(source.data);
      return null;
    };
    let diffuseTexture = resolveTexture(material.diffuseMap);
    if (
      !diffuseTexture &&
      material._assetReferences &&
      material._assetReferences.diffuseMap
    ) {
      const assetRef = material._assetReferences.diffuseMap;
      const assetId = assetRef.id || assetRef;
      const asset = this.app.assets.get(assetId);
      if (asset && asset.resource) {
        diffuseTexture = asset.resource;
      }
    }
    if (!diffuseTexture && material.parameters) {
      const paramNames = ["texture_diffuseMap", "tri_diffuseTex", "texture_0"];
      for (const name of paramNames) {
        if (material.parameters[name]) {
          const tex = resolveTexture(material.parameters[name]);
          if (tex) {
            diffuseTexture = tex;
            break;
          }
        }
      }
    }
    let normalTexture = resolveTexture(material.normalMap);
    if (!normalTexture && material.parameters) {
      const paramNames = ["texture_normalMap", "tri_normalTex"];
      for (const name of paramNames) {
        if (material.parameters[name]) {
          normalTexture = resolveTexture(material.parameters[name]);
          if (normalTexture) break;
        }
      }
    }
    let roughnessTexture = resolveTexture(
      material.glossMap || material.metalnessMap,
    );
    let aoTexture = resolveTexture(material.aoMap || material.lightMap);
    if (!aoTexture && material.parameters) {
      const paramNames = ["texture_aoMap", "texture_lightMap", "texture_occlusionMap"];
      for (const name of paramNames) {
        if (material.parameters[name]) {
          aoTexture = resolveTexture(material.parameters[name]);
          if (aoTexture) break;
        }
      }
    }
    let baseColor = this._materialBaseColor(material);
    const opacity = material.opacity !== undefined ? material.opacity : 1.0;
    let roughness = 0.5;
    if (material.gloss !== undefined) roughness = 1.0 - material.gloss;
    else if (material.shininess !== undefined)
      roughness = 1.0 - material.shininess / 100;
    if (material.parameters && material.parameters["tri_glossiness"]) {
      const val = material.parameters["tri_glossiness"].data;
      if (typeof val === "number")
        roughness = 1.0 - (val > 1 ? val / 100 : val);
    }
    const metallic =
      material.metalness !== undefined ? material.metalness : 0.0;
    let emissive = [0, 0, 0];
    if (material.emissive) {
      emissive = [
        material.emissive.r,
        material.emissive.g,
        material.emissive.b,
      ];
    }
    const flattenReason = this._furnitureFlattenReason(entity, material);
    let exportMaterialName = material.name || `mat_${Math.floor(Math.random() * 1000)}`;
    let diffuseMapTint = null;
    if (flattenReason) {
      const keepDiffuseTexture = this._shouldKeepFurnitureDiffuseMap(material, diffuseTexture);
      const keepDetailTextures = this._shouldKeepFurnitureDetailMaps(material);
      exportMaterialName = this._furnitureExportMaterialName(material, baseColor);
      if (keepDiffuseTexture) diffuseMapTint = [...baseColor, opacity];
      else diffuseTexture = null;
      if (!keepDetailTextures) {
        normalTexture = null;
        roughnessTexture = null;
      }
      aoTexture = null;
    }
    return {
      name: exportMaterialName,
      baseColor: [...baseColor, opacity],
      metallic: metallic,
      roughness: roughness,
      emissive: emissive,
      diffuseMap: diffuseTexture,
      diffuseMapTint,
      diffuseMapTiling: this._vec2Array(material.diffuseMapTiling, [1, 1]),
      diffuseMapOffset: this._vec2Array(material.diffuseMapOffset, [0, 0]),
      diffuseMapTransform: this._textureTransform(material, "diffuse"),
      normalMapTiling: this._vec2Array(material.normalMapTiling, [1, 1]),
      normalMapOffset: this._vec2Array(material.normalMapOffset, [0, 0]),
      normalMapTransform: this._textureTransform(material, "normal"),
      roughnessMapTiling: this._vec2Array(material.glossMapTiling || material.metalnessMapTiling, [1, 1]),
      roughnessMapOffset: this._vec2Array(material.glossMapOffset || material.metalnessMapOffset, [0, 0]),
      roughnessMapTransform: this._textureTransform(material, "gloss") || this._textureTransform(material, "metalness"),
      normalMap: normalTexture,
      roughnessMap: roughnessTexture,
      metallicMap: roughnessTexture,
      occlusionMap: aoTexture,
    };
  }

  _furnitureFlattenReason(entity, material) {
    if (!entity || !material) return false;
    if (!this._isUnderEntity(entity, "FurnitureGroup_Main")) return false;

    const name = String(material.name || "");
    if (/\[AO:/i.test(name)) return "furniture material has AO variant";
    if (/(^|\s|\[)(Fabric|Leather|Base|Tape|Stitch|Arm Net|Plastic Black Noise|TM Logo|Chrome)(\s|$)/i.test(name)) {
      return "furniture material family";
    }
    return false;
  }

  _isUnderEntity(entity, ancestorName) {
    let current = entity;
    while (current) {
      if (current.name === ancestorName) return true;
      current = current.parent;
    }
    return false;
  }

  _shouldKeepFurnitureDiffuseMap(material, diffuseTexture) {
    if (!material || !diffuseTexture) return false;
    const name = String(material.name || "");
    return /\bFabric\b/i.test(name);
  }

  _shouldKeepFurnitureDetailMaps(material) {
    if (!material) return false;
    const name = String(material.name || "");
    return /\b(Fabric|Leather)\b/i.test(name);
  }

  _applyDiffuseUvTransform(uvs, materialData) {
    if (!uvs || !uvs.length) return uvs;
    if (!/^AR Furniture /i.test(String(materialData.name || ""))) return uvs;
    const transform = this._primaryUvTransform(materialData);
    if (transform.matrix) {
      const out = new Array(uvs.length);
      const row0 = transform.matrix[0];
      const row1 = transform.matrix[1];
      for (let i = 0; i < uvs.length; i += 2) {
        const u = uvs[i];
        const v = uvs[i + 1];
        out[i] = u * row0[0] + v * row0[1] + row0[2];
        out[i + 1] = u * row1[0] + v * row1[1] + row1[2];
      }
      return out;
    }
    const tiling = transform.tiling;
    const offset = transform.offset;
    const isIdentity =
      tiling[0] === 1 &&
      tiling[1] === 1 &&
      offset[0] === 0 &&
      offset[1] === 0;
    if (isIdentity) return uvs;

    const transformed = new Array(uvs.length);
    for (let i = 0; i < uvs.length; i += 2) {
      transformed[i] = uvs[i] * tiling[0] + offset[0];
      transformed[i + 1] = uvs[i + 1] * tiling[1] + offset[1];
    }
    return transformed;
  }

  _primaryUvTransform(materialData) {
    if (materialData?.diffuseMap) {
      return {
        matrix: materialData.diffuseMapTransform,
        tiling: materialData.diffuseMapTiling || [1, 1],
        offset: materialData.diffuseMapOffset || [0, 0],
      };
    }
    if (materialData?.normalMap) {
      return {
        matrix: materialData.normalMapTransform,
        tiling: materialData.normalMapTiling || [1, 1],
        offset: materialData.normalMapOffset || [0, 0],
      };
    }
    if (materialData?.roughnessMap || materialData?.metallicMap) {
      return {
        matrix: materialData.roughnessMapTransform,
        tiling: materialData.roughnessMapTiling || [1, 1],
        offset: materialData.roughnessMapOffset || [0, 0],
      };
    }
    return {
      matrix: null,
      tiling: [1, 1],
      offset: [0, 0],
    };
  }

  _materialBaseColor(material) {
    const name = String(material?.name || "");
    const shaderDiffuse = this._shaderParameterArray(material?.parameters?.material_diffuse);
    if (/\bLeather\b/i.test(name) && shaderDiffuse) return shaderDiffuse;
    return material?.diffuse
      ? [material.diffuse.r, material.diffuse.g, material.diffuse.b]
      : [1, 1, 1];
  }

  _shaderParameterArray(parameter) {
    const value = parameter?.data !== undefined ? parameter.data : parameter;
    if (!value || typeof value.length !== "number" || value.length < 3) return null;
    return [Number(value[0]), Number(value[1]), Number(value[2])];
  }

  _textureTransform(material, mapName) {
    const row0 = this._shaderParameterArray(material?.parameters?.[`texture_${mapName}MapTransform0`]);
    const row1 = this._shaderParameterArray(material?.parameters?.[`texture_${mapName}MapTransform1`]);
    if (!row0 || !row1) return null;
    return [row0, row1];
  }

  _vec2Array(value, fallback) {
    if (!value) return [...fallback];
    return [
      typeof value.x === "number" ? value.x : fallback[0],
      typeof value.y === "number" ? value.y : fallback[1],
    ];
  }

  _furnitureExportMaterialName(material, baseColor) {
    const sourceName = String(material?.name || `color ${this._formatColor(baseColor)}`);
    const cleanSourceName = sourceName
      .replace(/\s*\[AO:[^\]]+\]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return `AR Furniture ${cleanSourceName}`;
  }

  _presetCloneFromPath(path) {
    const segment = String(path || "")
      .split("/")
      .find((part) => part.includes("__"));
    if (!segment) return null;
    const parts = segment.split("__");
    if (parts.length < 3) return null;
    return {
      name: segment,
      layout: parts[0],
      group: parts[1],
      template: parts[2],
    };
  }

  _entityPath(entity) {
    const parts = [];
    let current = entity;
    while (current) {
      parts.push(current.name);
      current = current.parent;
    }
    return parts.reverse().join("/");
  }

  _formatColor(color) {
    return (color || []).map(v => this._round(v)).join(",");
  }

  _round(value) {
    return typeof value === "number" ? Math.round(value * 1000) / 1000 : value;
  }

  _getDefaultMaterial() {
    return {
      name: "default",
      baseColor: [1, 1, 1, 1],
      metallic: 0.0,
      roughness: 0.5,
    };
  }
  getWorldTransform(entity) {
    const worldTransform = entity.getWorldTransform();
    const position = entity.getPosition();
    const rotation = entity.getRotation();
    const scale = this._extractWorldScale(worldTransform);
    return {
      position: [position.x, position.y, position.z],
      rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
      scale: [scale.x, scale.y, scale.z],
      matrix: worldTransform.data,
    };
  }

  _extractWorldScale(worldTransform) {
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
  getStatistics(geometryData) {
    let totalVertices = 0,
      totalIndices = 0,
      totalMeshes = 0;
    const materials = new Set();
    geometryData.forEach((product) => {
      product.meshes.forEach((meshData) => {
        meshData.meshes.forEach((mesh) => {
          totalVertices += mesh.vertexCount;
          totalIndices += mesh.indexCount;
          totalMeshes++;
          materials.add(mesh.material.name);
        });
      });
    });
    return {
      productCount: geometryData.length,
      totalMeshes: totalMeshes,
      totalVertices: totalVertices,
      totalIndices: totalIndices,
      totalTriangles: Math.floor(totalIndices / 3),
      uniqueMaterials: materials.size,
    };
  }
  constructor(app) {
    this.app = app;
    this.excludedGuids = new Set();
  }
}
_define_property(SceneCollector, "EXCLUDE_PATTERNS", [
  "Debug",
  "Helper",
  "Gizmo",
  "Tool",
  "Label",
  "Button",
  "DimensionTool",
  "SelectTool",
  "_cutter",
  "cutter_",
  "CSG_Tool",
]);

export { SceneCollector };
