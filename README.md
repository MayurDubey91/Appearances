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

## First draft
Basic working implementation of:
- `topview` / `bottomview`
- Banner (image, video, pdf, html, other)
- List (selectiontype, style, fields, gap)

## Quick start (vanilla)
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

See [examples/usage.html](examples/usage.html) and [examples/example.html](examples/example.html).

## Repo structure
```
index.html              # Self-contained demo (for Pages)
examples/
  standalone.html       # Fully inlined demo
  usage.html
  example.html
src/
  core/                 # Types
  vanilla/Appearance.js # First draft class
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
