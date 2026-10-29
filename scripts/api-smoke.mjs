// API smoke check: run after `npm run build`. Uses jsdom to exercise the vanilla build.
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';

const dom = new JSDOM('<!doctype html><div id="c"></div><div id="d"></div>');
Object.assign(globalThis, { window: dom.window, document: dom.window.document, URL: dom.window.URL });
const { Appearance, normalizeView } = await import('../dist/index.js');

const c = document.getElementById('c');
const items = [
  { id: 1, Name: 'Alpha', Description: 'first', Price: '$1' },
  { id: 2, Name: 'Beta', Description: 'second', Price: '$2' },
  { id: 3, Name: 'Gamma', Description: 'third', Price: '$3' },
];
const check = (name, fn) => { fn(); console.log('PASS', name); };
const inputs = () => [...c.querySelectorAll('input')];
const rows = () => [...c.querySelectorAll('.appearance-item')].map((r) => r.textContent);

check('canonical options render fields in order (first = title)', () => {
  new Appearance({ container: c, items, bottomview: { name: 'list', style: 'border', fields: ['Name', 'Description', 'Price'], gap: '4px' } });
  assert.deepEqual(rows(), ['Alphafirst$1', 'Betasecond$2', 'Gammathird$3']);
  assert.equal(c.querySelector('.appearance-item strong').textContent, 'Alpha');
  assert.equal(c.querySelector('.appearance-item').style.border, '1px solid rgb(209, 213, 219)');
  assert.equal(inputs().length, 0);
});

check('defaults: no views → list, fields → [Name], selectiontype → none', () => {
  const a = new Appearance({ container: c, items });
  assert.deepEqual(rows(), ['Alpha', 'Beta', 'Gamma']);
  assert.equal(a.selectionMode, 'none');
  assert.equal(a.getSelection(), null);
  assert.deepEqual(
    { ...normalizeView({ name: 'list' }) },
    { name: 'list', placement: 'top', scrollable: false, selectiontype: 'none', style: 'none', fields: ['Name'], gap: '8px' },
  );
  assert.equal(normalizeView({ name: 'none' }), null);
});

check('pre-0.2 option forms are rejected with a TypeError', () => {
  const bad = [
    [{ name: 'List' }, /name "List".*'banner', 'list', 'none'/],
    [{ name: 'Banner', file: 'x.jpg' }, /name "Banner"/],
    [{ name: 'None' }, /name "None"/],
    [{ name: 'list', style: 'Border' }, /style "Border".*'none', 'border', 'shadow'/],
    [{ name: 'list', selectiontype: 'checklist' }, /selectiontype "checklist".*'none', 'single', 'multiple'/],
    [{ name: 'list', selectiontype: 'select one' }, /selectiontype "select one"/],
    [{ name: 'list', selectiontype: 'Single' }, /selectiontype "Single"/],
    [{ name: 'list', fields: 'Name||Description' }, /fields "Name\|\|Description".*array/],
  ];
  for (const [view, re] of bad) {
    assert.throws(() => new Appearance({ container: c, items, bottomview: view }), (e) => e instanceof TypeError && re.test(e.message), JSON.stringify(view));
  }
});

check('single: onSelect(item, info) + getSelection + setSelection', () => {
  const calls = [];
  const a = new Appearance({ container: c, items, bottomview: { name: 'list', selectiontype: 'single' }, onSelect: (s, info) => calls.push([s, info]) });
  assert.ok(inputs().every((i) => i.type === 'radio' && !i.checked));
  assert.equal(a.getSelection(), null);
  inputs()[1].click();
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], items[1]);
  assert.deepEqual(calls[0][1], { index: 1, item: items[1] });
  assert.equal(a.getSelection(), items[1]);
  inputs()[2].click();
  assert.equal(a.getSelection(), items[2]);
  assert.deepEqual(inputs().map((i) => i.checked), [false, false, true]);
  a.setSelection(1);
  assert.equal(a.getSelection(), items[0]);
  assert.deepEqual(inputs().map((i) => i.checked), [true, false, false]);
  assert.equal(calls.length, 2, 'setSelection does not call onSelect');
  a.setSelection(null);
  assert.equal(a.getSelection(), null);
});

check('multiple: onSelect(items[], info) + toggle + getSelection + setSelection', () => {
  const calls = [];
  const a = new Appearance({ container: c, items, bottomview: { name: 'list', selectiontype: 'multiple' }, onSelect: (s, info) => calls.push([s, info]) });
  assert.ok(inputs().every((i) => i.type === 'checkbox'));
  assert.deepEqual(a.getSelection(), []);
  inputs()[2].click();
  inputs()[0].click();
  assert.deepEqual(calls[1][0], [items[0], items[2]]);
  assert.deepEqual(calls[1][1], { index: 0, item: items[0] });
  inputs()[2].click();
  assert.deepEqual(calls[2][0], [items[0]]);
  assert.deepEqual(a.getSelection(), [items[0]]);
  a.setSelection([2, 3, 99]);
  assert.deepEqual(a.getSelection(), [items[1], items[2]]);
  assert.deepEqual(inputs().map((i) => i.checked), [false, true, true]);
  assert.equal(calls.length, 3);
});

check('defaultSelected + update() keeps selection and prunes removed items', () => {
  const a = new Appearance({ container: c, items, defaultSelected: [1, 3], bottomview: { name: 'list', selectiontype: 'multiple' } });
  assert.deepEqual(inputs().map((i) => i.checked), [true, false, true]);
  a.update({ items: items.slice(0, 2) });
  assert.deepEqual(a.getSelection(), [items[0]]);
  a.update({ bottomview: { name: 'list', selectiontype: 'single' } });
  assert.equal(a.getSelection(), items[0]);
});

check("selectiontype 'none' ignores selection", () => {
  const a = new Appearance({ container: c, items, defaultSelected: 1, bottomview: { name: 'list', selectiontype: 'none' } });
  a.setSelection([1, 2]);
  assert.equal(a.getSelection(), null);
  assert.equal(inputs().length, 0);
});

check('radio groups are unique per instance', () => {
  const d = document.getElementById('d');
  new Appearance({ container: c, items, bottomview: { name: 'list', selectiontype: 'single' } });
  new Appearance({ container: d, items, bottomview: { name: 'list', selectiontype: 'single' } });
  assert.notEqual(c.querySelector('input').name, d.querySelector('input').name);
});

console.log('All API smoke checks passed.');
