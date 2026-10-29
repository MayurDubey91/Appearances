import { describe, it, expect } from 'vitest';
import {
  normalizeView, normalizeViews, itemKey, selectionMode, toSelectionKeys,
  toggleSelectionKey, pruneSelectionKeys, resolveSelection,
} from '../src/core/normalize.js';

describe('normalizeView', () => {
  it('fills defaults', () => {
    expect({ ...normalizeView({ name: 'list' }) }).toEqual({
      name: 'list', placement: 'top', scrollable: false, selectiontype: 'none', style: 'none', fields: ['Name'], gap: '8px',
    });
  });
  it('keeps valid values and trims fields', () => {
    const v = normalizeView({ name: 'list', placement: 'left', scrollable: true, selectiontype: 'multiple', style: 'shadow', fields: [' Name ', '', 'Price'], gap: '2px' });
    expect(v).toMatchObject({ placement: 'left', scrollable: true, selectiontype: 'multiple', style: 'shadow', fields: ['Name', 'Price'], gap: '2px' });
  });
  it('returns null for missing or none views', () => {
    expect(normalizeView(undefined)).toBeNull();
    expect(normalizeView(null)).toBeNull();
    expect(normalizeView({ name: 'none' })).toBeNull();
  });
  it.each([
    [{ name: 'List' }, /name "List"/],
    [{ name: 'Banner' }, /name "Banner"/],
    [{ name: 'None' }, /name "None"/],
    [{}, /name undefined/],
    [{ name: 'list', style: 'Border' }, /style "Border"/],
    [{ name: 'list', placement: 'bottom' }, /placement "bottom"/],
    [{ name: 'list', selectiontype: 'checklist' }, /selectiontype "checklist"/],
    [{ name: 'list', selectiontype: 'Single' }, /selectiontype "Single"/],
    [{ name: 'list', fields: 'Name||Description' }, /fields .*array/],
    [{ name: 'list', fields: ['a', 1] }, /fields/],
  ])('rejects old/invalid form %j with TypeError', (view, re) => {
    expect(() => normalizeView(view as any)).toThrow(TypeError);
    expect(() => normalizeView(view as any)).toThrow(re);
  });
  it('rejects non-object views', () => {
    expect(() => normalizeView('list' as any, 'topview')).toThrow(/topview must be an object/);
  });
});

describe('normalizeViews', () => {
  it('defaults bottomview to list', () => {
    const v = normalizeViews({});
    expect(v.topview).toBeNull();
    expect(v.bottomview?.name).toBe('list');
  });
  it('keeps explicit slots', () => {
    const v = normalizeViews({ topview: { name: 'banner', file: 'x.png' } });
    expect(v.topview?.name).toBe('banner');
    expect(v.bottomview).toBeNull();
  });
});

describe('selection helpers', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { Name: 'no id' }] as any[];
  it('itemKey falls back to index', () => {
    expect(itemKey(items[0], 0)).toBe('a');
    expect(itemKey(items[2], 2)).toBe(2);
    expect(itemKey(null, 5)).toBe(5);
  });
  it('selectionMode picks first interactive list', () => {
    expect(selectionMode([null, normalizeView({ name: 'list' })])).toBe('none');
    expect(selectionMode([normalizeView({ name: 'list', selectiontype: 'single' }), normalizeView({ name: 'list', selectiontype: 'multiple' })])).toBe('single');
  });
  it('toSelectionKeys', () => {
    expect(toSelectionKeys(null, 'multiple')).toEqual([]);
    expect(toSelectionKeys(1, 'none')).toEqual([]);
    expect(toSelectionKeys([1, 1, 2], 'multiple')).toEqual([1, 2]);
    expect(toSelectionKeys([1, 2], 'single')).toEqual([1]);
    expect(toSelectionKeys(0, 'single')).toEqual([0]);
  });
  it('toggleSelectionKey', () => {
    expect(toggleSelectionKey([1], 2, 'single')).toEqual([2]);
    expect(toggleSelectionKey([1], 2, 'multiple')).toEqual([1, 2]);
    expect(toggleSelectionKey([1, 2], 1, 'multiple')).toEqual([2]);
    expect(toggleSelectionKey([1], 2, 'none')).toEqual([1]);
  });
  it('prune and resolve', () => {
    expect(pruneSelectionKeys(items, ['a', 'z', 2])).toEqual(['a', 2]);
    expect(resolveSelection(items, ['b', 'a'], 'multiple')).toEqual([items[0], items[1]]);
    expect(resolveSelection(items, ['b'], 'single')).toBe(items[1]);
    expect(resolveSelection(items, [], 'single')).toBeNull();
    expect(resolveSelection(items, ['a'], 'none')).toBeNull();
  });
});
