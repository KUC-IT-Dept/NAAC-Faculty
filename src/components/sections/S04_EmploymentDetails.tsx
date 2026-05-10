import { fg, inp, dateInp } from './sectionUtils';
import { useState } from 'react';
import { Edit2, Briefcase, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>(EMPTY);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // Convert object to array for internal use
  const dataArray = Array.isArray(data) ? data : [];

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingData(index === -1 ? { ...EMPTY } : { ...dataArray[index] });
  };

  const saveEdit = () => {
    // Check if any data has been entered
    const hasData = Object.values(editingData).some(value => 
      value !== '' && value !== null && value !== undefined && value !== 0
    );
    
    if (!hasData) {
      alert('Please enter some data before saving.');
      return;
    }
    
    const newData = [...dataArray];
    if (editingIndex === -1) {
      // Add new entry
      newData.push(editingData);
    } else if (editingIndex !== null) {
      // Update existing entry
      newData[editingIndex] = editingData;
    }
    
    // Sort by date of joining descending (latest first)
    newData.sort((a, b) => {
      const dateA = new Date(a.dateOfJoining || '1900-01-01').getTime();
      const dateB = new Date(b.dateOfJoining || '1900-01-01').getTime();
      return dateB - dateA;
    });
    
    onChange(newData);
    setEditingIndex(null);
    setEditingData(EMPTY);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingData(EMPTY);
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

  const removeEntry = (index: number) => {
    onChange(dataArray.filter((_, i) => i !== index));
  };

  const addNewEntry = () => {
    setEditingIndex(-1);
    setEditingData({ ...EMPTY });
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
          onClick={addNewEntry}
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
          <Plus size={16} /> Add Employment
        </button>
      </div>

      {editingIndex === -1 ? (
        <div key="new" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={20} color="#4f46e5" /> Add Employment Details
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
                  Save
                </button>
              </div>
            </div>

            <div className="form-row form-row-2">
              {fg('Employee ID / Staff Code', inp(editingData.employeeId, v => updateEditingData('employeeId', v)))}
              {fg('Designation *', <CustomSelect
                value={editingData.designation}
                onChange={(v: string) => updateEditingData('designation', v)}
                options={['Assistant Professor', 'Associate Professor', 'Professor']}
              />)}
            </div>
            <div className="form-row form-row-1">
              {fg('Number of Promotions', <CustomSelect
                value={editingData.numberOfPromotions}
                onChange={(v: string) => updateEditingData('numberOfPromotions', v)}
                options={['0', '1', '2', '3', '4', '5']}
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

            <div className="form-row form-row-3">
              {fg('Nature of Appointment', <CustomSelect
                value={editingData.natureOfAppointment}
                onChange={(v: string) => updateEditingData('natureOfAppointment', v)}
                options={['Regular', 'Contract', 'Guest', 'Adjunct', 'Visiting', 'Assistant Professor', 'Associate Professor', 'Professor', 'Senior Professor']}
              />)}
              {fg('Date of Joining (current institution)', dateInp(editingData.dateOfJoining, v => updateEditingData('dateOfJoining', v)))}
              {fg('Date of Confirmation / Regularization', dateInp(editingData.dateOfConfirmation, v => updateEditingData('dateOfConfirmation', v)))}
            </div>
            <div className="form-row form-row-1">
              {fg('Pay Band / Pay Scale / CTC', inp(editingData.payBand, v => updateEditingData('payBand', v)))}
            </div>

            <div className="form-row form-row-3">
              {fg('Bank Account Details (for salary)', inp(editingData.bankAccountDetails, v => updateEditingData('bankAccountDetails', v)))}
              {fg('Provident Fund (PF) Number', inp(editingData.pfNumber, v => updateEditingData('pfNumber', v)))}
              {fg('Service Book Number', inp(editingData.serviceBookNumber, v => updateEditingData('serviceBookNumber', v)))}
            </div>

            {editingData.numberOfPromotions >= 1 && (
              <div className="form-row form-row-3">
                {fg('Date of First promotion', dateInp(editingData.dateOfFirstPromotion, v => updateEditingData('dateOfFirstPromotion', v)))}
                {fg('Nature of Appointment', <CustomSelect
                  value={editingData.natureOfAppointment1}
                  onChange={(v: string) => updateEditingData('natureOfAppointment1', v)}
                  options={['Regular', 'Contract', 'Guest', 'Adjunct', 'Visiting', 'Assistant Professor', 'Associate Professor', 'Professor', 'Senior Professor']}
                />)}
                {fg('New Pay Band / Pay Scale', inp(editingData.newPayBand1, v => updateEditingData('newPayBand1', v)))}
              </div>
            )}

            {editingData.numberOfPromotions >= 2 && (
              <div className="form-row form-row-3">
                {fg('Date of Second promotion', dateInp(editingData.dateOfSecondPromotion, v => updateEditingData('dateOfSecondPromotion', v)))}
                {fg('Nature of Appointment', <CustomSelect
                  value={editingData.natureOfAppointment2}
                  onChange={(v: string) => updateEditingData('natureOfAppointment2', v)}
                  options={['Regular', 'Contract', 'Guest', 'Adjunct', 'Visiting', 'Assistant Professor', 'Associate Professor', 'Professor', 'Senior Professor']}
                />)}
                {fg('New Pay Band / Pay Scale', inp(editingData.newPayBand2, v => updateEditingData('newPayBand2', v)))}
              </div>
            )}

            {editingData.numberOfPromotions >= 3 && (
              <div className="form-row form-row-3">
                {fg('Date of Third promotion', dateInp(editingData.dateOfThirdPromotion, v => updateEditingData('dateOfThirdPromotion', v)))}
                {fg('Nature of Appointment', <CustomSelect
                  value={editingData.natureOfAppointment3}
                  onChange={(v: string) => updateEditingData('natureOfAppointment3', v)}
                  options={['Regular', 'Contract', 'Guest', 'Adjunct', 'Visiting', 'Assistant Professor', 'Associate Professor', 'Professor', 'Senior Professor']}
                />)}
                {fg('New Pay Band / Pay Scale', inp(editingData.newPayBand3, v => updateEditingData('newPayBand3', v)))}
              </div>
            )}
          </>
        </div>
      ) : (
        dataArray.map((e, i) => (
          <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            {editingIndex === i ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={20} color="#111827" /> Edit Employment Details
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
                      Save
                    </button>
                  </div>
                </div>

                <div className="form-row form-row-2">
                  {fg('Year *', inp(editingData.year, v => updateEditingData('year', v), 'e.g., 2020'))}
                  {fg('Designation *', <CustomSelect
                    value={editingData.designation}
                    onChange={(v: string) => updateEditingData('designation', v)}
                    options={['Assistant Professor', 'Associate Professor', 'Professor']}
                  />)}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleCard(i)}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                          {e.designation || `Employment ${i + 1}`}
                          {e.dateOfJoining && <span style={{ marginLeft: '8px', color: '#64748b', fontWeight: 500, fontSize: '14px' }}>({e.dateOfJoining})</span>}
                        </h3>
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
                      onClick={() => removeEntry(i)}
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
                    {renderPreview('Employee ID / Staff Code', e.employeeId)}
                    {renderPreview('Designation', e.designation)}
                    {renderPreview('Department', e.department)}
                    {renderPreview('College / Institution Name', e.institution)}
                    {renderPreview('University Affiliated to', e.affiliatedUniversity)}
                    {renderPreview('Type of Institution', e.typeOfInstitution)}
                    {renderPreview('Nature of Appointment', e.natureOfAppointment)}
                    {renderPreview('Date of Joining', e.dateOfJoining)}
                    {renderPreview('Date of Confirmation', e.dateOfConfirmation)}
                    {renderPreview('Pay Band / Pay Scale / CTC', e.payBand)}
                    {renderPreview('Bank Account Details', e.bankAccountDetails)}
                    {renderPreview('Provident Fund (PF) Number', e.pfNumber)}
                    {renderPreview('Service Book Number', e.serviceBookNumber)}
                    {e.numberOfPromotions >= 1 && renderPreview('Date of First promotion', e.dateOfFirstPromotion)}
                    {e.numberOfPromotions >= 1 && renderPreview('First promotion Nature of Appointment', e.natureOfAppointment1)}
                    {e.numberOfPromotions >= 1 && renderPreview('First promotion New Pay Band', e.newPayBand1)}
                    {e.numberOfPromotions >= 2 && renderPreview('Date of Second promotion', e.dateOfSecondPromotion)}
                    {e.numberOfPromotions >= 2 && renderPreview('Second promotion Nature of Appointment', e.natureOfAppointment2)}
                    {e.numberOfPromotions >= 2 && renderPreview('Second promotion New Pay Band', e.newPayBand2)}
                    {e.numberOfPromotions >= 3 && renderPreview('Date of Third promotion', e.dateOfThirdPromotion)}
                    {e.numberOfPromotions >= 3 && renderPreview('Third promotion Nature of Appointment', e.natureOfAppointment3)}
                    {e.numberOfPromotions >= 3 && renderPreview('Third promotion New Pay Band', e.newPayBand3)}
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
