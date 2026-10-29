# Appearances

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
| `name` | `'banner' \| 'list' \| 'none'` | required | all (`'none'` renders nothing) |
| `ratio` | CSS length, e.g. `'30%'` | — | topview |
| `placement` | `'top' \| 'left' \| 'right'` | `'top'` | topview |
| `scrollable` | `boolean` | `false` (sticky) | topview |
| `file` | URL, inline HTML, or `File` | — | banner |
| `trustedHtml`, `sanitize` | see [Security](#security) | — | banner |
| `selectiontype` | `'none' \| 'single' \| 'multiple'` | `'none'` | list |
| `style` | `'none' \| 'border' \| 'shadow'` | `'none'` | list |
| `fields` | `string[]` (item keys; first = title) | `['Name']` | list |
| `gap` | CSS gap, e.g. `'1%'`, `'5px'` | `'8px'` | list |

Option values are lowercase and matched exactly. An unknown value throws a `TypeError` that lists the accepted values. Validation lives in `normalizeView` / `normalizeViews` (exported from the package root) and is shared by the vanilla and React renderers.

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

## License
MIT
