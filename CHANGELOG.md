# Changelog

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
