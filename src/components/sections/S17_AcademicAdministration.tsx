import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { fg, inp, dateInp, sel } from './sectionUtils';

const ACADEMIC_ADMIN_OPTIONS = [
  'Chairman - PG Board of studies',
  'Chairman - UG Board of studies',
  'Member - PG board of studies',
  'Member - UG board of studies',
  'Chairman - Designing PG syllabi',
  'Chairman - Designing UG syllabi',
  'Scheduling classes',
  'Monitoring teaching quality',
  'Serving as examiner, invigilator, paper setter, evaluator under the Controller of Examinations',
  'Participating in Board of Studies meeting',
  'Participating in academic councils',
  'Participating in departmental reviews',
  'Other',
];

const EMPTY_RESPONSIBILITY = {
  administrativeCharge: '',
  description: '',
  from: '',
  to: '',
};

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };

// Custom searchable dropdown removed, using shared component.

function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function RespPreviewCard({ r, onEdit, onDelete, disabled }: { r: any; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
              {r.administrativeCharge ? r.administrativeCharge.substring(0, 4).toUpperCase() : '—'}
            </div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Role</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {r.administrativeCharge || 'Untitled Responsibility'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {r.from && <span className="badge badge-secondary">{r.from}{r.to ? ` — ${r.to}` : ' — Present'}</span>}
              {r.description && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.description}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
          <button type="button" style={btnEdit} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {expanded ? 'Hide' : 'View'}
          </button>
          <button type="button" style={btnEdit} onClick={(e) => { e.stopPropagation(); onEdit(); }} disabled={disabled}>
            <Edit2 size={14} /> Edit
          </button>
          <button type="button" style={btnDelete} onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={disabled}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewRow label="Administrative Charge" value={r.administrativeCharge} />
          <PreviewRow label="Description" value={r.description} />
          <PreviewRow label="From" value={r.from} />
          <PreviewRow label="To" value={r.to} />
        </div>
      )}
    </>
  );
}

export default function AcademicAdministration({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const responsibilities = Array.isArray(data) ? data : (data?.responsibilities || []);
  const update = (val: any) => onChange(val);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<any>(null);

  const updItem = (i: number, k: string, v: string) => {
    const a = [...responsibilities];
    a[i] = { ...a[i], [k]: v };
    update(a);
  };

  const isComplete = (r: any) => !!r.administrativeCharge;

  const handleSavePending = (item: any) => {
    if (isComplete(item)) {
      update([item, ...responsibilities]);
      setPending(null);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 40 }}>
        <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Academic Administration</h5>
          <button
            type="button"
            onClick={() => setPending({ ...EMPTY_RESPONSIBILITY })}
            disabled={pending !== null || editingIndex !== null}
            style={{ ...btnAdd, flexShrink: 0 }}
          >
            <Plus size={16} /> Add Responsibility
          </button>
        </div>

        {responsibilities.length === 0 && !pending && (
          <div className="empty-state">No responsibilities added yet. Click Add Responsibility to get started.</div>
        )}

        <div className="items-list">
          {pending && (
            <div key="pending-resp" className="list-item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Responsibility</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleSavePending(pending)}
                    disabled={!isComplete(pending)}
                    style={isComplete(pending) ? btnSave : { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
                  >
                    <Check size={14} /> Save
                  </button>
                  <button type="button" onClick={() => setPending(null)} style={btnCancel}>
                    Cancel
                  </button>
                </div>
              </div>
              <div className="form-row form-row-1">
                {fg('Administrative Charge', sel(pending.administrativeCharge, v => setPending({ ...pending, administrativeCharge: v }), ACADEMIC_ADMIN_OPTIONS))}
              </div>
              <div className="form-row form-row-1">
                {fg('Description (optional)', inp(pending.description, v => setPending({ ...pending, description: v }), 'Brief description of the role'))}
              </div>
              <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {fg('From', dateInp(pending.from, v => setPending({ ...pending, from: v })))}
                {fg('To', dateInp(pending.to, v => setPending({ ...pending, to: v })))}
              </div>
            </div>
          )}

          {responsibilities.map((r: any, i: number) => {
            const isEditing = editingIndex === i;
            return (
              <div key={`r-${i}`} className="list-item-card">
                {isEditing ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Responsibility</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setEditingIndex(null)} style={btnSave}>
                          <Check size={14} /> Done
                        </button>
                        <button
                          type="button"
                          onClick={() => { update(responsibilities.filter((_: any, j: number) => j !== i)); setEditingIndex(null); }}
                          style={btnDelete}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                    <div className="form-row form-row-1">
                      {fg('Administrative Charge', sel(r.administrativeCharge, v => updItem(i, 'administrativeCharge', v), ACADEMIC_ADMIN_OPTIONS))}
                    </div>
                    <div className="form-row form-row-1">
                      {fg('Description (optional)', inp(r.description, v => updItem(i, 'description', v), 'Brief description of the role'))}
                    </div>
                    <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {fg('From', dateInp(r.from, v => updItem(i, 'from', v)))}
                      {fg('To', dateInp(r.to, v => updItem(i, 'to', v)))}
                    </div>
                  </>
                ) : (
                  <RespPreviewCard
                    r={r}
                    onEdit={() => setEditingIndex(i)}
                    onDelete={() => update(responsibilities.filter((_: any, j: number) => j !== i))}
                    disabled={pending !== null}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
