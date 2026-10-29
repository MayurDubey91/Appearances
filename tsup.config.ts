import { defineConfig } from 'tsup';

const entry = {
  index: 'src/index.ts',
  'react/index': 'src/react/index.ts',
  'vanilla/index': 'src/vanilla/index.ts',
};

export default defineConfig([
  {
    entry,
    format: ['esm', 'cjs'],
    // package.json has "type": "module" → esm emits .js, cjs emits .cjs
    outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
    dts: { entry },
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    target: 'es2020',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  {
    // Browser <script> build: exposes window.Appearance (vanilla class only)
    entry: { 'appearances.global': 'src/vanilla/Appearance.js' },
    format: ['iife'],
    outExtension: () => ({ js: '.js' }),
    sourcemap: true,
    minify: true,
    target: 'es2018',
    platform: 'browser',
  },
]);
