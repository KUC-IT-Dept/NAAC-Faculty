import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, X, ChevronDown, ChevronUp } from 'lucide-react';
import { fg, inp, sel, dateInp } from './sectionUtils';

type UploadedFile = {
  name: string;
  url?: string;
};

type WorkExp = {
  organization: string;
  designation: string;
  department?: string;
  from: string;
  to: string;
  nature: string;
  reasonForLeaving: string;
  files: UploadedFile[];
  isEditing?: boolean;
};

const EMPTY: WorkExp = {
  organization: '',
  designation: '',
  department: '',
  from: '',
  to: '',
  nature: '',
  reasonForLeaving: '',
  files: [],
  isEditing: true,
};

const DEFAULT_DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Researcher', 'Industry Professional'];
const DEFAULT_DEPARTMENTS = ['Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Mathematics', 'Physics', 'Chemistry', 'Commerce', 'Management', 'English'];
const DEFAULT_NATURES = ['Teaching', 'Research', 'Industry / Corporate', 'Administrative', 'Contract', 'Permanent'];
const DEFAULT_REASONS = ['Career Growth', 'Higher Studies', 'Relocation', 'Better Opportunity', 'Contract Completed', 'Personal Reasons'];

/* ─── Shared Button Styles ───────────────────────────────────── */
const btnStyles = {
  add: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#4f46e5', color: '#ffffff',
    padding: '8px 16px', borderRadius: '6px',
    fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer'
  } as React.CSSProperties,
  edit: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#f8fafc', color: '#334155',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer'
  } as React.CSSProperties,
  delete: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#fff1f2', color: '#be123c',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer'
  } as React.CSSProperties,
  save: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#10b981', color: '#ffffff',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer'
  } as React.CSSProperties,
  saveDisabled: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#d1fae5', color: '#6ee7b7',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'not-allowed'
  } as React.CSSProperties,
  cancel: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: '#f1f5f9', color: '#475569',
    padding: '6px 12px', borderRadius: '6px',
    fontSize: '13px', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer'
  } as React.CSSProperties,
};

/* ─── Structured Preview Row ─────────────────────────────────── */
function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Preview Card with toggle ───────────────────────────────── */
function PreviewCard({
  e,
  i,
  data,
  onChange,
  toggleEdit,
  calculateDuration,
}: {
  e: WorkExp;
  i: number;
  data: WorkExp[];
  onChange: (d: WorkExp[]) => void;
  toggleEdit: (i: number, state: boolean) => void;
  calculateDuration: (from: string, to: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* ── Collapsed header row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          {/* Year / duration badge */}
          <div style={{
            minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8,
            background: 'var(--primary, #2563eb)', flexShrink: 0,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
              {e.from ? new Date(e.from).getFullYear() : '—'}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>From</div>
          </div>

          {/* Summary */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {e.organization || 'Untitled Organisation'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {e.designation && (
                <span className="badge badge-secondary">{e.designation}</span>
              )}
              {e.nature && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.nature}</span>
              )}
              {e.from && e.to && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {calculateDuration(e.from, e.to)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
          <button type="button" style={btnStyles.edit} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide' : 'View'}
          </button>
          <button type="button" style={btnStyles.edit} onClick={(ev) => { ev.stopPropagation(); toggleEdit(i, true); }}>
            <Edit2 size={14} /> Edit
          </button>
          <button type="button" style={btnStyles.delete} onClick={(ev) => { ev.stopPropagation(); onChange(data.filter((_, idx) => idx !== i)); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <PreviewRow label="Institution Name" value={e.organization} />
            <PreviewRow label="Designation" value={e.designation} />
            <PreviewRow label="Department" value={e.department} />
            <PreviewRow label="From – To" value={`${e.from ? new Date(e.from).toLocaleDateString() : '-'} → ${e.to ? new Date(e.to).toLocaleDateString() : '-'}`} />
            <PreviewRow label="Total Duration" value={calculateDuration(e.from, e.to)} />
            <PreviewRow label="Nature of Appointment" value={e.nature} />
            <PreviewRow label="Reason for Leaving" value={e.reasonForLeaving} />
          </div>

          {e.files?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Documents</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {e.files.map((f, idx) => (
                  <a key={idx} href={f.url} target="_blank" rel="noreferrer" className="preview-file-link" style={{ fontSize: 12 }}>
                    <ExternalLink size={12} /> {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function WorkExperience({ data, onChange }: { data: WorkExp[]; onChange: (d: WorkExp[]) => void; }) {

  const upd = (i: number, k: keyof WorkExp, v: string) => {
    const arr = [...data];
    arr[i] = { ...arr[i], [k]: v };
    onChange(arr);
  };

  const toggleEdit = (i: number, state: boolean) => {
    const arr = [...data];
    arr[i] = { ...arr[i], isEditing: state };
    onChange(arr);
  };

  const handleFileUpload = (i: number, files: FileList | null) => {
    if (!files) return;
    const uploadedFiles = Array.from(files).map((file: File) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    const arr = [...data];
    arr[i].files = [...(arr[i].files || []), ...uploadedFiles];
    onChange(arr);
  };

  const calculateDuration = (from: string, to: string) => {
    if (!from || !to) return '-';
    const start = new Date(from);
    const end = new Date(to);
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years < 0) return '-';
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
  };

  const isComplete = (e: WorkExp) => !!(e.organization?.trim());

  return (
    <>
      <div className="section-header-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          style={btnStyles.add}
          onClick={() => onChange([{ ...EMPTY }, ...data])}
        >
          <Plus size={16} /> Add Work Experience
        </button>
      </div>

      {data.length === 0 && (
        <div className="empty-state">
          No work experience added yet. Click <strong>Add Work Experience</strong> to get started.
        </div>
      )}

      <div className="items-list">
        {data.map((e, i) => (
          <div key={i} className={`item-card ${e.isEditing ? 'is-editing' : 'is-preview'}`}>

            {e.isEditing ? (
              <>
                {/* ── Edit mode header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                    {!e.organization ? 'New Entry' : 'Editing Entry'}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      style={isComplete(e) ? btnStyles.save : btnStyles.saveDisabled}
                      disabled={!isComplete(e)}
                      title={!isComplete(e) ? 'Please fill in the Institution Name' : 'Save entry'}
                      onClick={() => toggleEdit(i, false)}
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      type="button"
                      style={btnStyles.delete}
                      onClick={() => onChange(data.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* ── Form fields ── */}
                <div className="form-row form-row-3">
                  {fg('Institution Name *', inp(e.organization, v => upd(i, 'organization', v)))}
                  {fg('Designation', sel(e.designation, v => upd(i, 'designation', v), DEFAULT_DESIGNATIONS))}
                  {fg('Department', sel(e.department || '', v => upd(i, 'department', v), DEFAULT_DEPARTMENTS))}
                </div>

                <div className="form-row form-row-3">
                  {fg('From Date', dateInp(e.from, v => upd(i, 'from', v)))}
                  {fg('To Date', dateInp(e.to, v => upd(i, 'to', v)))}
                  {fg('Nature of Appointment', sel(e.nature, v => upd(i, 'nature', v), DEFAULT_NATURES))}
                </div>

                <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Total Duration: <span style={{ color: 'var(--primary)' }}>{calculateDuration(e.from, e.to)}</span>
                </div>

                <div className="form-row form-row-2">
                  {fg('Reason for Leaving', sel(e.reasonForLeaving, v => upd(i, 'reasonForLeaving', v), DEFAULT_REASONS))}
                </div>

                <div className="form-group" style={{ marginTop: 10 }}>
                  <label>Documents / Experience Proof</label>
                  <input type="file" multiple className="form-input" onChange={ev => handleFileUpload(i, ev.target.files)} />
                  {e.files?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {e.files.map((f, idx) => (
                        <div key={idx} style={{
                          background: 'var(--surface-alt, #f1f5f9)', padding: '4px 8px', borderRadius: 4,
                          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, border: '1px solid var(--border-light, #e2e8f0)'
                        }}>
                          <a href={f.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                            {f.name}
                          </a>
                          <button
                            type="button"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                            onClick={() => {
                              const arr = [...data];
                              arr[i].files = arr[i].files.filter((_, x) => x !== idx);
                              onChange(arr);
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <PreviewCard
                e={e}
                i={i}
                data={data}
                onChange={onChange}
                toggleEdit={toggleEdit}
                calculateDuration={calculateDuration}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}