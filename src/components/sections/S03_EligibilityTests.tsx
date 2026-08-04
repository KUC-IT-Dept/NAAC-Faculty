/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-expressions */
import { Plus, Trash2, Edit2, CheckCircle, ChevronDown, ChevronUp, Check, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { fg, sel, yearSel, FileInp, DocumentPreviewLink } from './sectionUtils';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import { useConfirmSave } from '../useConfirmSave';
import { useConfirmDelete } from '../useConfirmDelete';


import { examNameOptions, subjectPaperOptions, stateForSetOptions, validityStatusOptions } from '../../shared/dropdownOptions';

/* ─── Constants ─────────────────────────────────────────── */

const EMPTY = {
  examName: '',
  subject: '',
  year: '',
  certificateNo: '',
  state: '',
  score: '',
  fellowshipAgency: '',
  validityStatus: '',
  documentUrl: '',
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
  const { confirmSave, ConfirmDialog } = useConfirmSave();
  const { confirmDelete, ConfirmDialog: ConfirmDeleteDialog } = useConfirmDelete();
  const dynamicExamNameOptions = useDropdownOptions(examNameOptions);
  const dynamicSubjectPaperOptions = useDropdownOptions(subjectPaperOptions);
  const dynamicStateForSetOptions = useDropdownOptions(stateForSetOptions);
  const dynamicValidityStatusOptions = useDropdownOptions(validityStatusOptions);
  
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
            dynamicExamNameOptions)
        )}
        {fg('Year', yearSel(editingData.year, v => upd('year', v)))}
      </div>
      <div className="form-row form-row-1">
        {fg('Validity Status', sel(editingData.validityStatus, v => upd('validityStatus', v), dynamicValidityStatusOptions))}
      </div>

      {editingData.examName === 'NET' && (
        <div className="form-row form-row-2">
          {fg('Subject', sel(editingData.subject, v => upd('subject', v), dynamicSubjectPaperOptions))}
          {fg('Certificate No.', (
            <input className="form-input" value={editingData.certificateNo || ''} onChange={e => upd('certificateNo', e.target.value)} placeholder="Certificate number" />
          ))}
        </div>
      )}

      {editingData.examName === 'SET / SLET' && (
        <div className="form-row form-row-2">
          {fg('Subject', sel(editingData.subject, v => upd('subject', v), dynamicSubjectPaperOptions))}
          {fg('State', sel(editingData.state, v => upd('state', v), dynamicStateForSetOptions))}
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

      {editingData.examName && (
        <div className="form-row form-row-1" style={{ marginTop: '15px' }}>
          {fg('Upload Certificate / Proof', (
            <FileInp
              v={editingData.documentUrl || ''}
              fn={v => upd('documentUrl', v)}
              label="Upload Certificate (PDF / Image)"
              accept=".pdf,image/*"
              section="eligibilityTests"
            />
          ))}
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
        <button type="button" onClick={() => confirmSave(saveEdit)} style={saveBtnStyle}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedCards.has(i) ? '16px' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }} onClick={() => toggleCard(i)}>
                  {/* Year badge (blue box) */}
                  <div style={{ minWidth: 52, textAlign: 'center', padding: '6px 4px', borderRadius: '8px', background: '#2563eb', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                      {e.year || '—'}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year</div>
                  </div>
                  {/* Title details */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                      {e.examName || `Eligibility Test ${i + 1}`}
                    </h3>
                    {e.subject && (
                      <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Subject: {e.subject}</p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => toggleCard(i)}
                    style={{
                      padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                      backgroundColor: expandedCards.has(i) ? '#f8fafc' : '#f1f5f9',
                      color: expandedCards.has(i) ? '#000000' : '#475569',
                      border: expandedCards.has(i) ? '1px solid #cbd5e1' : '1px solid #cbd5e1',
                      borderRadius: '6px', fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {expandedCards.has(i) ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> View</>}
                  </button>
                  <button type="button" onClick={() => startEdit(i)} style={{
                    padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                    backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
                    borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button type="button" onClick={() => confirmDelete(() => removeTest(i))} style={{
                    padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
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
                  {renderPreview('Validity Status', e.validityStatus)}
                  {(e.examName === 'NET' || e.examName === 'SET / SLET') && renderPreview('Subject', e.subject)}
                  {e.examName === 'NET' && renderPreview('Certificate No.', e.certificateNo)}
                  {e.examName === 'SET / SLET' && renderPreview('State', e.state)}
                  {e.examName === 'GATE' && renderPreview('Score', e.score)}
                  {e.examName === 'JRF' && renderPreview('Fellowship Agency', e.fellowshipAgency)}
                  {e.documentUrl && (
                    <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#7c8b9d', fontWeight: 600, fontSize: '13px', width: '220px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Certificate</span>
                        <DocumentPreviewLink url={e.documentUrl} label="View Certificate" />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      <ConfirmDialog />
      <ConfirmDeleteDialog />
    </div>
  );
}
