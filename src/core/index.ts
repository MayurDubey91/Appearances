export * from './types';
export * from './sanitize';

// Core framework-agnostic logic will live here
// (layout calculations, appearance resolution, etc.)
export function createAppearances(props: any) {
  // TODO: implement core renderer logic
  return {
    render: () => {
      console.log('Appearances core render', props);
    }
  };
}
