import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink } from 'lucide-react';
import { fg, inp, sel, FileInp } from './sectionUtils';

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
  programTitle: '',
  type: '',
  organizingInstitution: '',
  duration: '',
  mode: '',
  certificate: '',
  year: '',
  documentUrl: '',
};

const TYPE_OPTS = ['FDP', 'Workshop', 'Seminar', 'MOOC', 'Refresher', 'Orientation'];
const MODE_OPTS = ['Online', 'Offline'];
const CERT_OPTS = ['Yes', 'No'];

const currentYear = new Date().getFullYear();
const YEAR_OPTS: string[] = [];
for (let y = currentYear; y >= 1970; y--) YEAR_OPTS.push(String(y));

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

function FdpPreview({ item }: { item: FDP }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8,
        background: 'var(--primary-light, #eff6ff)', flexShrink: 0,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary, #2563eb)', lineHeight: 1 }}>{item.year || '—'}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span className="badge badge-secondary" style={{ flexShrink: 0 }}>{item.type || 'FDP'}</span>
          {item.mode && <span className="badge badge-secondary" style={{ flexShrink: 0 }}>{item.mode}</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <PreviewRow label="Program Name" value={item.programTitle} />
          <PreviewRow label="Organized By" value={item.organizingInstitution} />
          <PreviewRow label="Duration / Dates" value={item.duration} />
          <PreviewRow label="Certificate" value={item.certificate} />
        </div>

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
    </div>
  );
}

export default function FdpWorkshops({
  data,
  onChange,
}: {
  data: FDP[];
  onChange: (d: FDP[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingItem, setPendingItem] = useState<FDP | null>(null);

  const upd = (i: number, k: keyof FDP, v: string) => {
    const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a);
  };

  const sorted = [...data].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  const isComplete = (item: FDP) => !!(item.programTitle && item.type && item.year);

  return (
    <>
      <div className="section-header-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setPendingItem({ ...EMPTY })}
          disabled={pendingItem !== null || editingIndex !== null}
        >
          <Plus size={14} /> Add FDP / Workshop
        </button>
      </div>

      {sorted.length === 0 && !pendingItem && (
        <div className="empty-state">
          No entries added yet. Click <strong>Add FDP / Workshop</strong> to get started.
        </div>
      )}

      <div className="items-list">
        {/* Pending New Entry */}
        {pendingItem && (
          <div className="item-card is-editing">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Entry</span>
              <div>
                <button
                  type="button" className="btn btn-success btn-xs"
                  disabled={!isComplete(pendingItem)}
                  onClick={() => {
                    const updated = [pendingItem, ...data];
                    updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
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
            <FdpForm item={pendingItem} onChange={(k, v) => setPendingItem({ ...pendingItem, [k]: v })} />
          </div>
        )}

        {/* Existing Entries */}
        {sorted.map((item, i) => {
          const isEdit = editingIndex === i;
          return (
            <div key={i} className={`item-card ${isEdit ? 'is-editing' : 'is-preview'}`}>
              {isEdit ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Entry</span>
                    <div>
                      <button
                        type="button" className="btn btn-success btn-xs"
                        onClick={() => {
                          const updated = [...data];
                          updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
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
                  <FdpForm item={item} onChange={(k, v) => upd(i, k, v)} />
                </>
              ) : (
                <>
                  <FdpPreview item={item} />
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
