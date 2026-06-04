import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fg, inp, dateInp, sel, ta } from './sectionUtils';
import { departmentalChargesOptions } from '../../shared/dropdownOptions';
import { useDropdownOptions } from '../../shared/useDropdownOptions';

const EMPTY_RESPONSIBILITY: Record<string, string> = {
  administrativeCharge: '',
  institutionName: '',
  departmentName: '',
  committeeName: '',
  libraryName: '',
  role: '',
  responsibilities: '',
  activitiesCoordinated: '',
  mentoringScheme: '',
  numberOfStudents: '',
  academicYear: '',
  eventTitle: '',
  eventType: '',
  organizingDepartment: '',
  eventDate: '',
  title: '',
  description: '',
  appointmentDate: '',
  tenureStart: '',
  tenureEnd: '',
  remarks: '',
};

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#16a34a', color: '#fff', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', marginLeft: 8 };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#9f1239', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };

/** Returns a human-readable subtitle for the selected charge */
function getChargeSubtitle(r: any): string {
  const charge = (r.administrativeCharge || '').toLowerCase();
  if (charge.includes('head of the department')) return [r.departmentName, r.institutionName].filter(Boolean).join(' · ');
  if (charge.includes('co-ordinator cultural')) return [r.committeeName, r.academicYear].filter(Boolean).join(' · ');
  if (charge.includes('serving as librarian')) return r.libraryName || '';
  if (charge.includes('serving on library') || charge.includes('serving on sports') || charge.includes('serving on cultural') || charge.includes('serving on grievance')) return [r.committeeName, r.role].filter(Boolean).join(' · ');
  if (charge.includes('guiding students')) return [r.mentoringScheme, r.numberOfStudents ? `${r.numberOfStudents} students` : ''].filter(Boolean).join(' · ');
  if (charge.includes('coordinating seminars')) return [r.eventTitle, r.organizingDepartment].filter(Boolean).join(' · ');
  // Other
  return [r.title, r.departmentName].filter(Boolean).join(' · ');
}

/** Renders the charge-specific form fields */
function ChargeSpecificFields({ item, setVal }: { item: any; setVal: (k: string, v: string) => void }) {
  const charge = (item.administrativeCharge || '').toLowerCase();

  if (charge.includes('head of the department')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Department Name', inp(item.departmentName, v => setVal('departmentName', v), 'Enter department name'))}
          {fg('Institution Name', inp(item.institutionName, v => setVal('institutionName', v), 'Enter institution name'))}
        </div>
        <div className="form-row form-row-1">
          {fg('Key Responsibilities', ta(item.responsibilities, v => setVal('responsibilities', v), 'Describe key responsibilities', 2))}
        </div>
      </>
    );
  }

  if (charge.includes('co-ordinator cultural')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Committee / Cell Name', inp(item.committeeName, v => setVal('committeeName', v), 'Enter committee or cell name'))}
          {fg('Academic Year', inp(item.academicYear, v => setVal('academicYear', v), 'e.g. 2023-2024'))}
        </div>
        <div className="form-row form-row-1">
          {fg('Activities Coordinated', ta(item.activitiesCoordinated, v => setVal('activitiesCoordinated', v), 'Describe activities coordinated', 2))}
        </div>
      </>
    );
  }

  if (charge.includes('serving as librarian')) {
    return (
      <>
        <div className="form-row form-row-1">
          {fg('Library Name', inp(item.libraryName, v => setVal('libraryName', v), 'Enter library name'))}
        </div>
        <div className="form-row form-row-1">
          {fg('Responsibilities', ta(item.responsibilities, v => setVal('responsibilities', v), 'Describe responsibilities', 2))}
        </div>
      </>
    );
  }

  if (charge.includes('serving on library') || charge.includes('serving on sports') || charge.includes('serving on cultural') || charge.includes('serving on grievance')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Committee Name', inp(item.committeeName, v => setVal('committeeName', v), 'Enter committee name'))}
          {fg('Role', charge.includes('library') ? sel(item.role, v => setVal('role', v), ['Chairperson', 'Member']) : inp(item.role, v => setVal('role', v), 'Enter role'))}
        </div>
      </>
    );
  }

  if (charge.includes('guiding students')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Mentoring Scheme', inp(item.mentoringScheme, v => setVal('mentoringScheme', v), 'Enter mentoring scheme'))}
          {fg('Number of Students Mentored', inp(item.numberOfStudents, v => setVal('numberOfStudents', v), 'Enter number of students'))}
        </div>
      </>
    );
  }

  if (charge.includes('coordinating seminars')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Event Title', inp(item.eventTitle, v => setVal('eventTitle', v), 'Enter event title'))}
          {fg('Event Type', inp(item.eventType, v => setVal('eventType', v), 'Enter event type'))}
        </div>
        <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {fg('Organizing Department', inp(item.organizingDepartment, v => setVal('organizingDepartment', v), 'Enter organizing department'))}
          {fg('Event Date', dateInp(item.eventDate, v => setVal('eventDate', v)))}
          {fg('Role', inp(item.role, v => setVal('role', v), 'Enter role'))}
        </div>
      </>
    );
  }

  // Other
  return (
    <>
      <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {fg('Responsibility Title', inp(item.title, v => setVal('title', v), 'Enter responsibility title'))}
        {fg('Department', inp(item.departmentName, v => setVal('departmentName', v), 'Enter department name'))}
      </div>
      <div className="form-row form-row-1">
        {fg('Description', ta(item.description, v => setVal('description', v), 'Describe the responsibility', 2))}
      </div>
    </>
  );
}

/** Renders the common date + remarks fields */
function CommonFields({ item, setVal }: { item: any; setVal: (k: string, v: string) => void }) {
  const charge = (item.administrativeCharge || '').toLowerCase();
  // Seminars/Workshops don't have tenure dates, only appointment date
  const hasTenure = !charge.includes('coordinating seminars');

  return (
    <>
      <div className={`form-row ${hasTenure ? 'form-row-3' : 'form-row-1'}`} style={hasTenure ? { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 } : {}}>
        {fg('Appointment Date', dateInp(item.appointmentDate, v => setVal('appointmentDate', v)))}
        {hasTenure && fg('From Date', dateInp(item.tenureStart, v => setVal('tenureStart', v)))}
        {hasTenure && fg('To Date', dateInp(item.tenureEnd, v => setVal('tenureEnd', v)))}
      </div>
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

  if (charge.includes('head of the department')) {
    return (
      <>
        <PreviewRow label="Department Name" value={r.departmentName} />
        <PreviewRow label="Institution Name" value={r.institutionName} />
        <PreviewRow label="Key Responsibilities" value={r.responsibilities} />
      </>
    );
  }
  if (charge.includes('co-ordinator cultural')) {
    return (
      <>
        <PreviewRow label="Committee / Cell Name" value={r.committeeName} />
        <PreviewRow label="Academic Year" value={r.academicYear} />
        <PreviewRow label="Activities Coordinated" value={r.activitiesCoordinated} />
      </>
    );
  }
  if (charge.includes('serving as librarian')) {
    return (
      <>
        <PreviewRow label="Library Name" value={r.libraryName} />
        <PreviewRow label="Responsibilities" value={r.responsibilities} />
      </>
    );
  }
  if (charge.includes('serving on library') || charge.includes('serving on sports') || charge.includes('serving on cultural') || charge.includes('serving on grievance')) {
    return (
      <>
        <PreviewRow label="Committee Name" value={r.committeeName} />
        <PreviewRow label="Role" value={r.role} />
      </>
    );
  }
  if (charge.includes('guiding students')) {
    return (
      <>
        <PreviewRow label="Mentoring Scheme" value={r.mentoringScheme} />
        <PreviewRow label="Number of Students" value={r.numberOfStudents} />
      </>
    );
  }
  if (charge.includes('coordinating seminars')) {
    return (
      <>
        <PreviewRow label="Event Title" value={r.eventTitle} />
        <PreviewRow label="Event Type" value={r.eventType} />
        <PreviewRow label="Organizing Department" value={r.organizingDepartment} />
        <PreviewRow label="Event Date" value={r.eventDate} />
        <PreviewRow label="Role" value={r.role} />
      </>
    );
  }
  // Other
  return (
    <>
      <PreviewRow label="Title" value={r.title} />
      <PreviewRow label="Department" value={r.departmentName} />
      <PreviewRow label="Description" value={r.description} />
    </>
  );
}

function RespPreviewCard({ r, onEdit, onDelete, disabled }: { r: any; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const subtitle = getChargeSubtitle(r);
  
  const charge = (r.administrativeCharge || '').toLowerCase();
  const hasTenure = !charge.includes('coordinating seminars');

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
              {hasTenure && r.tenureStart && <span className="badge badge-secondary">{r.tenureStart}{r.tenureEnd ? ` — ${r.tenureEnd}` : ' — Present'}</span>}
              {!hasTenure && r.eventDate && <span className="badge badge-secondary">{r.eventDate}</span>}
              {subtitle && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</span>}
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
          <PreviewRow label="Administrative charge" value={r.administrativeCharge} />
          <ChargePreviewRows r={r} />
          <PreviewRow label="Appointment Date" value={r.appointmentDate} />
          {hasTenure && (
            <>
              <PreviewRow label="From" value={r.tenureStart} />
              <PreviewRow label="To" value={r.tenureEnd} />
            </>
          )}
          <PreviewRow label="Remarks" value={r.remarks} />
        </div>
      )}
    </>
  );
}

export default function DepartmentalCharges({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const responsibilities = Array.isArray(data) ? data : (data?.responsibilities || []);
  const update = (val: any) => onChange(val);

  // Reactive dropdown options
  const departmentalChargesOpts = useDropdownOptions(departmentalChargesOptions);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<any>(null);

  const updItem = (i: number, k: string, v: string) => {
    const a = [...responsibilities];
    a[i] = { ...a[i], [k]: v };
    update(a);
  };

  const isComplete = (r: any) => !!r.administrativeCharge;

  const handleSavePending = (item: any) => {
    if (isComplete(item)) { update([item, ...responsibilities]); setPending(null); }
  };

  /** When charge type changes, reset charge-specific fields but keep common ones */
  const handleChargeChange = (currentItem: any, newCharge: string, isPending: boolean, idx?: number) => {
    const reset: Record<string, string> = {
      ...EMPTY_RESPONSIBILITY,
      administrativeCharge: newCharge,
      appointmentDate: currentItem.appointmentDate || '',
      tenureStart: currentItem.tenureStart || '',
      tenureEnd: currentItem.tenureEnd || '',
      remarks: currentItem.remarks || '',
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
      if (isPending) {
        setPending({ ...item, [k]: v });
      } else if (idx !== undefined) {
        updItem(idx, k, v);
      }
    };

    return (
      <>
        <div className="form-row form-row-1">
          {fg('Administrative Charge *', sel(item.administrativeCharge, v => handleChargeChange(item, v, isPending, idx), departmentalChargesOpts))}
        </div>
        {item.administrativeCharge && (
          <>
            <ChargeSpecificFields item={item} setVal={setVal} />
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
          <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Departmental Charges</h5>
          <button
            type="button"
            onClick={() => setPending({ ...EMPTY_RESPONSIBILITY })}
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
                  <button type="button" onClick={() => setPending(null)} style={btnCancel}><X size={14} /> Cancel</button>
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
                        <button type="button" onClick={() => setEditingIndex(null)} style={btnCancel}><X size={14} /> Cancel</button>
                        <button type="button" onClick={() => setEditingIndex(null)} style={btnSave}><Check size={14} /> Save</button>
                        <button type="button" onClick={() => { update(responsibilities.filter((_: any, j: number) => j !== i)); setEditingIndex(null); }} style={btnDelete}><Trash2 size={14} /> Delete</button>
                      </div>
                    </div>
                    {renderForm(r, false, i)}
                  </>
                ) : (
                  <RespPreviewCard
                    r={r}
                    onEdit={() => setEditingIndex(i)}
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
