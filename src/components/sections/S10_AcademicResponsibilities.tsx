import { useState } from 'react';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import { fg, inp, sel, dateInp, yearSel, pv } from './sectionUtils';

const EMPTY_RESP = { responsibility: '', level: '', fromDate: '', toDate: '' };
const EMPTY_COURSE = { courseName: '', academicYear: '', semester: '', level: '' };

const LEVELS = ['University', 'Department', 'Institution', 'College'];
const SEMESTERS = ['Odd', 'Even', 'Annual'];
const COURSE_LEVELS = ['UG', 'PG', 'PhD'];

const btnAdd:    React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit:   React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave:   React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };

export default function AcademicResponsibilities({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const resp = data.responsibilities || [];
  const courses = data.courses || [];
  
  const [editingRespIdx, setEditingRespIdx] = useState<number | null>(null);
  const [editingCourseIdx, setEditingCourseIdx] = useState<number | null>(null);
  const [pendingResp, setPendingResp] = useState<any>(null);
  const [pendingCourse, setPendingCourse] = useState<any>(null);

  const s = (k: string, v: any) => onChange({ ...data, [k]: v });
  const updR = (i: number, k: string, v: string) => { const a = [...resp]; a[i] = { ...a[i], [k]: v }; s('responsibilities', a); };
  const updC = (i: number, k: string, v: string) => { const a = [...courses]; a[i] = { ...a[i], [k]: v }; s('courses', a); };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

      {/* Responsibilities Section */}
      <div>
        <div className="section-header-actions" style={{ marginBottom: 16 }}>
          <h5 style={{ margin: 0 }}>Responsibilities</h5>
          <button
            type="button"
            onClick={() => setPendingResp({ ...EMPTY_RESP })}
            disabled={!!pendingResp || editingRespIdx !== null}
            style={btnAdd}
          >
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="items-list">
          {pendingResp && (
            <div key="pending-resp" className="list-item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Responsibility</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => { s('responsibilities', [pendingResp, ...resp]); setPendingResp(null); }}
                    disabled={!pendingResp.responsibility}
                    style={!pendingResp.responsibility ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                  >
                    <Check size={14} /> Save
                  </button>
                  <button type="button" onClick={() => setPendingResp(null)} style={btnCancel}>
                    Cancel
                  </button>
                </div>
              </div>
              <div className="form-row form-row-1">
                {fg('Responsibility *', inp(pendingResp.responsibility, v => setPendingResp({ ...pendingResp, responsibility: v })))}
              </div>
              <div className="form-row form-row-1">
                {fg('Level', sel(pendingResp.level, v => setPendingResp({ ...pendingResp, level: v }), LEVELS))}
              </div>
              <div className="form-row form-row-2">
                {fg('From Date', dateInp(pendingResp.fromDate, v => setPendingResp({ ...pendingResp, fromDate: v })))}
                {fg('To Date', dateInp(pendingResp.toDate, v => setPendingResp({ ...pendingResp, toDate: v })))}
              </div>
            </div>
          )}

          {resp.map((r: any, i: number) => {
            const itemIsEditing = editingRespIdx === i;
            return (
              <div key={i} className="list-item-card">
                {itemIsEditing ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Responsibility</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => setEditingRespIdx(null)} style={btnSave}>
                            <Check size={14} /> Done
                          </button>
                          <button type="button" onClick={() => s('responsibilities', resp.filter((_: any, j: number) => j !== i))} style={btnDelete}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    <div className="form-row form-row-1">
                      {fg('Responsibility *', inp(r.responsibility, v => updR(i, 'responsibility', v)))}
                    </div>
                    <div className="form-row form-row-1">
                      {fg('Level', sel(r.level, v => updR(i, 'level', v), LEVELS))}
                    </div>
                    <div className="form-row form-row-2">
                      {fg('From Date', dateInp(r.fromDate, v => updR(i, 'fromDate', v)))}
                      {fg('To Date', dateInp(r.toDate, v => updR(i, 'toDate', v)))}
                    </div>
                  </>
                ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
                        <button type="button" onClick={() => { setEditingRespIdx(i); setEditingCourseIdx(null); }} style={btnEdit}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button type="button" onClick={() => s('responsibilities', resp.filter((_: any, j: number) => j !== i))} style={btnDelete}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    <div style={{ marginBottom: '12px' }}>{pv('Responsibility', r.responsibility)}</div>
                    <div className="form-row form-row-1" style={{ marginBottom: '12px' }}>
                      {pv('Level', r.level)}
                    </div>
                    <div className="form-row form-row-2">
                      {pv('From', r.fromDate)}
                      {pv('To', r.toDate || 'Present')}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Courses Section */}
      <div>
        <div className="section-header-actions" style={{ marginBottom: 16 }}>
          <h5 style={{ margin: 0 }}>Courses Taught</h5>
          <button
            type="button"
            onClick={() => setPendingCourse({ ...EMPTY_COURSE })}
            disabled={!!pendingCourse || editingCourseIdx !== null}
            style={btnAdd}
          >
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="items-list">
          {pendingCourse && (
            <div key="pending-course" className="list-item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Course</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => { s('courses', [pendingCourse, ...courses]); setPendingCourse(null); }}
                    disabled={!pendingCourse.courseName}
                    style={!pendingCourse.courseName ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                  >
                    <Check size={14} /> Save
                  </button>
                  <button type="button" onClick={() => setPendingCourse(null)} style={btnCancel}>
                    Cancel
                  </button>
                </div>
              </div>
              <div className="form-row form-row-1">
                {fg('Course Name *', inp(pendingCourse.courseName, v => setPendingCourse({ ...pendingCourse, courseName: v })))}
              </div>
              <div className="form-row form-row-1">
                {fg('Academic Year', yearSel(pendingCourse.academicYear, v => setPendingCourse({ ...pendingCourse, academicYear: v })))}
              </div>
              <div className="form-row form-row-2">
                {fg('Semester', sel(pendingCourse.semester, v => setPendingCourse({ ...pendingCourse, semester: v }), SEMESTERS))}
                {fg('Level', sel(pendingCourse.level, v => setPendingCourse({ ...pendingCourse, level: v }), COURSE_LEVELS))}
              </div>
            </div>
          )}

          {courses.map((c: any, i: number) => {
            const itemIsEditing = editingCourseIdx === i;
            return (
              <div key={i} className="list-item-card">
                {itemIsEditing ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Course</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => setEditingCourseIdx(null)} style={btnSave}>
                            <Check size={14} /> Done
                          </button>
                          <button type="button" onClick={() => s('courses', courses.filter((_: any, j: number) => j !== i))} style={btnDelete}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    <div className="form-row form-row-1">
                      {fg('Course Name *', inp(c.courseName, v => updC(i, 'courseName', v)))}
                    </div>
                    <div className="form-row form-row-1">
                      {fg('Academic Year', yearSel(c.academicYear, v => updC(i, 'academicYear', v)))}
                    </div>
                    <div className="form-row form-row-2">
                      {fg('Semester', sel(c.semester, v => updC(i, 'semester', v), SEMESTERS))}
                      {fg('Level', sel(c.level, v => updC(i, 'level', v), COURSE_LEVELS))}
                    </div>
                  </>
                ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
                        <button type="button" onClick={() => { setEditingCourseIdx(i); setEditingRespIdx(null); }} style={btnEdit}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button type="button" onClick={() => s('courses', courses.filter((_: any, j: number) => j !== i))} style={btnDelete}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    <div style={{ marginBottom: '12px' }}>{pv('Course Name', c.courseName)}</div>
                    <div className="form-row form-row-1" style={{ marginBottom: '12px' }}>
                      {pv('Year', c.academicYear)}
                    </div>
                    <div className="form-row form-row-2">
                      {pv('Semester', c.semester)}
                      {pv('Level', c.level)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>

  );
}
