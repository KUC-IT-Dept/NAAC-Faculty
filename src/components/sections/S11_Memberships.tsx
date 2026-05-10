import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Edit2, ChevronDown, ChevronUp, Award, AlertCircle } from 'lucide-react';
import { fg, inp, sel, FileInp, pv, yearSel } from './sectionUtils';

type Membership = {
  organizationName: string;
  membershipType: string;
  membershipId: string;
  yearOfJoining: string;
  documentUrl: string;
};

const EMPTY: Membership = {
  organizationName: '',
  membershipType: '',
  membershipId: '',
  yearOfJoining: '',
  documentUrl: '',
};

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

  const isComplete = (item: Membership) => !!(item.organizationName && item.membershipType && item.yearOfJoining);

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
          onClick={() => { setPendingItem({ ...EMPTY }); setErrorMsg(null); }}
          disabled={pendingItem !== null || editingIndex !== null}
          style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Membership
        </button>
      </div>

      <div className="items-list">
        {pendingItem && (
          <div className="list-item-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} /> New Membership
              </h3>
              <div>
                <button 
                  type="button" 
                  onClick={() => { setPendingItem(null); setErrorMsg(null); }}
                  style={{ padding: '6px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', marginRight: '8px', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleSavePending}
                  style={{ padding: '6px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500 }}
                >
                  Save Membership
                </button>
              </div>
            </div>
            
            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            {fg('Organization Name *', inp(pendingItem.organizationName, v => setPendingItem({ ...pendingItem, organizationName: v })))}
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

        {data.map((item, i) => {
          const isEdit = editingIndex === i;
          const isExpanded = expandedIndices.has(i);
          return (
            <div key={i} className="list-item-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {isEdit ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>Edit Membership</h3>
                    <div>
                      <button 
                        type="button" 
                        onClick={() => { setEditingIndex(null); setErrorMsg(null); }}
                        style={{ padding: '6px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', marginRight: '8px', fontWeight: 500 }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={handleSaveEdit}
                        style={{ padding: '6px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500 }}
                      >
                        Save Membership
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                      <AlertCircle size={14} /> {errorMsg}
                    </div>
                  )}

                  {fg('Organization Name *', inp(item.organizationName, v => upd(i, 'organizationName', v)))}
                  <div className="form-row form-row-2">
                    {fg('Membership Type *', sel(item.membershipType, v => upd(i, 'membershipType', v), ['Life Member', 'Annual Member', 'Fellow', 'Associate']))}
                    {fg('Membership ID', inp(item.membershipId, v => upd(i, 'membershipId', v)))}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Year of Joining *', yearSel(item.yearOfJoining, v => upd(i, 'yearOfJoining', v)))}
                  </div>
                  {fg('Certificate / Proof', <FileInp v={item.documentUrl} fn={v => upd(i, 'documentUrl', v)} />)}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleExpand(i)}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                        {item.organizationName || `Membership ${i + 1}`}
                        {item.membershipType && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>— {item.membershipType}</span>}
                        {item.yearOfJoining && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>({item.yearOfJoining})</span>}
                      </h3>
                      {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                    </div>
                    <div>
                      <button 
                        type="button" 
                        onClick={() => { setEditingIndex(i); setErrorMsg(null); }}
                        style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button 
                        type="button" 
                        onClick={() => s(data.filter((_, j) => j !== i))}
                        style={{ marginLeft: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                      <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
                        {pv('Membership Type', item.membershipType)}
                        {pv('Membership ID', item.membershipId)}
                      </div>
                      <div className="form-row form-row-1" style={{ marginBottom: '16px' }}>
                        {pv('Year of Joining', item.yearOfJoining)}
                      </div>
                      {item.documentUrl && (
                        <div style={{ marginTop: '8px' }}>
                          <a href={`${import.meta.env.VITE_API_URL}${item.documentUrl}`} target="_blank" rel="noreferrer" className="preview-file-link" style={{ display: 'inline-flex' }}>
                            <ExternalLink size={14} /> View Document
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
