/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/BenchmarkImport.tsx
//
// Administrator workflow: upload a NAAC benchmark PDF -> review/edit the extracted
// definitions -> explicitly approve -> activate (never before approval).
// Every rule here is ALSO enforced by the server; this page is only the interface.
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, FilePlus, CheckCircle2, Rocket, RotateCcw, XCircle, Plus, Save, Trash2 } from 'lucide-react';
import DeleteBenchmarkDialog from './DeleteBenchmarkDialog';
import AppLayout from '../../components/AppLayout';
import BenchmarkCatalogue from './BenchmarkCatalogue';
import MetricMappingSelect from '../../components/admin/MetricMappingSelect';
import {
  getImportStatus, listImports, getImport, uploadBenchmarkPdf, createManualDraft, updateImportRow, addImportRow,
  approveImport, activateImport, rollbackImport, rejectImport, deleteImport, getAuditLog, previewActivation, fetchSourcePdfUrl,
  type ActivationPreview, type CatalogueStatus, type ImportSummary, type ImportFull, type ImportRow, type AuditEntry,
} from '../../lib/benchmarkImportApi';

const UNITS = ['count', 'percentage', 'ratio', 'amount_lakhs', 'days', 'years', 'option'];
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  draft: { bg: '#e0f2fe', fg: '#075985' }, approved: { bg: '#fef9c3', fg: '#854d0e' }, active: { bg: '#dcfce7', fg: '#166534' },
  superseded: { bg: '#f1f5f9', fg: '#475569' }, rejected: { bg: '#fee2e2', fg: '#991b1b' },
};
const SEV: Record<string, string> = { error: '#dc2626', warning: '#d97706', info: '#64748b' };

const errMsg = (e: any) => e?.response?.data?.message || (e?.response?.status === 403 ? 'Only administrators can use this page.' : 'Request failed.');

function Badge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return <span style={{ background: s.bg, color: s.fg, borderRadius: 999, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{status}</span>;
}

function RowEditor({ importId, row, editable, sourceStored, onSaved }: { importId: string; row: ImportRow; editable: boolean; sourceStored: boolean; onSaved: (r: ImportRow) => void }) {
  const [draft, setDraft] = useState<ImportRow>(row);
  const [showEv, setShowEv] = useState(false);
  const openSource = async () => {
    try { const url = await fetchSourcePdfUrl(importId); window.open(`${url}#page=${row.evidence?.pages?.[0] ?? 1}`, '_blank', 'noopener'); } catch (e) { toast.error(errMsg(e)); }
  };
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(row), [row]);
  const dirty = JSON.stringify({ ...draft, flags: 0 }) !== JSON.stringify({ ...row, flags: 0 });
  const set = (patch: Partial<ImportRow>) => setDraft((d) => ({ ...d, ...patch }));
  const bandLabel = (score: number) => draft.bands.find((b) => b.score === score)?.label ?? '';
  const setBand = (score: number, label: string) => {
    const others = [4, 3, 2, 1, 0].map((s) => ({ score: s, label: s === score ? label : bandLabel(s) }));
    set({ bands: others });
  };
  const save = async (extra: Partial<ImportRow> = {}) => {
    setBusy(true);
    try {
      const saved = await updateImportRow(importId, row.rowId, {
        metricId: draft.metricId, metricName: draft.metricName, description: draft.description, criterion: draft.criterion,
        criterionNumber: draft.criterionNumber, keyIndicator: draft.keyIndicator, maxScore: draft.maxScore, unit: draft.unit,
        period: draft.period, scoringType: draft.scoringType, bands: draft.bands, computedField: draft.computedField ?? null,
        excluded: draft.excluded, reviewed: draft.reviewed, ...extra,
      });
      onSaved(saved);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const hasError = row.flags.some((f) => f.severity === 'error');
  const needsReview = !row.excluded && !row.reviewed && row.flags.some((f) => f.severity !== 'info');
  const cell: React.CSSProperties = { padding: '6px 8px', verticalAlign: 'top', borderBottom: '1px solid #f1f5f9' };
  const inp: React.CSSProperties = { width: '100%', fontSize: '0.78rem', padding: '3px 5px', border: '1px solid #cbd5e1', borderRadius: 4 };
  return (
    <>
    <tr style={{ background: row.excluded ? '#f8fafc' : hasError ? '#fef2f2' : needsReview ? '#fffbeb' : undefined, opacity: row.excluded ? 0.6 : 1 }}>
      <td style={cell}><input type="checkbox" disabled={!editable} checked={!draft.excluded} onChange={(e) => set({ excluded: !e.target.checked })} title="Include in the catalogue" /></td>
      <td style={{ ...cell, width: 70 }}><input style={inp} disabled={!editable} value={draft.metricId} onChange={(e) => set({ metricId: e.target.value })} /></td>
      <td style={{ ...cell, minWidth: 260 }}>
        <textarea style={{ ...inp, minHeight: 54 }} disabled={!editable} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{draft.criterion} · {draft.keyIndicator}{row.page ? ` · p.${row.page}` : ''}</div>
        <MetricMappingSelect ariaLabel="Analytics metric" style={{ ...inp, marginTop: 3 }} disabled={!editable} value={draft.computedField ?? null} unit={draft.scoringType === 'categorical' ? 'option' : draft.unit} unmappedLabel="Unmapped analytics metric" onChange={(v) => set({ computedField: v })} />
      </td>
      <td style={{ ...cell, width: 110 }}>
        <select style={inp} disabled={!editable} value={draft.unit} onChange={(e) => set({ unit: e.target.value })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
        <select style={{ ...inp, marginTop: 3 }} disabled={!editable} value={draft.scoringType} onChange={(e) => set({ scoringType: e.target.value as any })}>
          <option value="numeric">numeric</option><option value="categorical">categorical A–E</option><option value="none">none</option>
        </select>
        <input style={{ ...inp, marginTop: 3 }} disabled={!editable} type="number" placeholder="weight" value={draft.maxScore ?? ''} onChange={(e) => set({ maxScore: e.target.value === '' ? null : Number(e.target.value) })} />
      </td>
      <td style={{ ...cell, minWidth: 150 }}>
        {[4, 3, 2, 1, 0].map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{ width: 12, fontSize: '0.72rem', color: '#64748b' }}>{s}</span>
            <input style={inp} disabled={!editable} value={bandLabel(s)} onChange={(e) => setBand(s, e.target.value)} />
          </div>
        ))}
        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{row.direction === 'lowerIsBetter' ? 'lower is better' : row.direction === 'higherIsBetter' ? 'higher is better' : row.scoringType === 'categorical' ? 'categorical' : 'direction unknown'}</div>
      </td>
      <td style={{ ...cell, minWidth: 200, fontSize: '0.72rem' }}>
        {row.flags.length === 0 ? <span style={{ color: '#16a34a' }}>No issues</span> : row.flags.map((f, i) => (
          <div key={i} style={{ color: SEV[f.severity], marginBottom: 2 }}>● {f.message}</div>
        ))}
      </td>
      <td style={{ ...cell, width: 96 }}>
        <label style={{ fontSize: '0.72rem', display: 'block' }}>
          <input type="checkbox" disabled={!editable || hasError} checked={draft.reviewed} onChange={(e) => set({ reviewed: e.target.checked })} /> Reviewed
        </label>
        {editable && <button className="btn btn-outline btn-sm" style={{ marginTop: 4 }} disabled={busy || !dirty} onClick={() => save()}><Save size={12} /> Save</button>}
        {row.evidence && <button className="btn btn-outline btn-sm" style={{ marginTop: 4 }} onClick={() => setShowEv((v) => !v)}>{showEv ? 'Hide' : 'Evidence'}</button>}
      </td>
    </tr>
    {showEv && row.evidence && (
      <tr style={{ background: '#f8fafc' }}>
        <td colSpan={7} style={{ padding: '6px 10px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 3 }}>Read from PDF page{row.evidence.pages.length > 1 ? 's' : ''} {row.evidence.pages.join(', ')}
            {sourceStored && <> · <button className="btn btn-outline btn-sm" onClick={openSource}>Open source PDF</button></>}</div>
          <pre style={{ margin: 0, fontSize: '0.74rem', whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>{row.evidence.text}</pre>
          {(row.formula || row.notes) && <div style={{ fontSize: '0.74rem', marginTop: 4 }}>{row.formula && <span>Formula (text only): {row.formula} </span>}{row.notes && <span>Note: {row.notes}</span>}</div>}
        </td>
      </tr>
    )}
    </>
  );
}

export default function BenchmarkImport() {
  const [status, setStatus] = useState<CatalogueStatus | null>(null);
  const [imports, setImports] = useState<ImportSummary[]>([]);
  const [selected, setSelected] = useState<ImportFull | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [docVersion, setDocVersion] = useState('');
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [tab, setTab] = useState<'catalogue' | 'imports' | 'audit'>('catalogue');
  const [preview, setPreview] = useState<ActivationPreview | null>(null);
  const loadPreview = async (id: string, m: 'merge' | 'replace') => { try { setPreview(await previewActivation(id, m)); } catch (e) { setPreview(null); toast.error(errMsg(e)); } };

  const [delVersion, setDelVersion] = useState<ImportSummary | null>(null);
  const [delError, setDelError] = useState<string | null>(null);

  const refresh = useCallback(async (keepId?: string, dropSelected = false) => {
    try {
      const [s, l, a] = await Promise.all([getImportStatus(), listImports(), getAuditLog()]);
      setStatus(s); setImports(l); setAudit(a.slice(0, 40));
      const id = dropSelected ? undefined : (keepId ?? selected?.id);
      if (id) setSelected(await getImport(id));
    } catch (e) { toast.error(errMsg(e)); }
  }, [selected?.id]);
  // initial load only; later refreshes are triggered explicitly after each action
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, []);

  const run = async (fn: () => Promise<unknown>, ok: string, keepId?: string) => {
    setBusy(true); setProblems([]);
    try { await fn(); toast.success(ok); await refresh(keepId); } catch (e: any) {
      toast.error(errMsg(e)); if (e?.response?.data?.problems) setProblems(e.response.data.problems);
    } finally { setBusy(false); }
  };

  const confirmDeleteVersion = async () => {
    if (!delVersion) return;
    setDelError(null);
    try {
      await deleteImport(delVersion.id);
      toast.success(`Version ${delVersion.versionNo} deleted.`);
      if (selected?.id === delVersion.id) { setSelected(null); setPreview(null); }
      setDelVersion(null);
      await refresh(undefined, true);
    } catch (e) { const m = errMsg(e); setDelError(m); toast.error(m); }
  };

  const upload = async () => {
    if (!file) return toast.error('Choose a PDF first.');
    setBusy(true); setProblems([]);
    try {
      const imp = await uploadBenchmarkPdf(file, docVersion);
      toast.success(`Extracted ${imp.rows.length} metrics. Review them before approving.`);
      setFile(null); setSelected(imp); await refresh(imp.id);
    } catch (e: any) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const manual = () => run(async () => { const imp = await createManualDraft(docVersion); setSelected(imp); await refresh(imp.id); }, 'Manual draft created.');

  const open = async (id: string) => { try { const imp = await getImport(id); setSelected(imp); setProblems([]); setPreview(null); setTab('imports'); if (imp.status === 'approved') loadPreview(id, mode); } catch (e) { toast.error(errMsg(e)); } };
  const editable = selected?.status === 'draft';
  const rows = useMemo(() => (selected?.rows || []).filter((r) => !onlyFlagged || r.flags.some((f) => f.severity !== 'info')), [selected, onlyFlagged]);
  const replaceRow = (r: ImportRow) => setSelected((s) => (s ? { ...s, rows: s.rows.map((x) => (x.rowId === r.rowId ? r : x)) } : s));
  const counts = useMemo(() => {
    const inc = (selected?.rows || []).filter((r) => !r.excluded);
    return {
      included: inc.length, errors: inc.filter((r) => r.flags.some((f) => f.severity === 'error')).length,
      unreviewed: inc.filter((r) => !r.reviewed && r.flags.some((f) => f.severity === 'warning') && !r.flags.some((f) => f.severity === 'error')).length,
    };
  }, [selected]);

  return (
    <AppLayout title="Benchmark Management">
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, borderBottom: '1px solid #e2e8f0' }} role="tablist">
        {([['catalogue', 'Catalogue'], ['imports', 'PDF import & versions'], ['audit', 'Audit log']] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            style={{ background: 'none', border: 0, borderBottom: tab === k ? '3px solid #1e3a5f' : '3px solid transparent', padding: '8px 14px', fontWeight: tab === k ? 700 : 500, cursor: 'pointer', color: tab === k ? '#1e3a5f' : '#64748b' }}>{label}</button>
        ))}
      </div>
      {tab === 'catalogue' && <div className="card"><div className="card-body"><BenchmarkCatalogue /></div></div>}
      {tab === 'imports' && (<>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <h3 style={{ margin: '0 0 6px' }}>Catalogue status</h3>
          {status && (
            <>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.85rem' }}>
                <span>Active metrics: <b>{status.benchmarkMetrics.active}</b> of {status.benchmarkMetrics.total}</span>
                <span>Mapped to analytics: <b>{status.benchmarkMetrics.withAnalyticsMapping}</b></span>
                <span>Analytics metric definitions: <b>{status.analyticsMetricDefinitions}</b></span>
                <span>Active version: <b>{status.activeVersion ? `v${status.activeVersion.versionNo} (${status.activeVersion.origin})` : 'none'}</b></span>
                <span>Database: <b>{status.database ?? 'unknown'}</b></span>
              </div>
              {status.notes.map((n) => <p key={n} style={{ margin: '6px 0 0', color: '#b45309', fontSize: '0.82rem' }}>⚠ {n}</p>)}
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <h3 style={{ margin: '0 0 8px' }}>1. Upload a benchmark PDF</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <input className="form-input" style={{ maxWidth: 260 }} placeholder="Document version (e.g. General University Manual 2022)" value={docVersion} onChange={(e) => setDocVersion(e.target.value)} />
            <button className="btn btn-primary btn-sm" disabled={busy || !file} onClick={upload}><Upload size={14} /> Upload &amp; extract</button>
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={manual}><FilePlus size={14} /> Start manual draft</button>
          </div>
          <p className="text-muted text-sm" style={{ margin: '8px 0 0' }}>
            PDF only, up to 15 MB. Extraction reads the PDF text layer; scanned PDFs are not OCR&apos;d — use a manual draft for those.
            Nothing changes in the live benchmark table until a version is approved <i>and</i> activated.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          <h3 style={{ margin: '0 0 8px' }}>Versions</h3>
          <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
            <thead><tr style={{ textAlign: 'left', color: '#475569' }}>{['#', 'Document', 'Source', 'Status', 'Uploaded by', 'Reviewed by', 'Approved by', 'Metrics', 'Errors', ''].map((h) => <th key={h} style={{ padding: '6px 8px', borderBottom: '2px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {imports.length === 0 && <tr><td colSpan={10} style={{ padding: 10, color: '#94a3b8' }}>No imports yet.</td></tr>}
              {imports.map((i) => (
                <tr key={i.id} style={{ background: selected?.id === i.id ? '#f0f9ff' : undefined }}>
                  <td style={{ padding: '6px 8px' }}>{i.versionNo}</td>
                  <td style={{ padding: '6px 8px' }}>{i.documentVersion || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>{i.sourceFilename || i.origin}</td>
                  <td style={{ padding: '6px 8px' }}><Badge status={i.status} /></td>
                  <td style={{ padding: '6px 8px' }}>{i.uploadedBy?.name || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>{i.reviewedBy?.name || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>{i.approvedBy?.name || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>{i.includedCount}/{i.rowCount}</td>
                  <td style={{ padding: '6px 8px', color: i.errorCount ? '#dc2626' : undefined }}>{i.errorCount}</td>
                  <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => open(i.id)}>{i.status === 'draft' ? 'Review' : 'View'}</button>{' '}
                    {i.status === 'superseded' && i.approvedBy?.name && (
                      <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => window.confirm(`Restore version ${i.versionNo}? Metrics added by later versions are deactivated (not deleted).`) && run(() => rollbackImport(i.id), 'Rolled back.', i.id)}><RotateCcw size={12} /> Roll back</button>
                    )}
                    {(i.status === 'draft' || i.status === 'approved') && (
                      <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => window.confirm('Reject this version? It is kept in the history but cannot be activated.') && run(() => rejectImport(i.id), 'Version rejected.', i.id)}><XCircle size={12} /> Reject</button>
                    )}{' '}
                    <button className="btn btn-outline btn-sm" aria-label={`Delete version ${i.versionNo}`}
                      disabled={busy || i.status === 'active' || i.origin === 'baseline'}
                      title={i.status === 'active' ? 'The active version cannot be deleted. Activate or roll back to another version first.' : i.origin === 'baseline' ? 'The pre-import baseline snapshot is kept so the first import can be reversed.' : 'Delete this version permanently'}
                      onClick={() => { setDelError(null); setDelVersion(i); }}><Trash2 size={12} /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>2. Review — version {selected.versionNo} <Badge status={selected.status} /></h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem' }}><input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} /> Only rows needing attention</label>
                {editable && <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => run(() => addImportRow(selected.id, { unit: 'count', scoringType: 'none' }), 'Row added.', selected.id)}><Plus size={14} /> Add metric</button>}
                {editable && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(() => approveImport(selected.id), 'Version approved. It is not live until activated.', selected.id)}><CheckCircle2 size={14} /> Approve</button>}
                {selected.status === 'approved' && (
                  <>
                    <select className="form-select" style={{ width: 'auto' }} aria-label="Activation mode" value={mode} onChange={(e) => { const m = e.target.value as 'merge' | 'replace'; setMode(m); loadPreview(selected.id, m); }}>
                      <option value="merge">Merge (keep other metrics active)</option>
                      <option value="replace">Replace (deactivate metrics not in this version)</option>
                    </select>
                    <button className="btn btn-primary btn-sm" disabled={busy || preview?.mode !== mode} title={preview?.mode === mode ? '' : 'Review the preview of changes first'} onClick={() => window.confirm(`Activate version ${selected.versionNo} (${mode})? Nothing is deleted; earlier versions stay in the history and can be restored.`) && run(() => activateImport(selected.id, mode), 'Version activated.', selected.id)}><Rocket size={14} /> Activate</button>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-muted" style={{ margin: '6px 0' }}>
              {counts.included} metrics included · <span style={{ color: counts.errors ? '#dc2626' : undefined }}>{counts.errors} with errors</span> · {counts.unreviewed} with warnings not yet reviewed.
              {selected.pageCount ? ` ${selected.pageCount} PDF pages.` : ''}
            </p>
            {selected.warnings.map((w) => <p key={w} style={{ margin: '2px 0', color: '#b45309', fontSize: '0.82rem' }}>⚠ {w}</p>)}
            {selected.status === 'approved' && preview && preview.mode === mode && (
              <div style={{ border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: 6, padding: '8px 12px', margin: '8px 0', fontSize: '0.8rem' }}>
                <b>Preview — activating version {preview.versionNo} ({preview.mode})</b>
                <div style={{ margin: '4px 0' }}>{preview.counts.added} to add · {preview.counts.modified} to modify · {preview.counts.deactivated} to deactivate · {preview.counts.unchanged} unchanged · {preview.counts.keptActive} other active metrics kept</div>
                {([['Additions', preview.additions.map((a) => a.metricId)], ['Modifications', preview.modifications.map((m) => `${m.metricId} (${m.fields.join(', ')})`)], ['Deactivations', preview.deactivations.map((d) => `${d.metricId} — ${d.reason}`)], ['Kept active (not in this version)', preview.keptActive]] as const).map(([title, list]) => list.length > 0 && (
                  <details key={title}><summary style={{ cursor: 'pointer' }}>{title} ({list.length})</summary><div style={{ fontSize: '0.74rem', color: '#475569', maxHeight: 120, overflowY: 'auto' }}>{list.join(' · ')}</div></details>
                ))}
              </div>
            )}
            {selected.processing && <p className="text-sm text-muted" style={{ margin: '2px 0' }}>Processed {selected.processing.pagesProcessed} pages in {selected.processing.chunks} chunks ({selected.processing.ms} ms). {selected.reviewedBy?.name ? `Last reviewed by ${selected.reviewedBy.name}.` : ''}</p>}
            {problems.length > 0 && (
              <div style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 6, padding: '8px 12px', margin: '8px 0', fontSize: '0.8rem' }}>
                <b>Cannot approve yet:</b>
                <ul style={{ margin: '4px 0 0 16px' }}>{problems.slice(0, 30).map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead><tr style={{ textAlign: 'left', color: '#475569' }}>{['In', 'ID', 'Description / mapping', 'Unit · type · weight', 'Score bands', 'Flags', 'Review'].map((h) => <th key={h} style={{ padding: '6px 8px', borderBottom: '2px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map((r) => <RowEditor key={r.rowId} importId={selected.id} row={r} editable={!!editable} sourceStored={!!selected.sourceStored} onSaved={replaceRow} />)}
                  {rows.length === 0 && <tr><td colSpan={7} style={{ padding: 12, color: '#94a3b8' }}>No rows to show.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      </>)}

      {tab === 'audit' && (
      <div className="card">
        <div className="card-body" style={{ overflowX: 'auto' }}>
          <h3 style={{ margin: '0 0 8px' }}>Audit log</h3>
          <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
            <thead><tr style={{ textAlign: 'left', color: '#475569' }}>{['When', 'Action', 'By', 'Details'].map((h) => <th key={h} style={{ padding: '5px 8px', borderBottom: '2px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a._id}>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{new Date(a.at).toLocaleString()}</td>
                  <td style={{ padding: '5px 8px', fontWeight: 600 }}>{a.action}</td>
                  <td style={{ padding: '5px 8px' }}>{a.actor?.name || '—'}</td>
                  <td style={{ padding: '5px 8px', color: '#64748b', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{JSON.stringify(a.details)}</td>
                </tr>
              ))}
              {audit.length === 0 && <tr><td colSpan={4} style={{ padding: 10, color: '#94a3b8' }}>No activity yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      )}
      {delVersion && (
        <DeleteBenchmarkDialog
          target={{
            kind: 'version', confirmWord: `v${delVersion.versionNo}`, title: `Delete version ${delVersion.versionNo}?`,
            details: [`Version ${delVersion.versionNo} · ${delVersion.sourceFilename || delVersion.origin}`, `Document: ${delVersion.documentVersion || '—'} · status: ${delVersion.status}`,
              `${delVersion.includedCount}/${delVersion.rowCount} metrics · uploaded by ${delVersion.uploadedBy?.name || '—'}`],
            consequences: ['Removes this version, its draft rows and its stored source PDF.', 'Live benchmark records, analytics metric definitions and other versions are kept.',
              ...(delVersion.status === 'superseded' ? ['This version can no longer be restored by rollback.'] : []),
              'The deletion is written to the audit log with your name and the time; earlier audit entries are kept.'],
          }}
          error={delError} onCancel={() => { setDelVersion(null); setDelError(null); }} onConfirm={confirmDeleteVersion} />
      )}
    </AppLayout>
  );
}
