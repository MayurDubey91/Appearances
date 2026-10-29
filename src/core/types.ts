/** Stable item identifier used for keys and selection. */
export type ItemId = string | number;

export interface AppearanceItem {
  id: ItemId;
  [key: string]: any;
}

/** Alias of {@link AppearanceItem}. */
export type Item = AppearanceItem;

/** View kinds. `'none'` renders nothing for that slot. */
export type ViewName = 'banner' | 'list' | 'grid' | 'cards' | 'table' | 'none';

/** Views that render items (and can drive selection). */
export type ItemViewName = 'list' | 'grid' | 'cards' | 'table';

/** Grid / cards column count: a positive integer or `'auto'` (responsive fill). Default `'auto'`. */
export type Columns = number | 'auto';

/** Table sort direction. */
export type SortDirection = 'asc' | 'desc';

/** Table sort state. */
export interface SortState {
  field: string;
  dir: SortDirection;
}

/** List selection mode. Default `'none'`. */
export type SelectionType = 'none' | 'single' | 'multiple';

/** List item style. Default `'none'` (subtle outline). */
export type ViewStyle = 'none' | 'border' | 'shadow';

/** Where the topview sits relative to the bottomview. Default `'top'`. */
export type Placement = 'top' | 'left' | 'right';

export interface ViewConfig {
  name: ViewName;
  // Layout (topview)
  /** Size of the topview as a CSS length, e.g. `'30%'`. */
  ratio?: string;
  placement?: Placement;
  /** Default `false` → sticky. */
  scrollable?: boolean;
  // Banner
  file?: string | File;
  /**
   * Inline-HTML banners are rendered inside `<iframe sandbox="" srcdoc>` (no
   * scripts, no same-origin access) by default. Set `trustedHtml: true` to inject
   * the HTML directly into the page instead. ONLY do this for HTML you control,
   * or combine it with `sanitize`.
   */
  trustedHtml?: boolean;
  /**
   * Optional hook applied to inline-HTML banner content before rendering
   * (both sandboxed and trusted modes), e.g. `(h) => DOMPurify.sanitize(h)`.
   */
  sanitize?: (html: string) => string;
  // List
  selectiontype?: SelectionType;
  style?: ViewStyle;
  /** Item keys to display; the first is the title. Default `['Name']`. */
  fields?: string[];
  /** CSS gap, e.g. `'1%'`, `'5px'`. */
  gap?: string;
  // Grid / cards
  /** Number of columns, or `'auto'` for a responsive fill. Default `'auto'`. */
  columns?: Columns;
  /** Item key holding an image URL (validated with `safeUrl`). */
  image?: string;
  // Cards
  /** Item key rendered in the card footer. */
  footer?: string;
  // Table
  /** Header labels, in `fields` order. Defaults to the field names. */
  headers?: string[];
  /** Click a header to sort asc/desc. Default `false`. */
  sortable?: boolean;
  /** Sticky header row. Default `false`. */
  sticky?: boolean;
}

export interface SelectInfo {
  /** Index (in `items`) of the item that was toggled. */
  index: number;
  /** The item that was toggled. */
  item: Item;
}

/**
 * Selection callback. `selected` is the selected `Item` for `selectiontype: 'single'`
 * and the array of selected items for `'multiple'`.
 */
export type OnSelect = (selected: Item | Item[], info: SelectInfo) => void;

/** Selection expressed as item ids (a single id, an array of ids, or `null` for none). */
export type SelectionValue = ItemId | ItemId[] | null;

/** Resolved selection: `Item | null` for `'single'`, `Item[]` for `'multiple'`, `null` for `'none'`. */
export type Selection = Item | Item[] | null;

export interface AppearanceOptions {
  container?: HTMLElement;
  items: Item[];
  topview?: ViewConfig;
  bottomview?: ViewConfig;
  /** Initial selection (uncontrolled), by item id. */
  defaultSelected?: SelectionValue;
  /** Called when the user toggles an item in a list/grid/cards/table view with `selectiontype` `'single'` or `'multiple'`. */
  onSelect?: OnSelect;
}
