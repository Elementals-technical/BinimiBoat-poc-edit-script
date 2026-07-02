import { BoundingBox } from 'playcanvas';

/**
 * Хелпери обходу сцени. (Повний порт з Hasting; `pc.BoundingBox` замінено
 * на ESM-імпорт — конвенція Bimini.)
 */
export class SceneEntityHelper {

    static MESH_STRATEGIES = [
        { key: 'render', getInstances: (ent) => ent.render?.meshInstances },
        { key: 'model', getInstances: (ent) => ent.model?.meshInstances }
    ];

    /**
     * Mesh instances з entity (render або legacy model).
     * @param {object} entity
     * @returns {Array}
     */
    static getMeshInstances(entity) {
        if (!entity) return [];
        for (const strategy of this.MESH_STRATEGIES) {
            const instances = strategy.getInstances(entity);
            if (instances && instances.length > 0) return instances;
        }
        return [];
    }

    /**
     * Рекурсивно збирає entities за точними іменами.
     * @param {object} rootEntity
     * @param {string[]} names
     * @returns {object[]}
     */
    static collectByNames(rootEntity, names) {
        const result = [];
        const nameSet = new Set(names);
        const traverse = (entity) => {
            if (nameSet.has(entity.name)) result.push(entity);
            entity.children.forEach(traverse);
        };
        traverse(rootEntity);
        return result;
    }

    /**
     * Як collectByNames, але матч по includes (частковий збіг імені).
     */
    static collectByNamesIncludes(rootEntity, names) {
        const result = [];
        const traverse = (entity) => {
            if (names.some(name => entity.name.includes(name))) result.push(entity);
            entity.children.forEach(traverse);
        };
        traverse(rootEntity);
        return result;
    }

    /**
     * Універсальний варіант: всі entities, для яких predicate(entity) === true.
     */
    static collectByPredicate(rootEntity, predicate) {
        const result = [];
        const traverse = (entity) => {
            if (predicate(entity)) result.push(entity);
            entity.children.forEach(traverse);
        };
        traverse(rootEntity);
        return result;
    }

    /**
     * Пошук одного entity за точним іменем.
     * @returns {object|null}
     */
    static findByName(rootEntity, name) {
        if (rootEntity.name === name) return rootEntity;
        for (const child of rootEntity.children) {
            const found = this.findByName(child, name);
            if (found) return found;
        }
        return null;
    }

    /**
     * Рекурсивно обчислює AABB для entity та всіх дочірніх.
     * Використовується для калібрування FURNITURE_FOOTPRINTS (layout-data.mjs).
     * @param {object} node
     * @param {string[]} [ignoreNodes] - імена нод для ігнорування (includes match)
     * @returns {BoundingBox|null}
     */
    static traverseAabb = (node, ignoreNodes = []) => {
        if (!node || !node.enabled) return null;
        if (ignoreNodes.length > 0 && ignoreNodes.some(name => node.name.includes(name))) return null;

        let total = null;

        const meshInstances = SceneEntityHelper.getMeshInstances(node);
        for (const mi of meshInstances) {
            if (!mi?.aabb) continue;
            if (!total) { total = new BoundingBox(); total.copy(mi.aabb); }
            else total.add(mi.aabb);
        }

        for (const child of node.children) {
            const childBox = SceneEntityHelper.traverseAabb(child, ignoreNodes);
            if (!childBox) continue;
            if (!total) { total = new BoundingBox(); total.copy(childBox); }
            else total.add(childBox);
        }

        return total;
    };
}
