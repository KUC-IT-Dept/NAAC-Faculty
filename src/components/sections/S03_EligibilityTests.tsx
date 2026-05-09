import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { fg, inp, sel, Sub } from './sectionUtils';

const EMPTY = { examName: '', subject: '', year: '', certificateNo: '', score: '', state: '', validity: '' };

export default function EligibilityTests({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
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

  const addNewTest = () => {
    onChange([{ ...EMPTY }, ...data]);
  };

  const removeTest = (index: number) => {
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
          onClick={addNewTest}
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
          <Plus size={14} /> Add Test
        </button>
      </div>

      {data.map((e, i) => (
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
                {fg('Exam Name *', <CustomSelect 
                  value={editingData.examName} 
                  onChange={v => updateEditingData('examName', v)} 
                  options={['UGC-NET', 'UGC-JRF', 'SET / SLET', 'GATE', 'CSIR-NET', 'CSIR-JRF', 'Other']} 
                />)}
                {fg('Subject / Paper', inp(editingData.subject, v => updateEditingData('subject', v), 'Computer Science & Applications'))}
                {fg('Year of Qualification', inp(editingData.year, v => updateEditingData('year', v), '2020'))}
              </div>
              <div className="form-row form-row-4">
                {fg('Certificate / Roll No.', inp(editingData.certificateNo, v => updateEditingData('certificateNo', v)))}
                {fg('Score / Percentile', inp(editingData.score, v => updateEditingData('score', v)))}
                {fg('State (for SET/SLET)', <CustomSelect 
                  value={editingData.state} 
                  onChange={v => updateEditingData('state', v)} 
                  options={['Qualified', 'Not Qualified', 'Awaited']} 
                />)}
                {fg('Validity', <CustomSelect 
                  value={editingData.validity} 
                  onChange={v => updateEditingData('validity', v)} 
                  options={['Lifetime', '2026']} 
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
                  onClick={() => removeTest(i)}
                  style={{ marginLeft: '8px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <Sub>Eligibility Test {i + 1}</Sub>
              <div className="form-row form-row-3" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Exam Name:</strong> {e.examName || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Subject / Paper:</strong> {e.subject || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Year of Qualification:</strong> {e.year || 'Not specified'}
                </div>
              </div>
              <div className="form-row form-row-4" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Certificate / Roll No.:</strong> {e.certificateNo || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Score / Percentile:</strong> {e.score || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>State (for SET/SLET):</strong> {e.state || 'Not specified'}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Validity:</strong> {e.validity || 'Not specified'}
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
