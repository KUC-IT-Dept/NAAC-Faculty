import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fg, inp, dateInp, sel, ta } from './sectionUtils';
import { extraInstitutionalOptions, institutionsOptions } from '../../shared/dropdownOptions';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import SearchableSelect from '../SearchableSelect';

const EMPTY_RESPONSIBILITY: Record<string, string> = {
  administrativeCharge: '',
  institutionName: '',
  universityName: '',
  organizationName: '',
  department: '',
  facultyName: '',
  programName: '',
  courseName: '',
  role: '',
  nominationType: '',
  examinationType: '',
  title: '',
  description: '',
  appointmentDate: '',
  tenureStart: '',
  tenureEnd: '',
  remarks: '',
};

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#fff1f2', color: '#e11d48', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#16a34a', color: '#fff', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#9f1239', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };

/** Returns a human-readable subtitle for the selected charge */
function getChargeSubtitle(r: any): string {
  const charge = (r.administrativeCharge || '').toLowerCase();
  if (charge.includes('syndicate')) return r.universityName || '';
  if (charge.includes('board of studies')) return [r.universityName, r.department].filter(Boolean).join(' · ');
  if (charge.includes('visiting')) return [r.institutionName, r.department].filter(Boolean).join(' · ');
  if (charge.includes('examiner')) return [r.universityName, r.courseName].filter(Boolean).join(' · ');
  if (charge.includes('syllabus')) return [r.universityName, r.programName].filter(Boolean).join(' · ');
  if (charge.includes('dean')) return [r.institutionName, r.facultyName].filter(Boolean).join(' · ');
  // Other
  return [r.title, r.organizationName].filter(Boolean).join(' · ');
}

/** Renders the charge-specific form fields */
function ChargeSpecificFields({ item, setVal }: { item: any; setVal: (k: string, v: string) => void }) {
  const charge = (item.administrativeCharge || '').toLowerCase();
  const institutionsOpts = useDropdownOptions(institutionsOptions);

  if (charge.includes('syndicate')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('University Name', <SearchableSelect value={item.universityName || ''} onChange={(v: string) => setVal('universityName', v)} options={institutionsOpts} placeholder="Search or Enter University" />)}
          {fg('Nomination Type', sel(item.nominationType, v => setVal('nominationType', v), ['Elected', 'Nominated']))}
        </div>
      </>
    );
  }

  if (charge.includes('board of studies')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('University Name', <SearchableSelect value={item.universityName || ''} onChange={(v: string) => setVal('universityName', v)} options={institutionsOpts} placeholder="Search or Enter University" />)}
          {fg('Department / Subject Area', inp(item.department, v => setVal('department', v), 'Enter department or subject area'))}
        </div>
        <div className="form-row form-row-1">
          {fg('Role', sel(item.role, v => setVal('role', v), ['Chairman', 'Member']))}
        </div>
      </>
    );
  }

  if (charge.includes('visiting')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Institution Name', <SearchableSelect value={item.institutionName || ''} onChange={(v: string) => setVal('institutionName', v)} options={institutionsOpts} placeholder="Search or Enter Institution" />)}
          {fg('Department', inp(item.department, v => setVal('department', v), 'Enter department'))}
        </div>
      </>
    );
  }

  if (charge.includes('examiner')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('University Name', <SearchableSelect value={item.universityName || ''} onChange={(v: string) => setVal('universityName', v)} options={institutionsOpts} placeholder="Search or Enter University" />)}
          {fg('Course / Subject', inp(item.courseName, v => setVal('courseName', v), 'Enter course or subject'))}
        </div>
        <div className="form-row form-row-1">
          {fg('Examination Type', inp(item.examinationType, v => setVal('examinationType', v), 'e.g. Internal, External, Viva-voce'))}
        </div>
      </>
    );
  }

  if (charge.includes('syllabus')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('University Name', <SearchableSelect value={item.universityName || ''} onChange={(v: string) => setVal('universityName', v)} options={institutionsOpts} placeholder="Search or Enter University" />)}
          {fg('Program / Course', inp(item.programName, v => setVal('programName', v), 'Enter program or course name'))}
        </div>
        <div className="form-row form-row-1">
          {fg('Role', sel(item.role, v => setVal('role', v), ['Chairman', 'Member']))}
        </div>
      </>
    );
  }

  if (charge.includes('dean')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Institution Name', <SearchableSelect value={item.institutionName || ''} onChange={(v: string) => setVal('institutionName', v)} options={institutionsOpts} placeholder="Search or Enter Institution" />)}
          {fg('Faculty / School', inp(item.facultyName, v => setVal('facultyName', v), 'Enter faculty or school name'))}
        </div>
      </>
    );
  }

  // Other
  return (
    <>
      <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {fg('Responsibility Title', inp(item.title, v => setVal('title', v), 'Enter responsibility title'))}
        {fg('Organization / Institution', <SearchableSelect value={item.organizationName || ''} onChange={(v: string) => setVal('organizationName', v)} options={institutionsOpts} placeholder="Search or Enter Organization" />)}
      </div>
      <div className="form-row form-row-1">
        {fg('Description', ta(item.description, v => setVal('description', v), 'Describe the responsibility', 2))}
      </div>
    </>
  );
}

/** Renders the common date + remarks fields */
function CommonFields({ item, setVal }: { item: any; setVal: (k: string, v: string) => void }) {
  return (
    <>
      <div className="form-row form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {fg('Appointment Date', dateInp(item.appointmentDate, v => setVal('appointmentDate', v)))}
        {fg('From Date', dateInp(item.tenureStart, v => setVal('tenureStart', v)))}
        {fg('To Date', dateInp(item.tenureEnd, v => setVal('tenureEnd', v)))}
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

  if (charge.includes('syndicate')) {
    return (
      <>
        <PreviewRow label="University Name" value={r.universityName} />
        <PreviewRow label="Nomination Type" value={r.nominationType} />
      </>
    );
  }
  if (charge.includes('board of studies')) {
    return (
      <>
        <PreviewRow label="University Name" value={r.universityName} />
        <PreviewRow label="Department" value={r.department} />
        <PreviewRow label="Role" value={r.role} />
      </>
    );
  }
  if (charge.includes('visiting')) {
    return (
      <>
        <PreviewRow label="Institution Name" value={r.institutionName} />
        <PreviewRow label="Department" value={r.department} />
      </>
    );
  }
  if (charge.includes('examiner')) {
    return (
      <>
        <PreviewRow label="University Name" value={r.universityName} />
        <PreviewRow label="Course / Subject" value={r.courseName} />
        <PreviewRow label="Examination Type" value={r.examinationType} />
      </>
    );
  }
  if (charge.includes('syllabus')) {
    return (
      <>
        <PreviewRow label="University Name" value={r.universityName} />
        <PreviewRow label="Program / Course" value={r.programName} />
        <PreviewRow label="Role" value={r.role} />
      </>
    );
  }
  if (charge.includes('dean')) {
    return (
      <>
        <PreviewRow label="Institution Name" value={r.institutionName} />
        <PreviewRow label="Faculty / School" value={r.facultyName} />
      </>
    );
  }
  // Other
  return (
    <>
      <PreviewRow label="Title" value={r.title} />
      <PreviewRow label="Organization" value={r.organizationName} />
      <PreviewRow label="Description" value={r.description} />
    </>
  );
}

function RespPreviewCard({ r, onEdit, onDelete, disabled }: { r: any; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const subtitle = getChargeSubtitle(r);
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
              {r.tenureStart && <span className="badge badge-secondary">{r.tenureStart}{r.tenureEnd ? ` — ${r.tenureEnd}` : ' — Present'}</span>}
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
          <PreviewRow label="From" value={r.tenureStart} />
          <PreviewRow label="To" value={r.tenureEnd} />
          <PreviewRow label="Remarks" value={r.remarks} />
        </div>
      )}
    </>
  );
}

export default function ExtraInstitutionalActivities({ data, onChange, onPersist }: { data: any; onChange: (d: any) => void; onPersist?: (d: any, showToast?: boolean) => Promise<void> | void }) {
  const responsibilities = Array.isArray(data) ? data : (data?.responsibilities || []);
  const update = (val: any) => onChange(val);

  // Reactive dropdown options
  const extraInstitutionalOpts = useDropdownOptions(extraInstitutionalOptions);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<any>(null);

  const updItem = (i: number, k: string, v: string) => {
    const a = [...responsibilities];
    a[i] = { ...a[i], [k]: v };
    update(a);
  };

  const isComplete = (r: any) => !!r.administrativeCharge;

  const handleSavePending = async (item: any) => {
    if (isComplete(item)) { 
      const updated = [item, ...responsibilities];
      update(updated); 
      setPending(null); 
      if (onPersist) await onPersist(updated, true);
    }
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
        setPending((prev: any) => ({ ...prev, [k]: v }));
      } else if (idx !== undefined) {
        updItem(idx, k, v);
      }
    };

    return (
      <>
        <div className="form-row form-row-1">
          {fg('Administrative Charge *', sel(item.administrativeCharge, v => handleChargeChange(item, v, isPending, idx), extraInstitutionalOpts))}
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
          <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Activities – Extra Institutional</h5>
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
                        <button type="button" onClick={async () => { setEditingIndex(null); if (onPersist) await onPersist(responsibilities, true); }} style={btnSave}><Check size={14} /> Save</button>
                        <button type="button" onClick={async () => { const updated = responsibilities.filter((_: any, j: number) => j !== i); update(updated); setEditingIndex(null); if (onPersist) await onPersist(updated, false); }} style={btnDelete}><Trash2 size={14} /> Delete</button>
                      </div>
                    </div>
                    {renderForm(r, false, i)}
                  </>
                ) : (
                  <RespPreviewCard
                    r={r}
                    onEdit={() => setEditingIndex(i)}
                    onDelete={async () => { const updated = responsibilities.filter((_: any, j: number) => j !== i); update(updated); if (onPersist) await onPersist(updated, false); }}
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
