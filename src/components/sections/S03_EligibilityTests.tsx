import { Plus, Trash2, Edit2, CheckCircle, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { useState } from 'react';
import { fg, sel, yearSel } from './sectionUtils';

/* ─── Constants ─────────────────────────────────────────── */

const EMPTY = {
  examName: '',
  subject: '',
  year: '',
  certificateNo: '',
  state: '',
  score: '',
  fellowshipAgency: '',
};

const SUBJECT_OPTIONS = [
  'Commerce',
  'Computer Science & Applications',
  'Economics',
  'Education',
  'English',
  'Geography',
  'Hindi',
  'History',
  'Law',
  'Library & Information Science',
  'Management',
  'Mathematics',
  'Philosophy',
  'Physics',
  'Political Science',
  'Psychology',
  'Sanskrit',
  'Social Work',
  'Sociology',
  'Tourism Administration & Management',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh',
  'Dadra & Nagar Haveli and Daman & Diu', 'Delhi',
  'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const FELLOWSHIP_AGENCIES = ['UGC', 'CSIR', 'University', 'NBHM', 'DAE'];

/* ─── Button styles ─────────────────────────────────────── */
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

/* ─── Component ─────────────────────────────────────────── */
export default function EligibilityTests({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>(EMPTY);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingData({ ...data[index] });
  };

  const saveEdit = () => {
    const hasContent = Object.values(editingData).some((v: any) => v && typeof v === 'string' && v.trim() !== '');
    if (!hasContent) { setEditingIndex(null); setEditingData(EMPTY); return; }

    let newData = [...data];
    if (editingIndex === -1) {
      newData.unshift({ ...editingData });
    } else if (editingIndex !== null && editingIndex >= 0) {
      newData[editingIndex] = { ...editingData };
    }
    newData.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
    onChange(newData);
    setEditingIndex(null);
    setEditingData(EMPTY);
  };

  const cancelEdit = () => { setEditingIndex(null); setEditingData(EMPTY); };

  const addNewTest = () => { setEditingIndex(-1); setEditingData({ ...EMPTY }); };

  const removeTest = (index: number) => onChange(data.filter((_, j) => j !== index));

  const upd = (key: string, value: string) =>
    setEditingData((prev: any) => ({ ...prev, [key]: value }));

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const s = new Set(prev);
      s.has(index) ? s.delete(index) : s.add(index);
      return s;
    });
  };

  const renderPreview = (label: string, value: any) => (
    <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#7c8b9d', fontWeight: 600, fontSize: '13px', width: '220px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
      <span style={{ color: '#1f2937', fontSize: '14px', fontWeight: 500 }}>{value || '-'}</span>
    </div>
  );

  /* ── Shared form fields ─────────────────────────────── */
  const renderFormFields = () => (
    <>
      <div className="form-row form-row-2">
        {fg('Eligibility Test *',
          sel(editingData.examName, v => { upd('examName', v); upd('subject', ''); upd('state', ''); },
            ['NET', 'SET / SLET', 'GATE', 'JRF'])
        )}
        {fg('Year', yearSel(editingData.year, v => upd('year', v)))}
      </div>

      {editingData.examName === 'NET' && (
        <div className="form-row form-row-2">
          {fg('Subject', sel(editingData.subject, v => upd('subject', v), SUBJECT_OPTIONS))}
          {fg('Certificate No.', (
            <input className="form-input" value={editingData.certificateNo || ''} onChange={e => upd('certificateNo', e.target.value)} placeholder="Certificate number" />
          ))}
        </div>
      )}

      {editingData.examName === 'SET / SLET' && (
        <div className="form-row form-row-2">
          {fg('Subject', sel(editingData.subject, v => upd('subject', v), SUBJECT_OPTIONS))}
          {fg('State', sel(editingData.state, v => upd('state', v), INDIAN_STATES))}
        </div>
      )}

      {editingData.examName === 'GATE' && (
        <div className="form-row form-row-1">
          {fg('Score', (
            <input className="form-input" value={editingData.score || ''} onChange={e => upd('score', e.target.value)} placeholder="e.g., 450" />
          ))}
        </div>
      )}

      {/* JRF — DD removed, only Fellowship Agency */}
      {editingData.examName === 'JRF' && (
        <div className="form-row form-row-1">
          {fg('Fellowship Agency', sel(editingData.fellowshipAgency, v => upd('fellowshipAgency', v), FELLOWSHIP_AGENCIES))}
        </div>
      )}


    </>
  );

  /* ── Shared edit header ─────────────────────────────── */
  const renderEditHeader = (title: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CheckCircle size={20} color="#4f46e5" /> {title}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button type="button" onClick={cancelEdit} style={cancelBtnStyle}>
          <X size={14} /> Cancel
        </button>
        <button type="button" onClick={saveEdit} style={saveBtnStyle}>
          <Check size={14} /> Save
        </button>
      </div>
    </div>
  );

  /* ── Main render ────────────────────────────────────── */
  return (
    <div>
      {/* Add button */}
      <div style={{ textAlign: 'right', marginBottom: '16px' }}>
        <button type="button" onClick={addNewTest} style={{
          padding: '8px 16px', fontSize: '14px', cursor: 'pointer',
          backgroundColor: '#4f46e5', color: 'white', border: 'none',
          borderRadius: '6px', display: 'inline-flex', alignItems: 'center',
          gap: '8px', fontWeight: 600,
        }}>
          <Plus size={16} /> Add Test
        </button>
      </div>

      {/* New entry form */}
      {editingIndex === -1 && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {renderEditHeader('Add New Eligibility Test')}
          {renderFormFields()}
        </div>
      )}

      {/* Existing entries */}
      {data.map((e, i) => (
        <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {editingIndex === i ? (
            <>
              {renderEditHeader('Edit Eligibility Test')}
              {renderFormFields()}
            </>
          ) : (
            <>
              {/* Preview header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleCard(i)}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                      {e.examName || `Eligibility Test ${i + 1}`}
                      {e.year && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>({e.year})</span>}
                    </h3>
                    {e.subject && (
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>Subject: {e.subject}</div>
                    )}
                  </div>
                  {expandedCards.has(i) ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                </div>
                <div>
                  <button type="button" onClick={() => startEdit(i)} style={{
                    padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                    backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
                    borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button type="button" onClick={() => removeTest(i)} style={{
                    marginLeft: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                    backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
                    borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedCards.has(i) && (
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  {renderPreview('Eligibility Test', e.examName)}
                  {renderPreview('Year', e.year)}
                  {(e.examName === 'NET' || e.examName === 'SET / SLET') && renderPreview('Subject', e.subject)}
                  {e.examName === 'NET' && renderPreview('Certificate No.', e.certificateNo)}
                  {e.examName === 'SET / SLET' && renderPreview('State', e.state)}
                  {e.examName === 'GATE' && renderPreview('Score', e.score)}
                  {e.examName === 'JRF' && renderPreview('Fellowship Agency', e.fellowshipAgency)}

                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
