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
  const [isDirty, setIsDirty] = useState(false);
  const displayName = getDisplayName(item);
  const duration = item.fromDate || item.toDate ? `${item.fromDate || '—'} to ${item.toDate || '—'}` : '';

  const handleFieldChange = (key: string, value: any) => {
    setIsDirty(true);
    onChange(key, value);
  };

  const handleSave = () => {
    setIsDirty(false);
    onSave();
  };

  const handleCancel = () => {
    setIsDirty(false);
    onCancel();
  };

  return (
    <div className="list-item-card" style={{ marginBottom: 12 }}>
      {isEditing ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong>{index === -1 ? 'New Student' : 'Edit Entry'}</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={handleCancel} style={btnCancel}><X size={14} /> Cancel</button>
              <button type="button" onClick={handleSave} style={btnSave}><Check size={14} /> Save</button>
            </div>
          </div>

          <div className="form-row form-row-2">
            {fg('STUDENT NAME *', inp(item.studentName, v => handleFieldChange('studentName', v), 'Enter student name'))}
            {fg('PROGRAM / COURSE *', (
              <SearchableSelect
                value={item.program || ''}
                onChange={v => handleFieldChange('program', v)}
                options={programOptions}
                placeholder="Search or Select Program/Course"
              />
            ))}
          </div>
          <div className="form-row form-row-2">
            {fg('INTERNSHIP / PROJECT TITLE *', inp(item.title, v => handleFieldChange('title', v), 'Enter internship / project title'))}
            {fg('STATUS *', sel(item.status, v => handleFieldChange('status', v), statusOptions))}
          </div>
          <div className="form-row form-row-2">
            {fg('ORGANIZATION / COMPANY *', inp(item.organisation, v => handleFieldChange('organisation', v), 'Enter organization / company'))}
            {fg('ROLE *', sel(item.role, v => handleFieldChange('role', v), roleOptions))}
          </div>
          <div className="form-row form-row-2">
            {fg('FROM DATE *', <input type="date" className="form-input" value={item.fromDate || ''} onChange={e => handleFieldChange('fromDate', e.target.value)} />)}
            {fg('TO DATE *', <input type="date" className="form-input" value={item.toDate || ''} onChange={e => handleFieldChange('toDate', e.target.value)} />)}
          </div>
          {isDirty && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <button type="button" onClick={handleCancel} style={btnCancel}><X size={14} /> Cancel</button>
              <button type="button" onClick={handleSave} style={btnSave}><Check size={14} /> Save</button>
            </div>
          )}
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

  const [isPendingDirty, setIsPendingDirty] = useState(false);

  const handleAddRow = () => { setPending({ ...emptyStudent }); setIsPendingDirty(false); };
  const savePending = (item: any) => {
    if (!item?.title?.trim()) return;
    const updated = [item, ...students];
    refreshParent(updated);
    setPending(null);
    setIsPendingDirty(false);
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

  const updatePending = (k: string, v: any) => {
    setIsPendingDirty(true);
    setPending((prev: any) => ({ ...prev, [k]: v }));
  };

  return (
    <>
      {/* ── Summary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Completed */}
        <div style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: '1px solid #c7d2fe', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#3730a3', lineHeight: 1 }}>{summary.totalCompleted}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
          </div>
        </div>

        {/* Ongoing */}
        <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#92400e', lineHeight: 1 }}>{summary.ongoingCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#b45309', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ongoing</div>
          </div>
        </div>

        {/* Students Involved */}
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#14532d', lineHeight: 1 }}>{summary.numberStudents}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Students Involved</div>
          </div>
        </div>
      </div>

      {/* ── Completed Names ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 4px rgba(79,70,229,0.06)' }}>
        <div style={{ background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Completed Internships / Projects</span>
          {summary.completedNames.length > 0 && (
            <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
              {summary.completedNames.length} name{summary.completedNames.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ padding: summary.completedNames.length ? '8px 0' : '20px' }}>
          {summary.completedNames.length ? (
            summary.completedNames.map((name, idx) => {
              const avatarColors = [
                { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
                { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
                { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
                { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
              ];
              const color = avatarColors[idx % avatarColors.length];
              const initials = name.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={`${name}-${idx}`} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 20px',
                  borderBottom: idx < summary.completedNames.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', width: 20, textAlign: 'right', flexShrink: 0 }}>{idx + 1}.</div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: color.bg, border: `1.5px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: color.text }}>{initials || 'IP'}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{name.trim()}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Completed</div>
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dcfce7', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
              <svg width="32" height="32" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              <span style={{ fontSize: 13, fontStyle: 'italic' }}>No completed internships / projects added yet.</span>
            </div>
          )}
        </div>
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
          {isPendingDirty && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <button type="button" onClick={() => { setPending(null); setIsPendingDirty(false); }} style={btnCancel}><X size={14} /> Cancel</button>
              <button type="button" onClick={() => savePending(pending)} style={btnSave}><Check size={14} /> Save</button>
            </div>
          )}
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
