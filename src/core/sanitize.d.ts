/**
 * Security helpers shared by the vanilla and React renderers.
 * Framework-agnostic and DOM-free so they can run in any environment.
 */
/** Escape a value for safe interpolation into HTML text or attribute context. */
export declare function escapeHtml(value: unknown): string;
export type UrlKind = 'link' | 'image' | 'video' | 'pdf';
/**
 * Returns the URL if it is safe for the given kind, otherwise null.
 * Allowed: http:, https:, blob:, relative/protocol-less URLs, and
 * data:image/* (images only). Everything else (javascript:, vbscript:,
 * data:text/html, file:, ...) is rejected.
 */
export declare function safeUrl(url: unknown, kind?: UrlKind): string | null;
/** True if the string looks like inline HTML markup rather than a URL. */
export declare function looksLikeHtml(value: unknown): boolean;
/**
 * Resolve banner HTML: apply the user's sanitize hook if provided.
 * Returns the HTML plus whether it may be injected directly into the page.
 */
export declare function prepareBannerHtml(html: string, opts?: {
    trustedHtml?: boolean;
    sanitize?: (html: string) => string;
}): {
    html: string;
    inject: boolean;
};
/** Sandbox attribute used for untrusted HTML banners (no scripts, forms, popups, same-origin). */
export declare const HTML_SANDBOX = "";
