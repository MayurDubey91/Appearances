import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppearanceOptions, Item, ItemId, SelectionType, SelectionValue, SortState } from '../core/types';
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
  type NormalizedView,
} from '../core/normalize.js';

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
  if (view.name === 'grid') return <GridView view={view} items={items} selection={selection} />;
  if (view.name === 'cards') return <CardsView view={view} items={items} selection={selection} />;
  if (view.name === 'table') return <TableView view={view} items={items} selection={selection} />;
  return <ListView view={view} items={items} selection={selection} />;
}

/** Object URL for a File banner, revoked on change/unmount (mirrors vanilla). */
function useObjectUrl(file: unknown): string | null {
  const isBlob = typeof Blob !== 'undefined' && file instanceof Blob;
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isBlob) return;
    const u = URL.createObjectURL(file as Blob);
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
      setUrl(null);
    };
  }, [file, isBlob]);
  return isBlob ? url : null;
}

function BannerView({ view }: { view: NormalizedView }) {
  const file = view.file;
  const objectUrl = useObjectUrl(file);
  if (file && typeof file !== 'string') {
    // File/Blob: like vanilla, render the object URL as an image.
    if (!objectUrl) return <div />;
    return <img src={objectUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
  }
  if (!file) return <div>Banner (no file provided)</div>;

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

interface ItemViewProps {
  view: NormalizedView;
  items: Item[];
  selection: SelectionCtx;
}

/** Checkbox/radio for an item; same semantics as the list view. */
function SelectInput({ view, item, index, selection, radioName }: { view: NormalizedView; item: Item; index: number; selection: SelectionCtx; radioName: string }) {
  const { selectiontype } = view;
  if (selectiontype === 'none') return null;
  const interactive = selectiontype === selection.mode;
  const checked = interactive && selection.keys.includes(itemKey(item, index));
  const label = `Select ${fieldText(item, view.fields[0]) || `Item ${index + 1}`}`;
  return (
    <input
      type={selectiontype === 'multiple' ? 'checkbox' : 'radio'}
      name={selectiontype === 'single' ? radioName : undefined}
      aria-label={label}
      checked={checked}
      disabled={!interactive}
      onChange={() => selection.toggle(index)}
    />
  );
}

function useRadioName() {
  const [name] = useState(() => `appearance-select-${++radioGroupSeq}`);
  return name;
}

function ItemImage({ item, field, alt, ratio }: { item: Item; field?: string; alt: string; ratio: string }) {
  if (!field) return null;
  const src = safeUrl(item[field], 'image');
  if (!src) return null;
  return <img src={src} alt={alt} loading="lazy" style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: ratio }} />;
}

const boxStyle = (view: NormalizedView, min: string): React.CSSProperties => ({
  display: 'grid',
  gap: view.gap,
  gridTemplateColumns: gridTemplate(view.columns ?? 'auto', min),
  alignContent: 'start',
  height: '100%',
  overflow: 'auto',
  padding: 8,
  boxSizing: 'border-box',
});

const tileCss = (view: NormalizedView): React.CSSProperties => ({
  ...tileStyle(view.style),
  borderRadius: 8,
  background: '#fff',
  overflow: 'hidden',
  boxSizing: 'border-box',
});

function GridView({ view, items, selection }: ItemViewProps) {
  const radioName = useRadioName();
  const [titleField, ...otherFields] = view.fields;
  return (
    <div style={boxStyle(view, '160px')}>
      {items.map((item, index) => (
        <div key={item.id ?? index} className="appearance-item appearance-grid-item" style={tileCss(view)}>
          <ItemImage item={item} field={view.image} alt={fieldText(item, titleField)} ratio="1 / 1" />
          <div style={{ padding: '10px 12px' }}>
            <SelectInput view={view} item={item} index={index} selection={selection} radioName={radioName} />
            <strong>{fieldText(item, titleField) || `Item ${index + 1}`}</strong>
            {otherFields.map((f) => {
              const t = fieldText(item, f);
              return t ? <div key={f} style={{ fontSize: '0.9em', color: '#4b5563', marginTop: 4 }}>{t}</div> : null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardsView({ view, items, selection }: ItemViewProps) {
  const radioName = useRadioName();
  const [titleField, ...descFields] = view.fields;
  return (
    <div style={boxStyle(view, '220px')}>
      {items.map((item, index) => {
        const footer = view.footer ? fieldText(item, view.footer) : '';
        return (
          <div key={item.id ?? index} className="appearance-item appearance-card" style={{ ...tileCss(view), display: 'flex', flexDirection: 'column' }}>
            <ItemImage item={item} field={view.image} alt={fieldText(item, titleField)} ratio="16 / 9" />
            <div style={{ padding: '12px 16px', flex: '1 1 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SelectInput view={view} item={item} index={index} selection={selection} radioName={radioName} />
                <h3 style={{ margin: 0, fontSize: '1.05em' }}>{fieldText(item, titleField) || `Item ${index + 1}`}</h3>
              </div>
              {descFields.map((f) => {
                const t = fieldText(item, f);
                return t ? <p key={f} style={{ margin: '6px 0 0', color: '#4b5563', fontSize: '0.9em' }}>{t}</p> : null;
              })}
            </div>
            {footer && <div className="appearance-card-footer" style={{ padding: '8px 16px', borderTop: '1px solid #e5e7eb', fontWeight: 600 }}>{footer}</div>}
          </div>
        );
      })}
    </div>
  );
}

const srOnly: React.CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

function TableView({ view, items, selection }: ItemViewProps) {
  const radioName = useRadioName();
  const [sortState, setSort] = useState<SortState | null>(null);
  const sort = view.sortable ? sortState : null;
  const labels = tableHeaders(view);
  const hasSelect = view.selectiontype !== 'none';
  const cell: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' };
  const th: React.CSSProperties = { ...cell, background: '#f9fafb', ...(view.sticky ? { position: 'sticky', top: 0, zIndex: 1 } : {}) };
  const order = sort ? sortedIndices(items, sort.field, sort.dir) : items.map((_, i) => i);
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 8, boxSizing: 'border-box' }}>
      <table className="appearance-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr>
            {hasSelect && <th scope="col" style={th}><span style={srOnly}>Select</span></th>}
            {view.fields.map((field, i) => {
              if (!view.sortable) return <th key={field} scope="col" style={th}>{labels[i]}</th>;
              const s = ariaSort(sort, field);
              return (
                <th key={field} scope="col" style={th} aria-sort={s}>
                  <button type="button" className="appearance-sort" onClick={() => setSort((cur) => nextSort(cur, field))} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>
                    {labels[i] + (s === 'ascending' ? ' ▲' : s === 'descending' ? ' ▼' : '')}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {order.map((index) => {
            const item = items[index];
            return (
              <tr key={item.id ?? index} className="appearance-item appearance-row">
                {hasSelect && (
                  <td style={cell}>
                    <SelectInput view={view} item={item} index={index} selection={selection} radioName={radioName} />
                  </td>
                )}
                {view.fields.map((field) => <td key={field} style={cell}>{fieldText(item, field)}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
