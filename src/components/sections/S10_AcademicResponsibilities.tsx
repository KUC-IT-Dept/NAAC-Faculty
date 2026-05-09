import { useState } from 'react';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import { fg, inp, sel, DropdownWithCustom, Sub } from './sectionUtils';

const EMPTY_RESP = { committeeName: '', role: '', from: '', to: '', description: '' };
const EMPTY_COURSE = { courseName: '', level: '', semester: '', academicYear: '', credits: '' };

const COMMITTEE_ROLES = ['Member', 'Coordinator', 'Chairperson', 'Convenor', 'Secretary', 'Nodal Officer', 'Co-convenor'];
const COURSE_LEVELS = ['UG', 'PG', 'Ph.D', 'Diploma', 'Certificate'];


export default function AcademicResponsibilities({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  // Per-item edit state
  const [editingRespIdx, setEditingRespIdx] = useState<number | null>(null);
  const [editingCourseIdx, setEditingCourseIdx] = useState<number | null>(null);
  const [pendingResp, setPendingResp] = useState<any>(null);
  const [pendingCourse, setPendingCourse] = useState<any>(null);
  const s = (k: string, v: any) => onChange({ ...data, [k]: v });
  const updR = (i: number, k: string, v: string) => { const a = [...(data.responsibilities || [])]; a[i] = { ...a[i], [k]: v }; s('responsibilities', a); };
  const updC = (i: number, k: string, v: string) => { const a = [...(data.coursesTaught || [])]; a[i] = { ...a[i], [k]: v }; s('coursesTaught', a); };
  const resp = data.responsibilities || [];
  const courses = data.coursesTaught || [];

  // Check if responsibility has all required fields filled
  const isResponsibilityComplete = (item: any) => item.committeeName && item.role;
  // Check if course has all required fields filled
  const isCourseComplete = (item: any) => item.courseName && item.level;

  return (
    <div className="section-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Responsibilities Section */}
        <div>
          <div className="section-header-actions" style={{ marginBottom: 16 }}>
            <h5 style={{ margin: 0 }}>Administrative / Committee Responsibilities</h5>
            <div>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setPendingResp({ ...EMPTY_RESP })} disabled={!!pendingResp} style={{ marginLeft: 0 }}>
                <Plus size={14} /> Add Responsibility
              </button>
            </div>
          </div>

          {resp.length === 0 && !pendingResp && (
            <div className="empty-state">No responsibilities added yet.</div>
          )}

          <div className="items-list">
            {/* Pending new responsibility */}
            {pendingResp && (
              <div key="pending-resp" className="item-card is-editing">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Responsibility</span>
                  <div>
                    <button type="button" className="btn btn-success btn-xs" onClick={() => { s('responsibilities', [...resp, pendingResp]); setPendingResp(null); }} disabled={!pendingResp.committeeName || !pendingResp.role}>
                      <Check size={12} /> Save
                    </button>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setPendingResp(null)} style={{ marginLeft: 8 }}>
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="form-row form-row-2">
                  {fg('Committee / Body Name *', <DropdownWithCustom v={pendingResp.committeeName} fn={v => setPendingResp({ ...pendingResp, committeeName: v })} opts={['IQAC', 'BOS', 'Anti-Ragging Cell', 'FDC', 'Grievance Committee', 'Research Commission']} />)}
                  {fg('Role *', sel(pendingResp.role, v => setPendingResp({ ...pendingResp, role: v }), COMMITTEE_ROLES))}
                </div>
                <div className="form-row form-row-2">
                  {fg('From', inp(pendingResp.from, v => setPendingResp({ ...pendingResp, from: v }), 'Jun 2020 or MM/YYYY'))}
                  {fg('To', inp(pendingResp.to, v => setPendingResp({ ...pendingResp, to: v }), 'Present'))}
                </div>
              </div>
            )}
            {resp.map((r: any, i: number) => {
              const itemIsEditing = editingRespIdx === i;
              return (
                <div key={i} className={`item-card ${itemIsEditing ? 'is-editing' : 'is-preview'}`}>
                  {itemIsEditing ? (
                    <>
                      <button type="button" className="item-remove-btn" onClick={() => s('responsibilities', resp.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></button>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <button type="button" className="btn btn-success btn-xs" onClick={() => setEditingRespIdx(null)}><Check size={12} /> Done</button>
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditingRespIdx(null)}>Cancel</button>
                      </div>
                      <div className="form-row form-row-2">
                        {fg('Committee / Body Name *', <DropdownWithCustom v={r.committeeName} fn={v => updR(i, 'committeeName', v)} opts={['IQAC', 'BOS', 'Anti-Ragging Cell', 'FDC', 'Grievance Committee', 'Research Commission']} />)}
                        {fg('Role *', sel(r.role, v => updR(i, 'role', v), COMMITTEE_ROLES))}
                      </div>
                      <div className="form-row form-row-2">
                        {fg('From', inp(r.from, v => updR(i, 'from', v), 'Jun 2020 or MM/YYYY'))}
                        {fg('To', inp(r.to, v => updR(i, 'to', v), 'Present'))}
                      </div>
                    </>
                  ) : (
                    <div className="preview-layout">
                      <div className="preview-main">
                        <h4 className="preview-title">{r.committeeName}</h4>
                        <p className="preview-subtitle"><span className="badge badge-secondary">{r.role}</span></p>
                        <p className="preview-meta">{r.from} • {r.to}</p>
                      </div>
                      <button type="button" className="btn btn-ghost btn-xs" style={{ marginTop: 8 }} onClick={() => { setEditingRespIdx(i); setEditingCourseIdx(null); }}><Edit2 size={12} /> Edit</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Courses Section */}
        <div>
          <div className="section-header-actions" style={{ marginBottom: 16 }}>
            <h5 style={{ margin: 0 }}>Courses / Subjects Taught</h5>
            <div>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setPendingCourse({ ...EMPTY_COURSE })} disabled={!!pendingCourse} style={{ marginLeft: 0 }}>
                <Plus size={14} /> Add Course
              </button>
            </div>
          </div>

          {courses.length === 0 && !pendingCourse && (
            <div className="empty-state">No courses added yet.</div>
          )}

          <div className="items-list">
            {/* Pending new course */}
            {pendingCourse && (
              <div key="pending-course" className="item-card is-editing">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Course</span>
                  <div>
                    <button type="button" className="btn btn-success btn-xs" onClick={() => { s('coursesTaught', [...courses, pendingCourse]); setPendingCourse(null); }} disabled={!pendingCourse.courseName || !pendingCourse.level}>
                      <Check size={12} /> Save
                    </button>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setPendingCourse(null)} style={{ marginLeft: 8 }}>
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="form-row form-row-2">
                  {fg('Course / Subject Name *', <DropdownWithCustom v={pendingCourse.courseName} fn={v => setPendingCourse({ ...pendingCourse, courseName: v })} opts={['Data Structures', 'Algorithms', 'Database Systems', 'Web Development', 'AI/ML', 'Cloud Computing']} />)}
                  {fg('Level *', sel(pendingCourse.level, v => setPendingCourse({ ...pendingCourse, level: v }), COURSE_LEVELS))}
                </div>
                <div className="form-row form-row-3">
                  {fg('Semester', inp(pendingCourse.semester, v => setPendingCourse({ ...pendingCourse, semester: v }), 'I, III, V, etc.'))}
                  {fg('Academic Year', inp(pendingCourse.academicYear, v => setPendingCourse({ ...pendingCourse, academicYear: v }), '2023-24'))}
                  {fg('Credits', inp(pendingCourse.credits, v => setPendingCourse({ ...pendingCourse, credits: v }), '3 or 4'))}
                </div>
              </div>
            )}
            {courses.map((c: any, i: number) => {
              const itemIsEditing = editingCourseIdx === i;
              return (
                <div key={i} className={`item-card ${itemIsEditing ? 'is-editing' : 'is-preview'}`}>
                  {itemIsEditing ? (
                    <>
                      <button type="button" className="item-remove-btn" onClick={() => s('coursesTaught', courses.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></button>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <button type="button" className="btn btn-success btn-xs" onClick={() => setEditingCourseIdx(null)}><Check size={12} /> Done</button>
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditingCourseIdx(null)}>Cancel</button>
                      </div>
                      <div className="form-row form-row-2">
                        {fg('Course / Subject Name *', <DropdownWithCustom v={c.courseName} fn={v => updC(i, 'courseName', v)} opts={['Data Structures', 'Algorithms', 'Database Systems', 'Web Development', 'AI/ML', 'Cloud Computing']} />)}
                        {fg('Level *', sel(c.level, v => updC(i, 'level', v), COURSE_LEVELS))}
                      </div>
                      <div className="form-row form-row-3">
                        {fg('Semester', inp(c.semester, v => updC(i, 'semester', v), 'I, III, V, etc.'))}
                        {fg('Academic Year', inp(c.academicYear, v => updC(i, 'academicYear', v), '2023-24'))}
                        {fg('Credits', inp(c.credits, v => updC(i, 'credits', v), '3 or 4'))}
                      </div>
                    </>
                  ) : (
                    <div className="preview-layout">
                      <div className="preview-main">
                        <h4 className="preview-title">{c.courseName}</h4>
                        <p className="preview-subtitle"><span className="badge badge-info">{c.level}</span></p>
                        <p className="preview-meta">Sem {c.semester} • {c.academicYear} {c.credits && '• ' + c.credits + ' Credits'}</p>
                      </div>
                      <button type="button" className="btn btn-ghost btn-xs" style={{ marginTop: 8 }} onClick={() => { setEditingCourseIdx(i); setEditingRespIdx(null); }}><Edit2 size={12} /> Edit</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
