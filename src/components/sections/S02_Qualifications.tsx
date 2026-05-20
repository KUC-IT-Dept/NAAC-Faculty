import { Plus, Trash2, Edit2, GraduationCap, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { useState } from 'react';
import { fg, inp } from './sectionUtils';

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
  country: '',
  state: '',
  countryAndState: ''
};

const QUALIFICATION_LEVELS = ['10th', '12th', 'UG', 'PG', 'Ph.D', 'M.Phil'];
const SPECIALIZATION_LEVELS = ['UG', 'PG', 'Ph.D', 'M.Phil'];
const YEAR_OPTIONS = Array.from({ length: new Date().getFullYear() - 1979 }, (_, i) => String(new Date().getFullYear() - i));
const DIVISION_OPTIONS = ['First', 'Second', 'Third'];
const MODE_OPTIONS = ['Regular', 'Distance'];
const COUNTRY_OPTIONS = ['India', 'USA', 'UK', 'Australia', 'Other'];
const STATE_OPTIONS_INDIA = ['Kerala', 'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Other'];
const STATE_OPTIONS_OTHER = ['Other'];
const BOARD_OPTIONS_10TH = ['vhse', 'cbse', 'icse', 'kerala board of higher education', 'other'];
const BOARD_OPTIONS_12TH = ['vhse', 'cbse', 'icse', 'kerala board of higher secondary education', 'other'];
const UNIVERSITY_OPTIONS_HIGHER = ['kannur university', 'calicut university', 'kerala university', 'mg university', 'central university', 'open university', 'foreign university', 'other'];

const showSpecialization = (level: string) => SPECIALIZATION_LEVELS.includes(level);
const showDegreeName = (level: string) => SPECIALIZATION_LEVELS.includes(level);
const getBoardUniversityOptions = (level: string) => {
  if (level === '10th') return BOARD_OPTIONS_10TH;
  if (level === '12th') return BOARD_OPTIONS_12TH;
  if (['UG', 'PG', 'Ph.D', 'M.Phil'].includes(level)) return UNIVERSITY_OPTIONS_HIGHER;
  return [];
};

const normalizeQualificationName = (level: string, name: string) => {
  if (name?.trim()) return name;
  if (level === '10th') return '10th Certificate';
  if (level === '12th') return '12th Certificate';
  if (level === 'UG') return 'UG Degree';
  if (level === 'PG') return 'PG Degree';
  if (level === 'Ph.D') return 'Ph.D Degree';
  if (level === 'M.Phil') return 'M.Phil Degree';
  return '';
};

const parseCountryState = (countryAndState: string) => {
  const parts = (countryAndState || '').split(',').map((p) => p.trim()).filter(Boolean);
  return {
    country: parts[0] || '',
    state: parts.slice(1).join(', ') || ''
  };
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
    const item = data[index] || {};
    const parsed = parseCountryState(item.countryAndState || '');
    setEditingIndex(index);
    setEditingData({
      ...item,
      country: item.country || parsed.country,
      state: item.state || parsed.state
    });
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

    const normalizedData = {
      ...editingData,
      degreeName: normalizeQualificationName(editingData.degreeLevel, editingData.degreeName),
      specialization: showSpecialization(editingData.degreeLevel) ? editingData.specialization : '',
      countryAndState: editingData.country && editingData.state
        ? `${editingData.country}, ${editingData.state}`
        : editingData.countryAndState || `${editingData.country || ''}${editingData.state ? `, ${editingData.state}` : ''}`
    };

    let newData = [...data];
    
    if (editingIndex === -1) {
      // Adding new qualification
      newData.unshift(normalizedData);
    } else if (editingIndex !== null && editingIndex >= 0) {
      // Editing existing qualification
      newData[editingIndex] = normalizedData;
    }

    // Sort the array by yearOfPassing descending (latest year at the top)
    newData.sort((a, b) => {
      const yearA = parseInt(a.yearOfPassing) || 0;
      const yearB = parseInt(b.yearOfPassing) || 0;
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

  const addNewQualification = () => {
    // Don't add empty qualification - just open edit mode with empty data
    setEditingIndex(-1);
    setEditingData({ ...EMPTY });
  };

  const removeQualification = (index: number) => {
    onChange(data.filter((_, j) => j !== index));
  };

  const updateEditingData = (key: string, value: string) => {
    setEditingData((prev: any) => ({ ...prev, [key]: value }));
  };

  const renderQualificationFormFields = () => {
    const level = editingData.degreeLevel || '';
    const showSpec = showSpecialization(level);
    const showName = showDegreeName(level);

    return (
      <>
        <div className={showName ? 'form-row form-row-3' : 'form-row form-row-1'}>
          {fg('Qualification Level *', <CustomSelect
            value={editingData.degreeLevel}
            onChange={(v: string) => updateEditingData('degreeLevel', v)}
            options={QUALIFICATION_LEVELS}
          />)}
          {showName && fg('Degree / Qualification Name', inp(editingData.degreeName, v => updateEditingData('degreeName', v), 'e.g., B.Sc / M.Tech'))}
          {showSpec && fg('Specialization / Subject', inp(editingData.specialization, v => updateEditingData('specialization', v), 'e.g., Computer Science'))}
        </div>

        <div className="form-row form-row-2">
          {fg('Institution / University Name', inp(editingData.institution, v => updateEditingData('institution', v)))}
          {fg('Board / University', <CustomSelect
            value={editingData.university}
            onChange={(v: string) => updateEditingData('university', v)}
            options={getBoardUniversityOptions(level)}
            placeholder="Select Board / University"
          />)}
        </div>

        <div className="form-row form-row-4">
          {fg('Year of Passing', <CustomSelect
            value={editingData.yearOfPassing}
            onChange={(v: string) => updateEditingData('yearOfPassing', v)}
            options={YEAR_OPTIONS}
            placeholder="Select Year"
          />)}
          {fg('Percentage / CGPA', inp(editingData.percentageCGPA, v => updateEditingData('percentageCGPA', v), '85% / 8.5'))}
          {fg('Division', <CustomSelect
            value={editingData.division}
            onChange={(v: string) => updateEditingData('division', v)}
            options={DIVISION_OPTIONS}
          />)}
          {fg('Mode', <CustomSelect
            value={editingData.mode}
            onChange={(v: string) => updateEditingData('mode', v)}
            options={MODE_OPTIONS}
          />)}
        </div>

        <div className="form-row form-row-2">
          {fg('Country', <CustomSelect
            value={editingData.country}
            onChange={(v: string) => updateEditingData('country', v)}
            options={COUNTRY_OPTIONS}
            placeholder="Select Country"
          />)}
          {fg('State', <CustomSelect
            value={editingData.state}
            onChange={(v: string) => updateEditingData('state', v)}
            options={editingData.country === 'India' ? STATE_OPTIONS_INDIA : STATE_OPTIONS_OTHER}
            placeholder="Select State"
          />)}
        </div>
      </>
    );
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
          <Plus size={16} /> Add Qualification
        </button>
      </div>

      {editingIndex === -1 ? (
        <div key="new" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={20} color="#4f46e5" /> Add New Qualification
              </h3>
              <div>
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: '#fecdd3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    marginRight: '8px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} /> Save
                </button>
              </div>
            </div>

            {renderQualificationFormFields()}
          </>
        </div>
      ) : (
        sortedData.map((q, i) => (
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
                      padding: '8px 16px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      backgroundColor: '#fecdd3',
                      color: '#9f1239',
                      border: 'none',
                      borderRadius: '8px',
                      marginRight: '8px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Check size={16} /> Save
                  </button>
                </div>
              </div>

              {renderQualificationFormFields()}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleCard(i)}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                      {q.degreeName || q.degreeLevel || `Qualification ${i + 1}`}
                      {q.yearOfPassing && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>({q.yearOfPassing})</span>}
                    </h3>
                    {(q.degreeLevel && q.degreeName && q.degreeLevel !== q.degreeName) && (
                      <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                        Level: {q.degreeLevel}
                      </div>
                    )}
                    {q.specialization && (
                      <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, marginTop: '2px' }}>
                        Specialization: {q.specialization}
                      </div>
                    )}
                  </div>
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
                      backgroundColor: '#fecdd3',
                      color: '#9f1239',
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
                  {renderPreview('Qualification Level', q.degreeLevel)}
                  {renderPreview('Degree / Qualification Name', q.degreeName)}
                  {renderPreview('Specialization / Subject', q.specialization)}
                  {renderPreview('Institution / University Name', q.institution)}
                  {renderPreview('Board / University', q.university)}
                  {renderPreview('Year of Passing', q.yearOfPassing)}
                  {renderPreview('Percentage / CGPA', q.percentageCGPA)}
                  {renderPreview('Division', q.division)}
                  {renderPreview('Mode', q.mode)}
                  {renderPreview('Country', q.country)}
                  {renderPreview('State', q.state)}
                </div>
              )}
            </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
