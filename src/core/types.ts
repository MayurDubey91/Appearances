export type ViewName = 'Banner' | 'List' | 'Grid' | 'Cards' | 'Table' | string;

export interface AppearanceItem {
  id: string | number;
  [key: string]: any;
}

export interface ViewConfig {
  name: ViewName;
  // Layout
  ratio?: string; // e.g. "30%" — height percentage of container
  // Banner
  file?: string | File;
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
