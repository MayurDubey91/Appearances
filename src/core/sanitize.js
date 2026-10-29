/**
 * Security helpers shared by the vanilla and React renderers.
 * Framework-agnostic and DOM-free so they can run in any environment.
 */
const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};
/** Escape a value for safe interpolation into HTML text or attribute context. */
export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}
/**
 * Returns the URL if it is safe for the given kind, otherwise null.
 * Allowed: http:, https:, blob:, relative/protocol-less URLs, and
 * data:image/* (images only). Everything else (javascript:, vbscript:,
 * data:text/html, file:, ...) is rejected.
 */
export function safeUrl(url, kind = 'link') {
    if (typeof url !== 'string')
        return null;
    // Strip whitespace/control chars browsers ignore when parsing schemes.
    const normalized = url.replace(/[\u0000-\u0020\u007f-\u009f]/g, '').toLowerCase();
    const scheme = /^([a-z][a-z0-9+.-]*):/.exec(normalized);
    if (!scheme)
        return url; // relative URL (incl. "//host/path", "/x", "x.jpg", "?q")
    switch (scheme[1]) {
        case 'http':
        case 'https':
        case 'blob':
            return url;
        case 'data':
            return kind === 'image' && /^data:image\/(png|jpe?g|gif|webp|bmp|x-icon|avif)[;,]/.test(normalized)
                ? url
                : null;
        default:
            return null;
    }
}
/** True if the string looks like inline HTML markup rather than a URL. */
export function looksLikeHtml(value) {
    return typeof value === 'string' && value.trim().startsWith('<');
}
/**
 * Resolve banner HTML: apply the user's sanitize hook if provided.
 * Returns the HTML plus whether it may be injected directly into the page.
 */
export function prepareBannerHtml(html, opts = {}) {
    const out = typeof opts.sanitize === 'function' ? String(opts.sanitize(html)) : html;
    return { html: out, inject: opts.trustedHtml === true };
}
/** Sandbox attribute used for untrusted HTML banners (no scripts, forms, popups, same-origin). */
export const HTML_SANDBOX = '';
