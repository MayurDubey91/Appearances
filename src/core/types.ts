export type ViewType = 'list' | 'grid' | 'cards' | 'table' | 'masonry';

export interface AppearanceItem {
  id: string | number;
  [key: string]: any;
}

export interface AppearanceConfig {
  view?: ViewType;
  // Custom renderers, themes, density, etc. will go here
}

export interface AppearancesProps {
  items: AppearanceItem[];
  config?: AppearanceConfig;
  // renderItem, columns, etc.
}
