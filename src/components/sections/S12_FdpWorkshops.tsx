import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { fg, inp, sel, FileInp, yearSel, pv } from './sectionUtils';

type FDP = {
  programTitle: string;
  type: string;
  organizingInstitution: string;
  duration: string;
  mode: string;
  certificate: string;
  year: string;
  documentUrl: string;
};

const EMPTY: FDP = {
  programTitle: '', type: '', organizingInstitution: '',
  duration: '', mode: '', certificate: '', year: '', documentUrl: '',
};

const TYPE_OPTS = ['FDP', 'Workshop', 'Seminar', 'MOOC', 'Refresher', 'Orientation'];
const MODE_OPTS = ['Online', 'Offline'];
const CERT_OPTS = ['Yes', 'No'];

const currentYear = new Date().getFullYear();
const YEAR_OPTS: string[] = [];
for (let y = currentYear; y >= 1970; y--) YEAR_OPTS.push(String(y));

/* ─── Shared Button Styles ───────────────────────────────────── */
const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };

/* ─── Form ───────────────────────────────────────────────────── */
function FdpForm({ item, onChange }: { item: FDP; onChange: (k: keyof FDP, v: string) => void }) {
  return (
    <>
      {fg('Program Name *', inp(item.programTitle, v => onChange('programTitle', v)))}
      <div className="form-row form-row-2">
        {fg('Type *', sel(item.type, v => onChange('type', v), TYPE_OPTS))}
        {fg('Organized by *', inp(item.organizingInstitution, v => onChange('organizingInstitution', v)))}
      </div>
      <div className="form-row form-row-2">
        {fg('Duration / Dates', inp(item.duration, v => onChange('duration', v), 'e.g. 5 Days / 10-15 Jan 2024'))}
        {fg('Year *',
          <select className="form-select" value={item.year} onChange={e => onChange('year', e.target.value)}>
            <option value="">— Year —</option>
            {YEAR_OPTS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>
      <div className="form-row form-row-2">
        {fg('Mode', sel(item.mode, v => onChange('mode', v), MODE_OPTS))}
        {fg('Certificate', sel(item.certificate, v => onChange('certificate', v), CERT_OPTS))}
      </div>
      <div style={{ marginTop: 10 }}>
        {fg('Certificate / Proof / Link', <FileInp v={item.documentUrl} fn={v => onChange('documentUrl', v)} label="Upload Document" />)}
      </div>
    </>
  );
}

/* ─── Preview Row ────────────────────────────────────────────── */
function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Preview Card with Toggle ───────────────────────────────── */
function PreviewCard({
  item,
  onEdit,
  onDelete,
  disabled,
}: {
  item: FDP;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* ── Collapsed header row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          {/* Year badge — white text on solid blue */}
          <div style={{
            minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8,
            background: 'var(--primary, #2563eb)', flexShrink: 0,
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
              {item.year || '—'}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>

          {/* Summary */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {item.programTitle || 'Untitled Program'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {item.type && <span className="badge badge-secondary">{item.type}</span>}
              {item.mode && <span className="badge badge-secondary">{item.mode}</span>}
              {item.organizingInstitution && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.organizingInstitution}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
          <button type="button" style={btnEdit} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide' : 'View'}
          </button>
          <button type="button" style={btnEdit} onClick={(e) => { e.stopPropagation(); onEdit(); }} disabled={disabled}>
            <Edit2 size={14} /> Edit
          </button>
          <button type="button" style={btnDelete} onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={disabled}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewRow label="Program Name" value={item.programTitle} />
          <PreviewRow label="Type" value={item.type} />
          <PreviewRow label="Organized By" value={item.organizingInstitution} />
          <PreviewRow label="Duration / Dates" value={item.duration} />
          <PreviewRow label="Mode" value={item.mode} />
          <PreviewRow label="Certificate" value={item.certificate} />
          {item.documentUrl && (
            <div style={{ marginTop: 8 }}>
              <a
                href={`${import.meta.env.VITE_API_URL || ''}${item.documentUrl}`}
                target="_blank" rel="noreferrer"
                className="preview-file-link"
              >
                <ExternalLink size={13} /> View Proof
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function FdpWorkshops({
  data,
  onChange,
}: {
  data: FDP[];
  onChange: (d: FDP[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingItem, setPendingItem] = useState<FDP | null>(null);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sorted = [...data].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  const s = (d: FDP[]) => onChange(d);
  const upd = (i: number, k: keyof FDP, v: string) => {
    const a = [...sorted];
    a[i] = { ...a[i], [k]: v };
    s(a);
  };

  const toggleExpand = (idx: number) => {
    const newSet = new Set(expandedIndices);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setExpandedIndices(newSet);
  };

  const isComplete = (item: FDP) => !!(item.programTitle && item.type && item.year);

  const handleSavePending = () => {
    if (!pendingItem) return;
    if (isComplete(pendingItem)) {
      s([pendingItem, ...data]);
      setPendingItem(null);
      setErrorMsg(null);
    } else {
      setErrorMsg("Please enter Program Name, Type, and Year.");
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const item = sorted[editingIndex];
    if (isComplete(item)) {
      setEditingIndex(null);
      setErrorMsg(null);
    } else {
      setErrorMsg("Required fields are missing.");
    }
  };

  return (
    <div className="section-container">
      <div className="section-header-actions" style={{ marginBottom: 16 }}>
        <h5 style={{ margin: 0 }}></h5>
        <button
          type="button"
          onClick={() => setPendingItem({ ...EMPTY })}
          disabled={pendingItem !== null || editingIndex !== null}
          style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
        >
          <Plus size={16} /> Add FDP / Workshop
        </button>
      </div>

      <div className="items-list">
        {/* ── Pending New Entry ── */}
        {pendingItem && (
          <div className="item-card is-editing">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Entry</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={isComplete(pendingItem) ? btnSave : { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
                  disabled={!isComplete(pendingItem)}
                  onClick={() => {
                    const updated = [pendingItem, ...data];
                    updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
                    onChange(updated);
                    setPendingItem(null);
                  }}
                >
                  <Check size={14} /> Save
                </button>
                <button type="button" style={btnCancel} onClick={() => setPendingItem(null)}>
                  Cancel
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            {fg('Program Name *', inp(pendingItem.programTitle, v => setPendingItem({ ...pendingItem, programTitle: v })))}
            <div className="form-row form-row-2">
              {fg('Type *', sel(pendingItem.type, v => setPendingItem({ ...pendingItem, type: v }), TYPE_OPTS))}
              {fg('Organized by *', inp(pendingItem.organizingInstitution, v => setPendingItem({ ...pendingItem, organizingInstitution: v })))}
            </div>
            <div className="form-row form-row-2">
              {fg('Duration / Dates', inp(pendingItem.duration, v => setPendingItem({ ...pendingItem, duration: v })))}
              {fg('Year *', yearSel(pendingItem.year, v => setPendingItem({ ...pendingItem, year: v })))}
            </div>
            <div className="form-row form-row-2">
              {fg('Mode', sel(pendingItem.mode, v => setPendingItem({ ...pendingItem, mode: v }), MODE_OPTS))}
              {fg('Certificate', sel(pendingItem.certificate, v => setPendingItem({ ...pendingItem, certificate: v }), CERT_OPTS))}
            </div>
            {fg('Certificate / Proof', <FileInp v={pendingItem.documentUrl} fn={v => setPendingItem({ ...pendingItem, documentUrl: v })} />)}
          </div>
        )}

        {/* ── Existing Entries ── */}
        {sorted.map((item, i) => {
          const isEdit = editingIndex === i;
          const isExpanded = expandedIndices.has(i);
          return (
            <div key={i} className="list-item-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {isEdit ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Entry</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button" style={btnSave}
                        onClick={() => {
                          const updated = [...data];
                          updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
                          onChange(updated);
                          setEditingIndex(null);
                        }}
                      >
                        <Check size={14} /> Done
                      </button>
                      <button
                        type="button" style={btnDelete}
                        onClick={() => { onChange(sorted.filter((_, j) => j !== i)); setEditingIndex(null); }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                      <AlertCircle size={14} /> {errorMsg}
                    </div>
                  )}

                  {fg('Program Name *', inp(item.programTitle, v => upd(i, 'programTitle', v)))}
                  <div className="form-row form-row-2">
                    {fg('Type *', sel(item.type, v => upd(i, 'type', v), TYPE_OPTS))}
                    {fg('Organized by *', inp(item.organizingInstitution, v => upd(i, 'organizingInstitution', v)))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Duration / Dates', inp(item.duration, v => upd(i, 'duration', v)))}
                    {fg('Year *', yearSel(item.year, v => upd(i, 'year', v)))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Mode', sel(item.mode, v => upd(i, 'mode', v), MODE_OPTS))}
                    {fg('Certificate', sel(item.certificate, v => upd(i, 'certificate', v), CERT_OPTS))}
                  </div>
                  {fg('Certificate / Proof', <FileInp v={item.documentUrl} fn={v => upd(i, 'documentUrl', v)} />)}
                </>
              ) : (
                <PreviewCard
                  item={item}
                  onEdit={() => setEditingIndex(i)}
                  onDelete={() => onChange(sorted.filter((_, j) => j !== i))}
                  disabled={pendingItem !== null}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
