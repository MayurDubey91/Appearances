import type { AppearanceItem, AppearanceOptions, Selection, SelectionType, SelectionValue } from '../core/types';
import type { NormalizedView } from '../core/normalize.js';

/** Vanilla DOM renderer. Requires a DOM at construction time. Throws a TypeError on invalid option values. */
export declare class Appearance {
  constructor(options: AppearanceOptions);
  options: AppearanceOptions;
  container: HTMLElement;
  items: AppearanceItem[];
  /** Normalized topview (`null` if absent or `name: 'none'`). */
  topview: NormalizedView | null;
  /** Normalized bottomview (`null` if absent or `name: 'none'`). */
  bottomview: NormalizedView | null;
  /** Effective selection mode (from the first list view whose selectiontype is not `'none'`). */
  selectionMode: SelectionType;
  resolveViews(): void;
  render(): void;
  /** Current selection: `Item | null` for `'single'`, `Item[]` for `'multiple'`, `null` for `'none'`. */
  getSelection(): Selection;
  /** Set the selection by item id(s). Unknown ids are ignored. Does not call `onSelect`. */
  setSelection(value: SelectionValue): void;
  applyRatio(el: HTMLElement, view: NormalizedView, position: string): void;
  renderView(view: NormalizedView, position: string): HTMLDivElement;
  /**
   * Inline HTML is rendered in a sandboxed iframe unless `view.trustedHtml === true`;
   * `view.sanitize` is applied first if given. Unsafe URL schemes (e.g. `javascript:`) are blocked.
   */
  renderBanner(view: NormalizedView): HTMLDivElement;
  renderList(view: NormalizedView, position?: string): HTMLDivElement;
  update(newOptions: Partial<AppearanceOptions>): void;
  destroy(): void;
}

declare global {
  interface Window {
    Appearance: typeof Appearance;
  }
}
