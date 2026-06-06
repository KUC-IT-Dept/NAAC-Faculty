import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { fg, inp, ta, Sub } from './sectionUtils';

const emptyStudent = { studentName: '', program: '', status: 'Ongoing', title: '', organisation: '', role: '', fromDate: '', toDate: '' };

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#fff1f2', color: '#e11d48', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#16a34a', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#9f1239', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };

export default function InternshipAndProjects({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [students, setStudents] = useState<any[]>(Array.isArray(data) ? data : []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<any>(null);

  // Local summary fields (not persisted back to parent to avoid changing data shape)
  const [totalCompleted, setTotalCompleted] = useState<string>('0');
  const [ongoingCount, setOngoingCount] = useState<string>('0');
  const [completedNames, setCompletedNames] = useState<string>('');
  const [numberStudents, setNumberStudents] = useState<string>('0');

  const refreshParent = (arr: any[]) => { setStudents(arr); try { onChange(arr); } catch { /* ignore */ } };

  const handleAddRow = () => setPending({ ...emptyStudent });
  const savePending = (item: any) => {
    const updated = [item, ...students];
    refreshParent(updated);
    setPending(null);
  };

  const updateStudent = (i: number, k: string, v: any) => { const a = [...students]; a[i] = { ...a[i], [k]: v }; refreshParent(a); };

  const removeStudent = (i: number) => refreshParent(students.filter((_, j) => j !== i));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {fg('TOTAL NUMBER OF INTERNSHIPS / PROJECTS COMPLETED', inp(totalCompleted, setTotalCompleted, '0'))}
        {fg('NUMBER OF ONGOING INTERNSHIPS / PROJECTS', inp(ongoingCount, setOngoingCount, '0'))}
      </div>

      <div style={{ marginBottom: 12 }}>
        {fg('NAMES OF COMPLETED INTERNSHIPS / PROJECTS', ta(completedNames, setCompletedNames, 'No completed internships / projects added yet...', 3))}
      </div>

      <div style={{ marginBottom: 18 }}>
        {fg('NUMBER OF STUDENTS INVOLVED (COMPLETED)', inp(numberStudents, setNumberStudents, '0'))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Sub>Student Details</Sub>
        <div>
          <button type="button" onClick={handleAddRow} style={btnAdd}><Plus size={14} /> Add Row</button>
        </div>
      </div>

      {pending && (
        <div className="list-item-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong>New Student</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setPending(null)} style={btnCancel}><X size={14} /> Delete</button>
              <button type="button" onClick={() => savePending(pending)} style={btnSave}><Check size={14} /> Save</button>
            </div>
          </div>
          <div className="form-row form-row-2">
            {fg('STUDENT NAME *', inp(pending.studentName, v => setPending({ ...pending, studentName: v }), 'Enter student name'))}
            {fg('PROGRAM / COURSE *', inp(pending.program, v => setPending({ ...pending, program: v }), 'Internship'))}
          </div>
          <div className="form-row form-row-2">
            {fg('INTERNSHIP / PROJECT TITLE *', inp(pending.title, v => setPending({ ...pending, title: v }), 'Enter internship / project title'))}
            {fg('STATUS *', inp(pending.status, v => setPending({ ...pending, status: v }), 'Ongoing'))}
          </div>
          <div className="form-row form-row-2">
            {fg('ORGANIZATION / COMPANY *', inp(pending.organisation, v => setPending({ ...pending, organisation: v }), 'Enter organization / company'))}
            {fg('ROLE *', inp(pending.role, v => setPending({ ...pending, role: v }), 'Enter role (e.g. Intern / Trainee / Project Member)'))}
          </div>
          <div className="form-row form-row-2">
            {fg('FROM DATE *', <input type="date" className="form-input" value={pending.fromDate || ''} onChange={e => setPending({ ...pending, fromDate: e.target.value })} />)}
            {fg('TO DATE *', <input type="date" className="form-input" value={pending.toDate || ''} onChange={e => setPending({ ...pending, toDate: e.target.value })} />)}
          </div>
        </div>
      )}

      <div className="items-list">
        {students && students.length === 0 && <div className="empty-state">No student internship / project entries yet.</div>}
        {students && students.map((s: any, i: number) => (
          <div key={i} className="list-item-card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{s.studentName || 'Student Detail ' + (i + 1)}</div>
                <div style={{ color: 'var(--text-muted)' }}>{s.title || s.program || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={btnDelete} onClick={() => removeStudent(i)}><Trash2 size={14} /> Delete</button>
                <button type="button" style={btnSave} onClick={() => setEditingIndex(editingIndex === i ? null : i)}><Check size={14} /> Save</button>
              </div>
            </div>

            {editingIndex === i && (
              <div style={{ marginTop: 10 }}>
                <div className="form-row form-row-2">
                  {fg('STUDENT NAME *', inp(s.studentName, v => updateStudent(i, 'studentName', v)))}
                  {fg('PROGRAM / COURSE *', inp(s.program, v => updateStudent(i, 'program', v)))}
                </div>
                <div className="form-row form-row-2">
                  {fg('INTERNSHIP / PROJECT TITLE *', inp(s.title, v => updateStudent(i, 'title', v)))}
                  {fg('STATUS *', inp(s.status, v => updateStudent(i, 'status', v)))}
                </div>
                <div className="form-row form-row-2">
                  {fg('ORGANIZATION / COMPANY *', inp(s.organisation, v => updateStudent(i, 'organisation', v)))}
                  {fg('ROLE *', inp(s.role, v => updateStudent(i, 'role', v)))}
                </div>
                <div className="form-row form-row-2">
                  {fg('FROM DATE *', <input type="date" className="form-input" value={s.fromDate || ''} onChange={e => updateStudent(i, 'fromDate', e.target.value)} />)}
                  {fg('TO DATE *', <input type="date" className="form-input" value={s.toDate || ''} onChange={e => updateStudent(i, 'toDate', e.target.value)} />)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
