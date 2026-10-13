/**
 * Appearances — First draft (vanilla JS)
 * Pure client-side. No API calls.
 */

class Appearance {
  constructor(options) {
    this.options = options;
    this.container = options.container;
    this.items = options.items || [];
    this.topview = options.topview || null;
    this.bottomview = options.bottomview || null;

    if (!this.container) {
      throw new Error('Appearance: container is required');
    }

    // Ensure container can be measured for ratio
    if (!this.container.style.height && !this.container.style.minHeight) {
      this.container.style.minHeight = '400px';
    }
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.height = this.container.style.height || '100%';

    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.container.style.gap = '0';
    this.container.style.fontFamily = 'system-ui, sans-serif';

    if (this.topview) {
      const topEl = this.renderView(this.topview, 'top');
      this.container.appendChild(topEl);
    }

    if (this.bottomview) {
      const bottomEl = this.renderView(this.bottomview, 'bottom');
      this.container.appendChild(bottomEl);
    }
  }

  applyRatio(el, view, position) {
    // ratio only applies to topview
    if (position === 'top' && view.ratio) {
      el.style.flex = `0 0 ${view.ratio}`;
      el.style.height = view.ratio;
      el.style.overflow = 'hidden';
      el.style.boxSizing = 'border-box';
    } else {
      // bottomview (or top without ratio) takes remaining space
      el.style.flex = '1 1 auto';
      el.style.minHeight = '0';
      el.style.overflow = 'hidden';
    }
  }

  renderView(view, position) {
    const wrapper = document.createElement('div');
    wrapper.className = `appearance-${position} appearance-${(view.name || '').toLowerCase()}`;
    this.applyRatio(wrapper, view, position);

    switch ((view.name || '').toLowerCase()) {
      case 'banner':
        wrapper.appendChild(this.renderBanner(view));
        break;
      case 'list':
      default:
        wrapper.appendChild(this.renderList(view));
        break;
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

    const url = typeof file === 'string' ? file : URL.createObjectURL(file);
    const lower = url.toLowerCase();

    if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/) || lower.startsWith('data:image')) {
      const img = document.createElement('img');
      img.src = url;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.display = 'block';
      el.appendChild(img);
    } else if (lower.match(/\.(mp4|webm|ogg)(\?|$)/) || lower.startsWith('data:video')) {
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      el.appendChild(video);
    } else if (lower.match(/\.pdf(\?|$)/)) {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      el.appendChild(iframe);
    } else if (lower.endsWith('.html') || lower.includes('text/html') || (typeof file === 'string' && file.trim().startsWith('<'))) {
      el.innerHTML = typeof file === 'string' ? file : 'HTML content';
      el.style.overflow = 'auto';
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.textContent = 'Open file';
      link.target = '_blank';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.appendChild(link);
    }

    return el;
  }

  renderList(view) {
    const el = document.createElement('div');
    const gap = view.gap || '8px';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.gap = gap;
    el.style.height = '100%';
    el.style.overflow = 'auto';
    el.style.padding = '8px';
    el.style.boxSizing = 'border-box';

    const fields = (view.fields || 'Name').split('||').map(f => f.trim()).filter(Boolean);
    const titleField = fields[0] || 'Name';
    const otherFields = fields.slice(1);

    const style = (view.style || '').toLowerCase();
    const selection = view.selectiontype;

    this.items.forEach((item, index) => {
      const li = document.createElement('div');
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

      if (selection === 'checklist') {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.style.marginRight = '8px';
        li.appendChild(cb);
      } else if (selection === 'select one') {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'appearance-select';
        radio.style.marginRight = '8px';
        li.appendChild(radio);
      }

      const content = document.createElement('div');
      content.style.display = 'inline-block';

      const title = document.createElement('strong');
      title.textContent = item[titleField] ?? item.name ?? item.Name ?? `Item ${index + 1}`;
      content.appendChild(title);

      otherFields.forEach(field => {
        if (item[field] !== undefined) {
          const p = document.createElement('div');
          p.style.fontSize = '0.9em';
          p.style.color = '#4b5563';
          p.style.marginTop = '4px';
          p.textContent = item[field];
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
    this.topview = this.options.topview ?? this.topview;
    this.bottomview = this.options.bottomview ?? this.bottomview;
    this.render();
  }

  destroy() {
    if (this.container) this.container.innerHTML = '';
  }
}

// Export for module usage + global for plain script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Appearance };
}
if (typeof window !== 'undefined') {
  window.Appearance = Appearance;
}
