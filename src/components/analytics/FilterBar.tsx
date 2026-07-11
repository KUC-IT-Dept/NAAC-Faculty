/**
 * FilterBar.tsx
 *
 * Analytics V2 filter control panel.
 * Renders dropdowns for every supported filter dimension and emits
 * the current filter state to its parent via the onChange callback.
 *
 * Filter options are loaded once from GET /analytics/filters/options
 * and cached in local state — no external store is used.
 *
 * Usage:
 *   <FilterBar value={filters} onChange={setFilters} />
 */

import { useEffect, useRef, useState } from 'react';
import { getFilterOptions, type AnalyticsFilters, type FilterOptions } from '../../lib/analyticsV2Api';

// ── Multi-select control ────────────────────────────────────────────────────
// Reused by FilterBar (department, pubType, projectCategory, fundingAgency)
// and FilterBarV3 (qualification, awardCategory). Renders like the existing
// single <select> at rest; opens a checkbox panel instead of a native list.
export function MultiSelectField({
  label,
  options,
  values,
  onChange,
}: {
  label:  string;
  options: string[];
  values:  string[];
  onChange: (vals: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggle = (opt: string) => {
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
  };

  const summary = values.length === 0 ? 'All' : values.length === 1 ? values[0] : `${values.length} selected`;

  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160, position: 'relative' }}>
      <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px',
          fontSize: '0.85rem', background: '#fff', color: values.length > 0 ? '#334155' : '#94a3b8',
          cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', gap: 8,
        }}
      >
        <span>{summary}</span>
        <span style={{ color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 30,
          background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8,
          minWidth: 200, maxHeight: 240, overflowY: 'auto',
          boxShadow: '0 4px 14px rgba(15,23,42,0.12)',
        }}>
          {options.map(opt => (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              fontSize: '0.85rem', color: '#334155', cursor: 'pointer',
            }}>
              <input type="checkbox" checked={values.includes(opt)} onChange={() => toggle(opt)} />
              {opt}
            </label>
          ))}
          {values.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                width: '100%', textAlign: 'left', padding: '6px 10px', fontSize: '0.78rem',
                color: '#64748b', background: 'none', border: 'none', borderTop: '1px solid #f1f5f9',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Normalizes a filter value (undefined | string | string[]) into a string[]. */
export function toValueArray(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

// Dimensions that support selecting multiple values at once.
const MULTI_SELECT_DIMS = new Set(['department', 'pubType', 'projectCategory', 'fundingAgency']);

interface FilterBarProps {
  /** Current filter state (controlled). */
  value: AnalyticsFilters;
  /** Called whenever any filter changes. */
  onChange: (filters: AnalyticsFilters) => void;
  /**
   * Which filter dimensions to show.
   * Defaults to all available dimensions.
   */
  show?: Array<
    | 'department' | 'designation' | 'year' | 'category'
    | 'level' | 'pubType' | 'projectCategory' | 'projectStatus'
    | 'fundingAgency' | 'patentStatus' | 'program'
  >;
}

const ALL_DIMENSIONS: FilterBarProps['show'] = [
  'department', 'year', 'category', 'level', 'pubType',
  'projectCategory', 'projectStatus', 'fundingAgency', 'patentStatus', 'program',
];

const LABELS: Record<string, string> = {
  department:      'Department',
  designation:     'Designation',
  year:            'Year',
  category:        'Journal Category',
  level:           'Publication Level',
  pubType:         'Publication Type',
  projectCategory: 'Project Category',
  projectStatus:   'Project Status',
  fundingAgency:   'Funding Agency',
  patentStatus:    'Patent Status',
  program:         'Program Level',
};

// Maps a filter key to the field in FilterOptions that populates it.
const OPTIONS_MAP: Record<string, keyof FilterOptions> = {
  department:      'departments',
  designation:     'designations',
  year:            'publicationYears',
  category:        'journalCategories',
  level:           'publicationLevels',
  pubType:         'publicationTypes',
  projectCategory: 'projectCategories',
  projectStatus:   'projectStatuses',
  fundingAgency:   'fundingAgencies',
  patentStatus:    'patentStatuses',
  program:         'programLevels',
};

export default function FilterBar({ value, onChange, show = ALL_DIMENSIONS }: FilterBarProps) {
  const [options, setOptions]   = useState<FilterOptions | null>(null);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    getFilterOptions()
      .then(setOptions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof AnalyticsFilters, val: string) => {
    onChange({ ...value, [key]: val || undefined });
  };

  // Stores a single value as a plain string (unchanged shape) and multiple
  // values as an array — so single-selection behavior/API payload is
  // byte-identical to before multi-select was added.
  const handleMultiChange = (key: keyof AnalyticsFilters, vals: string[]) => {
    onChange({ ...value, [key]: vals.length === 0 ? undefined : vals.length === 1 ? vals[0] : vals });
  };

  const handleReset = () => onChange({});

  const activeCount = Object.values(value).filter(v => v && v !== '').length;

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 20,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setExpanded(p => !p)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy, #1e3a5f)',
            display: 'flex', alignItems: 'center', gap: 6, padding: 0,
          }}
        >
          <span>{expanded ? '▲' : '▼'}</span>
          <span>Filters</span>
          {activeCount > 0 && (
            <span style={{
              background: 'var(--primary, #2563eb)', color: '#fff',
              borderRadius: 999, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 700,
            }}>
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'none', border: '1px solid #e2e8f0', borderRadius: 8,
              cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', padding: '3px 10px',
            }}
          >
            Clear all
          </button>
        )}

        {loading && (
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Loading options…</span>
        )}
      </div>

      {/* Filter controls */}
      {expanded && options && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14,
        }}>
          {(show ?? ALL_DIMENSIONS)!.map(dim => {
            const optKey = OPTIONS_MAP[dim];
            const opts   = options[optKey] as string[] | undefined;
            if (!opts || opts.length === 0) return null;

            if (MULTI_SELECT_DIMS.has(dim)) {
              return (
                <MultiSelectField
                  key={dim}
                  label={LABELS[dim]}
                  options={opts}
                  values={toValueArray(value[dim as keyof AnalyticsFilters] as string | string[] | undefined)}
                  onChange={vals => handleMultiChange(dim as keyof AnalyticsFilters, vals)}
                />
              );
            }

            return (
              <div key={dim} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  {LABELS[dim]}
                </label>
                <select
                  value={(value[dim as keyof AnalyticsFilters] as string) ?? ''}
                  onChange={e => handleChange(dim as keyof AnalyticsFilters, e.target.value)}
                  style={{
                    border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px',
                    fontSize: '0.85rem', background: '#fff', color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">All</option>
                  {opts.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {/* Date range (from / to) — shown separately since not a dropdown */}
      {expanded && (
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              Project Start — From
            </label>
            <input
              type="date"
              value={value.from ?? ''}
              onChange={e => handleChange('from', e.target.value)}
              style={{
                border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px',
                fontSize: '0.85rem', background: '#fff', color: '#334155',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              Project Start — To
            </label>
            <input
              type="date"
              value={value.to ?? ''}
              onChange={e => handleChange('to', e.target.value)}
              style={{
                border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px',
                fontSize: '0.85rem', background: '#fff', color: '#334155',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
