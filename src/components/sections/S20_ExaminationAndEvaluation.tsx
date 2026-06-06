import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fg, inp, dateInp, sel } from './sectionUtils';
import { examinationEvaluationOptions } from '../../shared/dropdownOptions';
import { useDropdownOptions } from '../../shared/useDropdownOptions';

const CHARGE_SCHEDULING = 'Assisting the Controller of Examinations in scheduling, seating, and logistics';
const CHARGE_TABULATION = 'Helping with tabulation, moderation, and publication of results';
const CHARGE_DISCIPLINARY = 'Serving on disciplinary boards during exams';
const CHARGE_CONTRIBUTING = 'Contributing questions for question bank';
const CHARGE_MANAGING = 'Managing Question bank';

const ACTIVITY_TYPE_OPTIONS = ['Tabulation', 'Moderation', 'Result Publication'];

const EMPTY_RESPONSIBILITY = {
  administrativeCharge: '',
  institutionName: '',
  departmentName: '',
  boardName: '',
  courseName: '',
  subjectArea: '',
  examinationSession: '',
  activityType: '',
  roleDescription: '',
  coursesManaged: '',
  examinationSessionsHandled: '',
  responsibilities: '',
  title: '',
  description: '',
  contributionDate: '',
  appointmentDate: '',
  tenureStart: '',
  tenureEnd: '',
  remarks: '',
};

const PREVIEW_LABELS: Record<string, string> = {
  institutionName: 'Institution Name',
  departmentName: 'Department Name',
  boardName: 'Board Name',
  courseName: 'Course Name',
  subjectArea: 'Subject Area',
  examinationSession: 'Examination Session',
  activityType: 'Activity Type',
  roleDescription: 'Role Description',
  coursesManaged: 'Courses Managed',
  examinationSessionsHandled: 'Examination Sessions Handled',
  responsibilities: 'Responsibilities',
  title: 'Responsibility Title',
  description: 'Description',
  contributionDate: 'Contribution Date',
  appointmentDate: 'Appointment Date',
  tenureStart: 'Tenure Start',
  tenureEnd: 'Tenure End',
  remarks: 'Remarks',
};

const REQUIRED_FIELDS: Record<string, string[]> = {
  'Controller of Examination': ['institutionName', 'appointmentDate', 'tenureStart'],
  [CHARGE_SCHEDULING]: ['examinationSession', 'appointmentDate', 'tenureStart'],
  [CHARGE_TABULATION]: ['examinationSession', 'activityType', 'appointmentDate', 'tenureStart'],
  [CHARGE_DISCIPLINARY]: ['boardName', 'examinationSession', 'appointmentDate', 'tenureStart'],
  [CHARGE_CONTRIBUTING]: ['courseName', 'subjectArea', 'contributionDate', 'appointmentDate'],
  [CHARGE_MANAGING]: ['departmentName', 'appointmentDate', 'tenureStart'],
  Other: ['title', 'appointmentDate', 'tenureStart'],
};

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#16a34a', color: '#fff', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', marginLeft: 8 };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#9f1239', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };

function getTenureStart(r: any) {
  return r.tenureStart || r.from || '';
}

function getTenureEnd(r: any) {
  return r.tenureEnd || r.to || '';
}

function getSubtitle(r: any) {
  return r.institutionName || r.examinationSession || r.boardName || r.courseName
    || r.departmentName || r.title || r.description || '';
}

function isComplete(r: any) {
  if (!r.administrativeCharge) return false;
  const required = REQUIRED_FIELDS[r.administrativeCharge] || ['appointmentDate', 'tenureStart'];
  return required.every(k => Boolean(r[k]));
}

function textArea(v: string, fn: (s: string) => void, ph = '') {
  return (
    <textarea
      className="form-input"
      rows={3}
      value={v || ''}
      onChange={e => fn(e.target.value)}
      placeholder={ph}
      style={{ resize: 'vertical' }}
    />
  );
}

function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function TenureFields({ item, onChange }: { item: any; onChange: (item: any) => void }) {
  const set = (k: string, v: string) => onChange({ ...item, [k]: v });
  return (
    <div className="form-row form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {fg('Tenure Start', dateInp(item.tenureStart, v => set('tenureStart', v)))}
      {fg('Tenure End', dateInp(item.tenureEnd, v => set('tenureEnd', v)))}
    </div>
  );
}

function ResponsibilityFormFields({ item, onChange }: { item: any; onChange: (item: any) => void }) {
  const set = (k: string, v: string) => onChange({ ...item, [k]: v });
  const charge = item.administrativeCharge;

  const appointmentDate = fg('Appointment Date', dateInp(item.appointmentDate, v => set('appointmentDate', v)));
  const remarks = fg('Remarks', textArea(item.remarks, v => set('remarks', v), 'Optional notes'));

  if (!charge) {
    return <div className="empty-state" style={{ marginTop: 8 }}>Select a responsibility to see the form fields.</div>;
  }

  switch (charge) {
    case 'Controller of Examination':
      return (
        <>
          {fg('Institution Name', inp(item.institutionName, v => set('institutionName', v)))}
          {appointmentDate}
          <TenureFields item={item} onChange={onChange} />
          {fg('Examination Sessions Handled', inp(item.examinationSessionsHandled, v => set('examinationSessionsHandled', v), 'e.g. Dec 2024, May 2025'))}
          {fg('Responsibilities', textArea(item.responsibilities, v => set('responsibilities', v), 'Key responsibilities handled'))}
          {remarks}
        </>
      );
    case CHARGE_SCHEDULING:
      return (
        <>
          {fg('Examination Session', inp(item.examinationSession, v => set('examinationSession', v)))}
          {fg('Role Description', textArea(item.roleDescription, v => set('roleDescription', v), 'Scheduling, seating, logistics duties'))}
          {appointmentDate}
          <TenureFields item={item} onChange={onChange} />
          {remarks}
        </>
      );
    case CHARGE_TABULATION:
      return (
        <>
          {fg('Examination Session', inp(item.examinationSession, v => set('examinationSession', v)))}
          {fg('Activity Type', sel(item.activityType, v => set('activityType', v), ACTIVITY_TYPE_OPTIONS))}
          {appointmentDate}
          <TenureFields item={item} onChange={onChange} />
          {remarks}
        </>
      );
    case CHARGE_DISCIPLINARY:
      return (
        <>
          {fg('Board Name', inp(item.boardName, v => set('boardName', v)))}
          {fg('Examination Session', inp(item.examinationSession, v => set('examinationSession', v)))}
          {appointmentDate}
          <TenureFields item={item} onChange={onChange} />
          {remarks}
        </>
      );
    case CHARGE_CONTRIBUTING:
      return (
        <>
          {fg('Course Name', inp(item.courseName, v => set('courseName', v)))}
          {fg('Subject Area', inp(item.subjectArea, v => set('subjectArea', v)))}
          {fg('Contribution Date', dateInp(item.contributionDate, v => set('contributionDate', v)))}
          {appointmentDate}
          {remarks}
        </>
      );
    case CHARGE_MANAGING:
      return (
        <>
          {fg('Department Name', inp(item.departmentName, v => set('departmentName', v)))}
          {fg('Courses Managed', inp(item.coursesManaged, v => set('coursesManaged', v), 'Courses covered in the question bank'))}
          {appointmentDate}
          <TenureFields item={item} onChange={onChange} />
          {remarks}
        </>
      );
    case 'Other':
      return (
        <>
          {fg('Responsibility Title', inp(item.title, v => set('title', v)))}
          {fg('Department / Unit', inp(item.departmentName, v => set('departmentName', v)))}
          {fg('Description', textArea(item.description, v => set('description', v), 'Brief description of the role'))}
          {appointmentDate}
          <TenureFields item={item} onChange={onChange} />
          {remarks}
        </>
      );
    default:
      return null;
  }
}

function RespPreviewCard({ r, onEdit, onDelete, disabled }: { r: any; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const tenureStart = getTenureStart(r);
  const tenureEnd = getTenureEnd(r);
  const subtitle = getSubtitle(r);

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
              {tenureStart && (
                <span className="badge badge-secondary">
                  {tenureStart}{tenureEnd ? ` — ${tenureEnd}` : ' — Present'}
                </span>
              )}
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
          <PreviewRow label="Administrative Charge" value={r.administrativeCharge} />
          {Object.entries(PREVIEW_LABELS).map(([key, label]) => (
            <PreviewRow key={key} label={label} value={r[key]} />
          ))}
        </div>
      )}
    </>
  );
}

function ResponsibilityEditor({
  item,
  onChange,
  onCancel,
  onSave,
  title,
}: {
  item: any;
  onChange: (item: any) => void;
  onCancel: () => void;
  onSave: () => void;
  title: string;
}) {
  const examEvalOpts = useDropdownOptions(examinationEvaluationOptions);

  const handleChargeChange = (v: string) => {
    onChange({ ...EMPTY_RESPONSIBILITY, administrativeCharge: v });
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{title}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onCancel} style={btnCancel}><X size={14} /> Cancel</button>
          <button
            type="button"
            onClick={onSave}
            disabled={!isComplete(item)}
            style={isComplete(item) ? btnSave : { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
          >
            <Check size={14} /> Save
          </button>
        </div>
      </div>
      <div className="form-row form-row-1">
        {fg('Administrative Charge *', sel(item.administrativeCharge, handleChargeChange, examEvalOpts))}
      </div>
      <ResponsibilityFormFields item={item} onChange={onChange} />
    </>
  );
}

export default function ExaminationAndEvaluation({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const responsibilities = Array.isArray(data) ? data : (data?.responsibilities || []);
  const update = (val: any) => onChange(val);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<any>(null);

  const updItem = (i: number, item: any) => {
    const a = [...responsibilities];
    a[i] = item;
    update(a);
  };

  const handleSavePending = (item: any) => {
    if (isComplete(item)) {
      update([item, ...responsibilities]);
      setPending(null);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 40 }}>
        <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Examination & Evaluation</h5>
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
              <ResponsibilityEditor
                item={pending}
                onChange={setPending}
                onCancel={() => setPending(null)}
                onSave={() => handleSavePending(pending)}
                title="New Responsibility"
              />
            </div>
          )}

          {responsibilities.map((r: any, i: number) => {
            const isEditing = editingIndex === i;
            return (
              <div key={`r-${i}`} className="list-item-card">
                {isEditing ? (
                  <ResponsibilityEditor
                    item={r}
                    onChange={item => updItem(i, item)}
                    onCancel={() => setEditingIndex(null)}
                    onSave={() => setEditingIndex(null)}
                    title="Editing Responsibility"
                  />
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
