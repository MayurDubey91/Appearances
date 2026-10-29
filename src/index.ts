// Root entry: framework-agnostic core + vanilla renderer (no React dependency).
// React component lives at the `appearances/react` subpath to keep React optional
// and avoid an `Appearance` name clash between the vanilla class and React component.
export * from './core';
export { Appearance } from './vanilla';
