# Appearances

A flexible JS library for displaying items with different appearances (Banner, List, and more). Supports **vanilla JS** and **React**. Pure client-side — you supply the data, no API calls.

## First draft
Basic working implementation of:
- `topview` / `bottomview`
- Banner (image, video, pdf, html, other)
- List (selectiontype, style, fields, gap)

## Quick start (vanilla)
See [examples/usage.html](examples/usage.html) and [examples/example.html](examples/example.html).

```js
const instance = new Appearance({
  container: document.getElementById('app'),
  items: data,
  topview: { name: 'Banner', file: 'https://example.com/banner.jpg' },
  bottomview: {
    name: 'List',
    selectiontype: 'checklist',
    style: 'Border',
    fields: 'Name||Description',
    gap: '1%'
  }
});
```

## Repo structure
```
src/
  core/       # Types
  vanilla/    # Appearance.js (first draft)
  react/      # React component
examples/     # usage.html + example.html
```

## License
MIT
