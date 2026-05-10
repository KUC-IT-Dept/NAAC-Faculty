import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Edit2, ChevronDown, ChevronUp, BookOpen, AlertCircle } from 'lucide-react';
import { fg, inp, sel, FileInp, yearSel, pv } from './sectionUtils';

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

export default function FdpWorkshops({
  data,
  onChange,
}: {
  data: FDP[];
  onChange: (d: FDP[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingItem, setPendingItem] = useState<FDP | null>(null);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sorted = [...data].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  const s = (d: FDP[]) => onChange(d);
  const upd = (i: number, k: keyof FDP, v: string) => {
    const a = [...sorted];
    a[i] = { ...a[i], [k]: v };
    s(a);
  };

  const toggleExpand = (idx: number) => {
    const newSet = new Set(expandedIndices);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setExpandedIndices(newSet);
  };

  const isComplete = (item: FDP) => !!(item.programTitle && item.type && item.year);

  const handleSavePending = () => {
    if (!pendingItem) return;
    if (isComplete(pendingItem)) {
      s([pendingItem, ...data]);
      setPendingItem(null);
      setErrorMsg(null);
    } else {
      setErrorMsg("Please enter Program Name, Type, and Year.");
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const item = sorted[editingIndex];
    if (isComplete(item)) {
      setEditingIndex(null);
      setErrorMsg(null);
    } else {
      setErrorMsg("Required fields are missing.");
    }
  };

  return (
    <div className="section-container">
      <div className="section-header-actions" style={{ marginBottom: 16 }}>
        <h5 style={{ margin: 0 }}>FDP / Workshops / Training</h5>
        <button
          type="button"
          onClick={() => { setPendingItem({ ...EMPTY }); setErrorMsg(null); }}
          disabled={pendingItem !== null || editingIndex !== null}
          style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Entry
        </button>
      </div>

      <div className="items-list">
        {pendingItem && (
          <div className="list-item-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} /> New Entry
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
                  Save Entry
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            {fg('Program Name *', inp(pendingItem.programTitle, v => setPendingItem({ ...pendingItem, programTitle: v })))}
            <div className="form-row form-row-2">
              {fg('Type *', sel(pendingItem.type, v => setPendingItem({ ...pendingItem, type: v }), TYPE_OPTS))}
              {fg('Organized by *', inp(pendingItem.organizingInstitution, v => setPendingItem({ ...pendingItem, organizingInstitution: v })))}
            </div>
            <div className="form-row form-row-2">
              {fg('Duration / Dates', inp(pendingItem.duration, v => setPendingItem({ ...pendingItem, duration: v })))}
              {fg('Year *', yearSel(pendingItem.year, v => setPendingItem({ ...pendingItem, year: v })))}
            </div>
            <div className="form-row form-row-2">
              {fg('Mode', sel(pendingItem.mode, v => setPendingItem({ ...pendingItem, mode: v }), MODE_OPTS))}
              {fg('Certificate', sel(pendingItem.certificate, v => setPendingItem({ ...pendingItem, certificate: v }), CERT_OPTS))}
            </div>
            {fg('Certificate / Proof', <FileInp v={pendingItem.documentUrl} fn={v => setPendingItem({ ...pendingItem, documentUrl: v })} />)}
          </div>
        )}

        {sorted.map((item, i) => {
          const isEdit = editingIndex === i;
          const isExpanded = expandedIndices.has(i);
          return (
            <div key={i} className="list-item-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {isEdit ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>Edit Entry</h3>
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
                        Save Entry
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                      <AlertCircle size={14} /> {errorMsg}
                    </div>
                  )}

                  {fg('Program Name *', inp(item.programTitle, v => upd(i, 'programTitle', v)))}
                  <div className="form-row form-row-2">
                    {fg('Type *', sel(item.type, v => upd(i, 'type', v), TYPE_OPTS))}
                    {fg('Organized by *', inp(item.organizingInstitution, v => upd(i, 'organizingInstitution', v)))}
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
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleExpand(i)}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                        {item.programTitle || `Entry ${i + 1}`}
                        {item.organizingInstitution && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>— {item.organizingInstitution}</span>}
                        {item.year && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>({item.year})</span>}
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
                        onClick={() => s(sorted.filter((_, j) => j !== i))}
                        style={{ marginLeft: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                      <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
                        {pv('Type', item.type)}
                        {pv('Organized By', item.organizingInstitution)}
                      </div>
                      <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
                        {pv('Duration', item.duration)}
                        {pv('Mode', item.mode)}
                      </div>
                      {item.documentUrl && (
                        <div style={{ marginTop: '8px' }}>
                          <a href={`${import.meta.env.VITE_API_URL}${item.documentUrl}`} target="_blank" rel="noreferrer" className="preview-file-link" style={{ display: 'inline-flex' }}>
                            <ExternalLink size={14} /> View Certificate
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
