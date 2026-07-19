import { fg } from './sectionUtils';
import { useState, useRef, useEffect } from 'react';
import { Edit2, Briefcase, Plus, Check, X, ExternalLink, FileText, Upload, RefreshCw } from 'lucide-react';
import { departmentOptions, affiliatedUniversityOptions, payScaleOptions, designationOptions, institutionTypeOptions, approvalStatusOptions, institutionsOptions } from '../../shared/dropdownOptions';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import SearchableSelect from '../SearchableSelect';
import api, { getAuthenticatedFileUrl } from '../../lib/api';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';

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
  approvalOfAppointment: '',
  payBand: '',
  pfNumber: '',
  serviceBookNumber: '',
  documentUrl: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: ''
};

const FIELD_DEFINITIONS = [
  { key: 'employeeId', required: true },
  { key: 'designation', required: true },
  { key: 'department', required: true },
  { key: 'institution', required: true },
  { key: 'natureOfAppointment', required: true },
  { key: 'dateOfJoining', required: true },
  { key: 'approvalOfAppointment', required: true }
];

const natureOfAppointmentOptionsCustom = [
  'Regular',
  'Contract',
  'Guest',
  'Adjunct',
  'Visiting',
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Senior Professor'
];

const parseBankDetails = (str: string) => {
  try {
    if (str && str.trim().startsWith('{') && str.trim().endsWith('}')) {
      const parsed = JSON.parse(str);
      return {
        bankName: parsed.bankName || '',
        accountNumber: parsed.accountNumber || '',
        ifscCode: parsed.ifscCode || '',
        branchName: parsed.branchName || ''
      };
    }
  } catch (e) {
    // Ignore and fallback
  }
  return {
    bankName: str || '',
    accountNumber: '',
    ifscCode: '',
    branchName: ''
  };
};

export default function EmploymentDetails({ data, onChange, onPersist }: { data: any; onChange: (d: any) => void; onPersist?: (updated: any) => void }) {
  const dynamicDepartmentOptions = useDropdownOptions(departmentOptions);
  const dynamicAffiliatedUniversityOptions = useDropdownOptions(affiliatedUniversityOptions);
  const dynamicPayScaleOptions = useDropdownOptions(payScaleOptions);
  const dynamicDesignationOptions = useDropdownOptions(designationOptions);
  const dynamicInstitutionTypeOptions = useDropdownOptions(institutionTypeOptions);
  const dynamicApprovalStatusOptions = useDropdownOptions(approvalStatusOptions);
  const institutionsOpts = useDropdownOptions(institutionsOptions);

  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<any>(EMPTY);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (data && typeof data === 'object' && data.employeeId) {
      const bankInfo = parseBankDetails(data.bankAccountDetails || '');
      setEditingData({
        ...EMPTY,
        ...data,
        bankName: data.bankName || bankInfo.bankName || '',
        accountNumber: data.accountNumber || bankInfo.accountNumber || '',
        ifscCode: data.ifscCode || bankInfo.ifscCode || '',
        branchName: data.branchName || bankInfo.branchName || '',
        documentUrl: data.documentUrl || ''
      });
      setHasSavedData(true);
      setIsEditing(false);
    } else {
      setEditingData(EMPTY);
      setHasSavedData(false);
      setIsEditing(false);
    }
    setErrors({});
    setTouchedFields({});
  }, [data]);

  const isFieldRequired = (key: string) => {
    return FIELD_DEFINITIONS.some(f => f.key === key && f.required);
  };

  const getFieldError = (key: string, value: any) => {
    if (!isFieldRequired(key)) return '';
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    return trimmedValue ? '' : 'This field is required.';
  };

  const markFieldTouched = (key: string) => {
    setTouchedFields((prev) => ({ ...prev, [key]: true }));
  };

  const updateEditingData = (key: string, value: string) => {
    markFieldTouched(key);
    setEditingData((prev: any) => {
      const nextValues = { ...prev, [key]: value };
      const nextError = getFieldError(key, value);
      setErrors((prevErrors) => {
        const updated = { ...prevErrors };
        if (nextError) updated[key] = nextError;
        else delete updated[key];
        return updated;
      });
      return nextValues;
    });
  };

  const focusFirstError = (fieldErrors: Record<string, string>) => {
    const firstInvalidKey = FIELD_DEFINITIONS.find((field) => fieldErrors[field.key])?.key;
    const target = firstInvalidKey ? fieldRefs.current[firstInvalidKey] : null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Original file size exceeds 25MB limit.');
      return;
    }

    setUploading(true);
    let finalFile: File | Blob = file;

    try {
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        finalFile = await imageCompression(file, options);
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
        finalFile = new Blob([pdfBytes], { type: 'application/pdf' });
      }
    } catch (err) {
      console.error('Compression failed:', err);
      finalFile = file;
    }

    if (finalFile.size > 10 * 1024 * 1024) {
      toast.error('Compressed file still exceeds 10MB limit. Please upload a smaller file.');
      setUploading(false);
      return;
    }

    const fd = new FormData();
    const uploadFile = new File([finalFile], file.name, { type: file.type });
    fd.append('file', uploadFile);
    try {
      const endpoint = '/upload?section=employmentDetails';
      const r = await api.post(endpoint, fd);
      updateEditingData('documentUrl', r.data.url);
      toast.success('File uploaded successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Upload failed. Please try again.';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveEdit = async () => {
    const nextErrors: Record<string, string> = {};
    FIELD_DEFINITIONS.forEach((field) => {
      const message = getFieldError(field.key, editingData[field.key]);
      if (message) nextErrors[field.key] = message;
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }

    const bankDetailsStr = JSON.stringify({
      bankName: (editingData.bankName || '').trim(),
      accountNumber: (editingData.accountNumber || '').trim(),
      ifscCode: (editingData.ifscCode || '').trim(),
      branchName: (editingData.branchName || '').trim()
    });

    const entryToSave = {
      ...editingData,
      bankAccountDetails: bankDetailsStr
    };

    delete entryToSave.bankName;
    delete entryToSave.accountNumber;
    delete entryToSave.ifscCode;
    delete entryToSave.branchName;

    onChange(entryToSave);
    if (onPersist) {
      await onPersist(entryToSave);
    }
    setIsEditing(false);
    setHasSavedData(true);
  };

  const cancelEdit = () => {
    if (data && typeof data === 'object' && data.employeeId) {
      const bankInfo = parseBankDetails(data.bankAccountDetails || '');
      setEditingData({
        ...EMPTY,
        ...data,
        bankName: data.bankName || bankInfo.bankName || '',
        accountNumber: data.accountNumber || bankInfo.accountNumber || '',
        ifscCode: data.ifscCode || bankInfo.ifscCode || '',
        branchName: data.branchName || bankInfo.branchName || '',
        documentUrl: data.documentUrl || ''
      });
      setIsEditing(false);
    } else {
      setEditingData(EMPTY);
      setIsEditing(false);
    }
    setErrors({});
    setTouchedFields({});
  };

  const startEditingForm = () => {
    setIsEditing(true);
  };

  const renderInput = (key: string, placeholder = "") => {
    return (
      <input
        ref={(el) => { fieldRefs.current[key] = el; }}
        className="form-input"
        value={editingData[key] || ''}
        onChange={e => updateEditingData(key, e.target.value)}
        placeholder={placeholder}
        disabled={!isEditing}
      />
    );
  };

  const renderDateInput = (key: string) => {
    return (
      <input
        ref={(el) => { fieldRefs.current[key] = el; }}
        className="form-input"
        type="date"
        value={editingData[key] || ''}
        onChange={e => updateEditingData(key, e.target.value)}
        disabled={!isEditing}
      />
    );
  };

  const renderSelect = (key: string, options: string[], placeholder = "— Select —") => {
    return (
      <select
        ref={(el) => { fieldRefs.current[key] = el; }}
        className="form-select"
        value={editingData[key] || ''}
        onChange={e => updateEditingData(key, e.target.value)}
        disabled={!isEditing}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  };

  const renderPreviewContent = (url: string) => {
    const fileUrl = getAuthenticatedFileUrl(url);
    const ext = url.split('.').pop()?.toLowerCase();
    
    if (ext === 'pdf') {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: '6px' }}
          title="PDF Preview"
        />
      );
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      return (
        <img
          src={fileUrl}
          alt="Preview"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
      );
    } else {
      return (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <FileText size={48} color="#64748b" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#1f2937', fontWeight: 500, marginBottom: '16px' }}>Preview not available for this file type ({ext?.toUpperCase()})</p>
          <a
            href={fileUrl}
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#4f46e5',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Download Document
          </a>
        </div>
      );
    }
  };

  return (
    <div>
      {!hasSavedData && !isEditing ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <button
            type="button"
            onClick={startEditingForm}
            style={{
              padding: '10px 20px',
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
            <Plus size={16} /> Add Current Employment Details
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="#4f46e5" /> Current Employment Details
            </h3>
            <div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={startEditingForm}
                  style={{
                    padding: '7px 20px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit2 size={14} /> Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      padding: '7px 20px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      backgroundColor: '#fff1f2',
                      color: '#9f1239',
                      border: '1px solid #fecdd3',
                      borderRadius: '8px',
                      marginRight: '8px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    style={{
                      padding: '7px 20px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Check size={14} /> Save
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="form-row form-row-2">
            {fg('Employee ID / Staff Code', renderInput('employeeId'), { required: isFieldRequired('employeeId'), error: errors.employeeId })}
            {fg('Designation', renderSelect('designation', dynamicDesignationOptions), { required: isFieldRequired('designation'), error: errors.designation })}
          </div>
          <div className="form-row form-row-2">
            {fg('Department', renderSelect('department', dynamicDepartmentOptions), { required: isFieldRequired('department'), error: errors.department })}
            {fg('College / Institution Name', !isEditing ? (
              <input className="form-input" value={editingData.institution || ''} disabled />
            ) : (
              <SearchableSelect
                value={editingData.institution || ''}
                onChange={(v: string) => updateEditingData('institution', v)}
                options={institutionsOpts}
                placeholder="Search or Enter Institution"
                inputRef={(el: HTMLDivElement | null) => { fieldRefs.current.institution = el as HTMLElement; }}
              />
            ), { required: isFieldRequired('institution'), error: errors.institution })}
          </div>
          <div className="form-row form-row-2">
            {fg('University Affiliated to', renderSelect('affiliatedUniversity', dynamicAffiliatedUniversityOptions), { required: isFieldRequired('affiliatedUniversity'), error: errors.affiliatedUniversity })}
            {fg('Type of Institution', renderSelect('typeOfInstitution', dynamicInstitutionTypeOptions), { required: isFieldRequired('typeOfInstitution'), error: errors.typeOfInstitution })}
          </div>

          <div className="form-row form-row-3">
            {fg('Nature of Appointment', renderSelect('natureOfAppointment', natureOfAppointmentOptionsCustom), { required: isFieldRequired('natureOfAppointment'), error: errors.natureOfAppointment })}
            {fg('Date of Joining (current institution)', renderDateInput('dateOfJoining'), { required: isFieldRequired('dateOfJoining'), error: errors.dateOfJoining })}
            {fg('Date of Confirmation / Regularization', renderDateInput('dateOfConfirmation'), { required: isFieldRequired('dateOfConfirmation'), error: errors.dateOfConfirmation })}
          </div>
          <div className="form-row form-row-2">
            {fg('Approval of Appointment', renderSelect('approvalOfAppointment', dynamicApprovalStatusOptions), { required: isFieldRequired('approvalOfAppointment'), error: errors.approvalOfAppointment })}
            {fg('Pay Band / Pay Scale / CTC', renderSelect('payBand', dynamicPayScaleOptions), { required: isFieldRequired('payBand'), error: errors.payBand })}
          </div>

          <div className="form-row form-row-2">
            {fg('Bank Name', renderInput('bankName'), { required: isFieldRequired('bankName'), error: errors.bankName })}
            {fg('Account Number', renderInput('accountNumber'), { required: isFieldRequired('accountNumber'), error: errors.accountNumber })}
          </div>
          <div className="form-row form-row-2">
            {fg('IFSC Code', renderInput('ifscCode'), { required: isFieldRequired('ifscCode'), error: errors.ifscCode })}
            {fg('Branch Name', renderInput('branchName'), { required: isFieldRequired('branchName'), error: errors.branchName })}
          </div>
          <div className="form-row form-row-2">
            {fg('Provident Fund (PF) Number', renderInput('pfNumber'), { required: isFieldRequired('pfNumber'), error: errors.pfNumber })}
            {fg('Service Book Number', renderInput('serviceBookNumber'), { required: isFieldRequired('serviceBookNumber'), error: errors.serviceBookNumber })}
          </div>

          <div className="form-group" style={{ marginTop: 15 }}>
            <label className={`form-label${errors.documentUrl ? ' invalid-label' : ''}`} style={{ fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>
              Experience Document / Proof
              {isFieldRequired('documentUrl') && <span className="required-star">*</span>}
            </label>
            <div className={`form-field-wrapper${errors.documentUrl ? ' invalid-field' : ''}`}>
              {editingData.documentUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#f0f9ff', border: '1px dashed #0ea5e9', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ backgroundColor: '#0ea5e9', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={18} color="white" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0369a1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {editingData.documentUrl.split('/').pop()}
                      </div>
                      <div style={{ fontSize: '11px', color: '#0ea5e9' }}>Ready to view</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button 
                      type="button" 
                      onClick={() => setPreviewUrl(editingData.documentUrl)}
                      title="View Document"
                      style={{ padding: '6px', backgroundColor: 'white', border: '1px solid #e0f2fe', borderRadius: '6px', cursor: 'pointer', color: '#0369a1', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                    >
                      <ExternalLink size={14} />
                    </button>
                    {isEditing && (
                      <button 
                        type="button" 
                        onClick={() => updateEditingData('documentUrl', '')}
                        title="Remove Document"
                        style={{ padding: '6px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ) : isEditing ? (
                <div 
                  onClick={() => !uploading && fileRef.current?.click()}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '10px', 
                    padding: '12px 20px', 
                    backgroundColor: uploading ? '#f1f5f9' : '#ffffff', 
                    border: '2px dashed #cbd5e1', 
                    borderRadius: '8px', 
                    cursor: uploading ? 'not-allowed' : 'pointer', 
                    transition: 'all 0.2s ease',
                    color: '#64748b',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = uploading ? '#f1f5f9' : '#ffffff'; }}
                >
                  <input type="file" ref={fileRef} hidden onChange={handleUpload} accept=".pdf,image/*" />
                  {uploading ? (
                    <RefreshCw size={18} className="animate-spin" color="#3b82f6" />
                  ) : (
                    <Upload size={18} color="#94a3b8" />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: uploading ? '#3b82f6' : '#475569' }}>
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </span>
                  {uploading && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', backgroundColor: '#3b82f6', width: '100%', transition: 'width 0.3s ease' }} />
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>No document uploaded</div>
              )}
            </div>
            {errors.documentUrl ? <div className="error-message">{errors.documentUrl}</div> : null}
          </div>
        </div>
      )}

      {previewUrl && (
        <div 
          className="dept-modal-overlay" 
          onClick={() => setPreviewUrl(null)} 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(10, 12, 16, 0.45)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999 
          }}
        >
          <div 
            className="dept-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              width: 'min(980px, 96%)', 
              height: '80vh', 
              backgroundColor: 'var(--card)', 
              borderRadius: 'var(--radius)', 
              boxShadow: 'var(--shadow-lg)', 
              border: '1px solid var(--border)',
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden' 
            }}
          >
            <div 
              className="dept-modal-header" 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 20px', 
                borderBottom: '1px solid var(--border)' 
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Document Preview</h3>
              <button 
                className="dept-modal-close" 
                onClick={() => setPreviewUrl(null)} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '8px', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div 
              className="dept-modal-body" 
              style={{ 
                flex: 1, 
                padding: '20px', 
                overflow: 'auto', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                backgroundColor: '#f8fafc' 
              }}
            >
              {renderPreviewContent(previewUrl)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
