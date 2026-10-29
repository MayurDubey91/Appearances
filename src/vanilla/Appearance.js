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
  fieldText,
  gridTemplate,
  tileStyle,
  tableHeaders,
  sortedIndices,
  nextSort,
  ariaSort,
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
    this._sort = {};

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
    } else if (view.name === 'grid') {
      wrapper.appendChild(this.renderGrid(view, position));
    } else if (view.name === 'cards') {
      wrapper.appendChild(this.renderCards(view, position));
    } else if (view.name === 'table') {
      wrapper.appendChild(this.renderTable(view, position));
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

  /** Selection checkbox/radio for an item, wired like the list view. Returns null when selectiontype is 'none'. */
  _selectInput(view, item, index, position) {
    const selection = view.selectiontype;
    if (selection !== 'multiple' && selection !== 'single') return null;
    const interactive = selection === this.selectionMode;
    const input = document.createElement('input');
    input.type = selection === 'multiple' ? 'checkbox' : 'radio';
    if (selection === 'single') input.name = `appearance-select-${this._id}-${position}`;
    const label = fieldText(item, view.fields[0]) || `Item ${index + 1}`;
    input.setAttribute('aria-label', `Select ${label}`);
    if (interactive) {
      const key = itemKey(item, index);
      input.checked = this._selection.includes(key);
      input.addEventListener('change', () => this._toggle(index));
      this._inputs.push({ input, key });
    } else {
      input.disabled = true;
    }
    return input;
  }

  _scrollBox(view, display) {
    const el = document.createElement('div');
    el.style.height = '100%';
    el.style.overflow = 'auto';
    el.style.padding = '8px';
    el.style.boxSizing = 'border-box';
    if (display === 'grid') {
      el.style.display = 'grid';
      el.style.gap = view.gap;
      el.style.gridTemplateColumns = gridTemplate(view.columns, view.name === 'cards' ? '220px' : '160px');
      el.style.alignContent = 'start';
    }
    return el;
  }

  _image(item, field, alt) {
    if (!field) return null;
    const src = safeUrl(item[field], 'image');
    if (!src) return null;
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.display = 'block';
    img.style.objectFit = 'cover';
    return img;
  }

  _tile(view, className) {
    const tile = document.createElement('div');
    tile.className = `appearance-item ${className}`;
    const t = tileStyle(view.style);
    tile.style.border = t.border;
    tile.style.boxShadow = t.boxShadow;
    tile.style.borderRadius = '8px';
    tile.style.background = '#fff';
    tile.style.overflow = 'hidden';
    tile.style.boxSizing = 'border-box';
    return tile;
  }

  renderGrid(view, position = 'bottom') {
    const el = this._scrollBox(view, 'grid');
    const [titleField, ...otherFields] = view.fields;
    this.items.forEach((item, index) => {
      const tile = this._tile(view, 'appearance-grid-item');
      const img = this._image(item, view.image, fieldText(item, titleField));
      if (img) {
        img.style.aspectRatio = '1 / 1';
        tile.appendChild(img);
      }
      const body = document.createElement('div');
      body.style.padding = '10px 12px';
      const input = this._selectInput(view, item, index, position);
      if (input) {
        input.style.marginRight = '6px';
        body.appendChild(input);
      }
      const title = document.createElement('strong');
      title.textContent = fieldText(item, titleField) || `Item ${index + 1}`;
      body.appendChild(title);
      for (const f of otherFields) {
        const text = fieldText(item, f);
        if (!text) continue;
        const d = document.createElement('div');
        d.style.fontSize = '0.9em';
        d.style.color = '#4b5563';
        d.style.marginTop = '4px';
        d.textContent = text;
        body.appendChild(d);
      }
      tile.appendChild(body);
      el.appendChild(tile);
    });
    return el;
  }

  renderCards(view, position = 'bottom') {
    const el = this._scrollBox(view, 'grid');
    const [titleField, ...descFields] = view.fields;
    this.items.forEach((item, index) => {
      const card = this._tile(view, 'appearance-card');
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      const img = this._image(item, view.image, fieldText(item, titleField));
      if (img) {
        img.style.aspectRatio = '16 / 9';
        card.appendChild(img);
      }
      const body = document.createElement('div');
      body.style.padding = '12px 16px';
      body.style.flex = '1 1 auto';
      const head = document.createElement('div');
      head.style.display = 'flex';
      head.style.alignItems = 'center';
      head.style.gap = '8px';
      const input = this._selectInput(view, item, index, position);
      if (input) head.appendChild(input);
      const title = document.createElement('h3');
      title.style.margin = '0';
      title.style.fontSize = '1.05em';
      title.textContent = fieldText(item, titleField) || `Item ${index + 1}`;
      head.appendChild(title);
      body.appendChild(head);
      for (const f of descFields) {
        const text = fieldText(item, f);
        if (!text) continue;
        const p = document.createElement('p');
        p.style.margin = '6px 0 0';
        p.style.color = '#4b5563';
        p.style.fontSize = '0.9em';
        p.textContent = text;
        body.appendChild(p);
      }
      card.appendChild(body);
      const footerText = view.footer ? fieldText(item, view.footer) : '';
      if (footerText) {
        const footer = document.createElement('div');
        footer.className = 'appearance-card-footer';
        footer.style.padding = '8px 16px';
        footer.style.borderTop = '1px solid #e5e7eb';
        footer.style.fontWeight = '600';
        footer.textContent = footerText;
        card.appendChild(footer);
      }
      el.appendChild(card);
    });
    return el;
  }

  renderTable(view, position = 'bottom') {
    const el = this._scrollBox(view);
    const table = document.createElement('table');
    table.className = 'appearance-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.background = '#fff';
    const labels = tableHeaders(view);
    const hasSelect = view.selectiontype !== 'none';
    const sort = view.sortable ? this._sort[position] || null : null;

    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    const cellStyle = (c) => {
      c.style.padding = '8px 12px';
      c.style.textAlign = 'left';
      c.style.borderBottom = '1px solid #e5e7eb';
    };
    const stickyTh = (th) => {
      th.style.background = '#f9fafb';
      if (view.sticky) {
        th.style.position = 'sticky';
        th.style.top = '0';
        th.style.zIndex = '1';
      }
    };
    if (hasSelect) {
      const th = document.createElement('th');
      th.scope = 'col';
      cellStyle(th);
      stickyTh(th);
      const sr = document.createElement('span');
      sr.textContent = 'Select';
      sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
      th.appendChild(sr);
      hr.appendChild(th);
    }
    view.fields.forEach((field, i) => {
      const th = document.createElement('th');
      th.scope = 'col';
      cellStyle(th);
      stickyTh(th);
      if (view.sortable) {
        th.setAttribute('aria-sort', ariaSort(sort, field));
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'appearance-sort';
        btn.style.cssText = 'all:unset;cursor:pointer;font-weight:600';
        const s = ariaSort(sort, field);
        btn.textContent = labels[i] + (s === 'ascending' ? ' ▲' : s === 'descending' ? ' ▼' : '');
        btn.addEventListener('click', () => {
          this._sort[position] = nextSort(this._sort[position] || null, field);
          this.render();
        });
        th.appendChild(btn);
      } else {
        th.textContent = labels[i];
      }
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const order = sort ? sortedIndices(this.items, sort.field, sort.dir) : this.items.map((_, i) => i);
    for (const index of order) {
      const item = this.items[index];
      const tr = document.createElement('tr');
      tr.className = 'appearance-item appearance-row';
      if (hasSelect) {
        const td = document.createElement('td');
        cellStyle(td);
        const input = this._selectInput(view, item, index, position);
        if (input) td.appendChild(input);
        tr.appendChild(td);
      }
      view.fields.forEach((field) => {
        const td = document.createElement('td');
        cellStyle(td);
        td.textContent = fieldText(item, field);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    el.appendChild(table);
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
