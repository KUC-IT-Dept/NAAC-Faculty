import { Plus, Trash2 } from 'lucide-react';
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
  gradeType: ''
};

export default function Qualifications({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>(EMPTY);

  const upd = (i: number, k: string, v: string) => { 
    const a = [...data]; 
    a[i] = { ...a[i], [k]: v }; 
    onChange(a); 
  };

  // Custom select with add option
  const CustomSelect = ({ value, onChange, options, placeholder = "— Select —" }) => {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customValue, setCustomValue] = useState('');

    const handleSelectChange = (newValue) => {
      if (newValue === 'Other') {
        setShowCustomInput(true);
      } else {
        onChange(newValue);
      }
    };

    const handleCustomAdd = () => {
      if (customValue.trim()) {
        onChange(customValue.trim());
        setCustomValue('');
        setShowCustomInput(false);
      }
    };

    return (
      <div>
        {showCustomInput ? (
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              className="form-input"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="Enter custom value"
              autoFocus
            />
            <button 
              type="button"
              onClick={handleCustomAdd}
              style={{ padding: '0 8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              Add
            </button>
            <button 
              type="button"
              onClick={() => setShowCustomInput(false)}
              style={{ padding: '0 8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              X
            </button>
          </div>
        ) : (
          <select 
            className="form-select" 
            value={value || ''} 
            onChange={(e) => handleSelectChange(e.target.value)}
          >
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="Other">Other</option>
          </select>
        )}
      </div>
    );
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingData({ ...data[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const newData = [...data];
      newData[editingIndex] = { ...editingData };
      onChange(newData);
      setEditingIndex(null);
      setEditingData(EMPTY);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingData(EMPTY);
  };

  const addNewQualification = () => {
    onChange([{ ...EMPTY }, ...data]);
  };

  const removeQualification = (index: number) => {
    onChange(data.filter((_, j) => j !== index));
  };

  const updateEditingData = (key: string, value: string) => {
    setEditingData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: '16px' }}>
        <button 
          type="button"
          onClick={addNewQualification}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          <Plus size={14} /> Add Qualification
        </button>
      </div>

      {data.map((q, i) => (
        <div key={i} className="list-item-card">
          {editingIndex === i ? (
            <>
              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <button 
                  type="button"
                  onClick={saveEdit}
                  style={{
                    padding: '6px 12px',
                    marginRight: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Save
                </button>
                <button 
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Cancel
                </button>
              </div>

              <div className="form-row form-row-3">
                {fg('Degree Level *', <CustomSelect 
                  value={editingData.degreeLevel} 
                  onChange={v => updateEditingData('degreeLevel', v)} 
                  options={['SSLC', 'Plus Two', 'Diploma', 'Bachelor Degree', 'Master Degree', 'M.Phil', 'Ph.D', 'Certification']} 
                />)}
                {fg('Degree / Certificate Name', inp(editingData.degreeName, v => updateEditingData('degreeName', v), 'B.Sc / M.Tech / Ph.D'))}
                {fg('Specialization / Subject', <CustomSelect 
                  value={editingData.specialization} 
                  onChange={v => updateEditingData('specialization', v)} 
                  options={['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Commerce', 'Economics', 'Management', 'Arts', 'Other']} 
                />)}
              </div>
              <div className="form-row form-row-2">
                {fg('College / Institution', inp(editingData.institution, v => updateEditingData('institution', v)))}
                {fg('University / Board', inp(editingData.university, v => updateEditingData('university', v)))}
              </div>
              <div className="form-row form-row-4">
                {fg('Year of Passing', inp(editingData.yearOfPassing, v => updateEditingData('yearOfPassing', v), '2015'))}
                {fg('% / CGPA / Grade', inp(editingData.percentageCGPA, v => updateEditingData('percentageCGPA', v), '85% / 8.5'))}
                {fg('Division / Class', <CustomSelect 
                  value={editingData.division} 
                  onChange={v => updateEditingData('division', v)} 
                  options={['Distinction', 'First', 'Second', 'Third', 'Pass']} 
                />)}
                {fg('Study Mode', <CustomSelect 
                  value={editingData.mode} 
                  onChange={v => updateEditingData('mode', v)} 
                  options={['Regular', 'Distance', 'Part-Time', 'Correspondence']} 
                />)}
              </div>
              <div className="form-row form-row-2">
                {fg('Grade Type', <CustomSelect 
                  value={editingData.gradeType} 
                  onChange={v => updateEditingData('gradeType', v)} 
                  options={['Percentage', 'CGPA', 'Grade', 'GPA']} 
                />)}
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <button 
                  type="button"
                  onClick={() => startEdit(i)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Edit
                </button>
                <button 
                  type="button" 
                  className="list-item-remove" 
                  onClick={() => removeQualification(i)}
                  style={{ marginLeft: '8px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <Sub>Qualification {i + 1}</Sub>
              <div className="form-row form-row-3" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Degree Level:</strong> {q.degreeLevel || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Degree / Certificate Name:</strong> {q.degreeName || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Specialization / Subject:</strong> {q.specialization || 'Not specified'}
                </div>
              </div>
              <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>College / Institution:</strong> {q.institution || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>University / Board:</strong> {q.university || 'Not specified'}
                </div>
              </div>
              <div className="form-row form-row-4" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Year of Passing:</strong> {q.yearOfPassing || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>% / CGPA / Grade:</strong> {q.percentageCGPA || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Division / Class:</strong> {q.division || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Study Mode:</strong> {q.mode || 'Not specified'}
                </div>
              </div>
              <div className="form-row form-row-2">
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Grade Type:</strong> {q.gradeType || 'Not specified'}
                </div>
                <div></div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
