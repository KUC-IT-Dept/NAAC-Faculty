import { fg, inp, sel, dateInp, Sub } from './sectionUtils';
import { useState, useEffect } from 'react';

const EMPTY = { 
  employeeId: '', 
  designation: '', 
  department: '', 
  institution: '', 
  affiliatedUniversity: '', 
  dateOfAppointment: '', 
  natureOfAppointment: '', 
  approvalOfAppointment: '', 
  approvalLetterNo: '', 
  approvalLetterDate: '', 
  scaleOfPay: '', 
  currentBasicPay: '', 
  dateOfRetirement: '', 
  totalExperienceYears: '', 
  totalExperienceMonths: ''
};

// Custom select with add option
const CustomSelect = ({ value, onChange, options, placeholder = "— Select —" }: any) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleSelectChange = (newValue: string) => {
    if (newValue === '__ADD_CUSTOM__') {
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
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
          <option value="__ADD_CUSTOM__">+ Add Custom Option</option>
        </select>
      )}
    </div>
  );
};

export default function EmploymentDetails({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<any>(EMPTY);

  const s = (k: string, v: string) => onChange({ ...data, [k]: v });

  // Force preview mode on mount
  useEffect(() => {
    setIsEditing(false);
  }, []);

  
  const startEdit = () => {
    setIsEditing(true);
    setEditingData({ ...data });
  };

  const saveEdit = () => {
    const newData = { ...editingData };
    onChange(newData);
    setIsEditing(false);
    setEditingData(EMPTY);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingData(EMPTY);
  };

  const updateEditingData = (key: string, value: string) => {
    setEditingData((prev: any) => ({ ...prev, [key]: value }));
  };

  // Preview display helper
  const renderPreview = (label: string, value: string) => (
    <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
      <strong style={{ display: 'block', marginBottom: '4px' }}>{label}:</strong> {value || 'Not specified'}
    </div>
  );

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: '16px' }}>
        {isEditing ? (
          <>
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
          </>
        ) : (
          <button 
            type="button"
            onClick={() => startEdit()}
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
        )}
      </div>

      <Sub>Current Position</Sub>
      {isEditing ? (
        <div className="form-row form-row-2">
          {fg('Employee ID / Staff Code', inp(editingData.employeeId, v => updateEditingData('employeeId', v)))}
          {fg('Designation *', <CustomSelect 
            value={editingData.designation} 
            onChange={(v: string) => updateEditingData('designation', v)} 
            options={['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Dean', 'Director']} 
          />)}
        </div>
      ) : (
        <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
          {renderPreview('Employee ID / Staff Code', data.employeeId)}
          {renderPreview('Designation', data.designation)}
        </div>
      )}

      {isEditing ? (
        <div className="form-row form-row-2">
          {fg('Department *', <CustomSelect 
            value={editingData.department} 
            onChange={(v: string) => updateEditingData('department', v)} 
            options={['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Commerce', 'Economics', 'Management', 'Arts']} 
          />)}
          {fg('Institution / College Name *', inp(editingData.institution, v => updateEditingData('institution', v)))}
        </div>
      ) : (
        <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
          {renderPreview('Department', data.department)}
          {renderPreview('Institution / College Name', data.institution)}
        </div>
      )}
      
      {isEditing ? (
        fg('Affiliated University', inp(editingData.affiliatedUniversity, v => updateEditingData('affiliatedUniversity', v)))
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {renderPreview('Affiliated University', data.affiliatedUniversity)}
        </div>
      )}

      <Sub>Appointment Details</Sub>
      {isEditing ? (
        <div className="form-row form-row-3">
          {fg('Date of Appointment', dateInp(editingData.dateOfAppointment, v => updateEditingData('dateOfAppointment', v)))}
          {fg('Nature of Appointment', <CustomSelect 
            value={editingData.natureOfAppointment} 
            onChange={(v: string) => updateEditingData('natureOfAppointment', v)} 
            options={['Regular / Permanent', 'Ad-hoc', 'Contract', 'Guest / Visiting', 'Deputation', 'On Probation']} 
          />)}
          {fg('Approval Status', <CustomSelect 
            value={editingData.approvalOfAppointment} 
            onChange={(v: string) => updateEditingData('approvalOfAppointment', v)} 
            options={['Approved', 'Pending', 'Not Applicable']} 
          />)}
        </div>
      ) : (
        <div className="form-row form-row-3" style={{ marginBottom: '16px' }}>
          {renderPreview('Date of Appointment', data.dateOfAppointment)}
          {renderPreview('Nature of Appointment', data.natureOfAppointment)}
          {renderPreview('Approval Status', data.approvalOfAppointment)}
        </div>
      )}
      
      {isEditing ? (
        <div className="form-row form-row-2">
          {fg('Approval Letter No.', inp(editingData.approvalLetterNo, v => updateEditingData('approvalLetterNo', v)))}
          {fg('Approval Letter Date', dateInp(editingData.approvalLetterDate, v => updateEditingData('approvalLetterDate', v)))}
        </div>
      ) : (
        <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
          {renderPreview('Approval Letter No.', data.approvalLetterNo)}
          {renderPreview('Approval Letter Date', data.approvalLetterDate)}
        </div>
      )}

      <Sub>Pay Details</Sub>
      {isEditing ? (
        <div className="form-row form-row-3">
          {fg('Pay Scale / Band', <CustomSelect 
            value={editingData.scaleOfPay} 
            onChange={(v: string) => updateEditingData('scaleOfPay', v)} 
            options={['Level-1', 'Level-2', 'Level-3', 'Level-4', 'Level-5', 'Level-6', 'Level-7', 'Level-8', 'Level-9', 'Level-10', 'AGP 8000']} 
          />)}
          {fg('Current Basic Pay (₹)', inp(editingData.currentBasicPay, v => updateEditingData('currentBasicPay', v)))}
          {fg('Date of Superannuation', dateInp(editingData.dateOfRetirement, v => updateEditingData('dateOfRetirement', v)))}
        </div>
      ) : (
        <div className="form-row form-row-3" style={{ marginBottom: '16px' }}>
          {renderPreview('Pay Scale / Band', data.scaleOfPay)}
          {renderPreview('Current Basic Pay (₹)', data.currentBasicPay)}
          {renderPreview('Date of Superannuation', data.dateOfRetirement)}
        </div>
      )}

      <Sub>Total Experience at Current Institution</Sub>
      {isEditing ? (
        <div className="form-row form-row-2">
          {fg('Years', inp(editingData.totalExperienceYears, v => updateEditingData('totalExperienceYears', v)))}
          {fg('Months', inp(editingData.totalExperienceMonths, v => updateEditingData('totalExperienceMonths', v)))}
        </div>
      ) : (
        <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
          {renderPreview('Years', data.totalExperienceYears)}
          {renderPreview('Months', data.totalExperienceMonths)}
        </div>
      )}
    </div>
  );
}
