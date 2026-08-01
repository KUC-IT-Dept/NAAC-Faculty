import { fg, inp, dateInp, FileInp, sel, DocumentPreviewLink } from './sectionUtils';
import { useState } from 'react';
import { Briefcase, Plus, ChevronDown, ChevronUp, Trash2, Check, X, Edit2, ExternalLink } from 'lucide-react';
import { departmentOptions, affiliatedUniversityOptions, designationPostOptions, institutionTypeWorkOptions, natureOfAppointmentOptions, reasonForLeavingOptions, institutionsOptions } from '../../shared/dropdownOptions';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import { useConfirmSave } from '../useConfirmSave';
import { useConfirmDelete } from '../useConfirmDelete';


import SearchableSelect from '../SearchableSelect';

const EMPTY = {
  employeeId: '',
  designation: '',
  department: '',
  institution: '',
  affiliatedUniversity: '',
  typeOfInstitution: '',
  natureOfAppointment: '',
  from: '',
  to: '',
  reasonForLeaving: '',
  documentUrl: '',
};

interface WorkExperienceEntry {
  employeeId?: string;
  designation?: string;
  department?: string;
  institution?: string;
  affiliatedUniversity?: string;
  typeOfInstitution?: string;
  natureOfAppointment?: string;
  from?: string;
  to?: string;
  reasonForLeaving?: string;
  documentUrl?: string;
  dateOfJoining?: string;
  dateOfConfirmation?: string;
}

const CustomSelect = ({ value, onChange, options, placeholder = '— Select —' }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) => sel(value, onChange, options, placeholder);

const getDurationText = (from: string, to?: string) => {
  if (!from) return '—';
  const start = new Date(from);
  if (isNaN(start.getTime())) return '—';

  const end = to ? new Date(to) : new Date();
  if (isNaN(end.getTime()) || end < start) return '—';

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} Year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`);
  if (years === 0 && months === 0) {
    if (days > 0) parts.push(`${days} Day${days > 1 ? 's' : ''}`);
    else return '0 Days';
  }

  const durationStr = parts.join(', ');
  return to ? durationStr : `${durationStr} (to Present)`;
};

export default function WorkExperience({ data, onChange }: { data: WorkExperienceEntry[]; onChange: (d: WorkExperienceEntry[]) => void }) {
  const { confirmSave, ConfirmDialog } = useConfirmSave();
  const { confirmDelete, ConfirmDialog: ConfirmDeleteDialog } = useConfirmDelete();
  const dynamicDepartmentOptions = useDropdownOptions(departmentOptions);
  const dynamicAffiliatedUniversityOptions = useDropdownOptions(affiliatedUniversityOptions);
  const dynamicDesignationPostOptions = useDropdownOptions(designationPostOptions);
  const dynamicInstitutionTypeWorkOptions = useDropdownOptions(institutionTypeWorkOptions);
  const dynamicNatureOfAppointmentOptions = useDropdownOptions(natureOfAppointmentOptions);
  const dynamicReasonForLeavingOptions = useDropdownOptions(reasonForLeavingOptions);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<WorkExperienceEntry>(EMPTY);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const institutionsOpts = useDropdownOptions(institutionsOptions);

  const dataArray = (Array.isArray(data) ? data : []).filter(Boolean);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    const base = index === -1 ? { ...EMPTY } : { ...dataArray[index] };
    if (base.dateOfJoining && !base.from) base.from = base.dateOfJoining;
    if (base.dateOfConfirmation && !base.to) base.to = base.dateOfConfirmation;
    setEditingData({ ...base });
  };

  const saveEdit = () => {
    const keysToCheck: (keyof WorkExperienceEntry)[] = [
      'employeeId', 'designation', 'department', 'institution',
      'affiliatedUniversity', 'typeOfInstitution', 'natureOfAppointment',
      'from', 'to',
      'reasonForLeaving', 'documentUrl'
    ];
    const hasAnyData = keysToCheck.some(key => {
      const val = editingData[key];
      return val && typeof val === 'string' && val.trim() !== '';
    });

    if (!hasAnyData) {
      alert('Please fill in at least one field to save.');
      return;
    }

    const newData = [...dataArray];
    if (editingIndex === -1) {
      newData.push({ ...editingData });
    } else if (editingIndex !== null) {
      newData[editingIndex] = { ...editingData };
    }

    // Sort by from descending
    newData.sort((a, b) => {
      const dateA = new Date(a.from || '1900-01-01').getTime();
      const dateB = new Date(b.from || '1900-01-01').getTime();
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

  const updateField = (key: keyof WorkExperienceEntry, value: string) => {
    setEditingData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const s = new Set(prev);
      if (s.has(index)) {
        s.delete(index);
      } else {
        s.add(index);
      }
      return s;
    });
  };

  const removeEntry = (index: number) => {
    onChange(dataArray.filter((_: unknown, i: number) => i !== index));
  };

  const renderPreview = (label: string, value: string | undefined | null) => (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#7c8b9d', fontWeight: 600, fontSize: '14px', width: '250px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#1f2937', fontSize: '14px', fontWeight: 500 }}>{value || '-'}</span>
    </div>
  );

  const renderFormFields = () => (
    <>
      <div className="form-row form-row-2">
        {fg('College / Institution Name', <SearchableSelect value={editingData.institution || ''} onChange={(v: string) => updateField('institution', v)} options={institutionsOpts} placeholder="Search or Enter Institution" />)}
        {fg('Designation', <CustomSelect value={editingData.designation || ''} onChange={(v: string) => updateField('designation', v)} options={dynamicDesignationPostOptions} />)}
      </div>
      <div className="form-row form-row-2">
        {fg('Department', <CustomSelect value={editingData.department || ''} onChange={(v: string) => updateField('department', v)} options={dynamicDepartmentOptions} />)}
        {fg('Employee ID / Staff Code', inp(editingData.employeeId || '', v => updateField('employeeId', v)))}
      </div>
      <div className="form-row form-row-2">
        {fg('University Affiliated to', <CustomSelect value={editingData.affiliatedUniversity || ''} onChange={(v: string) => updateField('affiliatedUniversity', v)} options={dynamicAffiliatedUniversityOptions} />)}
        {fg('Type of Institution', <CustomSelect value={editingData.typeOfInstitution || ''} onChange={(v: string) => updateField('typeOfInstitution', v)} options={dynamicInstitutionTypeWorkOptions} />)}
      </div>
      <div className="form-row form-row-3">
        {fg('Nature of Appointment', <CustomSelect value={editingData.natureOfAppointment || ''} onChange={(v: string) => updateField('natureOfAppointment', v)} options={dynamicNatureOfAppointmentOptions} />)}
        {fg('From Date', dateInp(editingData.from || '', v => updateField('from', v)))}
        {fg('To Date', dateInp(editingData.to || '', v => updateField('to', v)))}
      </div>
      <div className="form-row form-row-1">
        {fg('Reason for Leaving', <CustomSelect value={editingData.reasonForLeaving || ''} onChange={(v: string) => updateField('reasonForLeaving', v)} options={dynamicReasonForLeavingOptions} />)}
      </div>
      <div className="form-group" style={{ marginTop: 15 }}>
        <label className="form-label" style={{ fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>
          Experience Document / Proof
        </label>
        <FileInp
          v={editingData.documentUrl || ''}
          fn={(v) => updateField('documentUrl', v)}
          section="workExperience"
          accept=".pdf,image/*"
        />
      </div>
    </>
  );

  return (
    <div>
      {/* ── Add button ── */}
      <div style={{ textAlign: 'right', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => startEdit(-1)}
          style={{
            padding: '8px 16px', fontSize: '14px', cursor: 'pointer',
            backgroundColor: '#4f46e5', color: 'white', border: 'none',
            borderRadius: '6px', display: 'inline-flex', alignItems: 'center',
            gap: '8px', fontWeight: 600
          }}
        >
          <Plus size={16} /> Add Work Experience
        </button>
      </div>

      {/* ── New entry form ── */}
      {editingIndex === -1 && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="#4f46e5" /> Add Work Experience
            </h3>
            <div>
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  padding: '7px 20px', fontSize: '14px', cursor: 'pointer',
                  backgroundColor: '#fff1f2', color: '#9f1239',
                  border: '1px solid #fecdd3', borderRadius: '8px',
                  marginRight: '8px', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmSave(saveEdit)}
                style={{
                  padding: '7px 20px', fontSize: '14px', cursor: 'pointer',
                  backgroundColor: '#16a34a', color: 'white', border: 'none',
                  borderRadius: '8px', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Check size={14} /> Save
              </button>
            </div>
          </div>
          {renderFormFields()}
        </div>
      )}

      {/* ── Empty state ── */}
      {dataArray.length === 0 && editingIndex !== -1 && (
        <div className="empty-state">
          No work experience added yet. Click <strong>Add Work Experience</strong> to get started.
        </div>
      )}

      {/* ── Saved entries ── */}
      {dataArray.map((e: WorkExperienceEntry, i: number) => (
        <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {editingIndex === i ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={20} color="#111827" /> Edit Work Experience
                </h3>
                <div>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      padding: '7px 20px', fontSize: '14px', cursor: 'pointer',
                      backgroundColor: '#fff1f2', color: '#9f1239',
                      border: '1px solid #fecdd3', borderRadius: '8px',
                      marginRight: '8px', fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    style={{
                      padding: '7px 20px', fontSize: '14px', cursor: 'pointer',
                      backgroundColor: '#16a34a', color: 'white', border: 'none',
                      borderRadius: '8px', fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              </div>
              {renderFormFields()}
            </>
          ) : (
            <>
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedCards.has(i) ? '16px' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }} onClick={() => toggleCard(i)}>
                  {/* Year badge */}
                  <div style={{ minWidth: 52, textAlign: 'center', padding: '6px 4px', borderRadius: '8px', background: '#2563eb', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                      {(() => {
                        const dateStr = e.from || e.dateOfJoining;
                        return dateStr ? new Date(dateStr).getFullYear() : '—';
                      })()}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year</div>
                  </div>
                  {/* Title */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                      {e.designation || `Work Experience ${i + 1}`}
                    </h3>
                    {e.institution && (
                      <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>{e.institution}</p>
                    )}
                    {(e.from || e.dateOfJoining) && (
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                        Duration: {getDurationText(e.from || e.dateOfJoining || '', e.to || e.dateOfConfirmation)}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => toggleCard(i)}
                    style={{
                      padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                      backgroundColor: expandedCards.has(i) ? '#eff6ff' : '#f1f5f9',
                      color: expandedCards.has(i) ? '#2563eb' : '#475569',
                      border: expandedCards.has(i) ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                      borderRadius: '6px', fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {expandedCards.has(i) ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> View</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    style={{
                      padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                      backgroundColor: '#f1f5f9', color: '#475569',
                      border: '1px solid #cbd5e1', borderRadius: '6px',
                      fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(() => removeEntry(i))}
                    style={{
                      padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                      backgroundColor: '#fff1f2', color: '#e11d48',
                      border: '1px solid #fecdd3', borderRadius: '6px',
                      fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>

              {/* Expanded preview */}
              {expandedCards.has(i) && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {renderPreview('College / Institution Name', e.institution)}
                  {renderPreview('Designation', e.designation)}
                  {renderPreview('Department', e.department)}
                  {renderPreview('Employee ID / Staff Code', e.employeeId)}
                  {renderPreview('University Affiliated to', e.affiliatedUniversity)}
                  {renderPreview('Type of Institution', e.typeOfInstitution)}
                  {renderPreview('Nature of Appointment', e.natureOfAppointment)}
                  {renderPreview('From Date', e.from || e.dateOfJoining)}
                  {renderPreview('To Date', e.to || e.dateOfConfirmation)}
                  {(e.from || e.dateOfJoining) && renderPreview('Calculated Duration', getDurationText(e.from || e.dateOfJoining || '', e.to || e.dateOfConfirmation))}
                  {renderPreview('Reason for Leaving', e.reasonForLeaving)}
                  {e.documentUrl && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#7c8b9d', fontWeight: 600, fontSize: '14px', width: '250px', flexShrink: 0 }}>Experience Document</span>
                      <DocumentPreviewLink url={e.documentUrl} label="View Document" />
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