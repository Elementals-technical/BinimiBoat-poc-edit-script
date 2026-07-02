import { BOAT_ATTRIBUTES } from '../../domain/product/attributes/attributes-catalog.mjs';
import { SceneEntityHelper } from '../../helpers/scene-entity-helper.mjs';

/**
 * TestUIPanel — дефолтний тестовий UI конфігуратора (dev-режим).
 *
 * Вмикається URL-параметром: ?testui (див. SceneManager).
 * Панель будується DATA-DRIVEN з attributes-catalog:
 *   - type 'number' → range-слайдер з min/max/step каталогу + точне число;
 *   - type 'enum'   → select з labels каталогу (матеріали, типи забору).
 * Кожна зміна → window.ConfiguratorAPI.setConfiguration({key: value});
 * результат (changed/rejected/placementConflicts) — у лог-рядку знизу.
 *
 * Додатково: секція Furniture — колір усіх меблів (batch), add/remove
 * елементів FurnitureLayout для тестування reconcile.
 */
export class TestUIPanel {

    static mount(app) {
        if (document.getElementById('bimini-test-ui')) return; // один інстанс
        const api = window.ConfiguratorAPI;
        if (!api) { console.warn('[TestUI] ConfiguratorAPI відсутній'); return; }

        const panel = document.createElement('div');
        panel.id = 'bimini-test-ui';
        panel.style.cssText = [
            'position:fixed', 'top:0', 'right:0', 'width:300px', 'max-height:100vh',
            'overflow-y:auto', 'background:rgba(20,22,26,.92)', 'color:#e8e8e8',
            'font:12px/1.45 monospace', 'padding:12px', 'z-index:9999',
            'border-left:1px solid #444', 'box-sizing:border-box'
        ].join(';');
        document.body.appendChild(panel);

        // ІЗОЛЯЦІЯ ВІД СЦЕНИ: жодна подія миші/тачу/колеса з панелі не досягає
        // канваса — інакше orbit-камера крутиться, поки тягнеш слайдер.
        for (const evt of ['pointerdown', 'pointermove', 'pointerup',
                           'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick',
                           'wheel', 'touchstart', 'touchmove', 'touchend', 'contextmenu']) {
            panel.addEventListener(evt, e => e.stopPropagation());
        }

        panel.appendChild(this._h('BIMINI TEST UI', 14));

        // ── лог результату ──
        const log = document.createElement('div');
        log.style.cssText = 'color:#8f8;white-space:pre-wrap;margin:6px 0;min-height:28px;font-size:11px';
        const report = (r) => {
            log.style.color = r.rejected?.length ? '#f88' : '#8f8';
            log.textContent = `changed: [${r.changed}]`
                + (r.rejected?.length ? `\nrejected: [${r.rejected}]` : '')
                + (r.placementConflicts?.length ? `\nconflicts: [${r.placementConflicts}]` : '');
        };
        const send = (patch) => api.setConfiguration(patch).then(report).catch(e => {
            log.style.color = '#f88'; log.textContent = String(e);
        });

        // ── BOAT: всі атрибути з каталогу ──
        panel.appendChild(this._h('Boat'));
        const current = api.getConfiguration();
        for (const attr of Object.values(BOAT_ATTRIBUTES)) {
            const cur = current[attr.key];
            if (attr.type === 'number') panel.appendChild(this._range(attr, cur, v => send({ [attr.key]: v })));
            else if (attr.type === 'enum') panel.appendChild(this._select(attr, cur, v => send({ [attr.key]: v })));
        }
        panel.appendChild(log);
        // Furniture-блок прибрано (2026-07-02) — повернемо, коли дійде черга до меблів.

        // ── ДІАГНОСТИКА: world Z-межі частин забору/деки (console.table) ──
        const diagBtn = document.createElement('button');
        diagBtn.textContent = 'Diag: fence Z-extents → console';
        diagBtn.style.cssText = 'width:100%;margin-top:8px;background:#357;color:#fff;border:0;padding:4px;cursor:pointer';
        diagBtn.onclick = () => {
            const names = ['boat_fence_front', 'square_fence_front', 'fence_unip',
                           'fence_unip_right', 'fence_unip_right_plane', 'fence_unip_left_plane',
                           'boat_fence_back', 'square_fence_back', 'Deck_front', 'Deck_back', 'boat_engine'];
            const rows = {};
            for (const n of names) {
                const e = app.root.findByName(n);
                if (!e) { rows[n] = { error: 'not found' }; continue; }
                const aabb = SceneEntityHelper.traverseAabb(e);
                const lp = e.getLocalPosition();
                rows[n] = {
                    enabled: e.enabled,
                    localZ: +lp.z.toFixed(4),
                    worldZmin: aabb ? +(aabb.center.z - aabb.halfExtents.z).toFixed(4) : null,
                    worldZmax: aabb ? +(aabb.center.z + aabb.halfExtents.z).toFixed(4) : null,
                    stretchZ: e.script?.smartStretch?.stretchAmount?.z ?? '—'
                };
            }
            console.table(rows);
            log.style.color = '#9cf';
            log.textContent = 'Diag → див. console.table (worldZmin/max сусідніх частин мають стикатися)';
        };
        panel.appendChild(diagBtn);

        console.log('[TestUI] mounted (?testui)');
    }

    // ═══════════════ контроли ═══════════════

    /** @private заголовок секції */
    static _h(text, size = 12) {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = `font-weight:bold;font-size:${size}px;margin:10px 0 4px;color:#fff;border-bottom:1px solid #444`;
        return el;
    }

    /** @private number → range з min/max/step каталогу + точне число */
    static _range(attr, current, onChange) {
        const wrap = document.createElement('div');
        wrap.style.margin = '6px 0';
        const label = document.createElement('div');
        label.textContent = `${attr.label} [${attr.min}…${attr.max}, step ${attr.step}]`;
        label.style.color = '#9cf';

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:6px;align-items:center';
        const range = document.createElement('input');
        Object.assign(range, { type: 'range', min: attr.min, max: attr.max, step: attr.step, value: current ?? attr.default });
        range.style.flex = '1';
        const num = document.createElement('input');
        Object.assign(num, { type: 'number', min: attr.min, max: attr.max, step: attr.step, value: current ?? attr.default });
        num.style.cssText = 'width:56px;background:#222;color:#eee;border:1px solid #555';

        // слайдер: ЖИВЕ застосування під час руху (throttle до кадру:
        // не більше одного setConfiguration за rAF, останнє значення виграє)
        let pending = null;
        let scheduled = false;
        const flush = () => {
            scheduled = false;
            if (pending !== null) { const v = pending; pending = null; onChange(v); }
        };
        range.oninput = () => {
            num.value = range.value;
            pending = Number(range.value);
            if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
        };
        range.onchange = () => { pending = Number(range.value); flush(); };
        num.onchange = () => { range.value = num.value; onChange(Number(num.value)); };

        row.append(range, num);
        wrap.append(label, row);
        return wrap;
    }

    /** @private enum → select з labels каталогу */
    static _select(attr, current, onChange) {
        const wrap = document.createElement('div');
        wrap.style.margin = '6px 0';
        const label = document.createElement('div');
        label.textContent = attr.label;
        label.style.color = '#9cf';
        const sel = document.createElement('select');
        sel.style.cssText = 'width:100%;background:#222;color:#eee;border:1px solid #555';
        for (const o of attr.values) {
            const opt = new Option(o.label, String(o.value));
            opt.selected = o.value === current;
            sel.appendChild(opt);
        }
        sel.onchange = () => {
            const raw = attr.values.find(o => String(o.value) === sel.value)?.value;
            onChange(raw);
        };
        wrap.append(label, sel);
        return wrap;
    }
}
