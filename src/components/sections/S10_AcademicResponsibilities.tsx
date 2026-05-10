import { Plus, Trash2, Edit2, Save } from 'lucide-react';
import { fg, inp, ta, yearSel, sel } from './sectionUtils';

const CLASSES_HANDLED = ['UG', 'PG', 'Ph.D.', 'UG & PG', 'UG, PG & Ph.D.', 'Other'];
const ADMIN_ROLES = ['HOD', 'Dean', 'IQAC Coordinator', 'Warden', 'Principal', 'Director', 'Department Coordinator', 'Exam Coordinator', 'Other'];
const COMMITTEES = ['Academic Council', 'Board of Studies (BOS)', 'Anti-Ragging Committee', 'Disciplinary Committee', 'Research Committee', 'Other'];
const COURSE_NAMES = ['Advanced Algorithms', 'Database Systems', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Data Structures', 'Machine Learning', 'Artificial Intelligence', 'Web Development', 'Other'];
const PROGRAMMES_LIST = ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'Ph.D.', 'B.A.', 'M.A.', 'B.Com', 'M.Com', 'BBA', 'MBA', 'BCA', 'MCA', 'Other'];
const SUBJECTS_LIST = ['Computer Science', 'Physics', 'Mathematics', 'Chemistry', 'Biology', 'Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'English', 'Management', 'Other'];

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#ffffff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#2563eb', color: '#ffffff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnSaveDisabled: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#bfdbfe', color: '#60a5fa', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'not-allowed' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };

export default function AcademicResponsibilities({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const courses = data.courses || [];
  const otherResponsibilities = data.otherResponsibilities || [];

  const update = (k: string, v: any) => onChange({ ...data, [k]: v });

  const addCourse = () => {
    update('courses', [{ courseName: '', year: '', programmes: '', subject: '', isEditing: true }, ...courses]);
  };
  const updCourse = (i: number, k: string, v: string) => {
    const arr = [...courses];
    arr[i] = { ...arr[i], [k]: v };
    update('courses', arr);
  };
  const toggleCourseEdit = (i: number, state: boolean) => {
    const arr = [...courses];
    arr[i] = { ...arr[i], isEditing: state };
    update('courses', arr);
  };
  const delCourse = (i: number) => {
    update('courses', courses.filter((_: any, idx: number) => idx !== i));
  };
  const isCourseComplete = (c: any) => !!c.courseName?.trim();

  const addResp = () => {
    update('otherResponsibilities', [{ classesHandled: '', administrativeRoles: '', committeeMemberships: '', isEditing: true }, ...otherResponsibilities]);
  };
  const updResp = (i: number, k: string, v: string) => {
    const arr = [...otherResponsibilities];
    arr[i] = { ...arr[i], [k]: v };
    update('otherResponsibilities', arr);
  };
  const toggleRespEdit = (i: number, state: boolean) => {
    const arr = [...otherResponsibilities];
    arr[i] = { ...arr[i], isEditing: state };
    update('otherResponsibilities', arr);
  };
  const delResp = (i: number) => {
    update('otherResponsibilities', otherResponsibilities.filter((_: any, idx: number) => idx !== i));
  };
  // Allow saving if at least one field has content
  const isRespComplete = (r: any) => !!(r.classesHandled?.trim() || r.administrativeRoles?.trim() || r.committeeMemberships?.trim());

  return (
    <div className="section-container" style={{ padding: 24, backgroundColor: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
      
      {/* Courses / Subjects Taught Section */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Courses / Subjects Taught</div>
          </div>
          <button type="button" style={btnAdd} onClick={addCourse}>
            <Plus size={14} /> Add Row
          </button>
        </div>

        <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {courses.map((c: any, i: number) => (
            <div key={`course-${i}`} className={`list-item-card ${c.isEditing ? 'is-editing' : 'is-preview'}`} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, backgroundColor: '#fafafa' }}>
              {c.isEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Course #{courses.length - i}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Expanded</span>
                      </div>
                      {!c.courseName && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>No details added yet</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        type="button" 
                        style={isCourseComplete(c) ? btnSave : btnSaveDisabled} 
                        onClick={() => toggleCourseEdit(i, false)}
                        disabled={!isCourseComplete(c)}
                        title={!isCourseComplete(c) ? 'Please enter course name' : 'Save'}
                      >
                        <Save size={14} /> Save
                      </button>
                      <button type="button" style={btnCancel} onClick={() => isCourseComplete(c) ? toggleCourseEdit(i, false) : delCourse(i)}>Cancel</button>
                      <button type="button" style={btnDelete} onClick={() => delCourse(i)}><Trash2 size={14} /> Delete</button>
                    </div>
                  </div>

                  <div className="form-row form-row-1">
                    {fg('Courses / Subjects Taught', sel(c.courseName, v => updCourse(i, 'courseName', v), COURSE_NAMES))}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Year', yearSel(c.year, v => updCourse(i, 'year', v)))}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Programmes', sel(c.programmes, v => updCourse(i, 'programmes', v), PROGRAMMES_LIST))}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Subject', sel(c.subject, v => updCourse(i, 'subject', v), SUBJECTS_LIST))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{c.courseName || 'Untitled Course'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {c.year ? `${c.year} • ` : ''}
                      {c.programmes || 'No programmes'} 
                      {c.subject ? ` • ${c.subject}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" style={btnEdit} onClick={() => toggleCourseEdit(i, true)}><Edit2 size={14} /> Edit</button>
                    <button type="button" style={btnDelete} onClick={() => delCourse(i)}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Other Academic Responsibilities Section */}
      <div style={{ paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Other Academic Responsibilities</div>
          </div>
          <button type="button" style={btnAdd} onClick={addResp}>
            <Plus size={14} /> Add Row
          </button>
        </div>

        <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {otherResponsibilities.map((r: any, i: number) => (
            <div key={`resp-${i}`} className={`list-item-card ${r.isEditing ? 'is-editing' : 'is-preview'}`} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, backgroundColor: '#fafafa' }}>
              {r.isEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Other Academic Responsibilities</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Expanded</span>
                      </div>
                      {!isRespComplete(r) && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>No additional responsibilities added yet</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        type="button" 
                        style={isRespComplete(r) ? btnSave : btnSaveDisabled} 
                        onClick={() => toggleRespEdit(i, false)}
                        disabled={!isRespComplete(r)}
                        title={!isRespComplete(r) ? 'Please enter at least one detail' : 'Save'}
                      >
                        <Save size={14} /> Save
                      </button>
                      <button type="button" style={btnCancel} onClick={() => isRespComplete(r) ? toggleRespEdit(i, false) : delResp(i)}>Cancel</button>
                      <button type="button" style={btnDelete} onClick={() => delResp(i)}><Trash2 size={14} /> Delete</button>
                    </div>
                  </div>

                  <div className="form-row form-row-1">
                    {fg('Classes Handled (UG / PG / Ph.D.)', sel(r.classesHandled, v => updResp(i, 'classesHandled', v), CLASSES_HANDLED))}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Administrative Roles (HOD / Dean / IQAC / Warden etc.)', sel(r.administrativeRoles, v => updResp(i, 'administrativeRoles', v), ADMIN_ROLES))}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Committee Memberships (Academic Council / BOS / etc.)', sel(r.committeeMemberships, v => updResp(i, 'committeeMemberships', v), COMMITTEES))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {r.classesHandled || r.administrativeRoles || 'Academic Responsibility'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {r.administrativeRoles ? `Roles: ${r.administrativeRoles}` : ''}
                      {r.committeeMemberships ? ` • Committees: ${r.committeeMemberships}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" style={btnEdit} onClick={() => toggleRespEdit(i, true)}><Edit2 size={14} /> Edit</button>
                    <button type="button" style={btnDelete} onClick={() => delResp(i)}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
