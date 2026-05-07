import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel, Sub } from './sectionUtils';

const EMPTY_RESP = { committeeName: '', role: '', from: '', to: '' };
const EMPTY_COURSE = { courseName: '', level: '', semester: '', academicYear: '' };

export default function AcademicResponsibilities({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const s = (k: string, v: any) => onChange({ ...data, [k]: v });
  const updR = (i: number, k: string, v: string) => { const a = [...(data.responsibilities || [])]; a[i] = { ...a[i], [k]: v }; s('responsibilities', a); };
  const updC = (i: number, k: string, v: string) => { const a = [...(data.coursesTaught || [])]; a[i] = { ...a[i], [k]: v }; s('coursesTaught', a); };
  const resp = data.responsibilities || [];
  const courses = data.coursesTaught || [];

  return (
    <div>
      <Sub>Administrative / Committee Responsibilities</Sub>
      {resp.map((r: any, i: number) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => s('responsibilities', resp.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></button>
          <div className="form-row form-row-2">
            {fg('Committee / Body Name *', inp(r.committeeName, v => updR(i, 'committeeName', v), 'IQAC / BOS / Anti-Ragging'))}
            {fg('Role', sel(r.role, v => updR(i, 'role', v), ['Member', 'Coordinator', 'Chairperson', 'Convenor', 'Secretary', 'Nodal Officer']))}
          </div>
          <div className="form-row form-row-2">
            {fg('From', inp(r.from, v => updR(i, 'from', v), 'Jun 2020'))}
            {fg('To', inp(r.to, v => updR(i, 'to', v), 'Present'))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" style={{ marginBottom: 24 }} onClick={() => s('responsibilities', [...resp, { ...EMPTY_RESP }])}>
        <Plus size={15} /> Add Responsibility
      </button>

      <Sub>Courses / Subjects Taught</Sub>
      {courses.map((c: any, i: number) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => s('coursesTaught', courses.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></button>
          <div className="form-row form-row-4">
            {fg('Course / Subject Name', inp(c.courseName, v => updC(i, 'courseName', v), 'Data Structures & Algorithms'))}
            {fg('Level', sel(c.level, v => updC(i, 'level', v), ['UG', 'PG', 'Ph.D', 'Diploma']))}
            {fg('Semester', inp(c.semester, v => updC(i, 'semester', v), 'III / V'))}
            {fg('Academic Year', inp(c.academicYear, v => updC(i, 'academicYear', v), '2023-24'))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => s('coursesTaught', [...courses, { ...EMPTY_COURSE }])}>
        <Plus size={15} /> Add Course Taught
      </button>
    </div>
  );
}
