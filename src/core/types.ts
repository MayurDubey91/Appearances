export type ViewName = 'Banner' | 'List' | 'Grid' | 'Cards' | 'Table' | string;

export interface AppearanceItem {
  id: string | number;
  [key: string]: any;
}

export interface ViewConfig {
  name: ViewName;
  // Layout (topview)
  ratio?: string; // e.g. "30%" — size percentage of container
  placement?: 'top' | 'left' | 'right'; // default 'top'
  scrollable?: boolean; // default false → sticky
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
  // List / item views
  selectiontype?: 'checklist' | 'select one';
  style?: 'Border' | 'shadow';
  fields?: string; // e.g. "Name||Description"
  gap?: string;    // "1%", "5px", etc.
}

export interface AppearanceOptions {
  container?: HTMLElement;
  items: AppearanceItem[];
  topview?: ViewConfig;
  bottomview?: ViewConfig;
}
