import { LoggerService } from '../logger/logger-service.mjs';
import { SceneEntityHelper } from '../../helpers/scene-entity-helper.mjs';

export const PRESET_FURNITURE_CLONE_MARKER = '__presetFurnitureClone';
export const PRESET_FURNITURE_TEMPLATE = '__presetFurnitureTemplate';

/** Manages preset furniture clones and the four dimension-driven anchor groups. */
export class PresetFurnitureService {
    constructor(app, boatEntity, data) {
        this.app = app;
        this.boatEntity = boatEntity;
        this.data = data;
        this.templates = new Map();
        this.groups = new Map();
        this.baseGroupPositions = new Map();
        this._initializeReferences();
    }

    rebuild(layoutKey) {
        this.clearClones();
        const layout = this.data.layouts[layoutKey];
        if (!layout) {
            LoggerService.log(this, `[PresetFurniture] layout "${layoutKey}" cleared`);
            return;
        }

        let created = 0;
        for (const definition of layout.items) {
            if (this._createClone(layoutKey, definition)) created++;
        }
        LoggerService.log(this,
            `[PresetFurniture] layout "${layoutKey}": created ${created}/${layout.items.length} clones`);
    }

    clearClones() {
        for (const group of this.groups.values()) {
            const clones = [...group.children].filter(child => child[PRESET_FURNITURE_CLONE_MARKER] === true);
            for (const clone of clones) clone.destroy();
        }
    }

    updateGroupPositions(layoutKey, offsets) {
        const layout = this.data.layouts[layoutKey] || null;
        for (const [groupName, group] of this.groups) {
            const base = this.baseGroupPositions.get(groupName);
            const common = this.data.groups[groupName];
            if (!base || !common) continue;

            const override = layout?.groupOverrides?.[groupName] || {};
            const lengthAnchor = override.lengthAnchor || common.lengthAnchor;
            const widthAnchor = override.widthAnchor || common.widthAnchor;
            const x = base.x
                + offsets.deckLength
                + (lengthAnchor === 'back' ? offsets.backLength : offsets.frontLength)
                + offsets.frontIndent;
            const z = base.z
                + (widthAnchor === 'left' ? offsets.leftWidth : 0)
                + (widthAnchor === 'right' ? offsets.rightWidth : 0);

            group.setLocalPosition(x, base.y, z);
        }
    }

    _initializeReferences() {
        // In the PlayCanvas hierarchy FurnitureGroup_Main is a sibling of
        // Boat_PC_Config under MainConfigGroup, not a descendant of the Boat entity.
        const main = SceneEntityHelper.findByName(this.app.root, 'FurnitureGroup_Main');
        if (!main) {
            LoggerService.error(this, '[PresetFurniture] FurnitureGroup_Main not found in scene hierarchy');
            return;
        }
        // These entities are runtime containers. They can be disabled in the Editor
        // while empty, but an enabled clone remains invisible under a disabled parent.
        main.enabled = true;

        for (const groupName of Object.keys(this.data.groups)) {
            const group = SceneEntityHelper.findByName(main, groupName);
            if (!group) {
                LoggerService.warn(this, `[PresetFurniture] target group "${groupName}" not found`);
                continue;
            }
            group.enabled = true;
            this.groups.set(groupName, group);
            this.baseGroupPositions.set(groupName, group.getLocalPosition().clone());
        }

        const templateNames = new Set();
        for (const layout of Object.values(this.data.layouts)) {
            for (const definition of layout.items) templateNames.add(definition.template);
        }
        for (const name of templateNames) {
            const template = SceneEntityHelper.findByName(this.app.root, name);
            if (!template) LoggerService.warn(this, `[PresetFurniture] template "${name}" not found`);
            else this.templates.set(name, template);
        }
        LoggerService.log(this,
            `[PresetFurniture] initialized: ${this.groups.size}/${Object.keys(this.data.groups).length} groups, `
            + `${this.templates.size}/${templateNames.size} templates`);
    }

    _createClone(layoutKey, definition) {
        const template = this.templates.get(definition.template);
        const group = this.groups.get(definition.group);
        if (!template || !group) {
            LoggerService.warn(this,
                `[PresetFurniture] skip "${definition.id}" (${layoutKey}): `
                + `${!template ? `template "${definition.template}"` : `group "${definition.group}"`} not found`);
            return null;
        }

        let clone = null;
        let stage = 'clone';
        try {
            clone = template.clone();
            stage = 'prepare';
            clone.enabled = false;
            clone.name = `${layoutKey}__${definition.group}__${definition.template}__${definition.id}`;
            clone[PRESET_FURNITURE_CLONE_MARKER] = true;
            clone[PRESET_FURNITURE_TEMPLATE] = definition.template;
            stage = 'attach';
            group.addChild(clone);
            stage = 'transform';
            const { position, rotation } = definition;
            clone.setLocalPosition(position.x, position.y, position.z);
            clone.setLocalEulerAngles(rotation.x, rotation.y, rotation.z);
            stage = 'enable';
            clone.enabled = true;
            return clone;
        } catch (error) {
            clone?.destroy?.();
            LoggerService.error(this,
                `[PresetFurniture] failed at ${stage} for "${definition.template}" (${definition.id}):`,
                error?.stack || error?.message || error);
            return null;
        }
    }
}
