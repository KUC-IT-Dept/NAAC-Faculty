import { Plus, Trash2, Edit2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { fg, inp } from './sectionUtils';

const EMPTY = {
  examName: '',
  subject: '',
  year: '',
  certificateNo: '',
  state: '',
  score: '',
  fellowshipAgency: '',
  dd: ''
};

export default function EligibilityTests({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>(EMPTY);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());



  const CustomSelect = ({ value, onChange, options, placeholder = "— Select —" }: any) => (
    <select
      className="form-select"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#1e293b' }}
    >
      <option value="">{placeholder}</option>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingData({ ...data[index] });
  };

  const saveEdit = () => {
    // Check if editingData has any meaningful content
    const hasContent = Object.values(editingData).some((v: any) => v && typeof v === 'string' && v.trim() !== '');
    
    if (!hasContent) {
      // If no content, just cancel without adding
      setEditingIndex(null);
      setEditingData(EMPTY);
      return;
    }

    let newData = [...data];
    
    if (editingIndex === -1) {
      // Adding new test
      newData.unshift({ ...editingData });
    } else if (editingIndex !== null && editingIndex >= 0) {
      // Editing existing test
      newData[editingIndex] = { ...editingData };
    }

    // Sort the array by year descending (latest year at the top)
    newData.sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      return yearB - yearA;
    });

    onChange(newData);
    setEditingIndex(null);
    setEditingData(EMPTY);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingData(EMPTY);
  };

  const addNewTest = () => {
    // Don't add empty test - just open edit mode with empty data
    setEditingIndex(-1);
    setEditingData({ ...EMPTY });
  };

  const removeTest = (index: number) => {
    onChange(data.filter((_, j) => j !== index));
  };

  const updateEditingData = (key: string, value: string) => {
    setEditingData((prev: any) => ({ ...prev, [key]: value }));
  };

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const renderPreview = (label: string, value: any) => (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#7c8b9d', fontWeight: 600, fontSize: '14px', width: '250px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#1f2937', fontSize: '14px', fontWeight: 500 }}>{value || '-'}</span>
    </div>
  );

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={addNewTest}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600
          }}
        >
          <Plus size={16} /> Add Test
        </button>
      </div>

      {editingIndex === -1 ? (
        <div key="new" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="#4f46e5" /> Add New Eligibility Test
              </h3>
              <div>
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    padding: '6px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    marginRight: '8px',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  style={{
                    padding: '6px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 500
                  }}
                >
                  Save Test
                </button>
              </div>
            </div>

            <div className="form-row form-row-2">
              {fg('Eligibility Test *', <CustomSelect
                value={editingData.examName}
                onChange={(v: string) => updateEditingData('examName', v)}
                options={['NET', 'SET / SLET', 'GATE', 'JRF', 'Any other competitive exam qualified']}
              />)}
              {fg('Year', inp(editingData.year, v => updateEditingData('year', v), 'e.g., 2022'))}
            </div>
            
            {/* NET Fields */}
            {editingData.examName === 'NET' && (
              <>
                <div className="form-row form-row-2">
                  {fg('Subject', inp(editingData.subject, v => updateEditingData('subject', v), 'e.g., Computer Science'))}
                  {fg('Certificate No.', inp(editingData.certificateNo, v => updateEditingData('certificateNo', v)))}
                </div>
              </>
            )}
            
            {/* SET / SLET Fields */}
            {editingData.examName === 'SET / SLET' && (
              <>
                <div className="form-row form-row-1">
                  {fg('Subject', inp(editingData.subject, v => updateEditingData('subject', v), 'e.g., Computer Science'))}
                </div>
                <div className="form-row form-row-1">
                  {fg('State', inp(editingData.state, v => updateEditingData('state', v), 'e.g., Karnataka'))}
                </div>
              </>
            )}
            
            {/* GATE Fields */}
            {editingData.examName === 'GATE' && (
              <>
                <div className="form-row form-row-1">
                  {fg('Score', inp(editingData.score, v => updateEditingData('score', v), 'e.g., 450'))}
                </div>
              </>
            )}
            
            {/* JRF Fields */}
            {editingData.examName === 'JRF' && (
              <>
                <div className="form-row form-row-1">
                  {fg('DD', inp(editingData.dd, v => updateEditingData('dd', v), 'e.g., 01/01/2022'))}
                </div>
                <div className="form-row form-row-3">
                  {fg('UGC', <CustomSelect
                    value={editingData.fellowshipAgency === 'UGC' ? 'UGC' : ''}
                    onChange={(v: string) => updateEditingData('fellowshipAgency', v === 'UGC' ? 'UGC' : '')}
                    options={['UGC']}
                  />)}
                  {fg('CSIR', <CustomSelect
                    value={editingData.fellowshipAgency === 'CSIR' ? 'CSIR' : ''}
                    onChange={(v: string) => updateEditingData('fellowshipAgency', v === 'CSIR' ? 'CSIR' : '')}
                    options={['CSIR']}
                  />)}
                  {fg('University', <CustomSelect
                    value={editingData.fellowshipAgency === 'University' ? 'University' : ''}
                    onChange={(v: string) => updateEditingData('fellowshipAgency', v === 'University' ? 'University' : '')}
                    options={['University']}
                  />)}
                </div>
                <div className="form-row form-row-2">
                  {fg('NBHM', <CustomSelect
                    value={editingData.fellowshipAgency === 'NBHM' ? 'NBHM' : ''}
                    onChange={(v: string) => updateEditingData('fellowshipAgency', v === 'NBHM' ? 'NBHM' : '')}
                    options={['NBHM']}
                  />)}
                  {fg('DAE', <CustomSelect
                    value={editingData.fellowshipAgency === 'DAE' ? 'DAE' : ''}
                    onChange={(v: string) => updateEditingData('fellowshipAgency', v === 'DAE' ? 'DAE' : '')}
                    options={['DAE']}
                  />)}
                </div>
              </>
            )}
            
            {/* Any other competitive exam */}
            {editingData.examName === 'Any other competitive exam qualified' && (
              <div className="form-row form-row-1">
                {fg('Exam Details', inp(editingData.subject, v => updateEditingData('subject', v), 'e.g., Exam name and details'))}
              </div>
            )}
          </>
        </div>
      ) : (
        data.map((e, i) => (
          <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            {editingIndex === i ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={20} color="#111827" /> Edit Eligibility Test
                </h3>
                <div>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      padding: '6px 16px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      marginRight: '8px',
                      fontWeight: 500
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    style={{
                      padding: '6px 16px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      backgroundColor: '#111827',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 500
                    }}
                  >
                    Save Test
                  </button>
                </div>
              </div>

              <div className="form-row form-row-2">
                {fg('Eligibility Test *', <CustomSelect
                  value={editingData.examName}
                  onChange={(v: string) => updateEditingData('examName', v)}
                  options={['NET', 'SET / SLET', 'GATE', 'JRF', 'Any other competitive exam qualified']}
                />)}
                {fg('Year', inp(editingData.year, v => updateEditingData('year', v), 'e.g., 2022'))}
              </div>
              
              {/* NET Fields */}
              {editingData.examName === 'NET' && (
                <>
                  <div className="form-row form-row-2">
                    {fg('Subject', inp(editingData.subject, v => updateEditingData('subject', v), 'e.g., Computer Science'))}
                    {fg('Certificate No.', inp(editingData.certificateNo, v => updateEditingData('certificateNo', v)))}
                  </div>
                </>
              )}
              
              {/* SET / SLET Fields */}
              {editingData.examName === 'SET / SLET' && (
                <>
                  <div className="form-row form-row-1">
                    {fg('Subject', inp(editingData.subject, v => updateEditingData('subject', v), 'e.g., Computer Science'))}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('State', inp(editingData.state, v => updateEditingData('state', v), 'e.g., Karnataka'))}
                  </div>
                </>
              )}
              
              {/* GATE Fields */}
              {editingData.examName === 'GATE' && (
                <>
                  <div className="form-row form-row-1">
                    {fg('Score', inp(editingData.score, v => updateEditingData('score', v), 'e.g., 450'))}
                  </div>
                </>
              )}
              
              {/* JRF Fields */}
              {editingData.examName === 'JRF' && (
                <>
                  <div className="form-row form-row-1">
                    {fg('DD', inp(editingData.dd, v => updateEditingData('dd', v), 'e.g., 01/01/2022'))}
                  </div>
                  <div className="form-row form-row-3">
                    {fg('UGC', <CustomSelect
                      value={editingData.fellowshipAgency === 'UGC' ? 'UGC' : ''}
                      onChange={(v: string) => updateEditingData('fellowshipAgency', v === 'UGC' ? 'UGC' : '')}
                      options={['UGC']}
                    />)}
                    {fg('CSIR', <CustomSelect
                      value={editingData.fellowshipAgency === 'CSIR' ? 'CSIR' : ''}
                      onChange={(v: string) => updateEditingData('fellowshipAgency', v === 'CSIR' ? 'CSIR' : '')}
                      options={['CSIR']}
                    />)}
                    {fg('University', <CustomSelect
                      value={editingData.fellowshipAgency === 'University' ? 'University' : ''}
                      onChange={(v: string) => updateEditingData('fellowshipAgency', v === 'University' ? 'University' : '')}
                      options={['University']}
                    />)}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('NBHM', <CustomSelect
                      value={editingData.fellowshipAgency === 'NBHM' ? 'NBHM' : ''}
                      onChange={(v: string) => updateEditingData('fellowshipAgency', v === 'NBHM' ? 'NBHM' : '')}
                      options={['NBHM']}
                    />)}
                    {fg('DAE', <CustomSelect
                      value={editingData.fellowshipAgency === 'DAE' ? 'DAE' : ''}
                      onChange={(v: string) => updateEditingData('fellowshipAgency', v === 'DAE' ? 'DAE' : '')}
                      options={['DAE']}
                    />)}
                  </div>
                </>
              )}
              
              {/* Any other competitive exam */}
              {editingData.examName === 'Any other competitive exam qualified' && (
                <div className="form-row form-row-1">
                  {fg('Exam Details', inp(editingData.subject, v => updateEditingData('subject', v), 'e.g., Exam name and details'))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleCard(i)}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                        {e.examName || `Eligibility Test ${i + 1}`}
                        {e.year && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>({e.year})</span>}
                      </h3>
                      {e.subject && (
                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, marginTop: '2px' }}>
                          Subject: {e.subject}
                        </div>
                      )}
                    </div>
                    {expandedCards.has(i) ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTest(i)}
                    style={{
                      marginLeft: '8px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      backgroundColor: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #fecdd3',
                      borderRadius: '6px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>

              {expandedCards.has(i) && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {renderPreview('Eligibility Test', e.examName)}
                  {renderPreview('Year', e.year)}
                  {(e.examName === 'NET' || e.examName === 'SET / SLET') && renderPreview('Subject', e.subject)}
                  {e.examName === 'NET' && renderPreview('Certificate No.', e.certificateNo)}
                  {e.examName === 'SET / SLET' && renderPreview('State', e.state)}
                  {e.examName === 'GATE' && renderPreview('Score', e.score)}
                  {e.examName === 'JRF' && (
                    <>
                      {renderPreview('DD', e.dd)}
                      {renderPreview('Fellowship Agency', e.fellowshipAgency)}
                    </>
                  )}
                  {e.examName === 'Any other competitive exam qualified' && renderPreview('Exam Details', e.subject)}
                </div>
              )}
            </>
          )}
        </div>
      )))}
    </div>
  );
}
