import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { Appearance } from '../src/react/index';

afterEach(cleanup);
const items = [
  { id: 1, Name: 'beta', Price: 10, Img: 'https://x/b.png', Note: 'n1' },
  { id: 2, Name: 'Alpha', Price: 9, Img: 'javascript:alert(1)', Note: 'n2' },
  { id: 3, Name: 'gamma', Price: 100, Note: '' },
];
const XSS = '<img src=x onerror=alert(1)>';
const inputs = (c: HTMLElement) => [...c.querySelectorAll('input')] as HTMLInputElement[];

describe('React grid', () => {
  it('renders tiles with safe images and text', () => {
    const { container } = render(<Appearance items={[...items, { id: 4, Name: XSS }]} bottomview={{ name: 'grid', columns: 2, fields: ['Name', 'Note'], image: 'Img' }} />);
    expect(container.querySelectorAll('.appearance-grid-item')).toHaveLength(4);
    expect([...container.querySelectorAll('img')].map((i) => i.getAttribute('src'))).toEqual(['https://x/b.png']);
    expect(container.textContent).toContain(XSS);
    expect((container.querySelector('.appearance-grid-item')!.parentElement as HTMLElement).style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
  });
  it('multiple selection', () => {
    const onSelect = vi.fn();
    const { container } = render(<Appearance items={items} bottomview={{ name: 'grid', selectiontype: 'multiple' }} onSelect={onSelect} />);
    fireEvent.click(inputs(container)[1]);
    expect(onSelect).toHaveBeenCalledWith([items[1]], { index: 1, item: items[1] });
  });
});

describe('React cards', () => {
  it('image, title, description, footer and single selection', () => {
    const onSelect = vi.fn();
    const { container } = render(<Appearance items={items} defaultSelected={1} bottomview={{ name: 'cards', fields: ['Name', 'Note'], image: 'Img', footer: 'Price', selectiontype: 'single' }} onSelect={onSelect} />);
    const cards = container.querySelectorAll('.appearance-card');
    expect(cards[0].querySelector('h3')!.textContent).toBe('beta');
    expect(cards[0].querySelector('.appearance-card-footer')!.textContent).toBe('10');
    expect(cards[1].querySelector('img')).toBeNull();
    expect(inputs(container).map((i) => i.checked)).toEqual([true, false, false]);
    fireEvent.click(inputs(container)[2]);
    expect(onSelect).toHaveBeenCalledWith(items[2], { index: 2, item: items[2] });
    expect(inputs(container).map((i) => i.checked)).toEqual([false, false, true]);
  });
});

describe('React table', () => {
  it('headers, scope, sticky, sorting and aria-sort', () => {
    const { container } = render(<Appearance items={items} bottomview={{ name: 'table', fields: ['Name', 'Price'], headers: ['Product', 'Cost'], sortable: true, sticky: true, selectiontype: 'multiple' }} />);
    const ths = () => [...container.querySelectorAll('th')];
    expect(ths().map((t) => t.textContent)).toEqual(['Select', 'Product', 'Cost']);
    expect(ths().every((t) => t.getAttribute('scope') === 'col')).toBe(true);
    expect(ths()[1].style.position).toBe('sticky');
    const names = () => [...container.querySelectorAll('tbody tr')].map((r) => r.children[1].textContent);
    const btns = () => container.querySelectorAll('button.appearance-sort');
    fireEvent.click(btns()[1]);
    expect(names()).toEqual(['Alpha', 'beta', 'gamma']);
    expect(ths()[2].getAttribute('aria-sort')).toBe('ascending');
    fireEvent.click(btns()[1]);
    expect(names()).toEqual(['gamma', 'beta', 'Alpha']);
    expect(ths()[2].getAttribute('aria-sort')).toBe('descending');
    fireEvent.click(btns()[0]);
    expect(names()).toEqual(['Alpha', 'beta', 'gamma']);
  });
  it('text-only cells, no sort buttons when not sortable', () => {
    const { container } = render(<Appearance items={[{ id: 1, Name: XSS }]} bottomview={{ name: 'table' }} />);
    expect(container.querySelector('td')!.textContent).toBe(XSS);
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('th')!.hasAttribute('aria-sort')).toBe(false);
  });
});

describe('React File banner', () => {
  it('renders a File as an image via object URL and revokes it', () => {
    const create = vi.fn(() => 'blob:abc');
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const { container, unmount } = render(<Appearance items={[]} topview={{ name: 'banner', file }} />);
    expect(container.querySelector('img')!.getAttribute('src')).toBe('blob:abc');
    expect(container.textContent).not.toMatch(/no file/);
    act(() => unmount());
    expect(revoke).toHaveBeenCalledWith('blob:abc');
  });
});
