
import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fg, inp, sel, ta, FileInp, DocumentPreviewLink } from './sectionUtils';
import { awardLevelOptions, awardCategoryOptions, awardingAgencyTypeOptions, honourTypeOptions, recognitionStatusOptions } from '../../shared/dropdownOptions';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import { useConfirmDelete } from '../useConfirmDelete';


const EMPTY = { name: '', awardingAgency: '', awardCategory: '', honourType: '', recognitionStatus: '', dateOfAward: '', yearReceived: '', level: '', description: '', documentUrl: '' };

const currentYear = new Date().getFullYear();
const YEAR_OPTS: string[] = [];
for (let y = currentYear; y >= 1970; y--) YEAR_OPTS.push(String(y));

const btnAdd:    React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit:   React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };

const saveBtnStyle: React.CSSProperties = {
  padding: '7px 20px', fontSize: '14px', cursor: 'pointer',
  backgroundColor: '#16a34a', color: 'white', border: 'none',
  borderRadius: '8px', fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  marginLeft: '8px',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '7px 20px', fontSize: '14px', cursor: 'pointer',
  backgroundColor: '#fff1f2', color: '#9f1239',
  border: '1px solid #fecdd3', borderRadius: '8px', fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: '6px',
};

const deleteBtnStyle: React.CSSProperties = {
  marginLeft: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
  backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
  borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
};

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
          <button type="button" style={deleteBtnStyle} onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={disabled}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewRow label="Award Name" value={a.name} />
          <PreviewRow label="Awarding Agency" value={a.awardingAgency} />
          <PreviewRow label="Award Category" value={a.awardCategory} />
          <PreviewRow label="Honour Type" value={a.honourType} />
          <PreviewRow label="Recognition Status" value={a.recognitionStatus} />
          <PreviewRow label="Date of Award" value={a.dateOfAward} />
          <PreviewRow label="Year Received" value={a.yearReceived} />
          <PreviewRow label="Level" value={a.level} />
          <PreviewRow label="Description" value={a.description} />
          {a.documentUrl && (
            <div style={{ marginTop: 8 }}>
              <DocumentPreviewLink url={a.documentUrl} label="View Proof" />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function Awards({ data, onChange, onPersist }: { data: any[]; onChange: (d: any[]) => void; onPersist?: (updatedAwards: any[], showToast?: boolean) => Promise<void> | void }) {
  const { confirmDelete, ConfirmDialog: ConfirmDeleteDialog } = useConfirmDelete();
  // Reactive dropdown options
  const levels = useDropdownOptions(awardLevelOptions);
  const dynamicAwardCategoryOptions = useDropdownOptions(awardCategoryOptions);
  const dynamicAwardingAgencyTypeOptions = useDropdownOptions(awardingAgencyTypeOptions);
  const dynamicHonourTypeOptions = useDropdownOptions(honourTypeOptions);
  const dynamicRecognitionStatusOptions = useDropdownOptions(recognitionStatusOptions);

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [pendingNewItem, setPendingNewItem] = useState<any>(null);
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };

  const persist = async (updatedAwards: any[], showToast = false) => {
    if (onPersist) {
      try { await onPersist(updatedAwards, showToast); }
      catch (err) { console.error('Failed to persist awards section', err); }
    }
  };

  // Check if an item has all required fields filled
  const isItemComplete = (item: any) => item.name && item.awardingAgency;

  // Handle adding a new award
  const handleAddAward = () => {
    setPendingNewItem({ ...EMPTY });
  };

  // Handle saving a pending new item (insert at top, then sort)
  const handleSavePending = async (item: any) => {
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
      await persist(updated, true);
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
      <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
        <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Awards / Fellowships / Honours</h5>
        <button
          type="button"
          onClick={handleAddAward}
          disabled={pendingNewItem !== null || editingItemIndex !== null}
          style={{ ...btnAdd, flexShrink: 0 }}
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
                <button type="button" onClick={() => setPendingNewItem(null)} style={cancelBtnStyle}>
                  <X size={14} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePending(pendingNewItem)}
                  disabled={!isItemComplete(pendingNewItem)}
                  style={saveBtnStyle}
                >
                  <Check size={14} /> Save
                </button>
              </div>
            </div>
            <div className="form-row form-row-2">
              {fg('Award / Fellowship / Honour Name *', inp(pendingNewItem.name, v => setPendingNewItem({ ...pendingNewItem, name: v })))}
              {fg('Awarding Body / Agency *', sel(pendingNewItem.awardingAgency, v => setPendingNewItem({ ...pendingNewItem, awardingAgency: v }), dynamicAwardingAgencyTypeOptions, "Select..."))}
            </div>
            <div className="form-row form-row-3">
              {fg('Award Category', sel(pendingNewItem.awardCategory, v => setPendingNewItem({ ...pendingNewItem, awardCategory: v }), dynamicAwardCategoryOptions, "Select..."))}
              {fg('Honour Type', sel(pendingNewItem.honourType, v => setPendingNewItem({ ...pendingNewItem, honourType: v }), dynamicHonourTypeOptions, "Select..."))}
              {fg('Recognition Status', sel(pendingNewItem.recognitionStatus, v => setPendingNewItem({ ...pendingNewItem, recognitionStatus: v }), dynamicRecognitionStatusOptions, "Select..."))}
            </div>
            <div className="form-row form-row-2">
              {fg('Date / Year of Award', <input type="date" value={pendingNewItem.dateOfAward} onChange={e => setPendingNewItem({ ...pendingNewItem, dateOfAward: e.target.value })} className="form-input" />)}
              {fg('Year Received', <select className="form-select" value={pendingNewItem.yearReceived || ''} onChange={e => setPendingNewItem({ ...pendingNewItem, yearReceived: e.target.value })}><option value="">— Select Year —</option>{YEAR_OPTS.map(y => <option key={y} value={y}>{y}</option>)}</select>)}
            </div>
            <div className="form-row form-row-2">
              {fg('Level', sel(pendingNewItem.level, v => setPendingNewItem({ ...pendingNewItem, level: v }), levels))}
              {fg('Brief Description (optional)', ta(pendingNewItem.description, v => setPendingNewItem({ ...pendingNewItem, description: v }), 'Details about the award...'))}
            </div>
            <div className="form-row form-row-2">
              {fg('Certificate / Proof', <FileInp v={pendingNewItem.documentUrl} fn={v => setPendingNewItem({ ...pendingNewItem, documentUrl: v })} section="awards" />)}
              <div></div>
            </div>
          </div>
        )}

        {/* Render sorted items */}
        {sortedData.map((a, i) => {
          const originalIndex = data.indexOf(a);
          const itemIsEditing = editingItemIndex === i;
          return (
            <div key={i} className="list-item-card">
              {itemIsEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Award</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={async () => { setEditingItemIndex(null); await persist(data, true); }} style={saveBtnStyle}>
                        <Check size={14} /> Done
                      </button>
                      <button type="button" onClick={() => confirmDelete(async () => { const updated = data.filter((_, j) => j !== originalIndex); onChange(updated); setEditingItemIndex(null); await persist(updated, false); })} style={deleteBtnStyle}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Award / Fellowship / Honour Name *', inp(a.name, v => upd(originalIndex, 'name', v)))}
                    {fg('Awarding Body / Agency *', sel(a.awardingAgency, v => upd(originalIndex, 'awardingAgency', v), dynamicAwardingAgencyTypeOptions, "Select..."))}
                  </div>
                  <div className="form-row form-row-3">
                    {fg('Award Category', sel(a.awardCategory, v => upd(originalIndex, 'awardCategory', v), dynamicAwardCategoryOptions, "Select..."))}
                    {fg('Honour Type', sel(a.honourType, v => upd(originalIndex, 'honourType', v), dynamicHonourTypeOptions, "Select..."))}
                    {fg('Recognition Status', sel(a.recognitionStatus, v => upd(originalIndex, 'recognitionStatus', v), dynamicRecognitionStatusOptions, "Select..."))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Date / Year of Award', <input type="date" value={a.dateOfAward} onChange={e => upd(originalIndex, 'dateOfAward', e.target.value)} className="form-input" />)}
                    {fg('Year Received', <select className="form-select" value={a.yearReceived || ''} onChange={e => upd(originalIndex, 'yearReceived', e.target.value)}><option value="">— Select Year —</option>{YEAR_OPTS.map(y => <option key={y} value={y}>{y}</option>)}</select>)}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Level', sel(a.level, v => upd(originalIndex, 'level', v), levels))}
                    {fg('Brief Description (optional)', ta(a.description, v => upd(originalIndex, 'description', v), 'Details about the award...'))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Certificate / Proof', <FileInp v={a.documentUrl} fn={v => upd(originalIndex, 'documentUrl', v)} section="awards" />)}
                    <div></div>
                  </div>
                </>
              ) : (
                <AwardPreviewCard
                  a={a}
                  onEdit={() => setEditingItemIndex(i)}
                  onDelete={() => confirmDelete(async () => { const updated = data.filter((_, j) => j !== originalIndex); onChange(updated); await persist(updated, false); })}
                  disabled={pendingNewItem !== null}
                />
              )}
            </div>
          );
        })}
      </div>
      <ConfirmDeleteDialog />
    </>
  );
}
