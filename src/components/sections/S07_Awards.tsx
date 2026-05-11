
import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { fg, inp, sel, ta, FileInp } from './sectionUtils';
import { awardLevelOptions } from '../../shared/dropdownOptions';

const EMPTY = { name: '', awardingAgency: '', dateOfAward: '', level: '', description: '', documentUrl: '' };

const LEVELS = awardLevelOptions;

const btnAdd:    React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit:   React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave:   React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
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

function AwardPreviewCard({
  a, onEdit, onDelete, disabled
}: {
  a: any; onEdit: () => void; onDelete: () => void; disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const year = a.dateOfAward ? new Date(a.dateOfAward).getFullYear() : null;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{year || '—'}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {a.name || 'Untitled Award'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {a.awardingAgency && <span className="badge badge-secondary">{a.awardingAgency}</span>}
              {a.level && <span className="badge badge-secondary">{a.level}</span>}
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
          <PreviewRow label="Award Name" value={a.name} />
          <PreviewRow label="Awarding Agency" value={a.awardingAgency} />
          <PreviewRow label="Date of Award" value={a.dateOfAward} />
          <PreviewRow label="Level" value={a.level} />
          <PreviewRow label="Description" value={a.description} />
          {a.documentUrl && (
            <div style={{ marginTop: 8 }}>
              <a href={`${import.meta.env.VITE_API_URL}${a.documentUrl}`} target="_blank" rel="noreferrer" className="preview-file-link" style={{ display: 'inline-flex' }}>
                <ExternalLink size={14} /> View Proof
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function Awards({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [pendingNewItem, setPendingNewItem] = useState<any>(null);
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };

  // Check if an item has all required fields filled
  const isItemComplete = (item: any) => item.name && item.awardingAgency;

  // Handle adding a new award
  const handleAddAward = () => {
    setPendingNewItem({ ...EMPTY });
  };

  // Handle saving a pending new item (insert at top, then sort)
  const handleSavePending = (item: any) => {
    if (isItemComplete(item)) {
      // Insert at top, then sort by dateOfAward descending
      const updated = [item, ...data];
      updated.sort((a, b) => {
        if (!a.dateOfAward && !b.dateOfAward) return 0;
        if (!a.dateOfAward) return 1;
        if (!b.dateOfAward) return -1;
        return new Date(b.dateOfAward).getTime() - new Date(a.dateOfAward).getTime();
      });
      onChange(updated);
      setPendingNewItem(null);
    }
  };

  // Always sort data by dateOfAward descending for display
  const sortedData = [...data].sort((a, b) => {
    if (!a.dateOfAward && !b.dateOfAward) return 0;
    if (!a.dateOfAward) return 1;
    if (!b.dateOfAward) return -1;
    return new Date(b.dateOfAward).getTime() - new Date(a.dateOfAward).getTime();
  });



  return (
    <>
      <div className="section-header-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
        <h5 style={{ margin: 0 }}>Awards / Fellowships / Honours</h5>
        <button
          type="button"
          onClick={handleAddAward}
          disabled={pendingNewItem !== null || editingItemIndex !== null}
          style={btnAdd}
        >
          <Plus size={16} /> Add Award
        </button>
      </div>

      {sortedData.length === 0 && (
        <div className="empty-state">No awards added yet. Click Add Award to get started.</div>
      )}

      <div className="items-list">
        {/* Render pending new item first (at the top) */}
        {pendingNewItem && (
          <div key="pending" className="list-item-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Award</span>
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
            <div className="form-row form-row-2">
              {fg('Award / Fellowship / Honour Name *', inp(pendingNewItem.name, v => setPendingNewItem({ ...pendingNewItem, name: v })))}
              {fg('Awarding Body / Agency *', sel(pendingNewItem.awardingAgency, v => setPendingNewItem({ ...pendingNewItem, awardingAgency: v }), ['UGC', 'AICTE', 'DST', 'CSIR', 'ICMR']))}
            </div>
            <div className="form-row form-row-2">
              {fg('Date / Year of Award', <input type="date" value={pendingNewItem.dateOfAward} onChange={e => setPendingNewItem({ ...pendingNewItem, dateOfAward: e.target.value })} className="form-input" />)}
              {fg('Level', sel(pendingNewItem.level, v => setPendingNewItem({ ...pendingNewItem, level: v }), LEVELS))}
            </div>
            <div className="form-row form-row-2">
              {fg('Brief Description (optional)', ta(pendingNewItem.description, v => setPendingNewItem({ ...pendingNewItem, description: v }), 'Details about the award...'))}
              {fg('Certificate / Proof', <FileInp v={pendingNewItem.documentUrl} fn={v => setPendingNewItem({ ...pendingNewItem, documentUrl: v })} />)}
            </div>
          </div>
        )}

        {/* Render sorted items */}
        {sortedData.map((a, i) => {
          const itemIsEditing = editingItemIndex === i;
          return (
            <div key={i} className="list-item-card">
              {itemIsEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Award</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setEditingItemIndex(null)} style={btnSave}>
                        <Check size={14} /> Done
                      </button>
                      <button type="button" onClick={() => { onChange(sortedData.filter((_, j) => j !== i)); setEditingItemIndex(null); }} style={btnDelete}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Award / Fellowship / Honour Name *', inp(a.name, v => upd(i, 'name', v)))}
                    {fg('Awarding Body / Agency *', sel(a.awardingAgency, v => upd(i, 'awardingAgency', v), ['UGC', 'AICTE', 'DST', 'CSIR', 'ICMR']))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Date / Year of Award', <input type="date" value={a.dateOfAward} onChange={e => upd(i, 'dateOfAward', e.target.value)} className="form-input" />)}
                    {fg('Level', sel(a.level, v => upd(i, 'level', v), LEVELS))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Brief Description (optional)', ta(a.description, v => upd(i, 'description', v), 'Details about the award...'))}
                    {fg('Certificate / Proof', <FileInp v={a.documentUrl} fn={v => upd(i, 'documentUrl', v)} />)}
                  </div>
                </>
              ) : (
                <AwardPreviewCard
                  a={a}
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
