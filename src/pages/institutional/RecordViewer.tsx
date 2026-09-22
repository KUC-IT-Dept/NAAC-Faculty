/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/institutional/RecordViewer.tsx
//
// Renders a Library/MMTTC record (or any similarly-shaped nested object)
// as readable labeled sections instead of raw JSON.stringify - used by the
// "View" modal on LibraryPage.tsx and MMTTCPage.tsx. Generic/recursive
// rather than hand-listing every field, since both records are large,
// deeply nested, and independently evolving.
import type { ReactNode } from 'react';

// Fields that are internal bookkeeping, not something a person reading the
// record needs to see (and _id/academicYear are already shown elsewhere -
// academicYear is the modal title, _id is never meaningful to a reader).
const HIDDEN_KEYS = new Set(['_id', '__v', 'academicYear', 'createdBy', 'updatedBy']);

// A few fields whose plain "insert a space before each capital" treatment
// wouldn't read naturally.
const ACRONYMS: Record<string, string> = {
  opacAvailable: 'OPAC Available',
  cctv: 'CCTV',
  url: 'URL',
};

function humanizeKey(key: string): string {
  if (ACRONYMS[key]) return ACRONYMS[key];
  const withSpaces = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

// Renders an enum-ish raw value ('short_term', 'refresher') as 'Short Term',
// 'Refresher'. Leaves ordinary free-text sentences/phrases untouched.
function humanizeEnumString(value: string): string {
  if (!/^[a-z][a-z0-9_]*$/.test(value)) return value;
  return value
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDateIfIsoString(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPrimitive(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') {
    const asDate = formatDateIfIsoString(value);
    if (asDate) return asDate;
    return humanizeEnumString(value);
  }
  return String(value);
}

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 16,
      padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem',
    }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function SectionTitle({ label, depth }: { label: string; depth: number }) {
  return (
    <div style={{
      fontWeight: 600,
      fontSize: depth === 0 ? '0.95rem' : '0.85rem',
      color: depth === 0 ? 'var(--primary)' : 'inherit',
      marginTop: depth === 0 ? 18 : 10,
      marginBottom: 6,
    }}>
      {label}
    </div>
  );
}

export default function RecordFields({ data, depth = 0 }: { data: Record<string, any>; depth?: number }) {
  const entries = Object.entries(data || {}).filter(([k]) => !HIDDEN_KEYS.has(k));

  if (entries.length === 0) {
    return <span style={{ color: 'var(--text-muted)' }}>No data recorded.</span>;
  }

  return (
    <>
      {entries.map(([key, value]) => {
        const label = humanizeKey(key);

        if (value === null || value === undefined) {
          return <FieldRow key={key} label={label} value={formatPrimitive(value)} />;
        }

        // Array of objects -> a small card per item (e.g. courses, workshops)
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          return (
            <div key={key}>
              <SectionTitle label={label} depth={depth} />
              {value.map((item, i) => (
                <div key={i} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px', marginBottom: 8,
                }}>
                  <RecordFields data={item} depth={depth + 1} />
                </div>
              ))}
            </div>
          );
        }

        // Array of primitives -> comma-separated, or an em dash if empty
        if (Array.isArray(value)) {
          const display = value.length > 0 ? value.map(v => humanizeEnumString(String(v))).join(', ') : formatPrimitive(null);
          return <FieldRow key={key} label={label} value={display} />;
        }

        // Nested object -> its own labeled sub-section
        if (typeof value === 'object') {
          return (
            <div key={key}>
              <SectionTitle label={label} depth={depth} />
              <RecordFields data={value} depth={depth + 1} />
            </div>
          );
        }

        return <FieldRow key={key} label={label} value={formatPrimitive(value)} />;
      })}
    </>
  );
}
