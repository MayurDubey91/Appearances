import React, { useCallback, useMemo, useState } from 'react';
import type { AppearanceOptions, Item, ItemId, SelectionType, SelectionValue } from '../core/types';
import { safeUrl, looksLikeHtml, prepareBannerHtml, HTML_SANDBOX } from '../core/sanitize';
import {
  normalizeViews,
  selectionMode,
  toSelectionKeys,
  toggleSelectionKey,
  pruneSelectionKeys,
  resolveSelection,
  itemKey,
  type NormalizedView,
} from '../core/normalize';

export interface AppearanceProps extends Omit<AppearanceOptions, 'container'> {
  /** Controlled selection, by item id. When set, `onSelect` must be used to update it. */
  selected?: SelectionValue;
}

export function Appearance({ items = [], topview, bottomview, selected, defaultSelected, onSelect }: AppearanceProps) {
  const views = useMemo(() => normalizeViews({ topview, bottomview }), [topview, bottomview]);
  const mode = selectionMode([views.topview, views.bottomview]);

  const [innerKeys, setInnerKeys] = useState<ItemId[]>(() => toSelectionKeys(defaultSelected, mode));
  const controlled = selected !== undefined;
  const keys = pruneSelectionKeys(items, controlled ? toSelectionKeys(selected, mode) : toSelectionKeys(innerKeys, mode));

  const toggle = useCallback(
    (index: number) => {
      const item = items[index];
      const next = toggleSelectionKey(keys, itemKey(item, index), mode);
      if (!controlled) setInnerKeys(next);
      const resolved = resolveSelection(items, next, mode);
      if (onSelect && resolved) onSelect(resolved, { index, item });
    },
    [items, keys, mode, controlled, onSelect],
  );

  const sel = { keys, mode, toggle };
  return (
    <div className="appearances" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
      {views.topview && <ViewRenderer view={views.topview} items={items} selection={sel} />}
      {views.bottomview && <ViewRenderer view={views.bottomview} items={items} selection={sel} />}
    </div>
  );
}

interface SelectionCtx {
  keys: ItemId[];
  mode: SelectionType;
  toggle: (index: number) => void;
}

function ViewRenderer({ view, items, selection }: { view: NormalizedView; items: Item[]; selection: SelectionCtx }) {
  if (view.name === 'banner') return <BannerView view={view} />;
  return <ListView view={view} items={items} selection={selection} />;
}

function BannerView({ view }: { view: NormalizedView }) {
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

let radioGroupSeq = 0;

function ListView({ view, items, selection }: { view: NormalizedView; items: Item[]; selection: SelectionCtx }) {
  // Unique radio group per list (React >=17 compatible; no useId).
  const [radioName] = useState(() => `appearance-select-${++radioGroupSeq}`);
  const [titleField = 'Name', ...otherFields] = view.fields;
  const { style, selectiontype } = view;
  // This list is interactive only if it drives the instance's selection mode.
  const interactive = selectiontype !== 'none' && selectiontype === selection.mode;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: view.gap }}>
      {items.map((item, index) => {
        const checked = interactive && selection.keys.includes(itemKey(item, index));
        return (
          <div
            key={item.id ?? index}
            className="appearance-item"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#fff',
              border: style === 'border' ? '1px solid #d1d5db' : style === 'shadow' ? '1px solid transparent' : '1px solid #e5e7eb',
              boxShadow: style === 'shadow' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {selectiontype === 'multiple' && (
              <input type="checkbox" checked={checked} disabled={!interactive} onChange={() => selection.toggle(index)} style={{ marginRight: 8 }} />
            )}
            {selectiontype === 'single' && (
              <input type="radio" name={radioName} checked={checked} disabled={!interactive} onChange={() => selection.toggle(index)} style={{ marginRight: 8 }} />
            )}
            <strong>{String(item[titleField] ?? item.name ?? item.Name ?? `Item ${index + 1}`)}</strong>
            {otherFields.map((field) => item[field] !== undefined && (
              <div key={field} style={{ fontSize: '0.9em', color: '#4b5563', marginTop: 4 }}>
                {String(item[field])}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
