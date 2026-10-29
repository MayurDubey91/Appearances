import type { AppearanceItem, AppearanceOptions, ViewConfig } from '../core/types';

/** Vanilla DOM renderer. Requires a DOM at construction time. */
export declare class Appearance {
  constructor(options: AppearanceOptions);
  options: AppearanceOptions;
  container: HTMLElement;
  items: AppearanceItem[];
  topview: ViewConfig | null | undefined;
  bottomview: ViewConfig | null | undefined;
  resolveViews(): void;
  render(): void;
  applyRatio(el: HTMLElement, view: ViewConfig, position: string): void;
  renderView(view: ViewConfig, position: string): HTMLDivElement;
  /**
   * Inline HTML is rendered in a sandboxed iframe unless `view.trustedHtml === true`;
   * `view.sanitize` is applied first if given. Unsafe URL schemes (e.g. `javascript:`) are blocked.
   */
  renderBanner(view: ViewConfig): HTMLDivElement;
  renderList(view: ViewConfig): HTMLDivElement;
  update(newOptions: Partial<AppearanceOptions>): void;
  destroy(): void;
}

declare global {
  interface Window {
    Appearance: typeof Appearance;
  }
}
