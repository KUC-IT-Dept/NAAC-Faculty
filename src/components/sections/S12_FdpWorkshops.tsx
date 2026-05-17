import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { fg, inp, sel, FileInp, yearSel } from './sectionUtils';

const EMPTY = { programTitle: '', type: '', organizingInstitution: '', duration: '', mode: '', certificate: '', year: '', documentUrl: '' };

const TYPE_OPTS = ['FDP', 'Workshop', 'Seminar', 'MOOC', 'Refresher', 'Orientation'];
const MODE_OPTS = ['Online', 'Offline'];
const CERT_OPTS = ['Yes', 'No'];

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };

function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function PreviewCard({ item, onEdit, onDelete, disabled }: { item: any; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{item.year || '—'}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>
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
          <PreviewRow label="Program Name" value={item.programTitle} />
          <PreviewRow label="Type" value={item.type} />
          <PreviewRow label="Organized By" value={item.organizingInstitution} />
          <PreviewRow label="Duration / Dates" value={item.duration} />
          <PreviewRow label="Mode" value={item.mode} />
          <PreviewRow label="Certificate" value={item.certificate} />
          {item.documentUrl && (
            <div style={{ marginTop: 8 }}>
              <a href={`${import.meta.env.VITE_API_URL || ''}${item.documentUrl}`} target="_blank" rel="noreferrer" className="preview-file-link" style={{ display: 'inline-flex' }}>
                <ExternalLink size={14} /> View Proof
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function FdpWorkshops({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [pendingNewItem, setPendingNewItem] = useState<any>(null);
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };

  const isItemComplete = (item: any) => item.programTitle && item.type && item.year;

  const handleAdd = () => {
    setPendingNewItem({ ...EMPTY });
  };

  const handleSavePending = (item: any) => {
    if (isItemComplete(item)) {
      const updated = [item, ...data];
      updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
      onChange(updated);
      setPendingNewItem(null);
    }
  };

  const sortedData = [...data].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  return (
    <>
      <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
        <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>FDPs / Workshops / Seminars</h5>
        <button
          type="button"
          onClick={handleAdd}
          disabled={pendingNewItem !== null || editingItemIndex !== null}
          style={{ ...btnAdd, flexShrink: 0 }}
        >
          <Plus size={16} /> Add Program
        </button>
      </div>

      {sortedData.length === 0 && (
        <div className="empty-state">No programs added yet. Click Add Program to get started.</div>
      )}

      <div className="items-list">
        {pendingNewItem && (
          <div key="pending" className="list-item-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Program</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleSavePending(pendingNewItem)}
                  disabled={!isItemComplete(pendingNewItem)}
                  style={isItemComplete(pendingNewItem) ? btnSave : { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
                >
                  <Check size={14} /> Save
                </button>
                <button type="button" onClick={() => setPendingNewItem(null)} style={btnCancel}>
                  Cancel
                </button>
              </div>
            </div>
            {fg('Program Name *', inp(pendingNewItem.programTitle, v => setPendingNewItem({ ...pendingNewItem, programTitle: v })))}
            <div className="form-row form-row-2">
              {fg('Type *', sel(pendingNewItem.type, v => setPendingNewItem({ ...pendingNewItem, type: v }), TYPE_OPTS))}
              {fg('Organized by', inp(pendingNewItem.organizingInstitution, v => setPendingNewItem({ ...pendingNewItem, organizingInstitution: v })))}
            </div>
            <div className="form-row form-row-2">
              {fg('Duration / Dates', inp(pendingNewItem.duration, v => setPendingNewItem({ ...pendingNewItem, duration: v })))}
              {fg('Year *', yearSel(pendingNewItem.year, v => setPendingNewItem({ ...pendingNewItem, year: v })))}
            </div>
            <div className="form-row form-row-2">
              {fg('Mode', sel(pendingNewItem.mode, v => setPendingNewItem({ ...pendingNewItem, mode: v }), MODE_OPTS))}
              {fg('Certificate', sel(pendingNewItem.certificate, v => setPendingNewItem({ ...pendingNewItem, certificate: v }), CERT_OPTS))}
            </div>
            {fg('Certificate / Proof', <FileInp v={pendingNewItem.documentUrl} fn={v => setPendingNewItem({ ...pendingNewItem, documentUrl: v })} />)}
          </div>
        )}

        {sortedData.map((item, i) => {
          const itemIsEditing = editingItemIndex === i;
          return (
            <div key={i} className="list-item-card">
              {itemIsEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Program</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setEditingItemIndex(null)} style={btnSave}>
                        <Check size={14} /> Done
                      </button>
                      <button type="button" onClick={() => { onChange(sortedData.filter((_, j) => j !== i)); setEditingItemIndex(null); }} style={btnDelete}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                  {fg('Program Name *', inp(item.programTitle, v => upd(i, 'programTitle', v)))}
                  <div className="form-row form-row-2">
                    {fg('Type *', sel(item.type, v => upd(i, 'type', v), TYPE_OPTS))}
                    {fg('Organized by', inp(item.organizingInstitution, v => upd(i, 'organizingInstitution', v)))}
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
                  onEdit={() => setEditingItemIndex(i)}
                  onDelete={() => onChange(sortedData.filter((_, j) => j !== i))}
                  disabled={pendingNewItem !== null}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
