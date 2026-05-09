import { fg, inp, dateInp, Sub } from './sectionUtils';
import { useState, useEffect } from 'react';
import { Edit2, Save, Briefcase, Plus } from 'lucide-react';

const EMPTY = {
  employeeId: '',
  designation: '',
  department: '',
  institution: '',
  affiliatedUniversity: '',
  typeOfInstitution: '',
  natureOfAppointment: '',
  dateOfJoining: '',
  dateOfConfirmation: '',
  payBand: '',
  bankAccountDetails: '',
  pfNumber: '',
  serviceBookNumber: '',
  dateOfFirstPromotion: '',
  natureOfAppointment1: '',
  newPayBand1: '',
  dateOfSecondPromotion: '',
  natureOfAppointment2: '',
  newPayBand2: '',
  dateOfThirdPromotion: '',
  natureOfAppointment3: '',
  newPayBand3: ''
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

export default function EmploymentDetails({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<any>(EMPTY);

  useEffect(() => {
    setIsEditing(false);
  }, []);

  const startEdit = () => {
    setIsEditing(true);
    setEditingData(data && Object.keys(data).length > 0 ? { ...data } : { ...EMPTY });
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

  const renderPreview = (label: string, value: any) => (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#7c8b9d', fontWeight: 600, fontSize: '14px', width: '250px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#1f2937', fontSize: '14px', fontWeight: 500 }}>{value || '-'}</span>
    </div>
  );

  const hasData = data && Object.values(data).some(v => v !== '' && v !== null && v !== undefined);

  if (!hasData && !isEditing) {
    return (
      <div style={{ textAlign: 'right', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={startEdit}
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
          <Plus size={16} /> Add Current Employment
        </button>
      </div>
    );
  }

  const natureOptions = ['Regular', 'Contract', 'Guest', 'Adjunct', 'Visiting', 'Assistant Professor', 'Associate Professor', 'Professor', 'Senior Professor'];

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>

      {isEditing ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <Briefcase size={22} color="#4f46e5" /> Edit Employment Details
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
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>

          <Sub>Current Position</Sub>
          <div className="form-row form-row-2">
            {fg('Employee ID / Staff Code', inp(editingData.employeeId, v => updateEditingData('employeeId', v)))}
            {fg('Designation *', <CustomSelect
              value={editingData.designation}
              onChange={(v: string) => updateEditingData('designation', v)}
              options={['Assistant Professor', 'Associate Professor', 'Professor']}
            />)}
          </div>
          <div className="form-row form-row-2">
            {fg('Department', inp(editingData.department, v => updateEditingData('department', v)))}
            {fg('College / Institution Name', inp(editingData.institution, v => updateEditingData('institution', v)))}
          </div>
          <div className="form-row form-row-2">
            {fg('University Affiliated to', inp(editingData.affiliatedUniversity, v => updateEditingData('affiliatedUniversity', v)))}
            {fg('Type of Institution', <CustomSelect
              value={editingData.typeOfInstitution}
              onChange={(v: string) => updateEditingData('typeOfInstitution', v)}
              options={['Government', 'Aided', 'Private', 'Deemed', 'Central University']}
            />)}
          </div>

          <Sub>Appointment & Pay Details</Sub>
          <div className="form-row form-row-3">
            {fg('Nature of Appointment', <CustomSelect
              value={editingData.natureOfAppointment}
              onChange={(v: string) => updateEditingData('natureOfAppointment', v)}
              options={natureOptions}
            />)}
            {fg('Date of Joining (current institution)', dateInp(editingData.dateOfJoining, v => updateEditingData('dateOfJoining', v)))}
            {fg('Date of Confirmation / Regularization', dateInp(editingData.dateOfConfirmation, v => updateEditingData('dateOfConfirmation', v)))}
          </div>
          <div className="form-row form-row-1">
            {fg('Pay Band / Pay Scale / CTC', inp(editingData.payBand, v => updateEditingData('payBand', v)))}
          </div>

          <Sub>Financial & Service Records</Sub>
          <div className="form-row form-row-3">
            {fg('Bank Account Details (for salary)', inp(editingData.bankAccountDetails, v => updateEditingData('bankAccountDetails', v)))}
            {fg('Provident Fund (PF) Number', inp(editingData.pfNumber, v => updateEditingData('pfNumber', v)))}
            {fg('Service Book Number', inp(editingData.serviceBookNumber, v => updateEditingData('serviceBookNumber', v)))}
          </div>

          <Sub>First Promotion</Sub>
          <div className="form-row form-row-3">
            {fg('Date of First promotion', dateInp(editingData.dateOfFirstPromotion, v => updateEditingData('dateOfFirstPromotion', v)))}
            {fg('Nature of Appointment', <CustomSelect
              value={editingData.natureOfAppointment1}
              onChange={(v: string) => updateEditingData('natureOfAppointment1', v)}
              options={natureOptions}
            />)}
            {fg('New Pay Band / Pay Scale', inp(editingData.newPayBand1, v => updateEditingData('newPayBand1', v)))}
          </div>

          <Sub>Second Promotion</Sub>
          <div className="form-row form-row-3">
            {fg('Date of Second promotion', dateInp(editingData.dateOfSecondPromotion, v => updateEditingData('dateOfSecondPromotion', v)))}
            {fg('Nature of Appointment', <CustomSelect
              value={editingData.natureOfAppointment2}
              onChange={(v: string) => updateEditingData('natureOfAppointment2', v)}
              options={natureOptions}
            />)}
            {fg('New Pay Band / Pay Scale', inp(editingData.newPayBand2, v => updateEditingData('newPayBand2', v)))}
          </div>

          <Sub>Third Promotion</Sub>
          <div className="form-row form-row-3">
            {fg('Date of Third promotion', dateInp(editingData.dateOfThirdPromotion, v => updateEditingData('dateOfThirdPromotion', v)))}
            {fg('Nature of Appointment', <CustomSelect
              value={editingData.natureOfAppointment3}
              onChange={(v: string) => updateEditingData('natureOfAppointment3', v)}
              options={natureOptions}
            />)}
            {fg('New Pay Band / Pay Scale', inp(editingData.newPayBand3, v => updateEditingData('newPayBand3', v)))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <Briefcase size={22} color="#4f46e5" /> Current Employment Details
            </h3>
            <button
              type="button"
              onClick={startEdit}
              style={{
                padding: '6px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Edit2 size={14} /> Edit
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {renderPreview('Employee ID / Staff Code', data.employeeId)}
            {renderPreview('Designation', data.designation)}
            {renderPreview('Department', data.department)}
            {renderPreview('College / Institution Name', data.institution)}
            {renderPreview('University Affiliated to', data.affiliatedUniversity)}
            {renderPreview('Type of Institution', data.typeOfInstitution)}
            {renderPreview('Nature of Appointment', data.natureOfAppointment)}
            {renderPreview('Date of Joining', data.dateOfJoining)}
            {renderPreview('Date of Confirmation', data.dateOfConfirmation)}
            {renderPreview('Pay Band / Pay Scale / CTC', data.payBand)}
            {renderPreview('Bank Account Details', data.bankAccountDetails)}
            {renderPreview('Provident Fund (PF) Number', data.pfNumber)}
            {renderPreview('Service Book Number', data.serviceBookNumber)}
            {renderPreview('Date of First promotion', data.dateOfFirstPromotion)}
            {renderPreview('First promotion Nature of Appointment', data.natureOfAppointment1)}
            {renderPreview('First promotion New Pay Band', data.newPayBand1)}
            {renderPreview('Date of Second promotion', data.dateOfSecondPromotion)}
            {renderPreview('Second promotion Nature of Appointment', data.natureOfAppointment2)}
            {renderPreview('Second promotion New Pay Band', data.newPayBand2)}
            {renderPreview('Date of Third promotion', data.dateOfThirdPromotion)}
            {renderPreview('Third promotion Nature of Appointment', data.natureOfAppointment3)}
            {renderPreview('Third promotion New Pay Band', data.newPayBand3)}
          </div>
        </>
      )}
    </div>
  );
}
