/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/BenchmarkCatalogue.tsx
//
// Management of the LIVE benchmark definitions: search, filter, inspect scoring rules and
// analytics mapping, add manually, edit, deactivate/reactivate (never deletes).
// Everything is validated again on the server; this component is only the interface.
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Eye, Power, Trash2 } from 'lucide-react';
import DeleteBenchmarkDialog from './DeleteBenchmarkDialog';
import {
  listCatalogue, getCatalogueItem, getCatalogueHistory, createCatalogueItem, updateCatalogueItem, deactivateCatalogueItem,
  reactivateCatalogueItem, deleteCatalogueItem, getMetricOptions, type MetricOption,
  type CatalogueList, type CatalogueItem, type CatalogueDetail, type CatalogueWrite, type AuditEntry, type RowFlag,
} from '../../lib/benchmarkImportApi';

import MetricMappingSelect from '../../components/admin/MetricMappingSelect';

const UNITS = ['count', 'percentage', 'ratio', 'amount_lakhs', 'days', 'years', 'option'];
const MAP_LABEL: Record<string, { text: string; color: string }> = {
  mapped: { text: 'Mapped', color: '#166534' }, unmapped: { text: 'Unmapped', color: '#92400e' },
  unsupported: { text: 'Unsupported metric', color: '#991b1b' }, unknown_metric: { text: 'Unknown analytics metric', color: '#991b1b' },
};
const errMsg = (e: any) => e?.response?.data?.message || (e?.response?.status === 403 ? 'Only administrators can do this.' : 'Request failed.');
const inp: React.CSSProperties = { width: '100%', fontSize: '0.85rem', padding: '5px 7px', border: '1px solid #cbd5e1', borderRadius: 4 };

interface FormState {
  metricId: string; criterionNumber: string; keyIndicator: string; description: string; unit: string; scoringType: 'numeric' | 'categorical';
  maxScore: string; period: string; bands: string[]; optionTexts: string[]; computedField: string; formula: string; notes: string; improvementHint: string;
}
const blank = (): FormState => ({ metricId: '', criterionNumber: '1', keyIndicator: '', description: '', unit: 'count', scoringType: 'numeric', maxScore: '', period: '', bands: ['', '', '', '', ''], optionTexts: ['', '', '', '', ''], computedField: '', formula: '', notes: '', improvementHint: '' });
const fromItem = (d: CatalogueItem): FormState => ({
  metricId: d.metricId, criterionNumber: String(d.criterionNumber || 1), keyIndicator: d.keyIndicator || '', description: d.description || '', unit: d.unit, scoringType: d.scoringType,
  maxScore: d.maxScore == null ? '' : String(d.maxScore), period: d.period || '',
  bands: [4, 3, 2, 1, 0].map((sc) => d.bands.find((b) => b.score === sc)?.label ?? ''),
  optionTexts: ['A', 'B', 'C', 'D', 'E'].map((l) => d.options.find((o) => o.label === l)?.text ?? ''),
  computedField: d.computedField || '', formula: d.formula || '', notes: d.notes || '', improvementHint: d.improvementHint || '',
});
const toPayload = (f: FormState, isEdit: boolean): CatalogueWrite => {
  const categorical = f.scoringType === 'categorical';
  const p: CatalogueWrite = {
    criterionNumber: Number(f.criterionNumber), keyIndicator: f.keyIndicator, description: f.description, unit: f.unit, scoringType: f.scoringType,
    maxScore: f.maxScore === '' ? null : Number(f.maxScore), period: f.period || null, computedField: f.computedField || null,
    formula: f.formula, notes: f.notes, improvementHint: f.improvementHint,
    bands: categorical ? ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({ score: 4 - i, label: l })) : [4, 3, 2, 1, 0].map((sc, i) => ({ score: sc, label: f.bands[i] })),
    options: categorical ? ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({ label: l, score: 4 - i, text: f.optionTexts[i] })) : [],
  };
  if (!isEdit) p.metricId = f.metricId;
  return p;
};

function ItemForm({ item, onClose, onSaved }: { item: CatalogueItem | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!item;
  const [f, setF] = useState<FormState>(item ? fromItem(item) : blank());
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState<RowFlag[]>([]);
  const [options, setOptions] = useState<MetricOption[]>([]);
  useEffect(() => { getMetricOptions().then(setOptions).catch(() => setOptions([])); }, []);
  const set = (patch: Partial<FormState>) => setF((s) => ({ ...s, ...patch }));
  const submit = async () => {
    setBusy(true); setProblems([]);
    try {
      const res = isEdit ? await updateCatalogueItem(item!.metricId, toPayload(f, true)) : await createCatalogueItem(toPayload(f, false));
      const warns = res.flags.filter((x) => x.severity === 'warning');
      toast.success(isEdit ? 'Benchmark updated.' : 'Benchmark added.');
      if (warns.length) toast(warns.map((w) => w.message).join(' '), { icon: '⚠️', duration: 7000 });
      onSaved();
    } catch (e: any) {
      toast.error(errMsg(e)); setProblems(e?.response?.data?.flags || []);
    } finally { setBusy(false); }
  };
  const label = (t: string) => <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 2 }}>{t}</label>;
  return (
    <div className="modal-overlay" onClick={() => !busy && onClose()}>
      <div className="modal" style={{ maxWidth: 760, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ margin: 0 }}>{isEdit ? `Edit ${item!.metricId}` : 'Add benchmark'}</h3></div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '8px 14px' }}>
          <div>{label('Metric ID (e.g. 3.4.4)')}<input aria-label="Metric ID" style={inp} disabled={isEdit} value={f.metricId} onChange={(e) => set({ metricId: e.target.value })} /></div>
          <div>{label('NAAC Criterion')}<select aria-label="Criterion" style={inp} value={f.criterionNumber} onChange={(e) => set({ criterionNumber: e.target.value })}>{[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>Criterion {n}</option>)}</select></div>
          <div style={{ gridColumn: '1 / -1' }}>{label('Key indicator (e.g. 3.4 Research Publications and Awards)')}<input aria-label="Key indicator" style={inp} value={f.keyIndicator} onChange={(e) => set({ keyIndicator: e.target.value })} /></div>
          <div style={{ gridColumn: '1 / -1' }}>{label('Metric description')}<textarea aria-label="Description" style={{ ...inp, minHeight: 60 }} value={f.description} onChange={(e) => set({ description: e.target.value })} /></div>
          <div>{label('Scoring type')}<select aria-label="Scoring type" style={inp} value={f.scoringType} onChange={(e) => set({ scoringType: e.target.value as any, unit: e.target.value === 'categorical' ? 'option' : f.unit === 'option' ? 'count' : f.unit })}><option value="numeric">Numeric score bands</option><option value="categorical">Categorical A–E</option></select></div>
          <div>{label('Unit')}<select aria-label="Unit" style={inp} value={f.unit} onChange={(e) => set({ unit: e.target.value })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
          <div>{label('Weighted score (maximum)')}<input aria-label="Weight" style={inp} type="number" value={f.maxScore} onChange={(e) => set({ maxScore: e.target.value })} /></div>
          <div>{label('Applicable period')}<input aria-label="Period" style={inp} placeholder="e.g. last five years" value={f.period} onChange={(e) => set({ period: e.target.value })} /></div>
          {f.scoringType === 'numeric' ? (
            <div style={{ gridColumn: '1 / -1' }}>
              {label('Score bands (4 = best … 0). Use >=x, >x, <=x, <x, a-b (a ≤ v < b) or a:1 for ratios')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {[4, 3, 2, 1, 0].map((sc, i) => (
                  <div key={sc}><span style={{ fontSize: '0.72rem', color: '#64748b' }}>Score {sc}</span>
                    <input aria-label={`Band ${sc}`} style={inp} value={f.bands[i]} onChange={(e) => set({ bands: f.bands.map((b, j) => (j === i ? e.target.value : b)) })} /></div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ gridColumn: '1 / -1' }}>
              {label('Option descriptions (A is the best grade)')}
              {['A', 'B', 'C', 'D', 'E'].map((l, i) => (
                <div key={l} style={{ display: 'flex', gap: 6, marginBottom: 3 }}><b style={{ width: 16 }}>{l}</b>
                  <input aria-label={`Option ${l}`} style={inp} value={f.optionTexts[i]} onChange={(e) => set({ optionTexts: f.optionTexts.map((t, j) => (j === i ? e.target.value : t)) })} /></div>
              ))}
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }}>{label('Analytics mapping — which institutional metric supplies the current value')}
            <MetricMappingSelect ariaLabel="Analytics mapping" style={inp} value={f.computedField} unit={f.scoringType === 'categorical' ? 'option' : f.unit} options={options} onChange={(v) => set({ computedField: v || '' })} />
          </div>
          <div>{label('Formula (display text only)')}<input aria-label="Formula" style={inp} value={f.formula} onChange={(e) => set({ formula: e.target.value })} /></div>
          <div>{label('Notes')}<input aria-label="Notes" style={inp} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></div>
          <div style={{ gridColumn: '1 / -1' }}>{label('Improvement hint (shown as the recommendation)')}<input aria-label="Improvement hint" style={inp} value={f.improvementHint} onChange={(e) => set({ improvementHint: e.target.value })} /></div>
          {problems.length > 0 && (
            <div style={{ gridColumn: '1 / -1', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 6, padding: '6px 10px', fontSize: '0.8rem' }}>
              {problems.map((p, i) => <div key={i} style={{ color: p.severity === 'error' ? '#b91c1c' : '#b45309' }}>● {p.message}</div>)}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" disabled={busy} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add benchmark'}</button>
        </div>
      </div>
    </div>
  );
}

function Inspector({ metricId, onClose }: { metricId: string; onClose: () => void }) {
  const [d, setD] = useState<CatalogueDetail | null>(null);
  const [hist, setHist] = useState<AuditEntry[]>([]);
  useEffect(() => {
    getCatalogueItem(metricId).then(setD).catch((e) => toast.error(errMsg(e)));
    getCatalogueHistory(metricId).then(setHist).catch(() => setHist([]));
  }, [metricId]);
  const range = (b: CatalogueDetail['bandsDetail'][number]) => {
    if (b.min === null && b.max === null) return '—';
    const lo = b.min === null ? '(\u2212\u221e' : `${b.minInclusive ? '[' : '('}${b.min}`;
    const hi = b.max === null ? '+\u221e)' : `${b.max}${b.maxInclusive ? ']' : ')'}`;
    return `${lo}, ${hi}`;
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 820, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3 style={{ margin: 0 }}>{metricId} — scoring rules &amp; mapping</h3></div>
        <div className="modal-body" style={{ fontSize: '0.85rem' }}>
          {!d ? <p>Loading…</p> : (
            <>
              <p style={{ margin: '0 0 8px' }}>{d.description}</p>
              <p style={{ margin: '0 0 8px', color: '#64748b' }}>{d.criterion} · {d.keyIndicator} · unit <b>{d.unit}</b> · weight <b>{d.maxScore ?? '—'}</b>{d.period ? ` · ${d.period}` : ''} · {d.scoringType === 'categorical' ? 'categorical A–E' : d.direction === 'lowerIsBetter' ? 'lower is better' : 'higher is better'}</p>
              <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 10 }}>
                <thead><tr style={{ textAlign: 'left', color: '#475569' }}><th>Score</th><th>Band as printed</th><th>Interval (inclusivity)</th>{d.scoringType === 'categorical' && <th>Option</th>}</tr></thead>
                <tbody>{d.bandsDetail.slice().sort((a, b) => b.score - a.score).map((b) => (
                  <tr key={b.score}><td>{b.score}</td><td>{b.label}</td><td>{d.scoringType === 'categorical' ? '—' : range(b)}</td>{d.scoringType === 'categorical' && <td>{d.options.find((o) => o.label === b.label)?.text || ''}</td>}</tr>
                ))}</tbody>
              </table>
              <p style={{ margin: '0 0 4px' }}><b>Analytics mapping:</b> {d.analyticsMetric ? `${d.analyticsMetric.metricId} — ${d.analyticsMetric.metricName} (${d.analyticsMetric.formulaType || 'n/a'}${d.analyticsMetric.supported ? '' : ', unsupported'})` : d.computedField ? `${d.computedField} (not found in the analytics catalogue)` : 'Unmapped — the current value will read “Insufficient data”.'}</p>
              {d.formula && <p style={{ margin: '0 0 4px' }}><b>Formula (text only):</b> {d.formula}</p>}
              {d.notes && <p style={{ margin: '0 0 4px' }}><b>Notes:</b> {d.notes}</p>}
              <p style={{ margin: '0 0 8px' }}><b>Source:</b> {d.source.origin === 'import' ? `import v${d.source.versionNo} · ${d.source.filename || ''}${d.source.page ? ` · p.${d.source.page}` : ''}` : d.source.origin === 'manual' ? 'added manually' : 'seeded catalogue'} · revision {d.source.revision}{d.source.editedBy ? ` · last edited by ${d.source.editedBy}` : ''}{!d.active && d.lifecycle ? ` · deactivated by ${d.lifecycle.deactivatedBy || '?'}${d.lifecycle.reason ? ` (${d.lifecycle.reason})` : ''}` : ''}</p>
              <b>History</b>
              <div style={{ maxHeight: 160, overflowY: 'auto', marginTop: 4 }}>
                {hist.length === 0 ? <span style={{ color: '#94a3b8' }}>No recorded changes.</span> : hist.map((h) => (
                  <div key={h._id} style={{ borderBottom: '1px solid #f1f5f9', padding: '3px 0', fontSize: '0.78rem' }}>
                    {new Date(h.at).toLocaleString()} · <b>{h.action}</b> · {h.actor?.name || '—'}{(h.details as any)?.change ? ` · ${(h.details as any).change}` : ''}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer"><button className="btn btn-primary" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

export default function BenchmarkCatalogue() {
  const [filters, setFilters] = useState({ q: '', criterion: '', status: '', version: '', mapping: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CatalogueList | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ item: CatalogueItem | null } | null>(null);
  const [inspect, setInspect] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [del, setDel] = useState<CatalogueItem | null>(null);
  const [delError, setDelError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await listCatalogue({ ...filters, page, limit: 25 })); } catch (e) { toast.error(errMsg(e)); } finally { setLoading(false); }
  }, [filters, page]);
  // debounce typing in the search box; other filters apply immediately
  useEffect(() => { const t = setTimeout(load, filters.q ? 250 : 0); return () => clearTimeout(t); }, [load, tick, filters.q]);
  const setFilter = (patch: Partial<typeof filters>) => { setPage(1); setFilters((f) => ({ ...f, ...patch })); };

  const toggle = async (it: CatalogueItem) => {
    try {
      if (it.active) {
        if (!window.confirm(`Deactivate ${it.metricId}? It disappears from Analytics but is kept and can be reactivated.`)) return;
        const reason = window.prompt('Reason (optional):') || '';
        await deactivateCatalogueItem(it.metricId, reason); toast.success('Deactivated.');
      } else { await reactivateCatalogueItem(it.metricId); toast.success('Reactivated.'); }
      setTick((t) => t + 1);
    } catch (e) { toast.error(errMsg(e)); }
  };
  const confirmDelete = async () => {
    if (!del) return;
    setDelError(null);
    try {
      await deleteCatalogueItem(del.metricId);
      toast.success(`Benchmark ${del.metricId} deleted.`);
      if (inspect === del.metricId) setInspect(null);
      setDel(null); setTick((t) => t + 1);
    } catch (e) { const m = errMsg(e); setDelError(m); toast.error(m); }
  };
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <input aria-label="Search" style={{ ...inp, maxWidth: 280 }} placeholder="Search metric ID or description" value={filters.q} onChange={(e) => setFilter({ q: e.target.value })} />
        <select aria-label="Filter criterion" style={{ ...inp, width: 'auto' }} value={filters.criterion} onChange={(e) => setFilter({ criterion: e.target.value })}>
          <option value="">All criteria</option>{[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>Criterion {n}{data ? ` (${data.facets.criteria[n - 1]?.count ?? 0})` : ''}</option>)}
        </select>
        <select aria-label="Filter status" style={{ ...inp, width: 'auto' }} value={filters.status} onChange={(e) => setFilter({ status: e.target.value })}>
          <option value="">Any status</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
        <select aria-label="Filter version" style={{ ...inp, width: 'auto' }} value={filters.version} onChange={(e) => setFilter({ version: e.target.value })}>
          <option value="">Any import version</option>
          {(data?.facets.versions || []).map((v) => <option key={v} value={v}>{v === 'seed' ? 'Seeded catalogue' : v === 'manual' ? 'Added manually' : `Import v${v}`}</option>)}
        </select>
        <select aria-label="Filter mapping" style={{ ...inp, width: 'auto' }} value={filters.mapping} onChange={(e) => setFilter({ mapping: e.target.value })}>
          <option value="">Mapped &amp; unmapped</option><option value="mapped">Mapped</option><option value="unmapped">Unmapped</option>
        </select>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setForm({ item: null })}><Plus size={14} /> Add benchmark</button>
      </div>
      {data && <p className="text-sm text-muted" style={{ margin: '0 0 6px' }}>{data.total} shown · {data.facets.totals.active} active · {data.facets.totals.inactive} inactive · {data.facets.totals.unmapped} unmapped</p>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead><tr style={{ textAlign: 'left', color: '#475569' }}>{['ID', 'Description', 'Criterion', 'Unit · type', 'Score bands (4→0)', 'Mapping', 'Status', 'Source', ''].map((h) => <th key={h} style={{ padding: '6px 8px', borderBottom: '2px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading && !data && <tr><td colSpan={9} style={{ padding: 12 }}>Loading…</td></tr>}
            {data && data.items.length === 0 && <tr><td colSpan={9} style={{ padding: 12, color: '#94a3b8' }}>No benchmark definitions match these filters.</td></tr>}
            {data?.items.map((it) => (
              <tr key={it.metricId} style={{ opacity: it.active ? 1 : 0.55, borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>{it.metricId}</td>
                <td style={{ padding: '6px 8px', maxWidth: 340 }}>{it.description}</td>
                <td style={{ padding: '6px 8px', color: '#64748b' }}>C{it.criterionNumber}</td>
                <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{it.unit}<div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{it.scoringType === 'categorical' ? 'A–E' : it.direction === 'lowerIsBetter' ? 'lower better' : 'higher better'}</div></td>
                <td style={{ padding: '6px 8px', fontSize: '0.74rem', color: '#475569' }}>{it.bands.slice().sort((a, b) => b.score - a.score).map((b) => `${b.score}: ${b.label}`).join('  ')}</td>
                <td style={{ padding: '6px 8px', color: MAP_LABEL[it.mappingStatus].color, whiteSpace: 'nowrap' }}>{MAP_LABEL[it.mappingStatus].text}{it.computedField ? <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{it.computedField}</div> : null}</td>
                <td style={{ padding: '6px 8px' }}>{it.active ? 'Active' : 'Inactive'}</td>
                <td style={{ padding: '6px 8px', fontSize: '0.72rem', color: '#64748b' }}>{it.source.origin === 'import' ? `v${it.source.versionNo}` : it.source.origin === 'manual' ? 'Manual' : 'Seed'}{it.source.revision ? ` · r${it.source.revision}` : ''}</td>
                <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-outline btn-sm" title="Inspect" onClick={() => setInspect(it.metricId)}><Eye size={12} /></button>{' '}
                  <button className="btn btn-outline btn-sm" title="Edit" onClick={() => setForm({ item: it })}><Pencil size={12} /></button>{' '}
                  <button className="btn btn-outline btn-sm" title={it.active ? 'Deactivate' : 'Reactivate'} onClick={() => toggle(it)}><Power size={12} /> {it.active ? 'Deactivate' : 'Reactivate'}</button>{' '}
                  <button className="btn btn-outline btn-sm" aria-label={`Delete ${it.metricId}`} disabled={it.active}
                    title={it.active ? 'An active benchmark is used by Analytics. Deactivate it first, then delete it.' : 'Delete permanently'}
                    onClick={() => { setDelError(null); setDel(it); }}><Trash2 size={12} /> Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="text-sm">Page {page} of {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
      {form && <ItemForm item={form.item} onClose={() => setForm(null)} onSaved={() => { setForm(null); setTick((t) => t + 1); }} />}
      {del && (
        <DeleteBenchmarkDialog
          target={{
            kind: 'record', confirmWord: del.metricId, title: `Delete benchmark ${del.metricId}?`,
            details: [`Metric ${del.metricId} · Criterion ${del.criterionNumber}`, del.description,
              `Source: ${del.source.origin === 'import' ? `import v${del.source.versionNo}` : del.source.origin === 'manual' ? 'added manually' : 'seeded catalogue'} · currently inactive`],
            consequences: ['Removes only this benchmark record.', 'Analytics metric definitions, other benchmarks and import versions are kept.', 'The deletion is written to the audit log with your name and the time.'],
          }}
          error={delError} onCancel={() => { setDel(null); setDelError(null); }} onConfirm={confirmDelete} />
      )}
      {inspect && <Inspector metricId={inspect} onClose={() => setInspect(null)} />}
    </div>
  );
}
