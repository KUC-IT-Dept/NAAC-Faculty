
import { useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { fg, inp, sel, ta, FileInp, pv } from './sectionUtils';

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
      <div className="section-header-actions" style={{ marginBottom: 16 }}>
        <h5 style={{ margin: 0 }}>Awards / Fellowships / Honours</h5>
        <button 
          type="button" 
          onClick={handleAddAward} 
          disabled={pendingNewItem !== null || editingItemIndex !== null}
          style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          <Plus size={14} /> Add Award
        </button>
      </div>

      {sortedData.length === 0 && (
        <div className="empty-state">No awards added yet. Click Add Award to get started.</div>
      )}

      <div className="items-list">
        {/* Render pending new item first (at the top) */}
        {pendingNewItem && (
          <div key="pending" className="list-item-card">
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <button 
                type="button" 
                onClick={() => handleSavePending(pendingNewItem)} 
                disabled={!isItemComplete(pendingNewItem)}
                style={{ padding: '6px 12px', marginRight: '8px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Save
              </button>
              <button 
                type="button" 
                onClick={() => setPendingNewItem(null)}
                style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Cancel
              </button>
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
                  <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                    <button 
                      type="button" 
                      onClick={() => setEditingItemIndex(null)}
                      style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      Save
                    </button>
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
                <>
                  <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                    <button 
                      type="button" 
                      onClick={() => setEditingItemIndex(i)}
                      style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      className="list-item-remove" 
                      onClick={() => onChange(sortedData.filter((_, j) => j !== i))}
                      style={{ marginLeft: '8px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
                    {pv('Award Name', a.name)}
                    {pv('Awarding Agency', a.awardingAgency)}
                  </div>
                  <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
                    {pv('Date of Award', a.dateOfAward)}
                    {pv('Level', a.level)}
                  </div>
                  {a.description && <div style={{ marginBottom: '16px' }}>{pv('Description', a.description)}</div>}
                  {a.documentUrl && (
                    <div style={{ marginTop: '8px' }}>
                      <a href={`${import.meta.env.VITE_API_URL}${a.documentUrl}`} target="_blank" rel="noreferrer" className="preview-file-link" style={{ display: 'inline-flex' }}>
                        <ExternalLink size={14} /> View Proof
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
