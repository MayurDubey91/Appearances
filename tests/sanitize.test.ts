import { describe, it, expect } from 'vitest';
import { escapeHtml, safeUrl, looksLikeHtml, prepareBannerHtml, HTML_SANDBOX } from '../src/core/sanitize.js';

describe('escapeHtml', () => {
  it('escapes all HTML metacharacters', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });
  it('handles null/undefined/numbers', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('safeUrl', () => {
  it.each(['https://a.com/x.png', 'http://a', '/rel.jpg', 'x.pdf', '//cdn/x', '?q=1', 'blob:https://a/1'])('allows %s', (u) => {
    expect(safeUrl(u)).toBe(u);
  });
  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '\u0000javascript:alert(1)',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'data:text/html,<script>alert(1)</script>',
  ])('blocks %j', (u) => {
    expect(safeUrl(u)).toBeNull();
    expect(safeUrl(u, 'image')).toBeNull();
  });
  it('allows data:image only for images, never svg', () => {
    expect(safeUrl('data:image/png;base64,AA', 'image')).toBe('data:image/png;base64,AA');
    expect(safeUrl('data:image/jpeg,AA', 'image')).toBeTruthy();
    expect(safeUrl('data:image/png;base64,AA', 'link')).toBeNull();
    expect(safeUrl('data:image/png;base64,AA', 'video')).toBeNull();
    expect(safeUrl('data:image/svg+xml,<svg onload=alert(1)>', 'image')).toBeNull();
  });
  it('rejects non-strings', () => {
    expect(safeUrl(undefined as any)).toBeNull();
    expect(safeUrl(123 as any)).toBeNull();
  });
});

describe('html helpers', () => {
  it('looksLikeHtml', () => {
    expect(looksLikeHtml('  <b>x</b>')).toBe(true);
    expect(looksLikeHtml('x.png')).toBe(false);
    expect(looksLikeHtml(null as any)).toBe(false);
  });
  it('prepareBannerHtml applies sanitize and trustedHtml', () => {
    expect(prepareBannerHtml('<b>')).toEqual({ html: '<b>', inject: false });
    expect(prepareBannerHtml('<b>', { trustedHtml: true, sanitize: (h) => h + '!' })).toEqual({ html: '<b>!', inject: true });
    expect(HTML_SANDBOX).toBe('');
  });
});
