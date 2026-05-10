import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Edit2, ChevronDown, ChevronUp, Cpu, AlertCircle } from 'lucide-react';
import { fg, inp, sel, FileInp, yearSel, pv } from './sectionUtils';

const EMPTY = { courseName: '', platform: '', duration: '', completionYear: '', certificateId: '', certificateUrl: '', score: '' };
const PLATFORM_OPTS = ['NPTEL', 'Swayam', 'Coursera', 'edX', 'Udemy', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other'];

export default function OnlineCourses({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const s = (d: any[]) => onChange(d);
  const upd = (i: number, k: string, v: string) => {
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

  const isComplete = (c: any) => !!(c.courseName && c.platform);

  const handleSavePending = () => {
    if (!pendingItem) return;
    if (isComplete(pendingItem)) {
      s([pendingItem, ...data]);
      setPendingItem(null);
      setErrorMsg(null);
    } else {
      setErrorMsg("Please enter Course Name and Platform.");
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const item = data[editingIndex];
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
        <h5 style={{ margin: 0 }}>Online Courses & Certifications</h5>
        <button
          type="button"
          onClick={() => { setPendingItem({ ...EMPTY }); setErrorMsg(null); }}
          disabled={pendingItem !== null || editingIndex !== null}
          style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
        >
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="items-list">
        {pendingItem && (
          <div className="list-item-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} /> New Course
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
                  Save Course
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            {fg('Course / Certification Name *', inp(pendingItem.courseName, v => setPendingItem({ ...pendingItem, courseName: v })))}
            <div className="form-row form-row-3">
              {fg('Platform / Provider *', sel(pendingItem.platform, v => setPendingItem({ ...pendingItem, platform: v }), PLATFORM_OPTS))}
              {fg('Duration', inp(pendingItem.duration, v => setPendingItem({ ...pendingItem, duration: v })))}
              {fg('Year of Completion', yearSel(pendingItem.completionYear, v => setPendingItem({ ...pendingItem, completionYear: v })))}
            </div>
            <div className="form-row form-row-2">
              {fg('Certificate ID', inp(pendingItem.certificateId, v => setPendingItem({ ...pendingItem, certificateId: v })))}
              {fg('Score / Grade', inp(pendingItem.score, v => setPendingItem({ ...pendingItem, score: v })))}
            </div>
            {fg('Upload Certificate', <FileInp v={pendingItem.certificateUrl} fn={v => setPendingItem({ ...pendingItem, certificateUrl: v })} />)}
          </div>
        )}

        {data.map((c, i) => {
          const isEdit = editingIndex === i;
          const isExpanded = expandedIndices.has(i);
          return (
            <div key={i} className="list-item-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {isEdit ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>Edit Course</h3>
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
                        Save Course
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: 16, backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                      <AlertCircle size={14} /> {errorMsg}
                    </div>
                  )}

                  {fg('Course / Certification Name *', inp(c.courseName, v => upd(i, 'courseName', v)))}
                  <div className="form-row form-row-3">
                    {fg('Platform / Provider *', sel(c.platform, v => upd(i, 'platform', v), PLATFORM_OPTS))}
                    {fg('Duration', inp(c.duration, v => upd(i, 'duration', v)))}
                    {fg('Year of Completion', yearSel(c.completionYear, v => upd(i, 'completionYear', v)))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Certificate ID', inp(c.certificateId, v => upd(i, 'certificateId', v)))}
                    {fg('Score / Grade', inp(c.score, v => upd(i, 'score', v)))}
                  </div>
                  {fg('Upload Certificate', <FileInp v={c.certificateUrl} fn={v => upd(i, 'certificateUrl', v)} />)}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleExpand(i)}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                        {c.courseName || `Course ${i + 1}`}
                        {c.platform && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>— {c.platform}</span>}
                        {c.completionYear && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>({c.completionYear})</span>}
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
                      <div className="form-row form-row-3" style={{ marginBottom: '16px' }}>
                        {pv('Platform', c.platform)}
                        {pv('Duration', c.duration)}
                        {pv('Year', c.completionYear)}
                      </div>
                      <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
                        {pv('Certificate ID', c.certificateId)}
                        {pv('Score', c.score)}
                      </div>
                      {c.certificateUrl && (
                        <div style={{ marginTop: '8px' }}>
                          <a href={`${import.meta.env.VITE_API_URL}${c.certificateUrl}`} target="_blank" rel="noreferrer" className="preview-file-link" style={{ display: 'inline-flex' }}>
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
