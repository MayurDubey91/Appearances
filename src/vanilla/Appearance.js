/**
 * Appearances — First draft (vanilla JS)
 * Pure client-side. No API calls.
 */

import { safeUrl, looksLikeHtml, prepareBannerHtml, HTML_SANDBOX } from '../core/sanitize.js';
import {
  normalizeViews,
  selectionMode,
  toSelectionKeys,
  toggleSelectionKey,
  pruneSelectionKeys,
  resolveSelection,
  itemKey,
} from '../core/normalize.js';

let instanceSeq = 0;

export class Appearance {
  constructor(options) {
    this.options = options || {};
    this.container = this.options.container;
    this.items = this.options.items || [];
    this._id = ++instanceSeq;
    this._inputs = [];
    this._objectUrls = [];

    if (!this.container) {
      throw new Error('Appearance: container is required');
    }

    this.resolveViews();
    this._selection = pruneSelectionKeys(this.items, toSelectionKeys(this.options.defaultSelected, this.selectionMode));

    // Ensure container can be measured for ratio
    if (!this.container.style.height && !this.container.style.minHeight) {
      this.container.style.minHeight = '400px';
    }
    this.container.style.display = 'flex';
    this.container.style.height = this.container.style.height || '100%';

    this.render();
  }

  resolveViews() {
    // Validates options (throws TypeError on unknown values) and fills defaults.
    // Neither view given → bottomview defaults to { name: 'list' }.
    const { topview, bottomview } = normalizeViews(this.options);
    this.topview = topview;
    this.bottomview = bottomview;
    this.selectionMode = selectionMode([topview, bottomview]);
  }

  /** Current selection: `Item | null` (single), `Item[]` (multiple), `null` (none). */
  getSelection() {
    return resolveSelection(this.items, this._selection, this.selectionMode);
  }

  /** Programmatically set the selection by item id(s). Does not call `onSelect`. */
  setSelection(value) {
    this._selection = pruneSelectionKeys(this.items, toSelectionKeys(value, this.selectionMode));
    this._syncInputs();
  }

  _syncInputs() {
    for (const { input, key } of this._inputs) input.checked = this._selection.includes(key);
  }

  _toggle(index) {
    const item = this.items[index];
    this._selection = toggleSelectionKey(this._selection, itemKey(item, index), this.selectionMode);
    this._syncInputs();
    const selected = this.getSelection();
    if (typeof this.options.onSelect === 'function' && selected) {
      this.options.onSelect(selected, { index, item });
    }
  }

  _revokeObjectUrls() {
    for (const u of this._objectUrls) URL.revokeObjectURL(u);
    this._objectUrls = [];
  }

  render() {
    this._revokeObjectUrls();
    this.container.replaceChildren();
    this._inputs = [];
    this.container.style.gap = '0';
    this.container.style.fontFamily = 'system-ui, sans-serif';

    const placement = (this.topview && this.topview.placement) || 'top';
    if (placement === 'left' || placement === 'right') {
      this.container.style.flexDirection = 'row';
    } else {
      this.container.style.flexDirection = 'column';
    }

    if (this.topview && placement === 'right') {
      // For right: render bottom first so topview appears on the right
      if (this.bottomview) {
        const bottomEl = this.renderView(this.bottomview, 'bottom');
        this.container.appendChild(bottomEl);
      }
      const topEl = this.renderView(this.topview, 'top');
      this.container.appendChild(topEl);
    } else {
      if (this.topview) {
        const topEl = this.renderView(this.topview, 'top');
        this.container.appendChild(topEl);
      }
      if (this.bottomview) {
        const bottomEl = this.renderView(this.bottomview, 'bottom');
        this.container.appendChild(bottomEl);
      }
    }
  }

  applyRatio(el, view, position) {
    const placement = (view.placement || 'top');
    const isSide = placement === 'left' || placement === 'right';

    if (position === 'top' && view.ratio) {
      el.style.flex = `0 0 ${view.ratio}`;
      if (isSide) {
        el.style.width = view.ratio;
        el.style.height = '100%';
      } else {
        el.style.height = view.ratio;
        el.style.width = '100%';
      }
      el.style.overflow = 'hidden';
      el.style.boxSizing = 'border-box';
    } else {
      el.style.flex = '1 1 auto';
      el.style.minHeight = '0';
      el.style.minWidth = '0';
      el.style.overflow = 'hidden';
    }

    // scrollable: false → sticky (only meaningful for topview)
    if (position === 'top' && view.scrollable === false) {
      el.style.position = 'sticky';
      el.style.top = '0';
      el.style.zIndex = '1';
      el.style.alignSelf = 'flex-start';
    }
  }

  renderView(view, position) {
    const wrapper = document.createElement('div');
    wrapper.className = `appearance-${position} appearance-${view.name}`;
    this.applyRatio(wrapper, view, position);

    if (view.name === 'banner') {
      wrapper.appendChild(this.renderBanner(view));
    } else {
      wrapper.appendChild(this.renderList(view, position));
    }

    return wrapper;
  }

  renderBanner(view) {
    const el = document.createElement('div');
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.overflow = 'hidden';
    el.style.background = '#f9fafb';
    el.style.position = 'relative';

    const file = view.file;
    if (!file) {
      el.textContent = 'Banner (no file provided)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      return el;
    }

    // Inline HTML content: sandboxed iframe by default, direct injection only if trustedHtml.
    if (typeof file === 'string' && looksLikeHtml(file)) {
      const { html, inject } = prepareBannerHtml(file, view);
      if (inject) {
        el.innerHTML = html; // explicit opt-in: trustedHtml === true
        el.style.overflow = 'auto';
      } else {
        const frame = document.createElement('iframe');
        frame.setAttribute('sandbox', HTML_SANDBOX);
        frame.srcdoc = html;
        frame.title = 'Banner';
        frame.style.width = '100%';
        frame.style.height = '100%';
        frame.style.border = 'none';
        el.appendChild(frame);
      }
      return el;
    }

    let url = file;
    if (typeof file !== 'string') {
      url = URL.createObjectURL(file);
      this._objectUrls.push(url);
    }
    const lower = url.toLowerCase();
    const blocked = () => {
      el.textContent = 'Banner (blocked unsafe URL)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      return el;
    };
    const safeLink = safeUrl(url, 'link');
    const appendLink = () => {
      if (!safeLink) return blocked();
      const link = document.createElement('a');
      link.href = safeLink;
      link.textContent = 'Open file';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.appendChild(link);
      return el;
    };

    const isImage =
      lower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/) ||
      lower.startsWith('data:image') ||
      lower.includes('picsum.photos') ||
      lower.includes('unsplash.com') ||
      lower.includes('images.unsplash.com') ||
      lower.includes('placehold.co') ||
      lower.includes('via.placeholder.com') ||
      (!lower.match(/\.(pdf|mp4|webm|ogg|html|txt|json|zip)(\?|$)/) && !lower.startsWith('data:'));

    if (isImage) {
      const src = safeUrl(url, 'image');
      if (!src) return blocked();
      const img = document.createElement('img');
      img.src = src;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.display = 'block';
      img.alt = 'Banner';
      img.onerror = () => {
        el.replaceChildren();
        appendLink();
      };
      el.appendChild(img);
    } else if (lower.match(/\.(mp4|webm|ogg)(\?|$)/) || lower.startsWith('data:video')) {
      const src = safeUrl(url, 'video');
      if (!src) return blocked();
      const video = document.createElement('video');
      video.src = src;
      video.controls = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      el.appendChild(video);
    } else if (lower.match(/\.pdf(\?|$)/)) {
      const src = safeUrl(url, 'pdf');
      if (!src) return blocked();
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      el.appendChild(iframe);
    } else {
      // .html URLs, Files and other resources: plain link (never injected).
      appendLink();
    }

    return el;
  }

  renderList(view, position = 'bottom') {
    const el = document.createElement('div');
    const gap = view.gap;
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.gap = gap;
    el.style.height = '100%';
    el.style.overflow = 'auto';
    el.style.padding = '8px';
    el.style.boxSizing = 'border-box';

    const [titleField = 'Name', ...otherFields] = view.fields;
    const style = view.style;
    const selection = view.selectiontype;
    // Only the list that drives the instance's selection mode is interactive.
    const interactive = selection !== 'none' && selection === this.selectionMode;
    const radioName = `appearance-select-${this._id}-${position}`;

    this.items.forEach((item, index) => {
      const li = document.createElement('div');
      li.className = 'appearance-item';
      li.style.padding = '12px 16px';
      li.style.borderRadius = '8px';
      li.style.background = '#fff';
      li.style.transition = 'box-shadow 0.2s, border-color 0.2s';

      if (style === 'border') {
        li.style.border = '1px solid #d1d5db';
      } else if (style === 'shadow') {
        li.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        li.style.border = '1px solid transparent';
      } else {
        li.style.border = '1px solid #e5e7eb';
      }

      if (selection === 'multiple' || selection === 'single') {
        const input = document.createElement('input');
        input.type = selection === 'multiple' ? 'checkbox' : 'radio';
        if (selection === 'single') input.name = radioName;
        input.style.marginRight = '8px';
        if (interactive) {
          const key = itemKey(item, index);
          input.checked = this._selection.includes(key);
          input.addEventListener('change', () => this._toggle(index));
          this._inputs.push({ input, key });
        } else {
          input.disabled = true;
        }
        li.appendChild(input);
      }

      const content = document.createElement('div');
      content.style.display = 'inline-block';

      const title = document.createElement('strong');
      title.textContent = String(item[titleField] ?? item.name ?? item.Name ?? `Item ${index + 1}`);
      content.appendChild(title);

      otherFields.forEach(field => {
        if (item[field] !== undefined) {
          const p = document.createElement('div');
          p.style.fontSize = '0.9em';
          p.style.color = '#4b5563';
          p.style.marginTop = '4px';
          p.textContent = String(item[field]); // textContent: item data is never parsed as HTML
          content.appendChild(p);
        }
      });

      li.appendChild(content);
      el.appendChild(li);
    });

    return el;
  }

  update(newOptions) {
    Object.assign(this.options, newOptions);
    this.items = this.options.items || this.items;
    this.resolveViews();
    this._selection = pruneSelectionKeys(this.items, toSelectionKeys(this._selection, this.selectionMode));
    this.render();
  }

  destroy() {
    this._revokeObjectUrls();
    this._inputs = [];
    if (this.container) this.container.replaceChildren();
  }
}

// ESM export above; also expose a global for <script type="module"> demos
if (typeof window !== 'undefined') {
  window.Appearance = Appearance;
}
