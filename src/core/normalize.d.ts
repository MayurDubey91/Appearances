/**
 * Option validation/normalization and selection helpers shared by the vanilla
 * and React renderers. Framework-agnostic and DOM-free.
 *
 * Option values are canonical lowercase strings and are matched exactly:
 * unknown values (including the pre-0.2 forms such as 'Banner', 'Border',
 * 'checklist', 'select one' or a 'Name||Description' fields string) throw a
 * TypeError naming the accepted values.
 */
import type { AppearanceOptions, Item, ItemId, Placement, Selection, SelectionType, SelectionValue, ViewConfig, ViewName, ViewStyle } from './types';
export declare const VIEW_NAMES: readonly ViewName[];
export declare const SELECTION_TYPES: readonly SelectionType[];
export declare const VIEW_STYLES: readonly ViewStyle[];
export declare const PLACEMENTS: readonly Placement[];
/** A view config with every option validated and defaulted. */
export interface NormalizedView extends ViewConfig {
    name: Exclude<ViewName, 'none'>;
    placement: Placement;
    scrollable: boolean;
    selectiontype: SelectionType;
    style: ViewStyle;
    fields: string[];
    gap: string;
}
/** Validate one view config and fill defaults. Returns `null` for a missing view or `name: 'none'`. */
export declare function normalizeView(view: ViewConfig | null | undefined, slot?: string): NormalizedView | null;
/**
 * Normalize both view slots. If neither `topview` nor `bottomview` is given,
 * the bottomview defaults to `{ name: 'list' }`.
 */
export declare function normalizeViews(options: Pick<AppearanceOptions, 'topview' | 'bottomview'>): {
    topview: NormalizedView | null;
    bottomview: NormalizedView | null;
};
/** Key used for an item in selection state: its `id`, falling back to its index. */
export declare function itemKey(item: Item, index: number): ItemId;
/** The instance's selection mode: that of the first list view whose selectiontype is not `'none'`. */
export declare function selectionMode(views: Array<NormalizedView | null>): SelectionType;
/** Convert a public `SelectionValue` into internal key state for the given mode. */
export declare function toSelectionKeys(value: SelectionValue | undefined, mode: SelectionType): ItemId[];
/** Keys after the user toggles `key`. Single: select it. Multiple: add or remove it. */
export declare function toggleSelectionKey(keys: ItemId[], key: ItemId, mode: SelectionType): ItemId[];
/** Drop keys that no longer match an item. */
export declare function pruneSelectionKeys(items: Item[], keys: ItemId[]): ItemId[];
/** Resolve key state to items: `Item | null` (single), `Item[]` in `items` order (multiple), `null` (none). */
export declare function resolveSelection(items: Item[], keys: ItemId[], mode: SelectionType): Selection;
