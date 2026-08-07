import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fg, sel, yearSel } from './sectionUtils';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import { responsibilityRoleOptions, committeeTypeOptions, teachingCategoryOptions, courseNameOptions, programmeOptions, departmentOptions, semesterTypeOptions } from '../../shared/dropdownOptions';
import SearchableSelect from '../SearchableSelect';

const CLASSES_HANDLED = ['UG', 'PG', 'Ph.D.', 'Other'];

const EMPTY_COURSE = { courseName: '', fromYear: '', toYear: '', programmes: '', subject: '', semester: '', semesterFrom: '', semesterTo: '' };
const EMPTY_RESP = { classesHandled: '', administrativeRoles: '', committeeMemberships: '', fromYear: '', toYear: '' };

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
            <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{c.fromYear && c.toYear ? `${c.fromYear}-${c.toYear}` : c.fromYear || c.toYear || '—'}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Duration</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {c.courseName || 'Untitled Course'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {c.programmes && <span className="badge badge-secondary">{c.programmes}</span>}
              {(c.semesterFrom || c.semesterTo) && <span className="badge badge-secondary">{c.semesterFrom && c.semesterTo ? `${c.semesterFrom} – ${c.semesterTo}` : c.semesterFrom || c.semesterTo}</span>}
              {c.subject && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Department: {c.subject}</span>}
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
          <PreviewRow label="Duration" value={`${c.fromYear || '—'} - ${c.toYear || '—'}`} />
          <PreviewRow label="Programmes" value={c.programmes} />
          <PreviewRow label="Semester" value={c.semesterFrom && c.semesterTo ? `${c.semesterFrom} – ${c.semesterTo}` : c.semesterFrom || c.semesterTo} />
          <PreviewRow label="Department" value={c.subject} />
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
          { (r.fromYear || r.toYear) && <PreviewRow label="Duration" value={`${r.fromYear || '—'} - ${r.toYear || '—'}`} /> }
          <PreviewRow label="Administrative Roles" value={r.administrativeRoles} />
          <PreviewRow label="Committee Memberships" value={r.committeeMemberships} />
        </div>
      )}
    </>
  );
}

export default function AcademicResponsibilities({ data, onChange, onPersist }: { data: any; onChange: (d: any) => void; onPersist?: (d: any) => void }) {
  const adminRoles = useDropdownOptions(responsibilityRoleOptions);
  const committees = useDropdownOptions(committeeTypeOptions);
  const teachingCategories = useDropdownOptions(teachingCategoryOptions);
  const courseNames = useDropdownOptions(courseNameOptions);
  const programmes = useDropdownOptions(programmeOptions);
  const departments = useDropdownOptions(departmentOptions);
  const semesters = useDropdownOptions(semesterTypeOptions);

  const courses = data.courses || [];
  const otherResponsibilities = data.otherResponsibilities || [];
  const update = (k: string, v: any) => {
    const newData = { ...data, [k]: v };
    onChange(newData);
    if (onPersist) onPersist(newData);
  };

  // Courses state
  const [editingCourseIndex, setEditingCourseIndex] = useState<number | null>(null);
  const [pendingCourse, setPendingCourse] = useState<any>(null);
  const [isCourseDirty, setIsCourseDirty] = useState(false);

  // Responsibilities state
  const [editingRespIndex, setEditingRespIndex] = useState<number | null>(null);
  const [pendingResp, setPendingResp] = useState<any>(null);
  const [isRespDirty, setIsRespDirty] = useState(false);

  const updCourse = (i: number, k: string, v: string) => { setIsCourseDirty(true); const a = [...courses]; a[i] = { ...a[i], [k]: v }; update('courses', a); };
  const updResp = (i: number, k: string, v: string) => { setIsRespDirty(true); const a = [...otherResponsibilities]; a[i] = { ...a[i], [k]: v }; update('otherResponsibilities', a); };

  const isCourseComplete = (c: any) => c.courseName;
  const isRespComplete = (r: any) => r.classesHandled || r.administrativeRoles || r.committeeMemberships;

  const handleSavePendingCourse = (item: any) => {
    const validYears = !item.fromYear || !item.toYear || (parseInt(item.fromYear) <= parseInt(item.toYear));
    if (!validYears) return;
    if (isCourseComplete(item)) {
      const updated = [item, ...courses];
      updated.sort((a, b) => (parseInt(b.fromYear || b.toYear || '0') || 0) - (parseInt(a.fromYear || a.toYear || '0') || 0));
      update('courses', updated);
      setPendingCourse(null);
      setIsCourseDirty(false);
    }
  };

  const handleSavePendingResp = (item: any) => {
    const validYears = !item.fromYear || !item.toYear || (parseInt(item.fromYear) <= parseInt(item.toYear));
    if (!validYears) return;
    if (isRespComplete(item)) {
      update('otherResponsibilities', [item, ...otherResponsibilities]);
      setPendingResp(null);
      setIsRespDirty(false);
    }
  };

  const sortedCourses = [...courses].sort((a, b) => (parseInt(b.fromYear || b.toYear || '0') || 0) - (parseInt(a.fromYear || a.toYear || '0') || 0));

  return (
    <>
      <div style={{ marginBottom: 40 }}>
        <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Courses / Subjects Taught</h5>
          <button
            type="button"
            onClick={() => { setPendingCourse({ ...EMPTY_COURSE }); setIsCourseDirty(false); }}
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
                  <button type="button" onClick={() => { setPendingCourse(null); setIsCourseDirty(false); }} style={btnCancel}>
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePendingCourse(pendingCourse)}
                    disabled={!isCourseComplete(pendingCourse) || (pendingCourse.fromYear && pendingCourse.toYear && parseInt(pendingCourse.fromYear) > parseInt(pendingCourse.toYear))}
                    style={!isCourseComplete(pendingCourse) || (pendingCourse.fromYear && pendingCourse.toYear && parseInt(pendingCourse.fromYear) > parseInt(pendingCourse.toYear)) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              </div>
              <div className="form-row form-row-1">
                {fg('Courses / Subjects Taught', (
                  <SearchableSelect
                    value={pendingCourse.courseName || ''}
                    onChange={v => { setIsCourseDirty(true); setPendingCourse({ ...pendingCourse, courseName: v }); }}
                    options={courseNames}
                    placeholder="Search or Select Course"
                  />
                ))}
              </div>
              <div className="form-row form-row-1">
                {fg('', (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: '0 0 48%' }}>
                      <label className="form-label">From Year</label>
                      {yearSel(pendingCourse.fromYear, v => { setIsCourseDirty(true); setPendingCourse({ ...pendingCourse, fromYear: v }); }, 1960)}
                    </div>
                    <div style={{ flex: '0 0 48%' }}>
                      <label className="form-label">To Year</label>
                      {yearSel(pendingCourse.toYear, v => { setIsCourseDirty(true); setPendingCourse({ ...pendingCourse, toYear: v }); }, 1960)}
                    </div>
                  </div>
                ))}
                {pendingCourse.fromYear && pendingCourse.toYear && parseInt(pendingCourse.fromYear) > parseInt(pendingCourse.toYear) && (
                  <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 13 }}>From Year cannot be greater than To Year.</div>
                )}
              </div>
              <div className="form-row form-row-1">
                {fg('Programmes', (
                  <SearchableSelect
                    value={pendingCourse.programmes || ''}
                    onChange={v => { setIsCourseDirty(true); setPendingCourse({ ...pendingCourse, programmes: v }); }}
                    options={programmes}
                    placeholder="Search or Select Programme"
                  />
                ))}
              </div>
              <div className="form-row form-row-1">
                {fg('Semester', (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: '0 0 48%' }}>
                      <label className="form-label">From Semester</label>
                      {sel(pendingCourse.semesterFrom, v => { setIsCourseDirty(true); setPendingCourse({ ...pendingCourse, semesterFrom: v }); }, semesters, 'Select...')}
                    </div>
                    <div style={{ flex: '0 0 48%' }}>
                      <label className="form-label">To Semester</label>
                      {sel(pendingCourse.semesterTo, v => { setIsCourseDirty(true); setPendingCourse({ ...pendingCourse, semesterTo: v }); }, semesters, 'Select...')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="form-row form-row-1">
                {fg('Department', (
                  <SearchableSelect
                    value={pendingCourse.subject || ''}
                    onChange={v => { setIsCourseDirty(true); setPendingCourse({ ...pendingCourse, subject: v }); }}
                    options={departments}
                    placeholder="Search or Select Department"
                  />
                ))}
              </div>
              {isCourseDirty && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                  <button type="button" onClick={() => { setPendingCourse(null); setIsCourseDirty(false); }} style={btnCancel}>
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePendingCourse(pendingCourse)}
                    disabled={!isCourseComplete(pendingCourse) || (pendingCourse.fromYear && pendingCourse.toYear && parseInt(pendingCourse.fromYear) > parseInt(pendingCourse.toYear))}
                    style={!isCourseComplete(pendingCourse) || (pendingCourse.fromYear && pendingCourse.toYear && parseInt(pendingCourse.fromYear) > parseInt(pendingCourse.toYear)) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              )}
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
                        <button type="button" onClick={() => { setEditingCourseIndex(null); setIsCourseDirty(false); }} style={btnCancel}>
                          <X size={14} /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingCourseIndex(null); setIsCourseDirty(false); }}
                          disabled={c.fromYear && c.toYear && parseInt(c.fromYear) > parseInt(c.toYear)}
                          style={c.fromYear && c.toYear && parseInt(c.fromYear) > parseInt(c.toYear) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                        >
                          <Check size={14} /> Save
                        </button>
                      </div>
                    </div>
                    <div className="form-row form-row-1">
                      {fg('Courses / Subjects Taught', (
                        <SearchableSelect
                          value={c.courseName || ''}
                          onChange={v => updCourse(i, 'courseName', v)}
                          options={courseNames}
                          placeholder="Search or Select Course"
                        />
                      ))}
                    </div>
                    <div className="form-row form-row-1">
                      {fg('', (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ flex: '0 0 48%' }}>
                            <label className="form-label">From Year</label>
                            {yearSel(c.fromYear, v => updCourse(i, 'fromYear', v), 1960)}
                          </div>
                          <div style={{ flex: '0 0 48%' }}>
                            <label className="form-label">To Year</label>
                            {yearSel(c.toYear, v => updCourse(i, 'toYear', v), 1960)}
                          </div>
                        </div>
                      ))}
                      {c.fromYear && c.toYear && parseInt(c.fromYear) > parseInt(c.toYear) && (
                        <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 13 }}>From Year cannot be greater than To Year.</div>
                      )}
                    </div>
                    <div className="form-row form-row-1">
                      {fg('Programmes', (
                        <SearchableSelect
                          value={c.programmes || ''}
                          onChange={v => updCourse(i, 'programmes', v)}
                          options={programmes}
                          placeholder="Search or Select Programme"
                        />
                      ))}
                    </div>
                    <div className="form-row form-row-1">
                      {fg('Semester', (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ flex: '0 0 48%' }}>
                            <label className="form-label">From Semester</label>
                            {sel(c.semesterFrom, v => updCourse(i, 'semesterFrom', v), semesters, 'Select...')}
                          </div>
                          <div style={{ flex: '0 0 48%' }}>
                            <label className="form-label">To Semester</label>
                            {sel(c.semesterTo, v => updCourse(i, 'semesterTo', v), semesters, 'Select...')}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="form-row form-row-1">
                      {fg('Department', (
                        <SearchableSelect
                          value={c.subject || ''}
                          onChange={v => updCourse(i, 'subject', v)}
                          options={departments}
                          placeholder="Search or Select Department"
                        />
                      ))}
                    </div>
                    {isCourseDirty && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                        <button type="button" onClick={() => { setEditingCourseIndex(null); setIsCourseDirty(false); }} style={btnCancel}>
                          <X size={14} /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingCourseIndex(null); setIsCourseDirty(false); }}
                          disabled={c.fromYear && c.toYear && parseInt(c.fromYear) > parseInt(c.toYear)}
                          style={c.fromYear && c.toYear && parseInt(c.fromYear) > parseInt(c.toYear) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                        >
                          <Check size={14} /> Save
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <CoursePreviewCard
                    c={c}
                    onEdit={() => { setEditingCourseIndex(i); setIsCourseDirty(false); }}
                    onDelete={() => update('courses', sortedCourses.filter((_, j) => j !== i))}
                    disabled={pendingCourse !== null || editingCourseIndex !== null}
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
            onClick={() => { setPendingResp({ ...EMPTY_RESP }); setIsRespDirty(false); }}
            disabled={pendingResp !== null || editingRespIndex !== null}
            style={{ ...btnAdd, flexShrink: 0 }}
          >
            <Plus size={16} /> Add Responsibility
          </button>
        </div>

        {otherResponsibilities.length === 0 && !pendingResp && (
          <div className="empty-state">No other responsibilities added yet. Click Add Responsibility to get started.</div>
        )}

        <div className="items-list">
          {pendingResp && (
            <div key="pending-resp" className="list-item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Responsibility</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => { setPendingResp(null); setIsRespDirty(false); }} style={btnCancel}>
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePendingResp(pendingResp)}
                    disabled={!isRespComplete(pendingResp) || (pendingResp && pendingResp.fromYear && pendingResp.toYear && parseInt(pendingResp.fromYear) > parseInt(pendingResp.toYear))}
                    style={!pendingResp || !isRespComplete(pendingResp) || (pendingResp && pendingResp.fromYear && pendingResp.toYear && parseInt(pendingResp.fromYear) > parseInt(pendingResp.toYear)) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              </div>
              <div className="form-row form-row-1">
                {fg('', (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: '0 0 40%' }}>
                      <label className="form-label">Classes Handled (UG / PG / Ph.D.)</label>
                      {sel(pendingResp.classesHandled, v => { setIsRespDirty(true); setPendingResp({ ...pendingResp, classesHandled: v }); }, CLASSES_HANDLED)}
                    </div>
                    <div style={{ flex: '0 0 28%' }}>
                      <label className="form-label">From Year</label>
                      {yearSel(pendingResp.fromYear, v => { setIsRespDirty(true); setPendingResp({ ...pendingResp, fromYear: v }); }, 1960)}
                    </div>
                    <div style={{ flex: '0 0 28%' }}>
                      <label className="form-label">To Year</label>
                      {yearSel(pendingResp.toYear, v => { setIsRespDirty(true); setPendingResp({ ...pendingResp, toYear: v }); }, 1960)}
                    </div>
                  </div>
                ))}
                {pendingResp.fromYear && pendingResp.toYear && parseInt(pendingResp.fromYear) > parseInt(pendingResp.toYear) && (
                  <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 13 }}>From Year cannot be greater than To Year.</div>
                )}
              </div>
              <div className="form-row form-row-1">
                {fg('Administrative Roles (HOD / Dean / IQAC / Warden etc.)', sel(pendingResp.administrativeRoles, v => { setIsRespDirty(true); setPendingResp({ ...pendingResp, administrativeRoles: v }); }, adminRoles, "Select..."))}
              </div>
              <div className="form-row form-row-1">
                {fg('Committee Memberships (Academic Council / BOS / etc.)', sel(pendingResp.committeeMemberships, v => { setIsRespDirty(true); setPendingResp({ ...pendingResp, committeeMemberships: v }); }, committees, "Select..."))}
              </div>
              {isRespDirty && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                  <button type="button" onClick={() => { setPendingResp(null); setIsRespDirty(false); }} style={btnCancel}>
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePendingResp(pendingResp)}
                    disabled={!isRespComplete(pendingResp) || (pendingResp && pendingResp.fromYear && pendingResp.toYear && parseInt(pendingResp.fromYear) > parseInt(pendingResp.toYear))}
                    style={!pendingResp || !isRespComplete(pendingResp) || (pendingResp && pendingResp.fromYear && pendingResp.toYear && parseInt(pendingResp.fromYear) > parseInt(pendingResp.toYear)) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              )}
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
                        <button type="button" onClick={() => { setEditingRespIndex(null); setIsRespDirty(false); }} style={btnCancel}>
                          <X size={14} /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingRespIndex(null); setIsRespDirty(false); }}
                          disabled={r && r.fromYear && r.toYear && parseInt(r.fromYear) > parseInt(r.toYear)}
                          style={r && r.fromYear && r.toYear && parseInt(r.fromYear) > parseInt(r.toYear) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                        >
                          <Check size={14} /> Save
                        </button>
                      </div>
                    </div>
                    <div className="form-row form-row-1">
                      {fg('', (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ flex: '0 0 40%' }}>
                            <label className="form-label">Classes Handled (UG / PG / Ph.D.)</label>
                            {sel(r.classesHandled, v => updResp(i, 'classesHandled', v), CLASSES_HANDLED)}
                          </div>
                          <div style={{ flex: '0 0 28%' }}>
                            <label className="form-label">From Year</label>
                            {yearSel(r.fromYear, v => updResp(i, 'fromYear', v), 1960)}
                          </div>
                          <div style={{ flex: '0 0 28%' }}>
                            <label className="form-label">To Year</label>
                            {yearSel(r.toYear, v => updResp(i, 'toYear', v), 1960)}
                          </div>
                        </div>
                      ))}
                      {r.fromYear && r.toYear && parseInt(r.fromYear) > parseInt(r.toYear) && (
                        <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 13 }}>From Year cannot be greater than To Year.</div>
                      )}
                    </div>
                    <div className="form-row form-row-1">
                      {fg('Administrative Roles (HOD / Dean / IQAC / Warden etc.)', sel(r.administrativeRoles, v => updResp(i, 'administrativeRoles', v), adminRoles, "Select..."))}
                    </div>
                    <div className="form-row form-row-1">
                      {fg('Committee Memberships (Academic Council / BOS / etc.)', sel(r.committeeMemberships, v => updResp(i, 'committeeMemberships', v), committees, "Select..."))}
                    </div>
                    {isRespDirty && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                        <button type="button" onClick={() => { setEditingRespIndex(null); setIsRespDirty(false); }} style={btnCancel}>
                          <X size={14} /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingRespIndex(null); setIsRespDirty(false); }}
                          disabled={r && r.fromYear && r.toYear && parseInt(r.fromYear) > parseInt(r.toYear)}
                          style={r && r.fromYear && r.toYear && parseInt(r.fromYear) > parseInt(r.toYear) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                        >
                          <Check size={14} /> Save
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <RespPreviewCard
                    r={r}
                    onEdit={() => { setEditingRespIndex(i); setIsRespDirty(false); }}
                    onDelete={() => update('otherResponsibilities', otherResponsibilities.filter((_: any, j: number) => j !== i))}
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
