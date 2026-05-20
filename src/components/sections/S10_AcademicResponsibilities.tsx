import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fg, sel, yearSel } from './sectionUtils';

const CLASSES_HANDLED = ['UG', 'PG', 'Ph.D.', 'UG & PG', 'UG, PG & Ph.D.', 'Other'];
const ADMIN_ROLES = ['HOD', 'Dean', 'IQAC Coordinator', 'Warden', 'Principal', 'Director', 'Department Coordinator', 'Exam Coordinator', 'Other'];
const COMMITTEES = ['Academic Council', 'Board of Studies (BOS)', 'Anti-Ragging Committee', 'Disciplinary Committee', 'Research Committee', 'Other'];
const COURSE_NAMES = ['Advanced Algorithms', 'Database Systems', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Data Structures', 'Machine Learning', 'Artificial Intelligence', 'Web Development', 'Other'];
const PROGRAMMES_LIST = ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'Ph.D.', 'B.A.', 'M.A.', 'B.Com', 'M.Com', 'BBA', 'MBA', 'BCA', 'MCA', 'Other'];
const SUBJECTS_LIST = ['Computer Science', 'Physics', 'Mathematics', 'Chemistry', 'Biology', 'Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'English', 'Management', 'Other'];

const EMPTY_COURSE = { courseName: '', year: '', programmes: '', subject: '' };
const EMPTY_RESP = { classesHandled: '', administrativeRoles: '', committeeMemberships: '' };

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#fff1f2', color: '#e11d48', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#16a34a', color: '#fff', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#9f1239', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };

function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function CoursePreviewCard({ c, onEdit, onDelete, disabled }: { c: any; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{c.year || '—'}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {c.courseName || 'Untitled Course'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {c.programmes && <span className="badge badge-secondary">{c.programmes}</span>}
              {c.subject && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Subject: {c.subject}</span>}
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
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewRow label="Course Name" value={c.courseName} />
          <PreviewRow label="Year" value={c.year} />
          <PreviewRow label="Programmes" value={c.programmes} />
          <PreviewRow label="Subject" value={c.subject} />
        </div>
      )}
    </>
  );
}

function RespPreviewCard({ r, onEdit, onDelete, disabled }: { r: any; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {r.administrativeRoles || r.classesHandled || 'Academic Responsibility'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {r.committeeMemberships && <span className="badge badge-secondary">{r.committeeMemberships}</span>}
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
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewRow label="Classes Handled" value={r.classesHandled} />
          <PreviewRow label="Administrative Roles" value={r.administrativeRoles} />
          <PreviewRow label="Committee Memberships" value={r.committeeMemberships} />
        </div>
      )}
    </>
  );
}

export default function AcademicResponsibilities({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const courses = data.courses || [];
  const otherResponsibilities = data.otherResponsibilities || [];
  const update = (k: string, v: any) => onChange({ ...data, [k]: v });

  // Courses state
  const [editingCourseIndex, setEditingCourseIndex] = useState<number | null>(null);
  const [pendingCourse, setPendingCourse] = useState<any>(null);

  // Responsibilities state
  const [editingRespIndex, setEditingRespIndex] = useState<number | null>(null);
  const [pendingResp, setPendingResp] = useState<any>(null);

  const updCourse = (i: number, k: string, v: string) => { const a = [...courses]; a[i] = { ...a[i], [k]: v }; update('courses', a); };
  const updResp = (i: number, k: string, v: string) => { const a = [...otherResponsibilities]; a[i] = { ...a[i], [k]: v }; update('otherResponsibilities', a); };

  const isCourseComplete = (c: any) => c.courseName;
  const isRespComplete = (r: any) => r.classesHandled || r.administrativeRoles || r.committeeMemberships;

  const handleSavePendingCourse = (item: any) => {
    if (isCourseComplete(item)) {
      const updated = [item, ...courses];
      updated.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
      update('courses', updated);
      setPendingCourse(null);
    }
  };

  const handleSavePendingResp = (item: any) => {
    if (isRespComplete(item)) {
      update('otherResponsibilities', [item, ...otherResponsibilities]);
      setPendingResp(null);
    }
  };

  const sortedCourses = [...courses].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  return (
    <>
      <div style={{ marginBottom: 40 }}>
        <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Courses / Subjects Taught</h5>
          <button
            type="button"
            onClick={() => setPendingCourse({ ...EMPTY_COURSE })}
            disabled={pendingCourse !== null || editingCourseIndex !== null}
            style={{ ...btnAdd, flexShrink: 0 }}
          >
            <Plus size={16} /> Add Course
          </button>
        </div>

        {sortedCourses.length === 0 && (
          <div className="empty-state">No courses added yet. Click Add Course to get started.</div>
        )}

        <div className="items-list">
          {pendingCourse && (
            <div key="pending-course" className="list-item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Course</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setPendingCourse(null)} style={btnCancel}>
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePendingCourse(pendingCourse)}
                    disabled={!isCourseComplete(pendingCourse)}
                    style={isCourseComplete(pendingCourse) ? btnSave : { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              </div>
              <div className="form-row form-row-1">
                {fg('Courses / Subjects Taught', sel(pendingCourse.courseName, v => setPendingCourse({ ...pendingCourse, courseName: v }), COURSE_NAMES))}
              </div>
              <div className="form-row form-row-1">
                {fg('Year', yearSel(pendingCourse.year, v => setPendingCourse({ ...pendingCourse, year: v })))}
              </div>
              <div className="form-row form-row-1">
                {fg('Programmes', sel(pendingCourse.programmes, v => setPendingCourse({ ...pendingCourse, programmes: v }), PROGRAMMES_LIST))}
              </div>
              <div className="form-row form-row-1">
                {fg('Subject', sel(pendingCourse.subject, v => setPendingCourse({ ...pendingCourse, subject: v }), SUBJECTS_LIST))}
              </div>
            </div>
          )}

          {sortedCourses.map((c, i) => {
            const isEditing = editingCourseIndex === i;
            return (
              <div key={`c-${i}`} className="list-item-card">
                {isEditing ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Course</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setEditingCourseIndex(null)} style={btnCancel}>
                          <X size={14} /> Cancel
                        </button>
                        <button type="button" onClick={() => setEditingCourseIndex(null)} style={btnSave}>
                          <Check size={14} /> Save
                        </button>
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
                  <CoursePreviewCard
                    c={c}
                    onEdit={() => setEditingCourseIndex(i)}
                    onDelete={() => update('courses', sortedCourses.filter((_, j) => j !== i))}
                    disabled={pendingCourse !== null}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Other Academic Responsibilities</h5>
          <button
            type="button"
            onClick={() => setPendingResp({ ...EMPTY_RESP })}
            disabled={pendingResp !== null || editingRespIndex !== null}
            style={{ ...btnAdd, flexShrink: 0 }}
          >
            <Plus size={16} /> Add Responsibility
          </button>
        </div>

        {otherResponsibilities.length === 0 && (
          <div className="empty-state">No other responsibilities added yet. Click Add Responsibility to get started.</div>
        )}

        <div className="items-list">
          {pendingResp && (
            <div key="pending-resp" className="list-item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Responsibility</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setPendingResp(null)} style={btnCancel}>
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePendingResp(pendingResp)}
                    disabled={!isRespComplete(pendingResp)}
                    style={isRespComplete(pendingResp) ? btnSave : { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              </div>
              <div className="form-row form-row-1">
                {fg('Classes Handled (UG / PG / Ph.D.)', sel(pendingResp.classesHandled, v => setPendingResp({ ...pendingResp, classesHandled: v }), CLASSES_HANDLED))}
              </div>
              <div className="form-row form-row-1">
                {fg('Administrative Roles (HOD / Dean / IQAC / Warden etc.)', sel(pendingResp.administrativeRoles, v => setPendingResp({ ...pendingResp, administrativeRoles: v }), ADMIN_ROLES))}
              </div>
              <div className="form-row form-row-1">
                {fg('Committee Memberships (Academic Council / BOS / etc.)', sel(pendingResp.committeeMemberships, v => setPendingResp({ ...pendingResp, committeeMemberships: v }), COMMITTEES))}
              </div>
            </div>
          )}

          {otherResponsibilities.map((r: any, i: number) => {
            const isEditing = editingRespIndex === i;
            return (
              <div key={`r-${i}`} className="list-item-card">
                {isEditing ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Responsibility</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setEditingRespIndex(null)} style={btnCancel}>
                          <X size={14} /> Cancel
                        </button>
                        <button type="button" onClick={() => setEditingRespIndex(null)} style={btnSave}>
                          <Check size={14} /> Save
                        </button>
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
                  <RespPreviewCard
                    r={r}
                    onEdit={() => setEditingRespIndex(i)}
                    onDelete={() => update('otherResponsibilities', otherResponsibilities.filter((_: any, j: number) => j !== i))}
                    disabled={pendingResp !== null}
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
