import React from 'react';
import type { AppearanceOptions, ViewConfig, AppearanceItem } from '../core/types';
import { safeUrl, looksLikeHtml, prepareBannerHtml, HTML_SANDBOX } from '../core/sanitize';

interface Props extends Omit<AppearanceOptions, 'container'> {}

export function Appearance({ items = [], topview, bottomview }: Props) {
  return (
    <div className="appearances" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
      {topview && <ViewRenderer view={topview} items={items} position="top" />}
      {bottomview && <ViewRenderer view={bottomview} items={items} position="bottom" />}
    </div>
  );
}

function ViewRenderer({ view, items, position }: { view: ViewConfig; items: AppearanceItem[]; position: string }) {
  const name = (view.name || '').toLowerCase();
  if (name === 'banner') return <BannerView view={view} />;
  return <ListView view={view} items={items} />;
}

function BannerView({ view }: { view: ViewConfig }) {
  const file = view.file;
  if (!file || typeof file !== 'string') return <div>Banner (no file)</div>;

  // Inline HTML: sandboxed iframe unless the caller explicitly opts in with trustedHtml.
  if (looksLikeHtml(file)) {
    const { html, inject } = prepareBannerHtml(file, view);
    if (inject) return <div dangerouslySetInnerHTML={{ __html: html }} />;
    return <iframe sandbox={HTML_SANDBOX} srcDoc={html} title="banner" style={{ width: '100%', height: '400px', border: 'none' }} />;
  }

  const blocked = <div>Banner (blocked unsafe URL)</div>;
  const lower = file.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)/) || lower.startsWith('data:image')) {
    const src = safeUrl(file, 'image');
    return src ? <img src={src} alt="banner" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} /> : blocked;
  }
  if (lower.match(/\.(mp4|webm|ogg)/)) {
    const src = safeUrl(file, 'video');
    return src ? <video src={src} controls style={{ maxWidth: '100%' }} /> : blocked;
  }
  if (lower.endsWith('.pdf')) {
    const src = safeUrl(file, 'pdf');
    return src ? <iframe src={src} style={{ width: '100%', height: '400px', border: 'none' }} title="pdf" /> : blocked;
  }
  const href = safeUrl(file, 'link');
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">Open file</a> : blocked;
}

function ListView({ view, items }: { view: ViewConfig; items: AppearanceItem[] }) {
  const gap = view.gap || '8px';
  const fields = (view.fields || 'Name').split('||').map(f => f.trim()).filter(Boolean);
  const titleField = fields[0] || 'Name';
  const otherFields = fields.slice(1);
  const style = (view.style || '').toLowerCase();
  const selection = view.selectiontype;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {items.map((item, index) => (
        <div
          key={item.id ?? index}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#fff',
            border: style === 'border' ? '1px solid #d1d5db' : '1px solid #e5e7eb',
            boxShadow: style === 'shadow' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {selection === 'checklist' && <input type="checkbox" style={{ marginRight: 8 }} />}
          {selection === 'select one' && <input type="radio" name="appearance-select" style={{ marginRight: 8 }} />}
          <strong>{String(item[titleField] ?? item.name ?? item.Name ?? `Item ${index + 1}`)}</strong>
          {otherFields.map(field => item[field] !== undefined && (
            <div key={field} style={{ fontSize: '0.9em', color: '#4b5563', marginTop: 4 }}>
              {String(item[field])}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
