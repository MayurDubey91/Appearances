# Changelog

## 0.3.0

### Added
- New appearances `grid`, `cards` and `table`, in both the vanilla and React builds:
  - `grid`: a responsive CSS grid of tiles. Options: `columns` (a number or `'auto'`), `gap`, `fields`, and an optional `image`.
  - `cards`: cards with an optional `image`, a title (`fields[0]`), descriptions (`fields[1..]`) and an optional `footer` field.
  - `table`: a semantic `<table>`. Options: `headers`, `sortable` (locale-aware and numeric, with `aria-sort`) and a `sticky` header.
  - All three support `selectiontype` (`none`/`single`/`multiple`) and `style`, with the same selection API as `list`.
- New option validation, which throws a `TypeError`: `columns`, `image`, `footer`, `headers`, `sortable`, `sticky`.
- New core helpers: `fieldText`, `gridTemplate`, `tileStyle`, `tableHeaders`, `compareValues`, `sortedIndices`, `nextSort`, `ariaSort`, `ITEM_VIEWS`.
- New types: `Columns`, `ItemViewName`, `SortDirection`, `SortState`.
- New demos: `examples/grid.html`, `examples/cards.html`, `examples/table.html`.

### Changed
- The selection mode now comes from the first item view (`list`, `grid`, `cards` or `table`) whose `selectiontype` is not `'none'`.

### Fixed
- React: a `File` banner now renders as an image from an object URL, which is revoked on change or unmount, matching vanilla. Before, it showed "Banner (no file)". The empty-banner text now matches vanilla: "Banner (no file provided)".

## 0.2.0

### Breaking changes
- Option values are canonical lowercase and matched exactly. Unknown values throw a `TypeError` listing the accepted values. The pre-0.2 forms were removed with no aliases:
  - `name`: `'Banner' | 'List' | 'None'` → `'banner' | 'list' | 'none'`. `'Grid'`, `'Cards'`, `'Table'` (which rendered as a list) were removed from `ViewName`.
  - `selectiontype`: `'checklist'` → `'multiple'`, `'select one'` → `'single'` (and the new `'none'` default).
  - `style`: `'Border'` → `'border'` (`'shadow'` is unchanged; new `'none'` default).
  - `fields`: the `'Name||Description'` string → `['Name', 'Description']`.
- Vanilla `topview` / `bottomview` instance properties now hold normalized copies. Your option objects are no longer mutated.

### Added
- Selection API: `onSelect(selected, { index, item })`, plus `defaultSelected` (by item id).
  - Vanilla: `getSelection()` and `setSelection(ids)`.
  - React: controlled `selected` plus `onSelect`, or uncontrolled `defaultSelected`.
- `src/core/normalize.ts`: `normalizeView`, `normalizeViews`, and selection helpers, shared by both renderers and exported from the package root.
- New types: `Item`, `ItemId`, `SelectionType`, `ViewStyle`, `Placement`, `SelectInfo`, `OnSelect`, `SelectionValue`, `Selection`, and `AppearanceProps` (React).
- `npm run smoke:api`: a jsdom smoke test for the new API.

### Fixed
- Radio groups are unique per list and instance. Before, every instance shared `name="appearance-select"`.
