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

const popularBanks = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Punjab National Bank (PNB)',
  'Axis Bank',
  'Canara Bank',
  'Bank of Baroda',
  'Union Bank of India',
  'Bank of India',
  'Indian Bank',
  'Central Bank of India',
  'Indian Overseas Bank',
  'UCO Bank',
  'Bank of Maharashtra',
  'Punjab & Sind Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'Yes Bank',
  'IDFC First Bank',
  'Federal Bank',
  'South Indian Bank',
  'Karur Vysya Bank',
  'City Union Bank',
  'Bandhan Bank'
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

const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch (e) {
    // Ignore and fallback
  }
  return dateStr;
};

const normalizeInstitutionType = (val: string) => {
  if (!val) return '';
  const match = ['State', 'Central', 'Private', 'Deemed'].find(
    opt => opt.toLowerCase() === val.toLowerCase()
  );
  return match || val;
};

export default function EmploymentDetails({ data, personalInfo, onChange, onPersist }: { data: any; personalInfo?: any; onChange: (d: any) => void; onPersist?: (updated: any) => void }) {
  const dynamicDepartmentOptions = useDropdownOptions(departmentOptions);
  const dynamicAffiliatedUniversityOptions = useDropdownOptions(affiliatedUniversityOptions);
  const dynamicPayScaleOptions = useDropdownOptions(payScaleOptions);
  const dynamicDesignationOptions = useDropdownOptions(designationOptions);
  const dynamicInstitutionTypeOptions = useDropdownOptions(institutionTypeOptions);
  const dynamicApprovalStatusOptions = useDropdownOptions(approvalStatusOptions);
  const institutionsOpts = useDropdownOptions(institutionsOptions);

  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<any>(getEmpty());
  const [hasSavedData, setHasSavedData] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  function getEmpty() {
    return {
      ...EMPTY,
      department: personalInfo?.department || '',
      institution: personalInfo?.institution || '',
    };
  }

  useEffect(() => {
    if (data && typeof data === 'object' && (data.employeeId || data.designation || data.department || data.institution)) {
      const bankInfo = parseBankDetails(data.bankAccountDetails || '');
      setEditingData({
        ...getEmpty(),
        ...data,
        dateOfJoining: formatDateForInput(data.dateOfJoining || data.dateOfAppointment || ''),
        dateOfConfirmation: formatDateForInput(data.dateOfConfirmation || ''),
        typeOfInstitution: normalizeInstitutionType(data.typeOfInstitution || ''),
        bankName: data.bankName || bankInfo.bankName || '',
        accountNumber: data.accountNumber || bankInfo.accountNumber || '',
        ifscCode: data.ifscCode || bankInfo.ifscCode || '',
        branchName: data.branchName || bankInfo.branchName || '',
        documentUrl: data.documentUrl || ''
      });
      setHasSavedData(true);
      setIsEditing(false);
    } else {
      setEditingData(getEmpty());
      setHasSavedData(false);
      setIsEditing(false);
    }
    setErrors({});
    setTouchedFields({});
  }, [data, personalInfo]);

  const handleClear = () => {
    setEditingData(getEmpty());
    setErrors({});
    setTouchedFields({});
    setPreviewUrl(null);
  };

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
    
    // Auto-fetch bank details when IFSC code is fully typed (11 characters)
    if (key === 'ifscCode' && value.length === 11) {
      fetch(`https://ifsc.razorpay.com/${value}`)
        .then(res => res.json())
        .then(apiData => {
          if (apiData && apiData.BANK) {
            setEditingData((prev: any) => ({
              ...prev,
              bankName: apiData.BANK,
              branchName: apiData.BRANCH
            }));
            toast.success(`Fetched details for ${apiData.BANK}`);
          }
        })
        .catch(() => {
          // Silent failure if IFSC is invalid or API is down
        });
    }

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
    if (data && typeof data === 'object' && (data.employeeId || data.designation || data.department || data.institution)) {
      const bankInfo = parseBankDetails(data.bankAccountDetails || '');
      setEditingData({
        ...getEmpty(),
        ...data,
        dateOfJoining: formatDateForInput(data.dateOfJoining || data.dateOfAppointment || ''),
        dateOfConfirmation: formatDateForInput(data.dateOfConfirmation || ''),
        typeOfInstitution: normalizeInstitutionType(data.typeOfInstitution || ''),
        bankName: data.bankName || bankInfo.bankName || '',
        accountNumber: data.accountNumber || bankInfo.accountNumber || '',
        ifscCode: data.ifscCode || bankInfo.ifscCode || '',
        branchName: data.branchName || bankInfo.branchName || '',
        documentUrl: data.documentUrl || ''
      });
      setIsEditing(false);
    } else {
      setEditingData(getEmpty());
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
      ) : hasSavedData && !isEditing ? (
        /* ── Saved View Mode ── */
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(79,70,229,0.10)', border: '1px solid #e0e7ff' }}>

          {/* ── Hero Header ── */}
          <div style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #6366f1 100%)', padding: '28px 32px 24px', position: 'relative', overflow: 'hidden' }}>
            {/* decorative circles */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -20, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                {/* Avatar icon */}
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={26} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {editingData.designation || 'Faculty Member'}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500 }}>
                    {editingData.department && <span>{editingData.department}</span>}
                    {editingData.department && editingData.institution && <span style={{ margin: '0 6px', opacity: 0.5 }}>•</span>}
                    {editingData.institution && <span>{editingData.institution}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {editingData.natureOfAppointment && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', letterSpacing: '0.03em' }}>
                        {editingData.natureOfAppointment}
                      </span>
                    )}
                    {editingData.employeeId && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)', letterSpacing: '0.03em' }}>
                        ID: {editingData.employeeId}
                      </span>
                    )}
                    {editingData.dateOfJoining && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)', letterSpacing: '0.03em' }}>
                        Joined: {editingData.dateOfJoining}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={startEditingForm}
                style={{ padding: '7px 18px', fontSize: 13, cursor: 'pointer', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)', flexShrink: 0 }}
              >
                <Edit2 size={13} /> Edit
              </button>
            </div>
          </div>

          {/* ── Details Body ── */}
          <div style={{ background: '#fff', padding: '0 0 4px' }}>

            {/* Section: Appointment */}
            <div style={{ padding: '20px 28px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: '#4f46e5' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Appointment</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Affiliated University', value: editingData.affiliatedUniversity, icon: '🎓' },
                  { label: 'Type of Institution', value: editingData.typeOfInstitution, icon: '🏛️' },
                  { label: 'Approval Status', value: editingData.approvalOfAppointment, icon: '✅' },
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>{item.icon}</span> {item.label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: item.value ? '#1e293b' : '#d1d5db' }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: '#f1f5f9', margin: '0 28px' }} />

            {/* Section: Dates & Pay */}
            <div style={{ padding: '20px 28px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: '#0ea5e9' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dates & Compensation</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Date of Joining', value: editingData.dateOfJoining, accent: '#4f46e5' },
                  { label: 'Date of Confirmation', value: editingData.dateOfConfirmation, accent: '#0ea5e9' },
                  { label: 'Pay Band / Scale', value: editingData.payBand, accent: '#16a34a' },
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', borderLeft: `3px solid ${item.accent}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: item.value ? '#1e293b' : '#d1d5db' }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: '#f1f5f9', margin: '0 28px' }} />

            {/* Section: Finance & Records */}
            <div style={{ padding: '20px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: '#f59e0b' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Finance & Records</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Bank Name', value: editingData.bankName },
                  { label: 'Account Number', value: editingData.accountNumber ? '••••' + editingData.accountNumber.slice(-4) : '' },
                  { label: 'IFSC Code', value: editingData.ifscCode },
                  { label: 'Branch Name', value: editingData.branchName },
                  { label: 'PF Number', value: editingData.pfNumber },
                  { label: 'Service Book No.', value: editingData.serviceBookNumber },
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fef3c7' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.value ? '#1e293b' : '#d1d5db', fontFamily: item.label === 'IFSC Code' || item.label === 'Account Number' ? 'monospace' : 'inherit' }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document row */}
            {editingData.documentUrl && (
              <>
                <div style={{ height: 1, background: '#f1f5f9', margin: '0 28px' }} />
                <div style={{ padding: '16px 28px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: 'linear-gradient(90deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd', borderRadius: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={18} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0369a1' }}>{editingData.documentUrl.split('/').pop()}</div>
                      <div style={{ fontSize: 11, color: '#7dd3fc', marginTop: 1 }}>Employment Document</div>
                    </div>
                    <button type="button" onClick={() => setPreviewUrl(editingData.documentUrl)}
                      style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#0369a1', background: '#fff', border: '1.5px solid #bae6fd', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <ExternalLink size={12} /> View
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      ) : (
        /* ── Edit Form ── */
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="#4f46e5" /> Current Employment Details
            </h3>
            <div>
              <button
                type="button"
                onClick={cancelEdit}
                style={{ padding: '7px 20px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3', borderRadius: '8px', marginRight: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <X size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                style={{ padding: '7px 20px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={14} /> Save
              </button>
            </div>
          </div>

          <div className="form-row form-row-2">
            {fg('Employee ID / Staff Code', renderInput('employeeId'), { required: isFieldRequired('employeeId'), error: errors.employeeId })}
            {fg('Designation', renderSelect('designation', dynamicDesignationOptions), { required: isFieldRequired('designation'), error: errors.designation })}
          </div>
          <div className="form-row form-row-2">
            {fg('Department', renderSelect('department', dynamicDepartmentOptions), { required: isFieldRequired('department'), error: errors.department })}
            {fg('College / Institution Name', (
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
            {fg('Bank Name', (
              <SearchableSelect
                value={editingData.bankName || ''}
                onChange={(v: string) => updateEditingData('bankName', v)}
                options={popularBanks}
                placeholder="Search or Enter Bank Name"
                inputRef={(el: HTMLDivElement | null) => { fieldRefs.current.bankName = el as HTMLElement; }}
              />
            ), { required: isFieldRequired('bankName'), error: errors.bankName })}
            {fg('Account Number', renderInput('accountNumber', 'e.g. 1234567890'), { required: isFieldRequired('accountNumber'), error: errors.accountNumber })}
          </div>
          <div className="form-row form-row-2">
            {fg('IFSC Code', renderInput('ifscCode', 'Enter 11-digit IFSC Code'), { required: isFieldRequired('ifscCode'), error: errors.ifscCode })}
            {fg('Branch Name', renderInput('branchName', 'e.g. Main Branch'), { required: isFieldRequired('branchName'), error: errors.branchName })}
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
                    <button type="button" onClick={() => setPreviewUrl(editingData.documentUrl)} title="View Document" style={{ padding: '6px', backgroundColor: 'white', border: '1px solid #e0f2fe', borderRadius: '6px', cursor: 'pointer', color: '#0369a1', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
                      <ExternalLink size={14} />
                    </button>
                    <button type="button" onClick={() => setShowDeleteConfirm(true)} title="Remove Document" style={{ padding: '6px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}>
                      <X size={14} />
                    </button>
                    {showDeleteConfirm && (
                      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDeleteConfirm(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="modal" style={{ maxWidth: 420, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Delete document?</h3>
                            <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowDeleteConfirm(false)}><X size={18} /></button>
                          </div>
                          <div className="modal-body" style={{ padding: '20px' }}>
                            <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>Are you sure you want to delete this document? This action cannot be undone.</p>
                          </div>
                          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                            <button type="button" style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#475569' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button type="button" style={{ padding: '8px 16px', border: 'none', background: '#ef4444', color: 'white', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }} onClick={() => { updateEditingData('documentUrl', ''); setShowDeleteConfirm(false); }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px 20px', backgroundColor: uploading ? '#f1f5f9' : '#ffffff', border: '2px dashed #cbd5e1', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', color: '#64748b', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = uploading ? '#f1f5f9' : '#ffffff'; }}
                >
                  <input type="file" ref={fileRef} hidden onChange={handleUpload} accept=".pdf,image/*" />
                  {uploading ? <RefreshCw size={18} className="animate-spin" color="#3b82f6" /> : <Upload size={18} color="#94a3b8" />}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: uploading ? '#3b82f6' : '#475569' }}>
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </span>
                  {uploading && <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', backgroundColor: '#3b82f6', width: '100%', transition: 'width 0.3s ease' }} />}
                </div>
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
