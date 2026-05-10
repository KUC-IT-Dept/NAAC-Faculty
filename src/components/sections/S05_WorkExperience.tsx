import { Plus, Trash2, Edit2, Check, ExternalLink, X } from 'lucide-react';
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

/* ─── Structured Preview ─────────────────────────────────────── */
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

export default function WorkExperience({ data, onChange }: { data: WorkExp[]; onChange: (d: WorkExp[]) => void; }) {

  const upd = (i: number, k: keyof WorkExp, v: string) => {
    const arr = [...data];
    arr[i] = { ...arr[i], [k]: v };
    onChange(arr);
  };

  const toggleEdit = (i: number, state: boolean) => {
    const arr = [...data];
    arr[i].isEditing = state;
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

  return (
    <>
      <div className="section-header-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onChange([{ ...EMPTY }, ...data])}
        >
          <Plus size={14} /> Add Work Experience
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{i === 0 && !e.organization ? 'New Entry' : 'Editing Entry'}</span>
                  <div>
                    <button
                      type="button" className="btn btn-success btn-xs"
                      onClick={() => toggleEdit(i, false)}
                    >
                      <Check size={12} /> Save
                    </button>
                    <button
                      type="button" className="btn btn-danger btn-xs"
                      style={{ marginLeft: 8 }}
                      onClick={() => onChange(data.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>

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
                  <input type="file" multiple className="form-input" onChange={e => handleFileUpload(i, e.target.files)} />
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
              <>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <PreviewRow label="Institution Name" value={e.organization} />
                      <PreviewRow label="Designation" value={e.designation} />
                      <PreviewRow label="Department" value={e.department} />
                      <PreviewRow label="From–To" value={`${e.from ? new Date(e.from).toLocaleDateString() : '-'} → ${e.to ? new Date(e.to).toLocaleDateString() : '-'}`} />
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
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <button
                    type="button" className="btn btn-ghost btn-xs"
                    onClick={() => toggleEdit(i, true)}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    type="button" className="btn btn-danger btn-xs"
                    onClick={() => onChange(data.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}