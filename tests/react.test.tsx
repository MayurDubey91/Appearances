import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Appearance, Appearances } from '../src/react/index';
import type { Item, SelectionValue } from '../src/core/types';

afterEach(cleanup);

const items = [
  { id: 1, Name: 'Alpha', Description: 'first' },
  { id: 2, Name: 'Beta', Description: 'second' },
  { id: 3, Name: 'Gamma', Description: 'third' },
];
const boxes = (c: HTMLElement) => [...c.querySelectorAll('input')] as HTMLInputElement[];

describe('React Appearance: rendering', () => {
  it('exports deprecated alias', () => {
    expect(Appearances).toBe(Appearance);
  });
  it('renders default list and fields', () => {
    const { container } = render(<Appearance items={items} bottomview={{ name: 'list', fields: ['Name', 'Description'], style: 'border' }} />);
    expect(screen.getByText('Alpha').tagName).toBe('STRONG');
    expect(screen.getByText('second')).toBeTruthy();
    expect(container.querySelectorAll('.appearance-item')).toHaveLength(3);
    expect(boxes(container)).toHaveLength(0);
  });
  it('renders item data as text', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const { container } = render(<Appearance items={[{ id: 1, Name: payload }]} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain(payload);
  });
  it('throws TypeError on invalid options', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Appearance items={items} bottomview={{ name: 'List' as any }} />)).toThrow(TypeError);
    vi.restoreAllMocks();
  });
  it('banner: image, video, pdf, link, blocked, sandboxed and trusted HTML', () => {
    const r = (file: any, extra = {}) => render(<Appearance items={[]} topview={{ name: 'banner', file, ...extra }} />).container;
    expect(r('a.png').querySelector('img')!.getAttribute('src')).toBe('a.png');
    expect(r('a.mp4').querySelector('video')).not.toBeNull();
    expect(r('a.pdf').querySelector('iframe')!.getAttribute('src')).toBe('a.pdf');
    expect(r('page.html').querySelector('a')!.getAttribute('rel')).toBe('noopener noreferrer');
    expect(r('javascript:alert(1)').textContent).toMatch(/blocked/);
    expect(r(undefined).textContent).toMatch(/no file/);
    const f = r('<img src=x onerror=alert(1)>').querySelector('iframe')!;
    expect(f.getAttribute('sandbox')).toBe('');
    expect(f.getAttribute('srcdoc')).toContain('<img');
    const t = r('<img src=x onerror=alert(1)>', { trustedHtml: true, sanitize: (h: string) => h.replace(/\s+on\w+=[^\s>]+/g, '') });
    expect(t.querySelector('img')!.hasAttribute('onerror')).toBe(false);
  });
});

describe('React Appearance: selection', () => {
  it('uncontrolled single with defaultSelected and onSelect', () => {
    const onSelect = vi.fn();
    const { container } = render(<Appearance items={items} defaultSelected={2} bottomview={{ name: 'list', selectiontype: 'single' }} onSelect={onSelect} />);
    expect(boxes(container).map((b) => b.checked)).toEqual([false, true, false]);
    fireEvent.click(boxes(container)[0]);
    expect(onSelect).toHaveBeenCalledWith(items[0], { index: 0, item: items[0] });
    expect(boxes(container).map((b) => b.checked)).toEqual([true, false, false]);
  });
  it('uncontrolled multiple toggles', () => {
    const onSelect = vi.fn();
    const { container } = render(<Appearance items={items} bottomview={{ name: 'list', selectiontype: 'multiple' }} onSelect={onSelect} />);
    fireEvent.click(boxes(container)[2]);
    fireEvent.click(boxes(container)[0]);
    expect(onSelect).toHaveBeenLastCalledWith([items[0], items[2]], { index: 0, item: items[0] });
    fireEvent.click(boxes(container)[2]);
    expect(onSelect).toHaveBeenLastCalledWith([items[0]], { index: 2, item: items[2] });
    expect(boxes(container).map((b) => b.checked)).toEqual([true, false, false]);
  });
  it('controlled: reflects `selected` and only changes via parent', () => {
    const onSelect = vi.fn();
    const { container, rerender } = render(<Appearance items={items} selected={[1]} bottomview={{ name: 'list', selectiontype: 'multiple' }} onSelect={onSelect} />);
    fireEvent.click(boxes(container)[1]);
    expect(onSelect).toHaveBeenCalledWith([items[0], items[1]], { index: 1, item: items[1] });
    expect(boxes(container).map((b) => b.checked)).toEqual([true, false, false]);
    rerender(<Appearance items={items} selected={[2, 3]} bottomview={{ name: 'list', selectiontype: 'multiple' }} onSelect={onSelect} />);
    expect(boxes(container).map((b) => b.checked)).toEqual([false, true, true]);
  });
  it('controlled via state wrapper', () => {
    function Wrapper() {
      const [sel, setSel] = useState<SelectionValue>(null);
      return <Appearance items={items} selected={sel} bottomview={{ name: 'list', selectiontype: 'single' }} onSelect={(s) => setSel((s as Item).id)} />;
    }
    const { container } = render(<Wrapper />);
    expect(boxes(container).every((b) => !b.checked)).toBe(true);
    fireEvent.click(boxes(container)[2]);
    expect(boxes(container).map((b) => b.checked)).toEqual([false, false, true]);
  });
  it('none mode renders no inputs; secondary list is disabled', () => {
    const { container } = render(<Appearance items={items} topview={{ name: 'list', selectiontype: 'single' }} bottomview={{ name: 'list', selectiontype: 'multiple' }} />);
    const cbs = boxes(container).filter((b) => b.type === 'checkbox');
    expect(cbs.every((b) => b.disabled)).toBe(true);
    const radios = boxes(container).filter((b) => b.type === 'radio');
    expect(new Set(radios.map((r) => r.name)).size).toBe(1);
  });
  it('radio names unique between instances', () => {
    const { container } = render(<>
      <Appearance items={items} bottomview={{ name: 'list', selectiontype: 'single' }} />
      <Appearance items={items} bottomview={{ name: 'list', selectiontype: 'single' }} />
    </>);
    const names = new Set(boxes(container).map((b) => b.name));
    expect(names.size).toBe(2);
  });
});
