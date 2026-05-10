import { Plus, Trash2, Edit2, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { fg, inp, sel, dateInp, Sub } from './sectionUtils';

const EMPTY = {
  degreeLevel: '',
  degreeName: '',
  specialization: '',
  institution: '',
  university: '',
  yearOfPassing: '',
  percentageCGPA: '',
  division: '',
  mode: '',
  countryAndState: ''
};

export default function Qualifications({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>(EMPTY);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // Sort data by yearOfPassing descending (latest year at the top)
  const sortedData = [...data].sort((a, b) => {
    const yearA = parseInt(a.yearOfPassing) || 0;
    const yearB = parseInt(b.yearOfPassing) || 0;
    return yearB - yearA;
  });

  const upd = (i: number, k: string, v: string) => {
    const a = [...data];
    a[i] = { ...a[i], [k]: v };
    onChange(a);
  };

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
    if (editingIndex !== null) {
      let newData = [...data];
      newData[editingIndex] = { ...editingData };

      // Sort the array by yearOfPassing descending (latest year at the top)
      newData.sort((a, b) => {
        const yearA = parseInt(a.yearOfPassing) || 0;
        const yearB = parseInt(b.yearOfPassing) || 0;
        return yearB - yearA;
      });

      onChange(newData);
      setEditingIndex(null);
      setEditingData(EMPTY);
    }
  };

  const cancelEdit = () => {
    const isCompletelyEmpty = Object.values(editingData).every(v => v === '');
    if (isCompletelyEmpty && editingIndex !== null) {
      onChange(data.filter((_, j) => j !== editingIndex));
    }

    setEditingIndex(null);
    setEditingData(EMPTY);
  };

  const addNewQualification = () => {
    // Add empty qualification to top of list
    const newData = [{ ...EMPTY }, ...data];
    onChange(newData);
    // Directly open it in edit mode
    setEditingIndex(0);
    setEditingData({ ...EMPTY });
  };

  const removeQualification = (index: number) => {
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
          onClick={addNewQualification}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600
          }}
        >
          <Plus size={16} /> Add Qualification
        </button>
      </div>

      {sortedData.map((q, i) => (
        <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {editingIndex === i ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={20} color="#111827" /> Edit Qualification
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
                    Save Qualification
                  </button>
                </div>
              </div>

              <div className="form-row form-row-3">
                {fg('Degree Level *', <CustomSelect
                  value={editingData.degreeLevel}
                  onChange={(v: string) => updateEditingData('degreeLevel', v)}
                  options={['10th', '12th', 'UG', 'PG', 'M.Phil', 'Ph.D', 'PDF', 'Additional Educational Qualifications']}
                />)}
                {fg('Degree / Qualification Name', inp(editingData.degreeName, v => updateEditingData('degreeName', v), 'e.g., B.Sc / M.Tech'))}
                {fg('Specialization / Subject', inp(editingData.specialization, v => updateEditingData('specialization', v), 'e.g., Computer Science'))}
              </div>
              <div className="form-row form-row-2">
                {fg('Institution / University Name', inp(editingData.institution, v => updateEditingData('institution', v)))}
                {fg('Board / University', inp(editingData.university, v => updateEditingData('university', v)))}
              </div>
              <div className="form-row form-row-4">
                {fg('Year of Passing', inp(editingData.yearOfPassing, v => updateEditingData('yearOfPassing', v), '2015'))}
                {fg('Percentage / CGPA', inp(editingData.percentageCGPA, v => updateEditingData('percentageCGPA', v), '85% / 8.5'))}
                {fg('Division', <CustomSelect
                  value={editingData.division}
                  onChange={(v: string) => updateEditingData('division', v)}
                  options={['First', 'Second', 'Third']}
                />)}
                {fg('Mode', <CustomSelect
                  value={editingData.mode}
                  onChange={(v: string) => updateEditingData('mode', v)}
                  options={['Regular', 'Distance']}
                />)}
              </div>
              <div className="form-row form-row-1">
                {fg('Country & State of Institution', inp(editingData.countryAndState, v => updateEditingData('countryAndState', v), 'e.g., India, Karnataka'))}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleCard(i)}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                    {q.degreeName || q.degreeLevel || `Qualification ${i + 1}`}
                    {q.yearOfPassing && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>({q.yearOfPassing})</span>}
                  </h3>
                  {expandedCards.has(i) ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
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
                    onClick={() => removeQualification(i)}
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
                  {renderPreview('Degree Level', q.degreeLevel)}
                  {renderPreview('Degree / Qualification Name', q.degreeName)}
                  {renderPreview('Specialization / Subject', q.specialization)}
                  {renderPreview('Institution / University Name', q.institution)}
                  {renderPreview('Board / University', q.university)}
                  {renderPreview('Year of Passing', q.yearOfPassing)}
                  {renderPreview('Percentage / CGPA', q.percentageCGPA)}
                  {renderPreview('Division', q.division)}
                  {renderPreview('Mode', q.mode)}
                  {renderPreview('Country & State of Institution', q.countryAndState)}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
