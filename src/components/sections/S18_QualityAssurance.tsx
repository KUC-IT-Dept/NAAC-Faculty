import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fg, inp, dateInp, sel, ta } from './sectionUtils';
import { qualityAssuranceOptions, semesterTypeOptions, responsibilityStatusOptions } from '../../shared/dropdownOptions';
import { useDropdownOptions } from '../../shared/useDropdownOptions';

const EMPTY_RESPONSIBILITY: Record<string, string> = {
  administrativeCharge: '',
  academicYear: '',
  activityTitle: '',
  activityDate: '',
  activityCategory: '',
  objective: '',
  outcome: '',
  supportingDocuments: '',
  remarks: '',
  criteriaNumber: '',
  criteriaName: '',
  taskDescription: '',
  evidenceAvailable: '',
  status: '',
  reportName: '',
  reportingPeriod: '',
  preparedBy: '',
  criteriaCovered: '',
  reviewDate: '',
  reviewedBy: '',
  reportStatus: '',
  departmentName: '',
  coordinatorName: '',
  facultyDataSubmitted: '',
  studentDataSubmitted: '',
  researchDataSubmitted: '',
  submissionStatus: '',
  reportCycle: '',
  dataCategory: '',
  verifiedBy: '',
  verificationDate: '',
  studentStrength: '',
  facultyStrength: '',
  publicationCount: '',
  placementDataSubmitted: '',
  semester: '',
  feedbackType: '',
  feedbackSummary: '',
  actionPlan: '',
  responsiblePerson: '',
  implementationStatus: '',
  responsibilityTitle: '',
  startDate: '',
  endDate: '',
  description: '',
};

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#16a34a', color: '#fff', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', marginLeft: 8 };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#9f1239', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };

/** Returns a human-readable subtitle for the selected charge */
function getChargeSubtitle(r: any): string {
  const charge = (r.administrativeCharge || '').toLowerCase();
  if (charge.includes('director iqac')) return [r.activityTitle, r.academicYear].filter(Boolean).join(' · ');
  if (charge.includes('convener naac')) return [r.criteriaName, r.academicYear].filter(Boolean).join(' · ');
  if (charge.includes('reports for accreditation naac')) return [r.reportName, r.reportingPeriod].filter(Boolean).join(' · ');
  if (charge.includes('naac department')) return [r.departmentName, r.academicYear].filter(Boolean).join(' · ');
  if (charge.includes('reports for nirf')) return [r.reportCycle, r.academicYear].filter(Boolean).join(' · ');
  if (charge.includes('nirf department')) return [r.departmentName, r.academicYear].filter(Boolean).join(' · ');
  if (charge.includes('feedback')) return [r.feedbackType, r.academicYear].filter(Boolean).join(' · ');
  // Other
  return [r.responsibilityTitle, r.startDate ? `Started ${r.startDate}` : ''].filter(Boolean).join(' · ');
}

/** Renders the charge-specific form fields */
function ChargeSpecificFields({ item, setVal }: { item: any; setVal: (k: string, v: string) => void }) {
  const charge = (item.administrativeCharge || '').toLowerCase();
  const semesterOpts = (item as any)._semesterOpts || [];
  const statusOpts = (item as any)._statusOpts || [];

  if (charge.includes('director iqac')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Academic Year', inp(item.academicYear, v => setVal('academicYear', v), 'e.g. 2023-2024'))}
          {fg('Activity Date', dateInp(item.activityDate, v => setVal('activityDate', v)))}
        </div>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Activity Title', inp(item.activityTitle, v => setVal('activityTitle', v), 'Enter activity title'))}
          {fg('Activity Category', inp(item.activityCategory, v => setVal('activityCategory', v), 'Enter activity category'))}
        </div>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Objective', ta(item.objective, v => setVal('objective', v), 'Enter objective', 2))}
          {fg('Outcome', ta(item.outcome, v => setVal('outcome', v), 'Enter outcome', 2))}
        </div>
      </>
    );
  }

  if (charge.includes('convener naac')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Criteria Number', inp(item.criteriaNumber, v => setVal('criteriaNumber', v), 'Enter criteria number'))}
          {fg('Academic Year', inp(item.academicYear, v => setVal('academicYear', v), 'e.g. 2023-2024'))}
        </div>
        <div className="form-row form-row-1">
          {fg('Criteria Name', inp(item.criteriaName, v => setVal('criteriaName', v), 'Enter criteria name'))}
        </div>
        <div className="form-row form-row-1">
          {fg('Task Description', ta(item.taskDescription, v => setVal('taskDescription', v), 'Describe tasks', 2))}
        </div>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Evidence Available', sel(item.evidenceAvailable, v => setVal('evidenceAvailable', v), ['Yes', 'No', 'Partial']))}
          {fg('Status', sel(item.status, v => setVal('status', v), statusOpts, "Select..."))}
        </div>
      </>
    );
  }

  if (charge.includes('reports for accreditation naac')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Report Name', inp(item.reportName, v => setVal('reportName', v), 'Enter report name'))}
          {fg('Reporting Period', inp(item.reportingPeriod, v => setVal('reportingPeriod', v), 'Enter reporting period'))}
        </div>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Prepared By', inp(item.preparedBy, v => setVal('preparedBy', v), 'Enter prepared by'))}
          {fg('Criteria Covered', inp(item.criteriaCovered, v => setVal('criteriaCovered', v), 'Enter criteria covered'))}
        </div>
        <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {fg('Review Date', dateInp(item.reviewDate, v => setVal('reviewDate', v)))}
          {fg('Reviewed By', inp(item.reviewedBy, v => setVal('reviewedBy', v), 'Enter reviewed by'))}
          {fg('Report Status', sel(item.reportStatus, v => setVal('reportStatus', v), ['Draft', 'Submitted', 'Approved']))}
        </div>
      </>
    );
  }

  if (charge.includes('naac department')) {
    return (
      <>
        <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {fg('Department Name', inp(item.departmentName, v => setVal('departmentName', v), 'Enter department name'))}
          {fg('Coordinator Name', inp(item.coordinatorName, v => setVal('coordinatorName', v), 'Enter coordinator name'))}
          {fg('Academic Year', inp(item.academicYear, v => setVal('academicYear', v), 'e.g. 2023-2024'))}
        </div>
        <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {fg('Faculty Data Submitted', sel(item.facultyDataSubmitted, v => setVal('facultyDataSubmitted', v), ['Yes', 'No', 'In Progress']))}
          {fg('Student Data Submitted', sel(item.studentDataSubmitted, v => setVal('studentDataSubmitted', v), ['Yes', 'No', 'In Progress']))}
          {fg('Research Data Submitted', sel(item.researchDataSubmitted, v => setVal('researchDataSubmitted', v), ['Yes', 'No', 'In Progress']))}
        </div>
        <div className="form-row form-row-1">
          {fg('Submission Status', sel(item.submissionStatus, v => setVal('submissionStatus', v), ['Pending', 'Completed']))}
        </div>
      </>
    );
  }

  if (charge.includes('reports for nirf')) {
    return (
      <>
        <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {fg('Academic Year', inp(item.academicYear, v => setVal('academicYear', v), 'e.g. 2023-2024'))}
          {fg('Report Cycle', inp(item.reportCycle, v => setVal('reportCycle', v), 'Enter report cycle'))}
          {fg('Data Category', inp(item.dataCategory, v => setVal('dataCategory', v), 'Enter data category'))}
        </div>
        <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {fg('Verified By', inp(item.verifiedBy, v => setVal('verifiedBy', v), 'Enter verified by'))}
          {fg('Verification Date', dateInp(item.verificationDate, v => setVal('verificationDate', v)))}
          {fg('Report Status', sel(item.reportStatus, v => setVal('reportStatus', v), ['Draft', 'Submitted', 'Approved']))}
        </div>
      </>
    );
  }

  if (charge.includes('nirf department')) {
    return (
      <>
        <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {fg('Department Name', inp(item.departmentName, v => setVal('departmentName', v), 'Enter department name'))}
          {fg('Coordinator Name', inp(item.coordinatorName, v => setVal('coordinatorName', v), 'Enter coordinator name'))}
          {fg('Academic Year', inp(item.academicYear, v => setVal('academicYear', v), 'e.g. 2023-2024'))}
        </div>
        <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {fg('Student Strength', inp(item.studentStrength, v => setVal('studentStrength', v), 'Enter student strength'))}
          {fg('Faculty Strength', inp(item.facultyStrength, v => setVal('facultyStrength', v), 'Enter faculty strength'))}
          {fg('Publication Count', inp(item.publicationCount, v => setVal('publicationCount', v), 'Enter publication count'))}
        </div>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Placement Data Submitted', sel(item.placementDataSubmitted, v => setVal('placementDataSubmitted', v), ['Yes', 'No', 'In Progress']))}
          {fg('Submission Status', sel(item.submissionStatus, v => setVal('submissionStatus', v), ['Pending', 'Completed']))}
        </div>
      </>
    );
  }

  if (charge.includes('feedback')) {
    return (
      <>
        <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {fg('Academic Year', inp(item.academicYear, v => setVal('academicYear', v), 'e.g. 2023-2024'))}
          {fg('Semester', sel(item.semester, v => setVal('semester', v), semesterOpts, "Select..."))}
          {fg('Feedback Type', inp(item.feedbackType, v => setVal('feedbackType', v), 'Enter feedback type'))}
        </div>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Feedback Summary', ta(item.feedbackSummary, v => setVal('feedbackSummary', v), 'Enter feedback summary', 2))}
          {fg('Action Plan', ta(item.actionPlan, v => setVal('actionPlan', v), 'Enter action plan', 2))}
        </div>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Responsible Person', inp(item.responsiblePerson, v => setVal('responsiblePerson', v), 'Enter responsible person'))}
          {fg('Implementation Status', sel(item.implementationStatus, v => setVal('implementationStatus', v), ['Pending', 'In Progress', 'Completed']))}
        </div>
      </>
    );
  }

  // Other
  return (
    <>
      <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {fg('Responsibility Title', inp(item.responsibilityTitle, v => setVal('responsibilityTitle', v), 'Enter responsibility title'))}
        {fg('Start Date', dateInp(item.startDate, v => setVal('startDate', v)))}
        {fg('End Date', dateInp(item.endDate, v => setVal('endDate', v)))}
      </div>
      <div className="form-row form-row-1">
        {fg('Description', ta(item.description, v => setVal('description', v), 'Describe the responsibility', 2))}
      </div>
      <div className="form-row form-row-1">
        {fg('Status', sel(item.status, v => setVal('status', v), statusOpts, "Select..."))}
      </div>
    </>
  );
}

/** Renders the common fields (supporting documents & remarks) */
function CommonFields({ item, setVal }: { item: any; setVal: (k: string, v: string) => void }) {
  const charge = (item.administrativeCharge || '').toLowerCase();
  
  // Some options don't explicitly require supporting documents in the prompt, but it's good to provide it for options that do.
  // The user prompt lists it for: Director IQAC, Preparing Reports for NIRF Ranking, Other. Let's provide it generally or selectively.
  const wantsDocs = charge.includes('iqac') || charge.includes('nirf ranking') || charge.includes('other');

  return (
    <>
      {wantsDocs && (
        <div className="form-row form-row-1">
          {fg('Supporting Documents URL', inp(item.supportingDocuments, v => setVal('supportingDocuments', v), 'Link to supporting documents (optional)'))}
        </div>
      )}
      <div className="form-row form-row-1">
        {fg('Remarks', inp(item.remarks, v => setVal('remarks', v), 'Any additional remarks (optional)'))}
      </div>
    </>
  );
}

/** Preview row for expanded detail view */
function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

/** Returns the preview rows specific to the charge type */
function ChargePreviewRows({ r }: { r: any }) {
  const charge = (r.administrativeCharge || '').toLowerCase();

  if (charge.includes('director iqac')) {
    return (
      <>
        <PreviewRow label="Academic Year" value={r.academicYear} />
        <PreviewRow label="Activity Title" value={r.activityTitle} />
        <PreviewRow label="Activity Date" value={r.activityDate} />
        <PreviewRow label="Activity Category" value={r.activityCategory} />
        <PreviewRow label="Objective" value={r.objective} />
        <PreviewRow label="Outcome" value={r.outcome} />
      </>
    );
  }
  if (charge.includes('convener naac')) {
    return (
      <>
        <PreviewRow label="Criteria Number" value={r.criteriaNumber} />
        <PreviewRow label="Criteria Name" value={r.criteriaName} />
        <PreviewRow label="Academic Year" value={r.academicYear} />
        <PreviewRow label="Task Description" value={r.taskDescription} />
        <PreviewRow label="Evidence Available" value={r.evidenceAvailable} />
        <PreviewRow label="Status" value={r.status} />
      </>
    );
  }
  if (charge.includes('reports for accreditation naac')) {
    return (
      <>
        <PreviewRow label="Report Name" value={r.reportName} />
        <PreviewRow label="Reporting Period" value={r.reportingPeriod} />
        <PreviewRow label="Prepared By" value={r.preparedBy} />
        <PreviewRow label="Criteria Covered" value={r.criteriaCovered} />
        <PreviewRow label="Review Date" value={r.reviewDate} />
        <PreviewRow label="Reviewed By" value={r.reviewedBy} />
        <PreviewRow label="Report Status" value={r.reportStatus} />
      </>
    );
  }
  if (charge.includes('naac department')) {
    return (
      <>
        <PreviewRow label="Department Name" value={r.departmentName} />
        <PreviewRow label="Coordinator Name" value={r.coordinatorName} />
        <PreviewRow label="Academic Year" value={r.academicYear} />
        <PreviewRow label="Faculty Data Submitted" value={r.facultyDataSubmitted} />
        <PreviewRow label="Student Data Submitted" value={r.studentDataSubmitted} />
        <PreviewRow label="Research Data Submitted" value={r.researchDataSubmitted} />
        <PreviewRow label="Submission Status" value={r.submissionStatus} />
      </>
    );
  }
  if (charge.includes('reports for nirf')) {
    return (
      <>
        <PreviewRow label="Academic Year" value={r.academicYear} />
        <PreviewRow label="Report Cycle" value={r.reportCycle} />
        <PreviewRow label="Data Category" value={r.dataCategory} />
        <PreviewRow label="Verified By" value={r.verifiedBy} />
        <PreviewRow label="Verification Date" value={r.verificationDate} />
        <PreviewRow label="Report Status" value={r.reportStatus} />
      </>
    );
  }
  if (charge.includes('nirf department')) {
    return (
      <>
        <PreviewRow label="Department Name" value={r.departmentName} />
        <PreviewRow label="Coordinator Name" value={r.coordinatorName} />
        <PreviewRow label="Academic Year" value={r.academicYear} />
        <PreviewRow label="Student Strength" value={r.studentStrength} />
        <PreviewRow label="Faculty Strength" value={r.facultyStrength} />
        <PreviewRow label="Publication Count" value={r.publicationCount} />
        <PreviewRow label="Placement Data Submitted" value={r.placementDataSubmitted} />
        <PreviewRow label="Submission Status" value={r.submissionStatus} />
      </>
    );
  }
  if (charge.includes('feedback')) {
    return (
      <>
        <PreviewRow label="Academic Year" value={r.academicYear} />
        <PreviewRow label="Semester" value={r.semester} />
        <PreviewRow label="Feedback Type" value={r.feedbackType} />
        <PreviewRow label="Feedback Summary" value={r.feedbackSummary} />
        <PreviewRow label="Action Plan" value={r.actionPlan} />
        <PreviewRow label="Responsible Person" value={r.responsiblePerson} />
        <PreviewRow label="Implementation Status" value={r.implementationStatus} />
      </>
    );
  }
  // Other
  return (
    <>
      <PreviewRow label="Responsibility Title" value={r.responsibilityTitle} />
      <PreviewRow label="Start Date" value={r.startDate} />
      <PreviewRow label="End Date" value={r.endDate} />
      <PreviewRow label="Description" value={r.description} />
      <PreviewRow label="Status" value={r.status} />
    </>
  );
}

function RespPreviewCard({ r, onEdit, onDelete, disabled }: { r: any; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const subtitle = getChargeSubtitle(r);

  const charge = (r.administrativeCharge || '').toLowerCase();
  const wantsDocs = charge.includes('iqac') || charge.includes('nirf ranking') || charge.includes('other');

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
              {r.administrativeCharge ? r.administrativeCharge.substring(0, 4).toUpperCase() : '—'}
            </div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Role</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {r.administrativeCharge || 'Untitled Responsibility'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {subtitle && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</span>}
              {r.status && <span className="badge badge-secondary">{r.status}</span>}
              {r.reportStatus && <span className="badge badge-secondary">{r.reportStatus}</span>}
              {r.submissionStatus && <span className="badge badge-secondary">{r.submissionStatus}</span>}
              {r.implementationStatus && <span className="badge badge-secondary">{r.implementationStatus}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
          <button type="button" style={btnEdit} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {expanded ? 'Hide' : 'View'}
          </button>
          <button type="button" style={btnEdit} onClick={(e) => { e.stopPropagation(); onEdit(); }} disabled={disabled}>
            <Edit2 size={14} /> Edit
          </button>
          <button type="button" style={btnDelete} onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={disabled}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewRow label="Administrative Charge" value={r.administrativeCharge} />
          <ChargePreviewRows r={r} />
          {wantsDocs && <PreviewRow label="Supporting Documents" value={r.supportingDocuments} />}
          <PreviewRow label="Remarks" value={r.remarks} />
        </div>
      )}
    </>
  );
}

export default function QualityAssurance({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const responsibilities = Array.isArray(data) ? data : (data?.responsibilities || []);
  const update = (val: any) => onChange(val);

  // Reactive dropdown options
  const qualityAssuranceOpts = useDropdownOptions(qualityAssuranceOptions);
  const semesterOpts = useDropdownOptions(semesterTypeOptions);
  const statusOpts = useDropdownOptions(responsibilityStatusOptions);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  const updItem = (i: number, k: string, v: string) => {
    setIsDirty(true);
    const a = [...responsibilities];
    a[i] = { ...a[i], [k]: v };
    update(a);
  };

  const isComplete = (r: any) => !!r.administrativeCharge;

  const handleSavePending = (item: any) => {
    if (isComplete(item)) { update([item, ...responsibilities]); setPending(null); setIsDirty(false); }
  };

  /** When charge type changes, reset charge-specific fields but keep common ones */
  const handleChargeChange = (currentItem: any, newCharge: string, isPending: boolean, idx?: number) => {
    setIsDirty(true);
    const reset: Record<string, string> = {
      ...EMPTY_RESPONSIBILITY,
      administrativeCharge: newCharge,
      remarks: currentItem.remarks || '',
      supportingDocuments: currentItem.supportingDocuments || '',
    };
    if (isPending) {
      setPending(reset);
    } else if (idx !== undefined) {
      const a = [...responsibilities];
      a[idx] = reset;
      update(a);
    }
  };

  const renderForm = (item: any, isPending: boolean, idx?: number) => {
    const setVal = (k: string, v: string) => {
      setIsDirty(true);
      if (isPending) {
        setPending({ ...item, [k]: v });
      } else if (idx !== undefined) {
        updItem(idx, k, v);
      }
    };

    return (
      <>
        <div className="form-row form-row-1">
          {fg('Administrative Charge *', sel(item.administrativeCharge, v => handleChargeChange(item, v, isPending, idx), qualityAssuranceOpts))}
        </div>
        {item.administrativeCharge && (
          <>
            <ChargeSpecificFields item={{...item, _semesterOpts: semesterOpts, _statusOpts: statusOpts}} setVal={setVal} />
            <CommonFields item={item} setVal={setVal} />
          </>
        )}
      </>
    );
  };

  return (
    <>
      <div style={{ marginBottom: 40 }}>
        <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Quality Assurance</h5>
          <button
            type="button"
            onClick={() => { setPending({ ...EMPTY_RESPONSIBILITY }); setIsDirty(false); }}
            disabled={pending !== null || editingIndex !== null}
            style={{ ...btnAdd, flexShrink: 0 }}
          >
            <Plus size={16} /> Add Responsibility
          </button>
        </div>

        {responsibilities.length === 0 && !pending && (
          <div className="empty-state">No responsibilities added yet. Click Add Responsibility to get started.</div>
        )}

        <div className="items-list">
          {pending && (
            <div key="pending-resp" className="list-item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Responsibility</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => { setPending(null); setIsDirty(false); }} style={btnCancel}><X size={14} /> Cancel</button>
                  <button
                    type="button"
                    onClick={() => handleSavePending(pending)}
                    disabled={!isComplete(pending)}
                    style={isComplete(pending) ? btnSave : { ...btnSave, backgroundColor: '#16a34a', color: '#ffffff', cursor: 'not-allowed', opacity: 0.6 }}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              </div>
              {renderForm(pending, true)}
              {isDirty && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                  <button type="button" onClick={() => { setPending(null); setIsDirty(false); }} style={btnCancel}><X size={14} /> Cancel</button>
                  <button
                    type="button"
                    onClick={() => handleSavePending(pending)}
                    disabled={!isComplete(pending)}
                    style={isComplete(pending) ? btnSave : { ...btnSave, backgroundColor: '#16a34a', color: '#ffffff', cursor: 'not-allowed', opacity: 0.6 }}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              )}
            </div>
          )}

          {responsibilities.map((r: any, i: number) => {
            const isEditing = editingIndex === i;
            return (
              <div key={`r-${i}`} className="list-item-card">
                {isEditing ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Responsibility</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => { setEditingIndex(null); setIsDirty(false); }} style={btnCancel}><X size={14} /> Cancel</button>
                        <button type="button" onClick={() => { setEditingIndex(null); setIsDirty(false); }} style={btnSave}><Check size={14} /> Save</button>
                        <button type="button" onClick={() => { update(responsibilities.filter((_: any, j: number) => j !== i)); setEditingIndex(null); setIsDirty(false); }} style={btnDelete}><Trash2 size={14} /> Delete</button>
                      </div>
                    </div>
                    {renderForm(r, false, i)}
                    {isDirty && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                        <button type="button" onClick={() => { setEditingIndex(null); setIsDirty(false); }} style={btnCancel}><X size={14} /> Cancel</button>
                        <button type="button" onClick={() => { setEditingIndex(null); setIsDirty(false); }} style={btnSave}><Check size={14} /> Save</button>
                        <button type="button" onClick={() => { update(responsibilities.filter((_: any, j: number) => j !== i)); setEditingIndex(null); setIsDirty(false); }} style={btnDelete}><Trash2 size={14} /> Delete</button>
                      </div>
                    )}
                  </>
                ) : (
                  <RespPreviewCard
                    r={r}
                    onEdit={() => { setEditingIndex(i); setIsDirty(false); }}
                    onDelete={() => update(responsibilities.filter((_: any, j: number) => j !== i))}
                    disabled={pending !== null}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
