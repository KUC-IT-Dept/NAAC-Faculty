import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel, dateInp, yearSel, pv } from './sectionUtils';

const EMPTY_RESP = { responsibility: '', level: '', fromDate: '', toDate: '' };
const EMPTY_COURSE = { courseName: '', academicYear: '', semester: '', level: '' };

const LEVELS = ['University', 'Department', 'Institution', 'College'];
const SEMESTERS = ['Odd', 'Even', 'Annual'];
const COURSE_LEVELS = ['UG', 'PG', 'PhD'];

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
            style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="items-list">
          {pendingResp && (
            <div key="pending-resp" className="list-item-card">
              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => { s('responsibilities', [pendingResp, ...resp]); setPendingResp(null); }} 
                  disabled={!pendingResp.responsibility}
                  style={{ padding: '6px 12px', marginRight: '8px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Save
                </button>
                <button 
                  type="button" 
                  onClick={() => setPendingResp(null)}
                  style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Cancel
                </button>
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
                    <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                      <button 
                        type="button" 
                        onClick={() => setEditingRespIdx(null)}
                        style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                      >
                        Save
                      </button>
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
                    <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                      <button 
                        type="button" 
                        onClick={() => { setEditingRespIdx(i); setEditingCourseIdx(null); }}
                        style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        className="list-item-remove" 
                        onClick={() => s('responsibilities', resp.filter((_: any, j: number) => j !== i))}
                        style={{ marginLeft: '8px' }}
                      >
                        <Trash2 size={14} />
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
            style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="items-list">
          {pendingCourse && (
            <div key="pending-course" className="list-item-card">
              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => { s('courses', [pendingCourse, ...courses]); setPendingCourse(null); }} 
                  disabled={!pendingCourse.courseName}
                  style={{ padding: '6px 12px', marginRight: '8px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Save
                </button>
                <button 
                  type="button" 
                  onClick={() => setPendingCourse(null)}
                  style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Cancel
                </button>
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
                    <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                      <button 
                        type="button" 
                        onClick={() => setEditingCourseIdx(null)}
                        style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                      >
                        Save
                      </button>
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
                    <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                      <button 
                        type="button" 
                        onClick={() => { setEditingCourseIdx(i); setEditingRespIdx(null); }}
                        style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        className="list-item-remove" 
                        onClick={() => s('courses', courses.filter((_: any, j: number) => j !== i))}
                        style={{ marginLeft: '8px' }}
                      >
                        <Trash2 size={14} />
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
