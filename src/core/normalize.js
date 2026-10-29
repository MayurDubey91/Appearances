export const VIEW_NAMES = ['banner', 'list', 'none'];
export const SELECTION_TYPES = ['none', 'single', 'multiple'];
export const VIEW_STYLES = ['none', 'border', 'shadow'];
export const PLACEMENTS = ['top', 'left', 'right'];
function oneOf(key, value, allowed, fallback) {
    if (value === undefined && fallback !== undefined)
        return fallback;
    if (typeof value === 'string' && allowed.includes(value))
        return value;
    throw new TypeError(`Appearance: invalid ${key} ${JSON.stringify(value)}. Expected one of: ${allowed.map((a) => `'${a}'`).join(', ')}.`);
}
function normalizeFields(key, value) {
    if (value === undefined)
        return ['Name'];
    if (Array.isArray(value) && value.every((f) => typeof f === 'string')) {
        return value.map((f) => f.trim()).filter(Boolean);
    }
    throw new TypeError(`Appearance: invalid ${key} ${JSON.stringify(value)}. Expected an array of item keys, e.g. ['Name', 'Description'].`);
}
/** Validate one view config and fill defaults. Returns `null` for a missing view or `name: 'none'`. */
export function normalizeView(view, slot = 'view') {
    if (view == null)
        return null;
    if (typeof view !== 'object')
        throw new TypeError(`Appearance: ${slot} must be an object.`);
    const name = oneOf(`${slot}.name`, view.name, VIEW_NAMES);
    if (name === 'none')
        return null;
    return {
        ...view,
        name,
        placement: oneOf(`${slot}.placement`, view.placement, PLACEMENTS, 'top'),
        scrollable: view.scrollable === true,
        selectiontype: oneOf(`${slot}.selectiontype`, view.selectiontype, SELECTION_TYPES, 'none'),
        style: oneOf(`${slot}.style`, view.style, VIEW_STYLES, 'none'),
        fields: normalizeFields(`${slot}.fields`, view.fields),
        gap: view.gap ?? '8px',
    };
}
/**
 * Normalize both view slots. If neither `topview` nor `bottomview` is given,
 * the bottomview defaults to `{ name: 'list' }`.
 */
export function normalizeViews(options) {
    if (options.topview == null && options.bottomview == null) {
        return { topview: null, bottomview: normalizeView({ name: 'list' }, 'bottomview') };
    }
    return {
        topview: normalizeView(options.topview, 'topview'),
        bottomview: normalizeView(options.bottomview, 'bottomview'),
    };
}
// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------
/** Key used for an item in selection state: its `id`, falling back to its index. */
export function itemKey(item, index) {
    return item != null && item.id != null ? item.id : index;
}
/** The instance's selection mode: that of the first list view whose selectiontype is not `'none'`. */
export function selectionMode(views) {
    for (const v of views) {
        if (v && v.name === 'list' && v.selectiontype !== 'none')
            return v.selectiontype;
    }
    return 'none';
}
/** Convert a public `SelectionValue` into internal key state for the given mode. */
export function toSelectionKeys(value, mode) {
    if (value == null || mode === 'none')
        return [];
    const keys = Array.from(new Set(Array.isArray(value) ? value : [value]));
    return mode === 'single' ? keys.slice(0, 1) : keys;
}
/** Keys after the user toggles `key`. Single: select it. Multiple: add or remove it. */
export function toggleSelectionKey(keys, key, mode) {
    if (mode === 'single')
        return [key];
    if (mode === 'multiple')
        return keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
    return keys;
}
/** Drop keys that no longer match an item. */
export function pruneSelectionKeys(items, keys) {
    const present = new Set(items.map(itemKey));
    return keys.filter((k) => present.has(k));
}
/** Resolve key state to items: `Item | null` (single), `Item[]` in `items` order (multiple), `null` (none). */
export function resolveSelection(items, keys, mode) {
    if (mode === 'none')
        return null;
    const set = new Set(keys);
    const selected = items.filter((item, i) => set.has(itemKey(item, i)));
    return mode === 'single' ? selected[0] ?? null : selected;
}
