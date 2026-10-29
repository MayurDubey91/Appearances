import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Appearance } from '../src/vanilla/Appearance.js';
import { normalizeView, sortedIndices, compareValues, nextSort, ariaSort, gridTemplate, tableHeaders, selectionMode } from '../src/core/normalize.js';

const items = [
  { id: 1, Name: 'beta', Price: 10, Img: 'https://x/b.png', Note: 'n1' },
  { id: 2, Name: 'Alpha', Price: 9, Img: 'javascript:alert(1)', Note: 'n2' },
  { id: 3, Name: 'gamma', Price: 100, Note: '' },
];
const XSS = '<img src=x onerror=alert(1)>';
let c: HTMLElement;
beforeEach(() => {
  document.body.innerHTML = '<div id="c"></div>';
  c = document.getElementById('c')!;
});
const inputs = () => [...c.querySelectorAll('input')] as HTMLInputElement[];

describe('core: grid/cards/table normalization', () => {
  it('defaults', () => {
    expect(normalizeView({ name: 'grid' })).toMatchObject({ columns: 'auto', image: undefined, selectiontype: 'none' });
    expect(normalizeView({ name: 'cards', columns: 3, image: 'Img', footer: 'Price' })).toMatchObject({ columns: 3, image: 'Img', footer: 'Price' });
    expect(normalizeView({ name: 'table' })).toMatchObject({ sortable: false, sticky: false, headers: undefined });
    expect(normalizeView({ name: 'list' })).not.toHaveProperty('columns');
  });
  it('strict TypeErrors', () => {
    expect(() => normalizeView({ name: 'Grid' as any })).toThrow(/'banner', 'list', 'grid', 'cards', 'table', 'none'/);
    expect(() => normalizeView({ name: 'grid', columns: 0 })).toThrow(/'auto' or a positive integer/);
    expect(() => normalizeView({ name: 'grid', columns: '3' as any })).toThrow(TypeError);
    expect(() => normalizeView({ name: 'cards', image: 5 as any })).toThrow(/item key/);
    expect(() => normalizeView({ name: 'table', sortable: 'yes' as any })).toThrow(/true, false/);
    expect(() => normalizeView({ name: 'table', headers: 'A' as any })).toThrow(/array of strings/);
  });
  it('sorting helpers', () => {
    expect(sortedIndices(items, 'Name', 'asc')).toEqual([1, 0, 2]);
    expect(sortedIndices(items, 'Price', 'asc')).toEqual([1, 0, 2]);
    expect(sortedIndices(items, 'Price', 'desc')).toEqual([2, 0, 1]);
    expect(sortedIndices(items, 'Note', 'desc')).toEqual([1, 0, 2]); // empty last
    expect(sortedIndices(items, null)).toEqual([0, 1, 2]);
    expect(compareValues('10', '9')).toBeGreaterThan(0);
    expect(compareValues('item2', 'item10')).toBeLessThan(0);
    expect(nextSort(null, 'A')).toEqual({ field: 'A', dir: 'asc' });
    expect(nextSort({ field: 'A', dir: 'asc' }, 'A')).toEqual({ field: 'A', dir: 'desc' });
    expect(ariaSort({ field: 'A', dir: 'desc' }, 'A')).toBe('descending');
    expect(ariaSort(null, 'A')).toBe('none');
    expect(gridTemplate(3)).toBe('repeat(3, minmax(0, 1fr))');
    expect(gridTemplate('auto')).toContain('auto-fill');
    expect(tableHeaders(normalizeView({ name: 'table', fields: ['a', 'b'], headers: ['A'] })!)).toEqual(['A', 'b']);
    expect(selectionMode([normalizeView({ name: 'table', selectiontype: 'single' })])).toBe('single');
  });
});

describe('vanilla grid', () => {
  it('renders tiles, columns, safe images and text-only values', () => {
    new Appearance({ container: c, items: [...items, { id: 4, Name: XSS, Img: 'data:text/html,x' }], bottomview: { name: 'grid', columns: 2, gap: '6px', fields: ['Name', 'Note'], image: 'Img', style: 'shadow' } });
    const box = c.querySelector('.appearance-grid-item')!.parentElement as HTMLElement;
    expect(box.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(c.querySelectorAll('.appearance-grid-item')).toHaveLength(4);
    expect([...c.querySelectorAll('img')].map((i) => i.getAttribute('src'))).toEqual(['https://x/b.png']);
    expect(c.textContent).toContain(XSS);
    expect((c.querySelector('.appearance-grid-item') as HTMLElement).style.boxShadow).toContain('rgba');
  });
  it('multiple selection identical to list', () => {
    const onSelect = vi.fn();
    const a = new Appearance({ container: c, items, bottomview: { name: 'grid', selectiontype: 'multiple' }, onSelect });
    inputs()[0].click();
    inputs()[2].click();
    expect(onSelect).toHaveBeenLastCalledWith([items[0], items[2]], { index: 2, item: items[2] });
    expect(a.getSelection()).toEqual([items[0], items[2]]);
    a.setSelection(2);
    expect(inputs().map((i) => i.checked)).toEqual([false, true, false]);
  });
});

describe('vanilla cards', () => {
  it('renders image, title, descriptions and footer', () => {
    new Appearance({ container: c, items, bottomview: { name: 'cards', fields: ['Name', 'Note'], image: 'Img', footer: 'Price' } });
    const cards = c.querySelectorAll('.appearance-card');
    expect(cards).toHaveLength(3);
    expect(cards[0].querySelector('h3')!.textContent).toBe('beta');
    expect(cards[0].querySelector('p')!.textContent).toBe('n1');
    expect(cards[0].querySelector('.appearance-card-footer')!.textContent).toBe('10');
    expect(cards[1].querySelector('img')).toBeNull();
    expect(cards[2].querySelector('p')).toBeNull();
  });
  it('single selection with radios', () => {
    const a = new Appearance({ container: c, items, defaultSelected: 3, bottomview: { name: 'cards', selectiontype: 'single' } });
    expect(inputs().every((i) => i.type === 'radio' && i.name === inputs()[0].name)).toBe(true);
    expect(a.getSelection()).toEqual(items[2]);
    inputs()[0].click();
    expect(a.getSelection()).toEqual(items[0]);
  });
});

describe('vanilla table', () => {
  it('semantic markup, headers, sticky and text-only cells', () => {
    new Appearance({ container: c, items: [{ id: 1, Name: XSS, Price: 1 }], bottomview: { name: 'table', fields: ['Name', 'Price'], headers: ['Product'], sticky: true } });
    const ths = [...c.querySelectorAll('th')];
    expect(ths.map((t) => t.textContent)).toEqual(['Product', 'Price']);
    expect(ths.every((t) => t.getAttribute('scope') === 'col')).toBe(true);
    expect(ths[0].style.position).toBe('sticky');
    expect(ths[0].hasAttribute('aria-sort')).toBe(false);
    expect(c.querySelector('td')!.textContent).toBe(XSS);
    expect(c.querySelector('td img')).toBeNull();
  });
  it('sortable headers toggle asc/desc with aria-sort; selection survives', () => {
    const a = new Appearance({ container: c, items, defaultSelected: [2], bottomview: { name: 'table', fields: ['Name', 'Price'], sortable: true, selectiontype: 'multiple' } });
    const names = () => [...c.querySelectorAll('tbody tr')].map((r) => r.children[1].textContent);
    const btn = (i: number) => c.querySelectorAll('button.appearance-sort')[i] as HTMLButtonElement;
    expect(names()).toEqual(['beta', 'Alpha', 'gamma']);
    btn(1).click();
    expect(names()).toEqual(['Alpha', 'beta', 'gamma']);
    expect(c.querySelectorAll('th')[2].getAttribute('aria-sort')).toBe('ascending');
    btn(1).click();
    expect(names()).toEqual(['gamma', 'beta', 'Alpha']);
    expect(c.querySelectorAll('th')[2].getAttribute('aria-sort')).toBe('descending');
    expect(c.querySelectorAll('th')[1].getAttribute('aria-sort')).toBe('none');
    expect(inputs().map((i) => i.checked)).toEqual([false, false, true]);
    inputs()[0].click(); // gamma
    expect(a.getSelection()).toEqual([items[1], items[2]]);
  });
  it('single row selection, non-driving view disabled', () => {
    new Appearance({ container: c, items, topview: { name: 'list', selectiontype: 'multiple' }, bottomview: { name: 'table', selectiontype: 'single' } });
    const radios = inputs().filter((i) => i.type === 'radio');
    expect(radios).toHaveLength(3);
    expect(radios.every((r) => r.disabled)).toBe(true);
  });
});
