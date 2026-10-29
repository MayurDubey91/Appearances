# Appearances

[![CI](https://github.com/MayurDubey91/Appearances/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MayurDubey91/Appearances/actions/workflows/ci.yml)

A flexible JS library for displaying items with different appearances (Banner, List, and more). Supports **vanilla JS** and **React**. Pure client-side — you supply the data, no API calls.

## Live demo on GitHub Pages

1. Go to the repo **Settings → Pages**
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Save. After 1–2 minutes the site will be live at:

**https://mayurdubey91.github.io/Appearances/**

> Note: On free GitHub accounts, Pages only works if the repository is **public**. Private repos need a paid plan for Pages.

### Preview without Pages (public repo)
Once the repo is public you can also use:
- https://htmlpreview.github.io/?https://github.com/MayurDubey91/Appearances/blob/main/index.html
- https://htmlpreview.github.io/?https://github.com/MayurDubey91/Appearances/blob/main/examples/standalone.html

## Features
- `topview` / `bottomview`
- Banner (image, video, pdf, html, other)
- List (`selectiontype`, `style`, `fields`, `gap`) with single/multiple selection

## Quick start (vanilla)
```js
import { Appearance } from 'appearances';

const instance = new Appearance({
  container: document.getElementById('app'),
  items: data,
  topview: { name: 'banner', file: 'https://example.com/banner.jpg' },
  bottomview: {
    name: 'list',
    selectiontype: 'multiple',
    style: 'border',
    fields: ['Name', 'Description'],
    gap: '1%'
  },
  onSelect: (selected, { index, item }) => console.log(selected)
});
```

See [examples/usage.html](examples/usage.html) and [examples/example.html](examples/example.html).

## API

### Options (`new Appearance(options)` / `<Appearance {...props} />`)

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `container` | `HTMLElement` | — | Vanilla only, required. |
| `items` | `Item[]` | `[]` | `Item = { id: string \| number, [key]: any }`. |
| `topview` / `bottomview` | `ViewConfig` | see below | If both are omitted, `bottomview` is `{ name: 'list' }`. |
| `defaultSelected` | `ItemId \| ItemId[] \| null` | `null` | Initial (uncontrolled) selection, by item id. |
| `selected` | `ItemId \| ItemId[] \| null` | — | React only: controlled selection. |
| `onSelect` | `(selected: Item \| Item[], info: { index: number, item: Item }) => void` | — | Called when the user toggles an item. `selected` is an `Item` for `'single'`, `Item[]` for `'multiple'`. |

### View options (`ViewConfig`)

| Option | Values | Default | Applies to |
| --- | --- | --- | --- |
| `name` | `'banner' \| 'list' \| 'grid' \| 'cards' \| 'table' \| 'none'` | required | all (`'none'` renders nothing) |
| `ratio` | CSS length, e.g. `'30%'` | — | topview |
| `placement` | `'top' \| 'left' \| 'right'` | `'top'` | topview |
| `scrollable` | `boolean` | `false` (sticky) | topview |
| `file` | URL, inline HTML, or `File` | — | banner |
| `trustedHtml`, `sanitize` | see [Security](#security) | — | banner |
| `selectiontype` | `'none' \| 'single' \| 'multiple'` | `'none'` | list, grid, cards, table |
| `style` | `'none' \| 'border' \| 'shadow'` | `'none'` | list, grid, cards, table |
| `fields` | `string[]` (item keys; first = title) | `['Name']` | list, grid, cards, table |
| `gap` | CSS gap, e.g. `'1%'`, `'5px'` | `'8px'` | list, grid, cards |
| `columns` | positive integer or `'auto'` | `'auto'` | grid, cards |
| `image` | item key holding an image URL (checked with `safeUrl`) | — | grid, cards |
| `footer` | item key shown in the card footer | — | cards |
| `headers` | `string[]` header labels (in `fields` order) | field names | table |
| `sortable` | `boolean` (click a header: asc, then desc) | `false` | table |
| `sticky` | `boolean` sticky header row | `false` | table |

Option values are lowercase and matched exactly. An unknown value throws a `TypeError` that lists the accepted values. Validation lives in `normalizeView` / `normalizeViews` (exported from the package root) and is shared by the vanilla and React renderers.

### Grid, cards and table (0.3.0)

The same config object works for both builds.

Vanilla (one script tag, global `Appearance`):

```html
<script src="https://unpkg.com/appearances/dist/appearances.global.js"></script>
<div id="app"></div>
<script>
  const grid = new Appearance({
    container: document.getElementById('app'),
    items,
    bottomview: { name: 'grid', columns: 'auto', gap: '12px', fields: ['Name', 'Price'], image: 'Image', selectiontype: 'multiple', style: 'shadow' },
    onSelect: (selected) => console.log(selected),
  });
  grid.setSelection([1, 3]);
</script>
```

React:

```tsx
import { Appearance } from 'appearances/react';

<Appearance items={items} bottomview={{ name: 'cards', columns: 3, fields: ['Name', 'Description'], image: 'Image', footer: 'Price', selectiontype: 'single' }} onSelect={setPicked} />

<Appearance items={items} bottomview={{ name: 'table', fields: ['Name', 'Price'], headers: ['Product', 'Price'], sortable: true, sticky: true, selectiontype: 'multiple' }} />
```

- **grid**: responsive CSS grid of tiles. `fields[0]` is the tile title. Other fields are shown below it. `image` is optional.
- **cards**: an optional `image`, a title from `fields[0]`, descriptions from `fields[1..]`, and an optional `footer` field.
- **table**: a semantic `<table>` with `<th scope="col">`. With `sortable`, each header is a button and gets `aria-sort`. Sorting is locale-aware, numbers sort numerically, and empty values go last. With `selectiontype`, each row gets a checkbox or radio.
- Selection works the same as in `list`: `onSelect`, `getSelection`/`setSelection`, `defaultSelected`, and React `selected`, all by item id. All values are rendered as text, and image URLs that fail `safeUrl` are dropped.

Demos: `examples/grid.html`, `examples/cards.html`, `examples/table.html`.

### Selection

The selection mode comes from the first list view whose `selectiontype` is not `'none'`. Selection is tracked by item `id` (strict equality), and ids that no longer match an item are dropped.

Vanilla:
```js
const a = new Appearance({ container, items, defaultSelected: [1],
  bottomview: { name: 'list', selectiontype: 'multiple' },
  onSelect: (selected, { index, item }) => {} });

a.getSelection();      // Item | null ('single'), Item[] ('multiple'), null ('none')
a.setSelection([2, 3]); // by id; does not call onSelect
```

React (controlled, or pass `defaultSelected` for uncontrolled):
```jsx
import { Appearance } from 'appearances/react';

const [selected, setSelected] = useState(null);
<Appearance
  items={items}
  bottomview={{ name: 'list', selectiontype: 'single', fields: ['Name', 'Description'] }}
  selected={selected}
  onSelect={(item) => setSelected(item.id)}
/>
```

### Breaking changes in 0.2.0

The pre-0.2 option forms were removed, with no aliases and no deprecation period. Using one now throws a `TypeError`:

| 0.1.x | 0.2.0 |
| --- | --- |
| `name: 'Banner' \| 'List' \| 'None'` (and `'Grid'`, `'Cards'`, `'Table'`, which rendered as a list) | `name: 'banner' \| 'list' \| 'none'` |
| `selectiontype: 'checklist'` | `selectiontype: 'multiple'` |
| `selectiontype: 'select one'` | `selectiontype: 'single'` |
| `style: 'Border'` | `style: 'border'` |
| `fields: 'Name\|\|Description'` | `fields: ['Name', 'Description']` |

See [CHANGELOG.md](CHANGELOG.md).

## Repo structure
```
index.html              # Self-contained demo (for Pages)
examples/
  standalone.html       # Fully inlined demo
  usage.html
  example.html
src/
  core/                 # Types, option normalization, sanitize helpers
  vanilla/Appearance.js # Vanilla DOM renderer
  react/                # React component
```

## Security

Defaults are safe for untrusted item data and banner content:

- **Item fields** (List `fields`, names, descriptions) are always rendered as text (`textContent` / React text nodes), never parsed as HTML.
- **Banner URLs** (image, video, pdf, link) are validated: only `http:`, `https:`, `blob:`, relative URLs, and `data:image/*` (images only) are allowed. `javascript:` and other schemes are blocked.
- **Inline HTML banners** (`file` starting with `<`) render inside `<iframe sandbox="" srcdoc>` — no scripts, no same-origin access.

Opt-ins on the Banner view config:

- `trustedHtml: true` — inject the HTML directly into the page (`innerHTML` / `dangerouslySetInnerHTML`). Only for HTML you control.
- `sanitize: (html) => string` — hook applied before rendering, e.g. with [DOMPurify](https://github.com/cure53/DOMPurify) (not bundled):

```js
topview: { name: 'Banner', file: html, trustedHtml: true, sanitize: (h) => DOMPurify.sanitize(h) }
```

`escapeHtml` and `safeUrl` are exported from the package root for your own templates.

## Development

Requires Node 18+.

```bash
npm ci                 # install exact dependencies from package-lock.json
npm run build          # build dist/ with tsup (ESM, CJS, IIFE + types)
npm test               # unit tests (Vitest + jsdom, React Testing Library)
npm run test:watch     # tests in watch mode
npm run test:coverage  # tests with V8 coverage report
npm run ci             # typecheck, build, test, smoke:security, smoke:api
```

Tests live in `tests/`. CI (`.github/workflows/ci.yml`) runs `npm run ci` on Node 18, 20 and 22 for pushes and pull requests to `main`.

## License
MIT
