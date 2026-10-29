import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Appearance } from '../src/vanilla/Appearance.js';

const items = [
  { id: 1, Name: 'Alpha', Description: 'first', Price: '$1' },
  { id: 2, Name: 'Beta', Description: 'second', Price: '$2' },
  { id: 3, Name: 'Gamma', Description: 'third', Price: '$3' },
];
let c: HTMLElement;
const inputs = () => [...c.querySelectorAll('input')] as HTMLInputElement[];
const rows = () => [...c.querySelectorAll('.appearance-item')].map((r) => r.textContent);

beforeEach(() => {
  document.body.innerHTML = '<div id="c"></div><div id="d"></div>';
  c = document.getElementById('c')!;
});

describe('vanilla Appearance: rendering', () => {
  it('requires a container', () => {
    expect(() => new Appearance({ items } as any)).toThrow(/container is required/);
  });
  it('defaults to a list of Name', () => {
    const a = new Appearance({ container: c, items });
    expect(rows()).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(a.selectionMode).toBe('none');
    expect(a.getSelection()).toBeNull();
    expect(c.style.display).toBe('flex');
    expect(c.style.minHeight).toBe('400px');
  });
  it('renders fields array in order, first is title', () => {
    new Appearance({ container: c, items, bottomview: { name: 'list', style: 'border', fields: ['Name', 'Description', 'Price'], gap: '4px' } });
    expect(rows()).toEqual(['Alphafirst$1', 'Betasecond$2', 'Gammathird$3']);
    expect(c.querySelector('.appearance-item strong')!.textContent).toBe('Alpha');
    expect((c.querySelector('.appearance-item') as HTMLElement).style.border).toBe('1px solid rgb(209, 213, 219)');
  });
  it('shadow style and title fallback', () => {
    new Appearance({ container: c, items: [{ id: 1 }, { id: 2, name: 'lower' }], bottomview: { name: 'list', style: 'shadow', fields: ['Title'] } });
    expect(rows()).toEqual(['Item 1', 'lower']);
    expect((c.querySelector('.appearance-item') as HTMLElement).style.boxShadow).toContain('rgba');
  });
  it('renders item data as text, never HTML', () => {
    const payload = '<img src=x onerror=alert(1)>';
    new Appearance({ container: c, items: [{ id: 1, Name: payload, D: payload }], bottomview: { name: 'list', fields: ['Name', 'D'] } });
    expect(c.querySelector('img')).toBeNull();
    expect(c.textContent).toContain(payload);
  });
  it('rejects pre-0.2 option forms', () => {
    expect(() => new Appearance({ container: c, items, bottomview: { name: 'List' } as any })).toThrow(TypeError);
    expect(() => new Appearance({ container: c, items, bottomview: { name: 'list', fields: 'Name||D' } as any })).toThrow(TypeError);
  });
});

describe('vanilla Appearance: banner + layout', () => {
  it('renders image banner with ratio and sticky topview above the list', () => {
    new Appearance({ container: c, items, topview: { name: 'banner', file: 'https://x/a.png', ratio: '30%' }, bottomview: { name: 'list' } });
    const top = c.firstElementChild as HTMLElement;
    expect(top.className).toBe('appearance-top appearance-banner');
    expect(top.style.height).toBe('30%');
    expect(top.style.position).toBe('sticky');
    expect(c.querySelector('img')!.getAttribute('src')).toBe('https://x/a.png');
    expect(c.lastElementChild!.className).toBe('appearance-bottom appearance-list');
  });
  it('placement left/right orders views in a row', () => {
    new Appearance({ container: c, items, topview: { name: 'banner', file: 'a.png', placement: 'right', ratio: '20%', scrollable: true }, bottomview: { name: 'list' } });
    expect(c.style.flexDirection).toBe('row');
    expect(c.lastElementChild!.className).toContain('appearance-top');
    expect((c.lastElementChild as HTMLElement).style.width).toBe('20%');
    expect((c.lastElementChild as HTMLElement).style.position).toBe('');
    new Appearance({ container: c, items, topview: { name: 'banner', file: 'a.png', placement: 'left' }, bottomview: { name: 'list' } });
    expect(c.firstElementChild!.className).toContain('appearance-top');
  });
  it('no file, video, pdf and link banners', () => {
    new Appearance({ container: c, items: [], topview: { name: 'banner' } });
    expect(c.textContent).toMatch(/no file/);
    new Appearance({ container: c, items: [], topview: { name: 'banner', file: 'clip.mp4' } });
    expect(c.querySelector('video')!.getAttribute('src')).toBe('clip.mp4');
    new Appearance({ container: c, items: [], topview: { name: 'banner', file: 'doc.pdf' } });
    expect(c.querySelector('iframe')!.getAttribute('src')).toBe('doc.pdf');
    new Appearance({ container: c, items: [], topview: { name: 'banner', file: 'page.html' } });
    const a = c.querySelector('a')!;
    expect(a.getAttribute('href')).toBe('page.html');
    expect(a.rel).toBe('noopener noreferrer');
  });
  it('falls back to a link when an image fails to load', () => {
    new Appearance({ container: c, items: [], topview: { name: 'banner', file: 'https://x/a.png' } });
    c.querySelector('img')!.dispatchEvent(new Event('error'));
    expect(c.querySelector('img')).toBeNull();
    expect(c.querySelector('a')!.getAttribute('href')).toBe('https://x/a.png');
  });
  it.each(['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'data:video/mp4,AA'])(
    'blocks unsafe banner URL %j', (file) => {
      new Appearance({ container: c, items: [], topview: { name: 'banner', file } });
      expect(c.querySelector('a, img, iframe, video')).toBeNull();
      expect(c.textContent).toMatch(/blocked/);
    });
  it('renders inline HTML in a sandboxed iframe by default', () => {
    const payload = '<img src=x onerror=alert(1)>';
    new Appearance({ container: c, items: [], topview: { name: 'banner', file: payload } });
    const f = c.querySelector('iframe')!;
    expect(f.getAttribute('sandbox')).toBe('');
    expect(f.srcdoc).toBe(payload);
    expect(c.querySelector('img')).toBeNull();
  });
  it('sanitize hook applies to sandboxed HTML too', () => {
    new Appearance({ container: c, items: [], topview: { name: 'banner', file: '<b>x</b>', sanitize: () => '<i>clean</i>' } });
    expect(c.querySelector('iframe')!.srcdoc).toBe('<i>clean</i>');
  });
  it('trustedHtml + sanitize injects sanitized HTML', () => {
    const sanitize = vi.fn((h: string) => h.replace(/\s+on\w+=[^\s>]+/g, ''));
    new Appearance({ container: c, items: [], topview: { name: 'banner', file: '<img src=x onerror=alert(1)>', trustedHtml: true, sanitize } });
    expect(sanitize).toHaveBeenCalledOnce();
    const img = c.querySelector('img')!;
    expect(img).not.toBeNull();
    expect(img.hasAttribute('onerror')).toBe(false);
    expect(c.querySelector('iframe')).toBeNull();
  });
  it('File banners use object URLs that are revoked on re-render and destroy', () => {
    const create = vi.fn(() => 'blob:https://x/1');
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const a = new Appearance({ container: c, items: [], topview: { name: 'banner', file } });
    expect(create).toHaveBeenCalledOnce();
    expect(c.querySelector('img')).not.toBeNull();
    a.update({});
    expect(revoke).toHaveBeenCalledTimes(1);
    a.destroy();
    expect(revoke).toHaveBeenCalledTimes(2);
  });
});

describe('vanilla Appearance: selection', () => {
  it('none: no inputs, selection ignored', () => {
    const a = new Appearance({ container: c, items, defaultSelected: 1, bottomview: { name: 'list', selectiontype: 'none' } });
    a.setSelection([1, 2]);
    expect(a.getSelection()).toBeNull();
    expect(inputs()).toHaveLength(0);
  });
  it('single: onSelect, getSelection, setSelection', () => {
    const onSelect = vi.fn();
    const a = new Appearance({ container: c, items, bottomview: { name: 'list', selectiontype: 'single' }, onSelect });
    expect(inputs().every((i) => i.type === 'radio' && !i.checked)).toBe(true);
    inputs()[1].click();
    expect(onSelect).toHaveBeenCalledWith(items[1], { index: 1, item: items[1] });
    expect(a.getSelection()).toBe(items[1]);
    inputs()[2].click();
    expect(inputs().map((i) => i.checked)).toEqual([false, false, true]);
    a.setSelection(1);
    expect(a.getSelection()).toBe(items[0]);
    expect(inputs().map((i) => i.checked)).toEqual([true, false, false]);
    expect(onSelect).toHaveBeenCalledTimes(2);
    a.setSelection(null);
    expect(a.getSelection()).toBeNull();
  });
  it('multiple: toggle, onSelect with array, setSelection prunes unknown ids', () => {
    const onSelect = vi.fn();
    const a = new Appearance({ container: c, items, bottomview: { name: 'list', selectiontype: 'multiple' }, onSelect });
    expect(a.getSelection()).toEqual([]);
    inputs()[2].click();
    inputs()[0].click();
    expect(onSelect).toHaveBeenLastCalledWith([items[0], items[2]], { index: 0, item: items[0] });
    inputs()[2].click();
    expect(onSelect).toHaveBeenLastCalledWith([items[0]], { index: 2, item: items[2] });
    a.setSelection([2, 3, 99]);
    expect(a.getSelection()).toEqual([items[1], items[2]]);
    expect(inputs().map((i) => i.checked)).toEqual([false, true, true]);
  });
  it('items without id are keyed by index', () => {
    const noId = [{ Name: 'a' }, { Name: 'b' }] as any;
    const a = new Appearance({ container: c, items: noId, defaultSelected: 1, bottomview: { name: 'list', selectiontype: 'single' } });
    expect(a.getSelection()).toBe(noId[1]);
  });
  it('defaultSelected + update keeps and prunes selection', () => {
    const a = new Appearance({ container: c, items, defaultSelected: [1, 3], bottomview: { name: 'list', selectiontype: 'multiple' } });
    expect(inputs().map((i) => i.checked)).toEqual([true, false, true]);
    a.update({ items: items.slice(0, 2) });
    expect(a.getSelection()).toEqual([items[0]]);
    a.update({ bottomview: { name: 'list', selectiontype: 'single' } });
    expect(a.getSelection()).toBe(items[0]);
  });
  it('only the first selectable list is interactive', () => {
    new Appearance({ container: c, items, topview: { name: 'list', selectiontype: 'single' }, bottomview: { name: 'list', selectiontype: 'multiple' } });
    const boxes = inputs().filter((i) => i.type === 'checkbox');
    expect(boxes).toHaveLength(3);
    expect(boxes.every((b) => b.disabled)).toBe(true);
  });
  it('radio group names are unique per instance', () => {
    const d = document.getElementById('d')!;
    new Appearance({ container: c, items, bottomview: { name: 'list', selectiontype: 'single' } });
    new Appearance({ container: d, items, bottomview: { name: 'list', selectiontype: 'single' } });
    expect(c.querySelector('input')!.name).not.toBe(d.querySelector('input')!.name);
  });
});

describe('vanilla Appearance: destroy', () => {
  it('empties the container and detaches handlers', () => {
    const onSelect = vi.fn();
    const a = new Appearance({ container: c, items, bottomview: { name: 'list', selectiontype: 'single' }, onSelect });
    const first = inputs()[0];
    a.destroy();
    expect(c.childElementCount).toBe(0);
    first.click();
    expect(onSelect).not.toHaveBeenCalled();
  });
  it('is safe to call twice', () => {
    const a = new Appearance({ container: c, items });
    a.destroy();
    expect(() => a.destroy()).not.toThrow();
  });
});
