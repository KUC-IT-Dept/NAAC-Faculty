
import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink } from 'lucide-react';
import { fg, inp, sel, ta, FileInp, DropdownWithCustom } from './sectionUtils';

const EMPTY = { name: '', awardingAgency: '', dateOfAward: '', level: '', description: '', documentUrl: '' };

const LEVELS = ['International', 'National', 'State', 'University', 'Institution'];

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
        // If either date is missing, treat as oldest
        if (!a.dateOfAward && !b.dateOfAward) return 0;
        if (!a.dateOfAward) return 1;
        if (!b.dateOfAward) return -1;
        // Compare as dates (YYYY-MM-DD or YYYY)
        return new Date(b.dateOfAward).getTime() - new Date(a.dateOfAward).getTime();
      });
      onChange(updated);
      setPendingNewItem(null);
    }
  };

  // Handle canceling a pending new item
  const handleCancelPending = () => {
    setPendingNewItem(null);
  };

  // Handle updating pending item
  const updatePending = (k: string, v: string) => {
    setPendingNewItem({ ...pendingNewItem, [k]: v });
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
      <div className="section-header-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={handleAddAward} disabled={pendingNewItem !== null || editingItemIndex !== null}>
          <Plus size={14} /> Add Award
        </button>
      </div>

      {sortedData.length === 0 && (
        <div className="empty-state">No awards added yet. Click Add Award to get started.</div>
      )}

      <div className="items-list">
        {/* Render pending new item first (at the top) */}
        {pendingNewItem && (
          <div key="pending" className="item-card is-editing">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Award</span>
              <div>
                <button type="button" className="btn btn-success btn-xs" onClick={() => handleSavePending(pendingNewItem)} disabled={!isItemComplete(pendingNewItem)}>
                  <Check size={12} /> Save
                </button>
                <button type="button" className="btn btn-ghost btn-xs" onClick={handleCancelPending} style={{ marginLeft: 8 }}>
                  Cancel
                </button>
              </div>
            </div>
            <div className="form-row form-row-2">
              {fg('Award / Fellowship / Honour Name *', inp(pendingNewItem.name, v => updatePending('name', v)))}
              {fg('Awarding Body / Agency *', <DropdownWithCustom v={pendingNewItem.awardingAgency} fn={v => updatePending('awardingAgency', v)} opts={['UGC', 'AICTE', 'DST', 'CSIR', 'ICMR']} />)}
            </div>
            <div className="form-row form-row-2">
              {fg(
                'Date / Year of Award',
                <input
                  type="date"
                  value={pendingNewItem.dateOfAward}
                  onChange={e => updatePending('dateOfAward', e.target.value)}
                  className="form-input"
                />
              )}
              {fg('Level', sel(pendingNewItem.level, v => updatePending('level', v), LEVELS))}
            </div>
            <div className="form-row form-row-2">
              {fg('Brief Description (optional)', ta(pendingNewItem.description, v => updatePending('description', v), 'Details about the award...'))}
              {fg('Certificate / Proof', <FileInp v={pendingNewItem.documentUrl} fn={v => updatePending('documentUrl', v)} />)}
            </div>
          </div>
        )}

        {/* Render sorted items */}
        {sortedData.map((a, i) => {
          const itemIsEditing = editingItemIndex === i;
          return (
            <div key={i} className={`item-card ${itemIsEditing ? 'is-editing' : 'is-preview'}`}>
              {itemIsEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Award</span>
                    <div>
                      <button type="button" className="btn btn-success btn-xs" onClick={() => setEditingItemIndex(null)}>
                        <Check size={12} /> Done
                      </button>
                      <button type="button" className="btn btn-danger btn-xs" onClick={() => onChange(sortedData.filter((_, j) => j !== i))} style={{ marginLeft: 8 }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Award / Fellowship / Honour Name *', inp(a.name, v => upd(i, 'name', v)))}
                    {fg('Awarding Body / Agency *', <DropdownWithCustom v={a.awardingAgency} fn={v => upd(i, 'awardingAgency', v)} opts={['UGC', 'AICTE', 'DST', 'CSIR', 'ICMR']} />)}
                  </div>
                  <div className="form-row form-row-2">
                    {fg(
                      'Date / Year of Award',
                      <input
                        type="date"
                        value={a.dateOfAward}
                        onChange={e => upd(i, 'dateOfAward', e.target.value)}
                        className="form-input"
                      />
                    )}
                    {fg('Level', sel(a.level, v => upd(i, 'level', v), LEVELS))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Brief Description (optional)', ta(a.description, v => upd(i, 'description', v), 'Details about the award...'))}
                    {fg('Certificate / Proof', <FileInp v={a.documentUrl} fn={v => upd(i, 'documentUrl', v)} />)}
                  </div>
                </>
              ) : (
                <div className="preview-layout">
                  <div className="preview-main">
                    <h4 className="preview-title">{a.name}</h4>
                    <p className="preview-subtitle">{a.awardingAgency} • <span className="badge badge-secondary">{a.level}</span></p>
                    {a.description && <p className="preview-desc">{a.description}</p>}
                    <p className="preview-meta">{a.dateOfAward}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {a.documentUrl && (
                      <a href={`${import.meta.env.VITE_API_URL}${a.documentUrl}`} target="_blank" rel="noreferrer" className="preview-file-link">
                        <ExternalLink size={14} /> View Proof
                      </a>
                    )}
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditingItemIndex(i)}>
                      <Edit2 size={14} /> Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
