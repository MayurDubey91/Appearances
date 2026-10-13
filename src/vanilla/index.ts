import { createAppearances } from '../core';

export function Appearances(container: HTMLElement, props: any) {
  const instance = createAppearances(props);
  // TODO: mount into container
  instance.render();
  return instance;
}
