// Smoke check: run after `npm run build`. Uses jsdom to render the vanilla build.
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';

const dom = new JSDOM('<!doctype html><div id="c"></div>');
Object.assign(globalThis, { window: dom.window, document: dom.window.document, URL: dom.window.URL });
const { Appearance, safeUrl, escapeHtml } = await import('../dist/index.js');

const payload = '<img src=x onerror=alert(1)>';
const c = document.getElementById('c');
const check = (name, fn) => { fn(); console.log('PASS', name); };

new Appearance({ container: c, items: [{ id: 1, Name: payload, Description: payload }], bottomview: { name: 'List', fields: 'Name||Description' } });
check('field values rendered as text, no <img> injected', () => {
  assert.equal(c.querySelectorAll('img').length, 0);
  assert.ok(c.textContent.includes(payload));
});

for (const url of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>']) {
  new Appearance({ container: c, items: [], topview: { name: 'Banner', file: url } });
  check(`banner URL blocked: ${JSON.stringify(url)}`, () => {
    assert.equal(c.querySelector('a, img, iframe, video'), null);
    assert.match(c.textContent, /blocked/);
  });
}

new Appearance({ container: c, items: [], topview: { name: 'Banner', file: payload } });
check('HTML banner sandboxed in iframe by default', () => {
  const f = c.querySelector('iframe');
  assert.ok(f && f.getAttribute('sandbox') === '' && f.srcdoc === payload);
  assert.equal(c.querySelector('img'), null);
});

new Appearance({ container: c, items: [], topview: { name: 'Banner', file: payload, trustedHtml: true, sanitize: (h) => h.replace(/\s+on\w+=[^\s>]+/g, '') } });
check('trustedHtml + sanitize hook injects sanitized HTML', () => {
  const img = c.querySelector('img');
  assert.ok(img && !img.hasAttribute('onerror'));
});

check('safeUrl allows safe schemes', () => {
  for (const u of ['https://a.com/x.png', 'http://a', '/rel.jpg', 'x.pdf', 'blob:https://a/1']) assert.equal(safeUrl(u), u);
  assert.ok(safeUrl('data:image/png;base64,AA', 'image'));
  assert.equal(safeUrl('data:image/png;base64,AA', 'link'), null);
  assert.equal(safeUrl('data:image/svg+xml,<svg onload=alert(1)>', 'image'), null);
});
check('escapeHtml', () => assert.equal(escapeHtml(payload), '&lt;img src=x onerror=alert(1)&gt;'));
console.log('All security smoke checks passed.');
