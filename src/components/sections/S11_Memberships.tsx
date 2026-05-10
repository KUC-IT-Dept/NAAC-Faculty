import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { fg, inp, sel, FileInp, yearSel, pv } from './sectionUtils';

type Membership = {
  professionalBody: string;
  membershipType: string;
  membershipId: string;
  yearOfJoining: string;
  documentUrl: string;
};

const EMPTY: Membership = {
  professionalBody: '', membershipType: '', membershipId: '', yearOfJoining: '', documentUrl: ''
};

const MEMBERSHIP_TYPES = ['Life Member', 'Annual Member', 'Fellow', 'Senior Member', 'Associate Member'];

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
function MembForm({ item, onChange }: {
  item: Membership;
  onChange: (k: keyof Membership, v: string) => void;
}) {
  return (
    <>
      <div className="form-row form-row-2">
        {fg('Professional Body / Society *', inp(item.professionalBody, v => onChange('professionalBody', v), 'IEEE / CSI / ISTE / IMA'))}
        {fg('Membership Type', sel(item.membershipType, v => onChange('membershipType', v), MEMBERSHIP_TYPES))}
      </div>
      <div className="form-row form-row-2">
        {fg('Membership ID / Number', inp(item.membershipId, v => onChange('membershipId', v)))}
        {fg('Year of Joining',
          <select className="form-select" value={item.yearOfJoining} onChange={e => onChange('yearOfJoining', e.target.value)}>
            <option value="">— Year —</option>
            {YEAR_OPTS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>
      {fg('Certificate / Proof', <FileInp v={item.documentUrl} fn={v => onChange('documentUrl', v)} label="Upload Document" />)}
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
  m,
  onEdit,
  onDelete,
  disabled,
}: {
  m: Membership;
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
              {m.yearOfJoining || '—'}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>

          {/* Summary */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {m.professionalBody || 'Unnamed Organisation'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {m.membershipType && <span className="badge badge-secondary">{m.membershipType}</span>}
              {m.membershipId && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ID: {m.membershipId}</span>}
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
          <PreviewRow label="Professional Body" value={m.professionalBody} />
          <PreviewRow label="Membership Type" value={m.membershipType} />
          <PreviewRow label="Membership ID" value={m.membershipId} />
          <PreviewRow label="Year of Joining" value={m.yearOfJoining} />
          {m.documentUrl && (
            <div style={{ marginTop: 8 }}>
              <a
                href={`${import.meta.env.VITE_API_URL || ''}${m.documentUrl}`}
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
export default function Memberships({
  data,
  onChange,
}: {
  data: Membership[];
  onChange: (d: Membership[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingItem, setPendingItem] = useState<Membership | null>(null);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sorted = [...data].sort((a, b) => (parseInt(b.yearOfJoining) || 0) - (parseInt(a.yearOfJoining) || 0));

  const s = (d: Membership[]) => onChange(d);
  const upd = (i: number, k: keyof Membership, v: string) => {
    const a = [...data];
    a[i] = { ...a[i], [k]: v };
    s(a);
  };

  const toggleExpand = (idx: number) => {
    const newSet = new Set(expandedIndices);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setExpandedIndices(newSet);
  };

  const isComplete = (item: Membership) => !!(item.professionalBody && item.membershipType && item.yearOfJoining);

  const handleSavePending = () => {
    if (!pendingItem) return;
    if (isComplete(pendingItem)) {
      s([pendingItem, ...data]);
      setPendingItem(null);
      setErrorMsg(null);
    } else {
      setErrorMsg("Please enter Organization Name, Membership Type, and Year of Joining.");
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const item = data[editingIndex];
    if (isComplete(item)) {
      setEditingIndex(null);
      setErrorMsg(null);
    } else {
      setErrorMsg("Required fields are missing (Organization, Type, Year).");
    }
  };

  return (
    <div className="section-container">
      <div className="section-header-actions" style={{ marginBottom: 16 }}>
        <h5 style={{ margin: 0 }}>Professional Memberships</h5>
        <button
          type="button"
          onClick={() => setPendingItem({ ...EMPTY })}
          disabled={pendingItem !== null || editingIndex !== null}
          style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Membership
        </button>
      </div>

      <div className="items-list">
        {/* ── Pending new item ── */}
        {pendingItem && (
          <div className="item-card is-editing">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Membership</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={isComplete(pendingItem) ? btnSave : { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
                  disabled={!isComplete(pendingItem)}
                  onClick={() => {
                    const updated = [pendingItem, ...data];
                    updated.sort((a, b) => (parseInt(b.yearOfJoining) || 0) - (parseInt(a.yearOfJoining) || 0));
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

            {fg('Organization Name *', inp(pendingItem.professionalBody, v => setPendingItem({ ...pendingItem, professionalBody: v })))}
            <div className="form-row form-row-2">
              {fg('Membership Type *', sel(pendingItem.membershipType, v => setPendingItem({ ...pendingItem, membershipType: v }), ['Life Member', 'Annual Member', 'Fellow', 'Associate']))}
              {fg('Membership ID', inp(pendingItem.membershipId, v => setPendingItem({ ...pendingItem, membershipId: v })))}
            </div>
            <div className="form-row form-row-1">
              {fg('Year of Joining *', yearSel(pendingItem.yearOfJoining, v => setPendingItem({ ...pendingItem, yearOfJoining: v })))}
            </div>
            {fg('Certificate / Proof', <FileInp v={pendingItem.documentUrl} fn={v => setPendingItem({ ...pendingItem, documentUrl: v })} />)}
          </div>
        )}

        {/* ── Saved items ── */}
        {sorted.map((m, i) => {
          const isEdit = editingIndex === i;
          const isExpanded = expandedIndices.has(i);
          return (
            <div key={i} className="list-item-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {isEdit ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Membership</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button" style={btnSave}
                        onClick={() => {
                          const updated = [...data];
                          updated.sort((a, b) => (parseInt(b.yearOfJoining) || 0) - (parseInt(a.yearOfJoining) || 0));
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
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                      <AlertCircle size={14} /> {errorMsg}
                    </div>
                  )}

                  {fg('Organization Name *', inp(m.professionalBody, v => upd(i, 'professionalBody', v)))}
                  <div className="form-row form-row-2">
                    {fg('Membership Type *', sel(m.membershipType, v => upd(i, 'membershipType', v), ['Life Member', 'Annual Member', 'Fellow', 'Associate']))}
                    {fg('Membership ID', inp(m.membershipId, v => upd(i, 'membershipId', v)))}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Year of Joining *', yearSel(m.yearOfJoining, v => upd(i, 'yearOfJoining', v)))}
                  </div>
                  {fg('Certificate / Proof', <FileInp v={m.documentUrl} fn={v => upd(i, 'documentUrl', v)} />)}
                </>
              ) : (
                <>
                  <PreviewRow label="Professional Body" value={m.professionalBody} />
                  <PreviewRow label="Membership Type" value={m.membershipType} />
                  <PreviewRow label="Membership ID" value={m.membershipId} />
                  <PreviewRow label="Year of Joining" value={m.yearOfJoining} />
                  {m.documentUrl && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={`${import.meta.env.VITE_API_URL || ''}${m.documentUrl}`}
                        target="_blank" rel="noreferrer"
                        className="preview-file-link"
                      >
                        <ExternalLink size={13} /> View Proof
                      </a>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                    <button
                      type="button" className="btn btn-ghost btn-xs"
                      onClick={() => setEditingIndex(i)}
                      disabled={pendingItem !== null}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      type="button" className="btn btn-danger btn-xs"
                      onClick={() => onChange(sorted.filter((_, j) => j !== i))}
                      disabled={pendingItem !== null}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
