/**
 * FilterBarV3.tsx
 *
 * Analytics V3 extended filter panel.
 * Composes the existing V2 FilterBar (unchanged) and adds V3-specific
 * controls below it: Qualification, Experience Range, and Faculty ID.
 *
 * Design principle — config-driven:
 *   V3_FILTER_DEFINITIONS is a declarative array. Adding a future filter
 *   only requires a new entry in that array — no logic changes elsewhere.
 *
 * V2 FilterBar is rendered as-is using its existing props.
 * All new V3 controls are purely additive.
 *
 * Usage:
 *   <FilterBarV3 value={filters} onChange={setFilters} />
 */

import { useEffect, useState } from 'react';
import FilterBar, { MultiSelectField, toValueArray } from './FilterBar';
import { getFilterOptionsV3, type FilterOptionsV3 } from '../../lib/analyticsV3Api';
import type { AnalyticsFilters } from '../../lib/analyticsV2Api';

interface FilterBarV3Props {
  value:    AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
}

// ── V3 filter definitions — add new filters here only ────────────────────────
// type: 'select' | 'multi-select' | 'text' | 'number-range'
// optionsKey: key in FilterOptionsV3 (for 'select' / 'multi-select' types only)

interface V3FilterDef {
  key:        keyof AnalyticsFilters;
  label:      string;
  type:       'select' | 'multi-select' | 'text' | 'number-range';
  optionsKey?: keyof FilterOptionsV3;
  placeholder?: string;
  rangeMinKey?: keyof AnalyticsFilters;
  rangeMaxKey?: keyof AnalyticsFilters;
}

const V3_FILTER_DEFINITIONS: V3FilterDef[] = [
  {
    key:        'qualification',
    label:      'Qualification',
    type:       'multi-select',
    optionsKey: 'qualificationLevels',
  },
  {
    key:        'awardCategory',
    label:      'Award Category',
    type:       'multi-select',
    optionsKey: 'awardCategories',
  },
  {
    key:        'minExperience',
    label:      'Experience Range (Years)',
    type:       'number-range',
    rangeMinKey: 'minExperience',
    rangeMaxKey: 'maxExperience',
  },
  {
    key:        'facultyId',
    label:      'Faculty ID / Username',
    type:       'text',
    placeholder: 'Enter faculty username or ID',
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function FilterBarV3({ value, onChange }: FilterBarV3Props) {
  const [v3Options,  setV3Options]  = useState<FilterOptionsV3 | null>(null);
  const [v3Loading,  setV3Loading]  = useState(false);
  const [v3Expanded, setV3Expanded] = useState(false);

  useEffect(() => {
    setV3Loading(true);
    getFilterOptionsV3()
      .then(setV3Options)
      .catch(() => setV3Options(null))
      .finally(() => setV3Loading(false));
  }, []);

  const handleChange = (key: keyof AnalyticsFilters, val: string) => {
    onChange({ ...value, [key]: val || undefined });
  };

  const handleMultiChange = (key: keyof AnalyticsFilters, vals: string[]) => {
    onChange({ ...value, [key]: vals.length === 0 ? undefined : vals.length === 1 ? vals[0] : vals });
  };

  const v3ActiveCount = V3_FILTER_DEFINITIONS.filter(def => {
    if (def.type === 'number-range') {
      return (value[def.rangeMinKey!] || value[def.rangeMaxKey!]);
    }
    return value[def.key];
  }).length;

  return (
    <div>
      {/* V2 FilterBar — completely unchanged */}
      <FilterBar value={value} onChange={onChange} />

      {/* V3 extended controls */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 12,
        padding: '10px 16px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setV3Expanded(p => !p)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem', color: '#0369a1',
              display: 'flex', alignItems: 'center', gap: 6, padding: 0,
            }}
          >
            <span>{v3Expanded ? '▲' : '▼'}</span>
            <span>Advanced Filters</span>
            {v3ActiveCount > 0 && (
              <span style={{
                background: '#0369a1', color: '#fff',
                borderRadius: 999, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 700,
              }}>
                {v3ActiveCount}
              </span>
            )}
          </button>
          {v3Loading && (
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Loading…</span>
          )}
          {v3ActiveCount > 0 && (
            <button
              type="button"
              onClick={() => {
                const cleared = { ...value };
                V3_FILTER_DEFINITIONS.forEach(def => {
                  delete cleared[def.key];
                  if (def.rangeMinKey) delete cleared[def.rangeMinKey];
                  if (def.rangeMaxKey) delete cleared[def.rangeMaxKey];
                });
                onChange(cleared);
              }}
              style={{
                background: 'none', border: '1px solid #bae6fd', borderRadius: 8,
                cursor: 'pointer', fontSize: '0.78rem', color: '#0369a1', padding: '2px 8px',
              }}
            >
              Clear advanced
            </button>
          )}
        </div>

        {v3Expanded && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 14 }}>
            {V3_FILTER_DEFINITIONS.map(def => {

              // Multi-select dropdown
              if (def.type === 'multi-select' && def.optionsKey && v3Options) {
                const opts = v3Options[def.optionsKey] as string[];
                if (!opts || opts.length === 0) return null;
                return (
                  <MultiSelectField
                    key={String(def.key)}
                    label={def.label}
                    options={opts}
                    values={toValueArray(value[def.key] as string | string[] | undefined)}
                    onChange={vals => handleMultiChange(def.key, vals)}
                  />
                );
              }

              // Select dropdown
              if (def.type === 'select' && def.optionsKey && v3Options) {
                const opts = v3Options[def.optionsKey] as string[];
                if (!opts || opts.length === 0) return null;
                return (
                  <div key={String(def.key)} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                    <label style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>
                      {def.label}
                    </label>
                    <select
                      value={(value[def.key] as string) ?? ''}
                      onChange={e => handleChange(def.key, e.target.value)}
                      style={{
                        border: '1px solid #bae6fd', borderRadius: 8, padding: '6px 10px',
                        fontSize: '0.85rem', background: '#fff', color: '#334155', cursor: 'pointer',
                      }}
                    >
                      <option value="">All</option>
                      {opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                );
              }

              // Free-text input
              if (def.type === 'text') {
                return (
                  <div key={String(def.key)} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
                    <label style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>
                      {def.label}
                    </label>
                    <input
                      type="text"
                      placeholder={def.placeholder}
                      value={value[def.key] ?? ''}
                      onChange={e => handleChange(def.key, e.target.value)}
                      style={{
                        border: '1px solid #bae6fd', borderRadius: 8, padding: '6px 10px',
                        fontSize: '0.85rem', background: '#fff', color: '#334155',
                      }}
                    />
                  </div>
                );
              }

              // Number range
              if (def.type === 'number-range' && def.rangeMinKey && def.rangeMaxKey) {
                const expRange = v3Options?.experienceRange;
                return (
                  <div key={String(def.key)} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>
                      {def.label}
                      {expRange ? ` (${expRange.min}–${expRange.max} yrs available)` : ''}
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number" min={0} placeholder="Min"
                        value={value[def.rangeMinKey] ?? ''}
                        onChange={e => handleChange(def.rangeMinKey!, e.target.value)}
                        style={{
                          border: '1px solid #bae6fd', borderRadius: 8, padding: '6px 8px',
                          fontSize: '0.85rem', width: 72, background: '#fff', color: '#334155',
                        }}
                      />
                      <span style={{ alignSelf: 'center', color: '#64748b' }}>–</span>
                      <input
                        type="number" min={0} placeholder="Max"
                        value={value[def.rangeMaxKey] ?? ''}
                        onChange={e => handleChange(def.rangeMaxKey!, e.target.value)}
                        style={{
                          border: '1px solid #bae6fd', borderRadius: 8, padding: '6px 8px',
                          fontSize: '0.85rem', width: 72, background: '#fff', color: '#334155',
                        }}
                      />
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
