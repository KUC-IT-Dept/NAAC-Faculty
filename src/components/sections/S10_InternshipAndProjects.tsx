import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Check, X, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { fg, inp, sel, Sub } from './sectionUtils';
import SearchableSelect from '../SearchableSelect';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import { degreeNameOptions } from '../../shared/dropdownOptions';

const emptyStudent = { studentName: '', program: '', status: 'Ongoing', title: '', organisation: '', role: '', fromDate: '', toDate: '' };
const statusOptions = ['Ongoing', 'Completed'];
const roleOptions = ['Intern', 'Trainee', 'Project Member'];

const summaryBoxStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '10px 12px',
  border: '1px solid var(--border-color, #d1d5db)',
  borderRadius: 8,
  backgroundColor: '#f8fafc',
  color: 'var(--text-color, #0f172a)',
  display: 'flex',
  alignItems: 'center',
  fontSize: 14,
  fontWeight: 600,
};

const cardPreviewRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '4px 0',
  borderBottom: '1px solid var(--border-light, #f1f5f9)',
};

const cardPreviewLabelStyle: React.CSSProperties = {
  minWidth: 160,
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  flexShrink: 0,
};

const cardPreviewValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-primary, #1e293b)',
  wordBreak: 'break-word',
};

const summaryListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 6,
  width: '100%',
};

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#fff1f2', color: '#e11d48', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#16a34a', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#9f1239', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };

function PreviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div style={cardPreviewRowStyle}>
      <span style={cardPreviewLabelStyle}>{label}</span>
      <span style={cardPreviewValueStyle}>{value}</span>
    </div>
  );
}

function getStatus(value: any) {
  return String(value || '').trim().toLowerCase();
}

function getDisplayName(entry: any) {
  return entry?.title?.trim() || entry?.studentName?.trim() || entry?.program?.trim() || entry?.organisation?.trim() || 'Internship / Project Entry';
}

function EntryCard({
  item,
  index,
  expanded,
  isEditing,
  onToggleExpanded,
  onStartEdit,
  onDelete,
  onChange,
  onSave,
  onCancel,
  programOptions,
}: {
  item: any;
  index: number;
  expanded: boolean;
  isEditing: boolean;
  onToggleExpanded: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  programOptions: string[];
}) {
  const displayName = getDisplayName(item);
  const duration = item.fromDate || item.toDate ? `${item.fromDate || '—'} to ${item.toDate || '—'}` : '';

  return (
    <div className="list-item-card" style={{ marginBottom: 12 }}>
      {isEditing ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong>{index === -1 ? 'New Student' : 'Edit Entry'}</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={onCancel} style={btnCancel}><X size={14} /> Cancel</button>
              <button type="button" onClick={onSave} style={btnSave}><Check size={14} /> Save</button>
            </div>
          </div>

          <div className="form-row form-row-2">
            {fg('STUDENT NAME *', inp(item.studentName, v => onChange('studentName', v), 'Enter student name'))}
            {fg('PROGRAM / COURSE *', (
              <SearchableSelect
                value={item.program || ''}
                onChange={v => onChange('program', v)}
                options={programOptions}
                placeholder="Search or Select Program/Course"
              />
            ))}
          </div>
          <div className="form-row form-row-2">
            {fg('INTERNSHIP / PROJECT TITLE *', inp(item.title, v => onChange('title', v), 'Enter internship / project title'))}
            {fg('STATUS *', sel(item.status, v => onChange('status', v), statusOptions))}
          </div>
          <div className="form-row form-row-2">
            {fg('ORGANIZATION / COMPANY *', inp(item.organisation, v => onChange('organisation', v), 'Enter organization / company'))}
            {fg('ROLE *', sel(item.role, v => onChange('role', v), roleOptions))}
          </div>
          <div className="form-row form-row-2">
            {fg('FROM DATE *', <input type="date" className="form-input" value={item.fromDate || ''} onChange={e => onChange('fromDate', e.target.value)} />)}
            {fg('TO DATE *', <input type="date" className="form-input" value={item.toDate || ''} onChange={e => onChange('toDate', e.target.value)} />)}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', flex: 1 }} onClick={onToggleExpanded}>
              <div style={{ minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{displayName.slice(0, 1).toUpperCase()}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Entry</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>{displayName}</span>
                  <span className={`badge ${getStatus(item.status) === 'completed' ? 'badge-active' : 'badge-pending'}`}>{item.status || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {item.studentName && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Student: {item.studentName}</span>}
                  {item.program && <span className="badge badge-secondary">{item.program}</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginLeft: 8, flexShrink: 0 }}>
              <button type="button" style={btnEdit} onClick={onToggleExpanded}>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {expanded ? 'Hide' : 'View'}
              </button>
              <button type="button" style={btnEdit} onClick={onStartEdit}>
                <Edit2 size={14} /> Edit
              </button>
              <button type="button" style={btnDelete} onClick={onDelete}><Trash2 size={14} /> Delete</button>
            </div>
          </div>

          {expanded && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
              <PreviewRow label="Student Name" value={item.studentName} />
              <PreviewRow label="Program / Course" value={item.program} />
              <PreviewRow label="Title" value={item.title} />
              <PreviewRow label="Status" value={item.status} />
              <PreviewRow label="Organisation / Company" value={item.organisation} />
              <PreviewRow label="Role" value={item.role} />
              <PreviewRow label="Duration" value={duration} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function InternshipAndProjects({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const programOptions = useDropdownOptions(degreeNameOptions);
  const [students, setStudents] = useState<any[]>(Array.isArray(data) ? data : []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<any>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    setStudents(Array.isArray(data) ? data : []);
  }, [data]);

  const summary = useMemo(() => {
    const completed = students.filter(student => getStatus(student?.status) === 'completed');
    const ongoing = students.filter(student => getStatus(student?.status) === 'ongoing');

    return {
      totalCompleted: String(completed.length),
      ongoingCount: String(ongoing.length),
      numberStudents: String(students.length),
      completedNames: completed.map(student => getDisplayName(student)).filter(Boolean) as string[],
    };
  }, [students]);

  const refreshParent = (arr: any[]) => { setStudents(arr); try { onChange(arr); } catch { /* ignore */ } };

  const handleAddRow = () => setPending({ ...emptyStudent });
  const savePending = (item: any) => {
    if (!item?.title?.trim()) return;
    const updated = [item, ...students];
    refreshParent(updated);
    setPending(null);
  };

  const updateStudent = (i: number, k: string, v: any) => { const a = [...students]; a[i] = { ...a[i], [k]: v }; refreshParent(a); };

  const removeStudent = (i: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
    if (editingIndex === i) setEditingIndex(null);
    refreshParent(students.filter((_, j) => j !== i));
  };

  const toggleExpanded = (i: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  };

  const finishEdit = (i: number) => {
    setEditingIndex(null);
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  };

  const updatePending = (k: string, v: any) => setPending((prev: any) => ({ ...prev, [k]: v }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {fg('TOTAL NUMBER OF INTERNSHIPS / PROJECTS COMPLETED', <div style={summaryBoxStyle}>{summary.totalCompleted}</div>)}
        {fg('NUMBER OF ONGOING INTERNSHIPS / PROJECTS', <div style={summaryBoxStyle}>{summary.ongoingCount}</div>)}
      </div>

      <div style={{ marginBottom: 12 }}>
        {fg(
          'NAMES OF COMPLETED INTERNSHIPS / PROJECTS',
          <div style={{ ...summaryBoxStyle, alignItems: 'stretch', padding: '10px 12px' }}>
            {summary.completedNames.length ? (
              <ul style={summaryListStyle}>
                {summary.completedNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}
              </ul>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>No completed internships / projects added yet...</span>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        {fg('NUMBER OF STUDENTS INVOLVED (COMPLETED)', <div style={summaryBoxStyle}>{summary.numberStudents}</div>)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Sub>Student Details</Sub>
        <div>
          <button type="button" onClick={handleAddRow} style={btnAdd}><Plus size={14} /> Add Student</button>
        </div>
      </div>

      {pending && (
        <div className="list-item-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong>New Student</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setPending(null)} style={btnCancel}><X size={14} /> Cancel</button>
              <button type="button" onClick={() => savePending(pending)} style={btnSave}><Check size={14} /> Save</button>
            </div>
          </div>
          <div className="form-row form-row-2">
            {fg('STUDENT NAME *', inp(pending.studentName, v => updatePending('studentName', v), 'Enter student name'))}
            {fg('PROGRAM / COURSE *', (
              <SearchableSelect
                value={pending.program || ''}
                onChange={v => updatePending('program', v)}
                options={programOptions}
                placeholder="Search or Select Program/Course"
              />
            ))}
          </div>
          <div className="form-row form-row-2">
            {fg('INTERNSHIP / PROJECT TITLE *', inp(pending.title, v => updatePending('title', v), 'Enter internship / project title'))}
            {fg('STATUS *', sel(pending.status, v => updatePending('status', v), statusOptions))}
          </div>
          <div className="form-row form-row-2">
            {fg('ORGANIZATION / COMPANY *', inp(pending.organisation, v => updatePending('organisation', v), 'Enter organization / company'))}
            {fg('ROLE *', sel(pending.role, v => updatePending('role', v), roleOptions))}
          </div>
          <div className="form-row form-row-2">
            {fg('FROM DATE *', <input type="date" className="form-input" value={pending.fromDate || ''} onChange={e => updatePending('fromDate', e.target.value)} />)}
            {fg('TO DATE *', <input type="date" className="form-input" value={pending.toDate || ''} onChange={e => updatePending('toDate', e.target.value)} />)}
          </div>
        </div>
      )}

      <div className="items-list">
        {students && students.length === 0 && <div className="empty-state">No student internship / project entries yet.</div>}
        {students && students.map((s: any, i: number) => (
          <EntryCard
            key={i}
            item={s}
            index={i}
            expanded={expandedCards.has(i)}
            isEditing={editingIndex === i}
            onToggleExpanded={() => editingIndex !== i && toggleExpanded(i)}
            onStartEdit={() => startEdit(i)}
            onDelete={() => removeStudent(i)}
            onChange={(key, value) => updateStudent(i, key, value)}
            onSave={() => finishEdit(i)}
            onCancel={() => finishEdit(i)}
            programOptions={programOptions}
          />
        ))}
      </div>
    </>
  );
}
