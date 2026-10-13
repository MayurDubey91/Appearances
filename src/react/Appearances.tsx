import React from 'react';
import type { AppearancesProps } from '../core/types';

export function Appearances({ items, config }: AppearancesProps) {
  // TODO: implement React renderer with different views
  return (
    <div className="appearances">
      <p>Appearances React component — {items?.length ?? 0} items</p>
      {/* render list / grid / cards / table based on config.view */}
    </div>
  );
}
