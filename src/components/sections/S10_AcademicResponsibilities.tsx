import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fg, sel, yearSel } from './sectionUtils';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import { responsibilityRoleOptions, committeeTypeOptions, teachingCategoryOptions, courseNameOptions, programmeOptions, departmentOptions, semesterTypeOptions } from '../../shared/dropdownOptions';
import SearchableSelect from '../SearchableSelect';
import {
  EMPTY_COURSE, type CourseRecord, buildAcademicYearOptions, courseAcademicYearLabel, courseSemesterLabel, courseProgramme,
  semesterForEdit, academicYearForEdit, legacyYearNote, legacySemesterNote, legacyYearLabel, courseSortYear,
} from './academicCourseUtils';

const CLASSES_HANDLED = ['UG', 'PG', 'Ph.D.', 'Other'];

const EMPTY_RESP = { classesHandled: '', administrativeRoles: '', committeeMemberships: '', fromYear: '', toYear: '', fromSemester: '', toSemester: '' };

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
  const yearLabel = courseAcademicYearLabel(c);
  const semesterLabel = courseSemesterLabel(c);
  const programme = courseProgramme(c);
  const legacyYears = c.academicYear ? legacyYearLabel(c) : '';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 56, textAlign: 'center', padding: '6px 8px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{yearLabel || '—'}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Academic Year</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {c.courseName || 'Untitled Course'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {programme && <span className="badge badge-secondary">{programme}</span>}
              {semesterLabel && <span className="badge badge-secondary">{semesterLabel}</span>}
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
          <PreviewRow label="Courses / Subjects Taught" value={c.courseName} />
          <PreviewRow label="Programmes" value={programme} />
          <PreviewRow label="Academic Year" value={yearLabel} />
          <PreviewRow label="Semester" value={semesterLabel} />
          <PreviewRow label="Department" value={c.subject} />
          <PreviewRow label="Earlier Duration (legacy)" value={legacyYears} />
        </div>
      )}
    </>
  );
}

/** Shared form body for adding and editing a course, in the required field order. */
function CourseFields({ c, set, courseNames, programmes, semesters, departments, academicYears }: {
  c: CourseRecord; set: (k: string, v: string) => void;
  courseNames: string[]; programmes: string[]; semesters: string[]; departments: string[]; academicYears: string[];
}) {
  const year = academicYearForEdit(c);
  const yearOptions = year && !academicYears.includes(year) ? [year, ...academicYears] : academicYears;
  const yearNote = legacyYearNote(c);
  const semesterNote = legacySemesterNote(c);
  return (
    <>
      <div className="form-row form-row-1">
        {fg('Courses / Subjects Taught', (
          <SearchableSelect value={c.courseName || ''} onChange={v => set('courseName', v)} options={courseNames} placeholder="Search or Select Course" />
        ))}
      </div>
      <div className="form-row form-row-1">
        {fg('Programmes', (
          <SearchableSelect value={c.programmes || c.programme || ''} onChange={v => set('programmes', v)} options={programmes} placeholder="Search or Select Programme" />
        ))}
      </div>
      <div className="form-row form-row-1">
        {fg('Academic Year', (
          <>
            <select className="form-select" value={year} onChange={e => set('academicYear', e.target.value)}>
              <option value="">— Academic Year —</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {yearNote && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{yearNote}</div>}
          </>
        ))}
      </div>
      <div className="form-row form-row-1">
        {fg('Semester', (
          <>
            {sel(semesterForEdit(c), v => set('semester', v), semesters, 'Select...')}
            {semesterNote && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{semesterNote}</div>}
          </>
        ))}
      </div>
      <div className="form-row form-row-1">
        {fg('Department', (
          <SearchableSelect value={c.subject || ''} onChange={v => set('subject', v)} options={departments} placeholder="Search or Select Department" />
        ))}
      </div>
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
          { (r.fromSemester || r.toSemester) && <PreviewRow label="Semester" value={r.fromSemester && r.toSemester ? `${r.fromSemester} – ${r.toSemester}` : r.fromSemester || r.toSemester} /> }
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

  const academicYears = buildAcademicYearOptions(1960);
  // `i` is the index in the stored `courses` array (not the sorted/display order).
  const updCourse = (i: number, k: string, v: string) => { setIsCourseDirty(true); const a = [...courses]; a[i] = { ...a[i], [k]: v }; update('courses', a); };
  const updResp = (i: number, k: string, v: string) => { setIsRespDirty(true); const a = [...otherResponsibilities]; a[i] = { ...a[i], [k]: v }; update('otherResponsibilities', a); };

  const isCourseComplete = (c: any) => c.courseName;
  const isRespComplete = (r: any) => r.classesHandled || r.administrativeRoles || r.committeeMemberships;

  const handleSavePendingCourse = (item: any) => {
    if (isCourseComplete(item)) {
      const updated = [item, ...courses];
      updated.sort((a, b) => courseSortYear(b) - courseSortYear(a));
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

  // Keep each course's index in the stored array so edit/delete hit the right record even for unsorted legacy data.
  const sortedCourses = (courses as CourseRecord[])
    .map((c, idx) => ({ c, idx }))
    .sort((a, b) => courseSortYear(b.c) - courseSortYear(a.c));

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
                    disabled={!isCourseComplete(pendingCourse)}
                    style={!isCourseComplete(pendingCourse) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              </div>
              <CourseFields
                c={pendingCourse}
                set={(k, v) => { setIsCourseDirty(true); setPendingCourse({ ...pendingCourse, [k]: v }); }}
                courseNames={courseNames} programmes={programmes} semesters={semesters} departments={departments} academicYears={academicYears}
              />
              {isCourseDirty && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                  <button type="button" onClick={() => { setPendingCourse(null); setIsCourseDirty(false); }} style={btnCancel}>
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePendingCourse(pendingCourse)}
                    disabled={!isCourseComplete(pendingCourse)}
                    style={!isCourseComplete(pendingCourse) ? { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' } : btnSave}
                  >
                    <Check size={14} /> Save
                  </button>
                </div>
              )}
            </div>
          )}

          {sortedCourses.map(({ c, idx }) => {
            const isEditing = editingCourseIndex === idx;
            return (
              <div key={`c-${idx}`} className="list-item-card">
                {isEditing ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Course</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => { setEditingCourseIndex(null); setIsCourseDirty(false); }} style={btnCancel}>
                          <X size={14} /> Cancel
                        </button>
                        <button type="button" onClick={() => { setEditingCourseIndex(null); setIsCourseDirty(false); }} style={btnSave}>
                          <Check size={14} /> Save
                        </button>
                      </div>
                    </div>
                    <CourseFields
                      c={c}
                      set={(k, v) => updCourse(idx, k, v)}
                      courseNames={courseNames} programmes={programmes} semesters={semesters} departments={departments} academicYears={academicYears}
                    />
                    {isCourseDirty && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                        <button type="button" onClick={() => { setEditingCourseIndex(null); setIsCourseDirty(false); }} style={btnCancel}>
                          <X size={14} /> Cancel
                        </button>
                        <button type="button" onClick={() => { setEditingCourseIndex(null); setIsCourseDirty(false); }} style={btnSave}>
                          <Check size={14} /> Save
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <CoursePreviewCard
                    c={c}
                    onEdit={() => { setEditingCourseIndex(idx); setIsCourseDirty(false); }}
                    onDelete={() => update('courses', (courses as CourseRecord[]).filter((_, j) => j !== idx))}
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
                {fg('Semester', (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: '0 0 48%' }}>
                      <label className="form-label">From Semester</label>
                      {sel(pendingResp.fromSemester, v => { setIsRespDirty(true); setPendingResp({ ...pendingResp, fromSemester: v }); }, semesters, 'Select...')}
                    </div>
                    <div style={{ flex: '0 0 48%' }}>
                      <label className="form-label">To Semester</label>
                      {sel(pendingResp.toSemester, v => { setIsRespDirty(true); setPendingResp({ ...pendingResp, toSemester: v }); }, semesters, 'Select...')}
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
                      {fg('Semester', (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ flex: '0 0 48%' }}>
                            <label className="form-label">From Semester</label>
                            {sel(r.fromSemester, v => updResp(i, 'fromSemester', v), semesters, 'Select...')}
                          </div>
                          <div style={{ flex: '0 0 48%' }}>
                            <label className="form-label">To Semester</label>
                            {sel(r.toSemester, v => updResp(i, 'toSemester', v), semesters, 'Select...')}
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
                    disabled={pendingResp !== null || editingRespIndex !== null}
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
