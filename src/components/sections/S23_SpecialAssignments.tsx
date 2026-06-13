import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fg, inp, dateInp, sel, ta } from './sectionUtils';
import { specialAssignmentsOptions, institutionsOptions } from '../../shared/dropdownOptions';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import SearchableSelect from '../SearchableSelect';

const EMPTY_RESPONSIBILITY: Record<string, string> = {
  administrativeCharge: '',
  organizationName: '',
  programName: '',
  cellName: '',
  nssUnitNumber: '',
  nccUnitName: '',
  role: '',
  roleDescription: '',
  responsibilityArea: '',
  activityType: '',
  activitiesConducted: '',
  placementActivities: '',
  platformName: '',
  communityPartner: '',
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
  if (charge.includes('community service')) return [r.programName, r.communityPartner].filter(Boolean).join(' · ');
  if (charge.includes('coordinating nss')) return [r.nssUnitNumber, r.role].filter(Boolean).join(' · ');
  if (charge.includes('coordinating ncc')) return [r.nccUnitName, r.role].filter(Boolean).join(' · ');
  if (charge.includes('industry linkages')) return [r.activityType, r.organizationName].filter(Boolean).join(' · ');
  if (charge.includes('managing lms')) return [r.platformName, r.responsibilityArea].filter(Boolean).join(' · ');
  if (charge.includes('pro') || charge.includes('public relations')) return [r.organizationName, r.responsibilityArea].filter(Boolean).join(' · ');
  if (charge.includes('coordinator job') || charge.includes('coordinator - job')) return r.cellName || '';
  if (charge.includes('member job') || charge.includes('member - job')) return r.cellName || '';
  // Other
  return [r.title, r.organizationName].filter(Boolean).join(' · ');
}

/** Renders the charge-specific form fields */
function ChargeSpecificFields({ item, setVal }: { item: any; setVal: (k: string, v: string) => void }) {
  const charge = (item.administrativeCharge || '').toLowerCase();
  const institutionsOpts = useDropdownOptions(institutionsOptions);

  if (charge.includes('community service')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Program Name', inp(item.programName, v => setVal('programName', v), 'Enter program name'))}
          {fg('Community Partner / Agency', inp(item.communityPartner, v => setVal('communityPartner', v), 'Enter community partner'))}
        </div>
        <div className="form-row form-row-1">
          {fg('Role Description', ta(item.roleDescription, v => setVal('roleDescription', v), 'Describe role', 2))}
        </div>
      </>
    );
  }

  if (charge.includes('coordinating nss')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('NSS Unit Number', inp(item.nssUnitNumber, v => setVal('nssUnitNumber', v), 'Enter NSS unit number'))}
          {fg('Role', sel(item.role, v => setVal('role', v), ['Programme Officer', 'Coordinator']))}
        </div>
        <div className="form-row form-row-1">
          {fg('Activities Conducted', ta(item.activitiesConducted, v => setVal('activitiesConducted', v), 'Describe activities conducted', 2))}
        </div>
      </>
    );
  }

  if (charge.includes('coordinating ncc')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('NCC Unit Name', inp(item.nccUnitName, v => setVal('nccUnitName', v), 'Enter NCC unit name'))}
          {fg('Role', inp(item.role, v => setVal('role', v), 'Enter role'))}
        </div>
        <div className="form-row form-row-1">
          {fg('Activities Conducted', ta(item.activitiesConducted, v => setVal('activitiesConducted', v), 'Describe activities conducted', 2))}
        </div>
      </>
    );
  }

  if (charge.includes('industry linkages')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Activity Type', inp(item.activityType, v => setVal('activityType', v), 'Enter activity type'))}
          {fg('Industry / Organization Name', <SearchableSelect value={item.organizationName || ''} onChange={(v: string) => setVal('organizationName', v)} options={institutionsOpts} placeholder="Search or Enter Organization" />)}
        </div>
        <div className="form-row form-row-1">
          {fg('Role Description', ta(item.roleDescription, v => setVal('roleDescription', v), 'Describe role', 2))}
        </div>
      </>
    );
  }

  if (charge.includes('managing lms')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('LMS / Platform Name', inp(item.platformName, v => setVal('platformName', v), 'Enter platform name'))}
          {fg('Responsibility Area', inp(item.responsibilityArea, v => setVal('responsibilityArea', v), 'Enter responsibility area'))}
        </div>
      </>
    );
  }

  if (charge.includes('pro') || charge.includes('public relations')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Institution / Organization', <SearchableSelect value={item.organizationName || ''} onChange={(v: string) => setVal('organizationName', v)} options={institutionsOpts} placeholder="Search or Enter Organization" />)}
          {fg('Responsibility Area', inp(item.responsibilityArea, v => setVal('responsibilityArea', v), 'Enter responsibility area'))}
        </div>
      </>
    );
  }

  if (charge.includes('coordinator job') || charge.includes('coordinator - job')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Cell Name', inp(item.cellName, v => setVal('cellName', v), 'Enter cell name'))}
          {fg('Role Description', ta(item.roleDescription, v => setVal('roleDescription', v), 'Describe role', 2))}
        </div>
        <div className="form-row form-row-1">
          {fg('Placement Activities', ta(item.placementActivities, v => setVal('placementActivities', v), 'Describe placement activities', 2))}
        </div>
      </>
    );
  }

  if (charge.includes('member job') || charge.includes('member - job')) {
    return (
      <>
        <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fg('Cell Name', inp(item.cellName, v => setVal('cellName', v), 'Enter cell name'))}
          {fg('Responsibility Area', inp(item.responsibilityArea, v => setVal('responsibilityArea', v), 'Enter responsibility area'))}
        </div>
      </>
    );
  }

  // Other
  return (
    <>
      <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {fg('Responsibility Title', inp(item.title, v => setVal('title', v), 'Enter responsibility title'))}
        {fg('Organization / Unit', <SearchableSelect value={item.organizationName || ''} onChange={(v: string) => setVal('organizationName', v)} options={institutionsOpts} placeholder="Search or Enter Organization" />)}
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

  if (charge.includes('community service')) {
    return (
      <>
        <PreviewRow label="Program Name" value={r.programName} />
        <PreviewRow label="Community Partner" value={r.communityPartner} />
        <PreviewRow label="Role Description" value={r.roleDescription} />
      </>
    );
  }
  if (charge.includes('coordinating nss')) {
    return (
      <>
        <PreviewRow label="NSS Unit Number" value={r.nssUnitNumber} />
        <PreviewRow label="Role" value={r.role} />
        <PreviewRow label="Activities Conducted" value={r.activitiesConducted} />
      </>
    );
  }
  if (charge.includes('coordinating ncc')) {
    return (
      <>
        <PreviewRow label="NCC Unit Name" value={r.nccUnitName} />
        <PreviewRow label="Role" value={r.role} />
        <PreviewRow label="Activities Conducted" value={r.activitiesConducted} />
      </>
    );
  }
  if (charge.includes('industry linkages')) {
    return (
      <>
        <PreviewRow label="Activity Type" value={r.activityType} />
        <PreviewRow label="Organization" value={r.organizationName} />
        <PreviewRow label="Role Description" value={r.roleDescription} />
      </>
    );
  }
  if (charge.includes('managing lms')) {
    return (
      <>
        <PreviewRow label="Platform Name" value={r.platformName} />
        <PreviewRow label="Responsibility Area" value={r.responsibilityArea} />
      </>
    );
  }
  if (charge.includes('pro') || charge.includes('public relations')) {
    return (
      <>
        <PreviewRow label="Organization" value={r.organizationName} />
        <PreviewRow label="Responsibility Area" value={r.responsibilityArea} />
      </>
    );
  }
  if (charge.includes('coordinator job') || charge.includes('coordinator - job')) {
    return (
      <>
        <PreviewRow label="Cell Name" value={r.cellName} />
        <PreviewRow label="Role Description" value={r.roleDescription} />
        <PreviewRow label="Placement Activities" value={r.placementActivities} />
      </>
    );
  }
  if (charge.includes('member job') || charge.includes('member - job')) {
    return (
      <>
        <PreviewRow label="Cell Name" value={r.cellName} />
        <PreviewRow label="Responsibility Area" value={r.responsibilityArea} />
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

export default function SpecialAssignments({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const responsibilities = Array.isArray(data) ? data : (data?.responsibilities || []);
  const update = (val: any) => onChange(val);

  // Reactive dropdown options
  const specialAssignmentsOpts = useDropdownOptions(specialAssignmentsOptions);

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
          {fg('Administrative Charge *', sel(item.administrativeCharge, v => handleChargeChange(item, v, isPending, idx), specialAssignmentsOpts))}
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
          <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Special Assignments</h5>
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
