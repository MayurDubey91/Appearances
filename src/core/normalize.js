export const VIEW_NAMES = ['banner', 'list', 'grid', 'cards', 'table', 'none'];
/** Views that render items and can drive selection. */
export const ITEM_VIEWS = ['list', 'grid', 'cards', 'table'];
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
    const base = {
        ...view,
        name,
        placement: oneOf(`${slot}.placement`, view.placement, PLACEMENTS, 'top'),
        scrollable: view.scrollable === true,
        selectiontype: oneOf(`${slot}.selectiontype`, view.selectiontype, SELECTION_TYPES, 'none'),
        style: oneOf(`${slot}.style`, view.style, VIEW_STYLES, 'none'),
        fields: normalizeFields(`${slot}.fields`, view.fields),
        gap: view.gap ?? '8px',
    };
    if (name === 'grid' || name === 'cards') {
        base.columns = normalizeColumns(`${slot}.columns`, view.columns);
        base.image = normalizeFieldName(`${slot}.image`, view.image);
    }
    if (name === 'cards')
        base.footer = normalizeFieldName(`${slot}.footer`, view.footer);
    if (name === 'table') {
        base.headers = normalizeHeaders(`${slot}.headers`, view.headers);
        base.sortable = normalizeBool(`${slot}.sortable`, view.sortable);
        base.sticky = normalizeBool(`${slot}.sticky`, view.sticky);
    }
    return base;
}
function normalizeColumns(key, value) {
    if (value === undefined || value === 'auto')
        return 'auto';
    if (typeof value === 'number' && Number.isInteger(value) && value > 0)
        return value;
    throw new TypeError(`Appearance: invalid ${key} ${JSON.stringify(value)}. Expected 'auto' or a positive integer.`);
}
function normalizeFieldName(key, value) {
    if (value === undefined)
        return undefined;
    if (typeof value === 'string' && value.trim())
        return value.trim();
    throw new TypeError(`Appearance: invalid ${key} ${JSON.stringify(value)}. Expected an item key (non-empty string).`);
}
function normalizeHeaders(key, value) {
    if (value === undefined)
        return undefined;
    if (Array.isArray(value) && value.every((h) => typeof h === 'string'))
        return value.slice();
    throw new TypeError(`Appearance: invalid ${key} ${JSON.stringify(value)}. Expected an array of strings.`);
}
function normalizeBool(key, value) {
    if (value === undefined)
        return false;
    if (typeof value === 'boolean')
        return value;
    throw new TypeError(`Appearance: invalid ${key} ${JSON.stringify(value)}. Expected one of: true, false.`);
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
/** The instance's selection mode: that of the first item view (list/grid/cards/table) whose selectiontype is not `'none'`. */
export function selectionMode(views) {
    for (const v of views) {
        if (v && ITEM_VIEWS.includes(v.name) && v.selectiontype !== 'none')
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
// ---------------------------------------------------------------------------
// Shared rendering helpers (grid / cards / table)
// ---------------------------------------------------------------------------
/** Text for an item field: `''` for null/undefined, otherwise `String(value)`. Always rendered as text. */
export function fieldText(item, field) {
    const v = item == null ? undefined : item[field];
    return v == null ? '' : String(v);
}
/** CSS `grid-template-columns` for a `columns` option. */
export function gridTemplate(columns, min = '180px') {
    return columns === 'auto' ? `repeat(auto-fill, minmax(${min}, 1fr))` : `repeat(${columns}, minmax(0, 1fr))`;
}
/** Border / shadow for an item tile, matching the list styles. */
export function tileStyle(style) {
    if (style === 'border')
        return { border: '1px solid #d1d5db', boxShadow: 'none' };
    if (style === 'shadow')
        return { border: '1px solid transparent', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
    return { border: '1px solid #e5e7eb', boxShadow: 'none' };
}
/** Header labels for a table: `headers[i]` when given, else the field name. */
export function tableHeaders(view) {
    return view.fields.map((f, i) => (view.headers && typeof view.headers[i] === 'string' ? view.headers[i] : f));
}
const collator = typeof Intl !== 'undefined' ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }) : null;
/** Locale-aware comparison; numbers (and numeric strings) compare numerically; empty values sort last. */
export function compareValues(a, b) {
    const ea = a == null || a === '';
    const eb = b == null || b === '';
    if (ea || eb)
        return ea === eb ? 0 : ea ? 1 : -1;
    const na = typeof a === 'number' ? a : typeof a === 'string' && a.trim() !== '' && !isNaN(Number(a)) ? Number(a) : NaN;
    const nb = typeof b === 'number' ? b : typeof b === 'string' && b.trim() !== '' && !isNaN(Number(b)) ? Number(b) : NaN;
    if (!isNaN(na) && !isNaN(nb))
        return na - nb;
    return collator ? collator.compare(String(a), String(b)) : String(a).localeCompare(String(b));
}
/** Indices of `items` sorted by `field` (stable). `dir` is `'asc'` or `'desc'`; without a field returns original order. */
export function sortedIndices(items, field, dir = 'asc') {
    const idx = items.map((_, i) => i);
    if (!field)
        return idx;
    const sign = dir === 'desc' ? -1 : 1;
    return idx.sort((i, j) => {
        const a = items[i] == null ? undefined : items[i][field];
        const b = items[j] == null ? undefined : items[j][field];
        const ea = a == null || a === '';
        const eb = b == null || b === '';
        if (ea || eb)
            return ea === eb ? i - j : ea ? 1 : -1; // empties always last
        return sign * compareValues(a, b) || i - j;
    });
}
/** Next sort state after clicking `field`: asc first, then toggles asc/desc. */
export function nextSort(current, field) {
    if (current && current.field === field)
        return { field, dir: current.dir === 'asc' ? 'desc' : 'asc' };
    return { field, dir: 'asc' };
}
/** `aria-sort` value for a header. */
export function ariaSort(sort, field) {
    if (!sort || sort.field !== field)
        return 'none';
    return sort.dir === 'asc' ? 'ascending' : 'descending';
}
