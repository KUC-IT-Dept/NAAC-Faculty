import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { fg, inp, sel, ta, yearSel, pv } from './sectionUtils';

const EMPTY_SCHOLAR = { scholarName: '', gender: '', degree: '', topic: '', enrollmentYear: '', expectedCompletion: '', status: '', university: '', documentUrl: '' };
const EMPTY_PATENT = { title: '', patentNumber: '', dateOfFiling: '', status: '', description: '', documentUrl: '' };

const STATUSES = ['Ongoing', 'Awarded', 'Submitted'];
const DEGREES = ['Ph.D', 'M.Phil', 'PG Dissertation'];

const btnAdd:    React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit:   React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave:   React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };

/* ─── Preview Row ─────────────────────────────────────────────── */
function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 140, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

/* ─── Scholar Preview Card ────────────────────────────────────── */
function ScholarPreviewCard({ sc, onEdit, onDelete, disabled }: {
  sc: any; onEdit: () => void; onDelete: () => void; disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 52, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{sc.enrollmentYear || '—'}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 14, marginBottom: 4 }}>
              {sc.scholarName || 'Unnamed Scholar'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sc.degree && <span className="badge badge-secondary">{sc.degree}</span>}
              {sc.status && <span className="badge badge-secondary">{sc.status}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
          <button type="button" style={btnEdit} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {expanded ? 'Hide' : 'View'}
          </button>
          <button type="button" style={btnEdit} onClick={(e) => { e.stopPropagation(); onEdit(); }} disabled={disabled}>
            <Edit2 size={13} /> Edit
          </button>
          <button type="button" style={btnDelete} onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={disabled}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewRow label="Scholar Name" value={sc.scholarName} />
          <PreviewRow label="Degree" value={sc.degree} />
          <PreviewRow label="Status" value={sc.status} />
          <PreviewRow label="Research Topic" value={sc.topic} />
          <PreviewRow label="Enrolled" value={sc.enrollmentYear} />
          <PreviewRow label="Expected" value={sc.expectedCompletion} />
        </div>
      )}
    </>
  );
}

/* ─── Patent Preview Card ─────────────────────────────────────── */
function PatentPreviewCard({ p, onEdit, onDelete, disabled }: {
  p: any; onEdit: () => void; onDelete: () => void; disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const year = p.dateOfFiling ? p.dateOfFiling.slice(0, 4) : null;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 52, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{year || '—'}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 14, marginBottom: 4 }}>
              {p.title || 'Untitled Patent'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.status && <span className="badge badge-secondary">{p.status}</span>}
              {p.patentNumber && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No: {p.patentNumber}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
          <button type="button" style={btnEdit} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {expanded ? 'Hide' : 'View'}
          </button>
          <button type="button" style={btnEdit} onClick={(e) => { e.stopPropagation(); onEdit(); }} disabled={disabled}>
            <Edit2 size={13} /> Edit
          </button>
          <button type="button" style={btnDelete} onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={disabled}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewRow label="Patent Title" value={p.title} />
          <PreviewRow label="Patent Number" value={p.patentNumber} />
          <PreviewRow label="Status" value={p.status} />
          <PreviewRow label="Date of Filing" value={p.dateOfFiling} />
        </div>
      )}
    </>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function ResearchSupervision({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const scholars = data.scholars || [];
  const patents = data.patents || [];

  const [editingSIdx, setEditingSIdx] = useState<number | null>(null);
  const [editingPIdx, setEditingPIdx] = useState<number | null>(null);
  const [pendingScholar, setPendingScholar] = useState<any>(null);
  const [pendingPatent, setPendingPatent] = useState<any>(null);

  const stats = scholars.reduce((acc: any, s: any) => {
    const deg = s.degree;
    const stat = s.status;
    if (deg === 'Ph.D') { if (stat === 'Ongoing') acc.phdOngoing++; else if (stat === 'Awarded') acc.phdAwarded++; }
    else if (deg === 'M.Phil') { if (stat === 'Ongoing') acc.mphilOngoing++; else if (stat === 'Awarded') acc.mphilAwarded++; }
    else if (deg === 'PG Dissertation') acc.pgProjects++;
    return acc;
  }, { phdOngoing: 0, phdAwarded: 0, mphilOngoing: 0, mphilAwarded: 0, pgProjects: 0 });

  const s = (k: string, v: any) => onChange({ ...data, [k]: v });
  const updS = (i: number, k: string, v: string) => { const a = [...scholars]; a[i] = { ...a[i], [k]: v }; s('scholars', a); };
  const updP = (i: number, k: string, v: string) => { const a = [...patents]; a[i] = { ...a[i], [k]: v }; s('patents', a); };

  return (
    <div className="section-container">
      {/* Guidance Summary */}
      <div className="card-body" style={{ padding: 0, marginBottom: 24 }}>
        <h5 style={{ marginBottom: 16 }}>Guidance Summary (Auto-calculated)</h5>
        <div className="form-row form-row-3" style={{ marginBottom: 12 }}>
          {pv('Ph.D Ongoing', stats.phdOngoing)}
          {pv('Ph.D Awarded', stats.phdAwarded)}
          {pv('M.Phil Ongoing', stats.mphilOngoing)}
        </div>
        <div className="form-row form-row-2">
          {pv('M.Phil Awarded', stats.mphilAwarded)}
          {pv('PG Projects Guided', stats.pgProjects)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

        {/* ── Scholars Section ── */}
        <div>
          <div className="section-header-actions" style={{ marginBottom: 16 }}>
            <h5 style={{ margin: 0 }}>Research Scholars</h5>
            <button type="button" onClick={() => setPendingScholar({ ...EMPTY_SCHOLAR })}
              disabled={!!pendingScholar || editingSIdx !== null} style={btnAdd}>
              <Plus size={16} /> Add Scholar
            </button>
          </div>

          <div className="items-list">
            {pendingScholar && (
              <div key="pending-scholar" className="list-item-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Scholar</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button"
                      onClick={() => { s('scholars', [pendingScholar, ...scholars]); setPendingScholar(null); }}
                      disabled={!pendingScholar.scholarName || !pendingScholar.degree}
                      style={(!pendingScholar.scholarName || !pendingScholar.degree) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}>
                      <Check size={14} /> Save
                    </button>
                    <button type="button" onClick={() => setPendingScholar(null)} style={btnCancel}>Cancel</button>
                  </div>
                </div>
                <div className="form-row form-row-1">
                  {fg('Scholar Name *', inp(pendingScholar.scholarName, v => setPendingScholar({ ...pendingScholar, scholarName: v })))}
                </div>
                <div className="form-row form-row-1">
                  {fg('Degree *', sel(pendingScholar.degree, v => setPendingScholar({ ...pendingScholar, degree: v }), DEGREES))}
                </div>
                <div className="form-row form-row-1">
                  {fg('Current Status', sel(pendingScholar.status, v => setPendingScholar({ ...pendingScholar, status: v }), STATUSES))}
                </div>
                <div className="form-row form-row-1">
                  {fg('Research Topic', ta(pendingScholar.topic, v => setPendingScholar({ ...pendingScholar, topic: v })))}
                </div>
                <div className="form-row form-row-2">
                  {fg('Enrolled', yearSel(pendingScholar.enrollmentYear, v => setPendingScholar({ ...pendingScholar, enrollmentYear: v })))}
                  {fg('Expected', yearSel(pendingScholar.expectedCompletion, v => setPendingScholar({ ...pendingScholar, expectedCompletion: v })))}
                </div>
              </div>
            )}

            {scholars.map((sc: any, i: number) => {
              const itemIsEditing = editingSIdx === i;
              return (
                <div key={i} className="list-item-card">
                  {itemIsEditing ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Scholar</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => setEditingSIdx(null)} style={btnSave}>
                            <Check size={14} /> Done
                          </button>
                          <button type="button" onClick={() => { s('scholars', scholars.filter((_: any, j: number) => j !== i)); setEditingSIdx(null); }} style={btnDelete}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                      <div className="form-row form-row-1">{fg('Scholar Name *', inp(sc.scholarName, v => updS(i, 'scholarName', v)))}</div>
                      <div className="form-row form-row-1">{fg('Degree *', sel(sc.degree, v => updS(i, 'degree', v), DEGREES))}</div>
                      <div className="form-row form-row-1">{fg('Current Status', sel(sc.status, v => updS(i, 'status', v), STATUSES))}</div>
                      <div className="form-row form-row-1">{fg('Research Topic', ta(sc.topic, v => updS(i, 'topic', v)))}</div>
                      <div className="form-row form-row-2">
                        {fg('Enrolled', yearSel(sc.enrollmentYear, v => updS(i, 'enrollmentYear', v)))}
                        {fg('Expected', yearSel(sc.expectedCompletion, v => updS(i, 'expectedCompletion', v)))}
                      </div>
                    </>
                  ) : (
                    <ScholarPreviewCard
                      sc={sc}
                      onEdit={() => { setEditingSIdx(i); setEditingPIdx(null); }}
                      onDelete={() => s('scholars', scholars.filter((_: any, j: number) => j !== i))}
                      disabled={pendingScholar !== null}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Patents Section ── */}
        <div>
          <div className="section-header-actions" style={{ marginBottom: 16 }}>
            <h5 style={{ margin: 0 }}>Patents / IP</h5>
            <button type="button" onClick={() => setPendingPatent({ ...EMPTY_PATENT })}
              disabled={!!pendingPatent || editingPIdx !== null} style={btnAdd}>
              <Plus size={16} /> Add Patent
            </button>
          </div>

          <div className="items-list">
            {pendingPatent && (
              <div key="pending-patent" className="list-item-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Patent</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button"
                      onClick={() => { s('patents', [pendingPatent, ...patents]); setPendingPatent(null); }}
                      disabled={!pendingPatent.title}
                      style={!pendingPatent.title ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}>
                      <Check size={14} /> Save
                    </button>
                    <button type="button" onClick={() => setPendingPatent(null)} style={btnCancel}>Cancel</button>
                  </div>
                </div>
                {fg('Patent Title *', inp(pendingPatent.title, v => setPendingPatent({ ...pendingPatent, title: v })))}
                <div className="form-row form-row-1">{fg('Patent Number', inp(pendingPatent.patentNumber, v => setPendingPatent({ ...pendingPatent, patentNumber: v })))}</div>
                <div className="form-row form-row-1">{fg('Status', sel(pendingPatent.status, v => setPendingPatent({ ...pendingPatent, status: v }), ['Filed', 'Published', 'Granted']))}</div>
                {fg('Date of Filing', <input type="date" value={pendingPatent.dateOfFiling} onChange={e => setPendingPatent({ ...pendingPatent, dateOfFiling: e.target.value })} className="form-input" />)}
              </div>
            )}

            {patents.map((p: any, i: number) => {
              const itemIsEditing = editingPIdx === i;
              return (
                <div key={i} className="list-item-card">
                  {itemIsEditing ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Patent</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => setEditingPIdx(null)} style={btnSave}>
                            <Check size={14} /> Done
                          </button>
                          <button type="button" onClick={() => { s('patents', patents.filter((_: any, j: number) => j !== i)); setEditingPIdx(null); }} style={btnDelete}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                      {fg('Patent Title *', inp(p.title, v => updP(i, 'title', v)))}
                      <div className="form-row form-row-1">{fg('Patent Number', inp(p.patentNumber, v => updP(i, 'patentNumber', v)))}</div>
                      <div className="form-row form-row-1">{fg('Status', sel(p.status, v => updP(i, 'status', v), ['Filed', 'Published', 'Granted']))}</div>
                      {fg('Date of Filing', <input type="date" value={p.dateOfFiling} onChange={e => updP(i, 'dateOfFiling', e.target.value)} className="form-input" />)}
                    </>
                  ) : (
                    <PatentPreviewCard
                      p={p}
                      onEdit={() => { setEditingPIdx(i); setEditingSIdx(null); }}
                      onDelete={() => s('patents', patents.filter((_: any, j: number) => j !== i))}
                      disabled={pendingPatent !== null}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}