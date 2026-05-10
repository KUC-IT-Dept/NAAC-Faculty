import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink } from 'lucide-react';
import { fg, inp, sel, FileInp } from './sectionUtils';

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

function MembPreview({ m }: { m: Membership }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* Left: year badge */}
      <div style={{
        minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8,
        background: 'var(--primary-light, #eff6ff)', flexShrink: 0,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary, #2563eb)', lineHeight: 1 }}>{m.yearOfJoining || '—'}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
      </div>

      {/* Right: details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          {m.membershipType && <span className="badge badge-secondary" style={{ flexShrink: 0 }}>{m.membershipType}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <PreviewRow label="Professional Body" value={m.professionalBody || 'Unnamed'} />
          <PreviewRow label="Membership ID" value={m.membershipId} />
        </div>

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
    </div>
  );
}

export default function Memberships({
  data,
  onChange,
}: {
  data: Membership[];
  onChange: (d: Membership[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingItem, setPendingItem] = useState<Membership | null>(null);

  const upd = (i: number, k: keyof Membership, v: string) => {
    const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a);
  };

  const sorted = [...data].sort((a, b) => (parseInt(b.yearOfJoining) || 0) - (parseInt(a.yearOfJoining) || 0));

  const isComplete = (m: Membership) => !!m.professionalBody;

  return (
    <>
      <div className="section-header-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setPendingItem({ ...EMPTY })}
          disabled={pendingItem !== null || editingIndex !== null}
        >
          <Plus size={14} /> Add Membership
        </button>
      </div>

      {sorted.length === 0 && !pendingItem && (
        <div className="empty-state">
          No memberships added yet. Click <strong>Add Membership</strong> to get started.
        </div>
      )}

      <div className="items-list">
        {pendingItem && (
          <div className="item-card is-editing">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Membership</span>
              <div>
                <button
                  type="button" className="btn btn-success btn-xs"
                  disabled={!isComplete(pendingItem)}
                  onClick={() => {
                    const updated = [pendingItem, ...data];
                    updated.sort((a, b) => (parseInt(b.yearOfJoining) || 0) - (parseInt(a.yearOfJoining) || 0));
                    onChange(updated);
                    setPendingItem(null);
                  }}
                >
                  <Check size={12} /> Save
                </button>
                <button
                  type="button" className="btn btn-ghost btn-xs"
                  style={{ marginLeft: 8 }}
                  onClick={() => setPendingItem(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
            <MembForm item={pendingItem} onChange={(k, v) => setPendingItem({ ...pendingItem, [k]: v })} />
          </div>
        )}

        {sorted.map((m, i) => {
          const isEdit = editingIndex === i;
          return (
            <div key={i} className={`item-card ${isEdit ? 'is-editing' : 'is-preview'}`}>
              {isEdit ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Membership</span>
                    <div>
                      <button
                        type="button" className="btn btn-success btn-xs"
                        onClick={() => {
                          const updated = [...data];
                          updated.sort((a, b) => (parseInt(b.yearOfJoining) || 0) - (parseInt(a.yearOfJoining) || 0));
                          onChange(updated);
                          setEditingIndex(null);
                        }}
                      >
                        <Check size={12} /> Done
                      </button>
                      <button
                        type="button" className="btn btn-danger btn-xs"
                        style={{ marginLeft: 8 }}
                        onClick={() => { onChange(sorted.filter((_, j) => j !== i)); setEditingIndex(null); }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                  <MembForm item={m} onChange={(k, v) => upd(i, k, v)} />
                </>
              ) : (
                <>
                  <MembPreview m={m} />
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
    </>
  );
}
