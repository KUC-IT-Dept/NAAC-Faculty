import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { fg, inp, sel, ta, yearSel } from './sectionUtils';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import { useConfirmDelete } from '../useConfirmDelete';
import { researchDegreeOptions, scholarGenderOptions, researchStatusOptions, guidanceTypeOptions, supervisionCategoryOptions } from '../../shared/dropdownOptions';

const saveBtnStyle: React.CSSProperties = {
  padding: '7px 20px', fontSize: '14px', cursor: 'pointer',
  backgroundColor: '#16a34a', color: 'white', border: 'none',
  borderRadius: '8px', fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  marginLeft: '8px',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '7px 20px', fontSize: '14px', cursor: 'pointer',
  backgroundColor: '#fff1f2', color: '#9f1239',
  border: '1px solid #fecdd3', borderRadius: '8px', fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: '6px',
};

const NUM_OPTS_100 = Array.from({ length: 100 }, (_, i) => String(i + 1));
const NUM_OPTS_10 = Array.from({ length: 10 }, (_, i) => String(i + 1));

const isPhd = (deg: string) => {
  const d = (deg || 'Ph.D').trim();
  return d === 'Ph.D' || d === 'Ph.D.';
};

const isMphil = (deg: string) => {
  const d = (deg || '').trim();
  return d === 'M.Phil' || d === 'M.Phil.';
};

export default function ResearchSupervision({ data, onChange, onPersist }: { data: any; onChange: (d: any) => void; onPersist?: (updated: any, showToast?: boolean) => Promise<void> | void }) {
  const { confirmDelete, ConfirmDialog: ConfirmDeleteDialog } = useConfirmDelete();
  const degrees = useDropdownOptions(researchDegreeOptions);
  const statuses = useDropdownOptions(researchStatusOptions);
  const genders = useDropdownOptions(scholarGenderOptions);
  const guidanceTypes = useDropdownOptions(guidanceTypeOptions);
  const categories = useDropdownOptions(supervisionCategoryOptions);

  const mapStudentDetails = (details: any[]) => {
    return (details || []).map((st: any, idx: number) => ({
      id: st.id || st._id || `student-${idx}-${st.studentName || ''}-${st.topic || ''}`,
      ...st
    }));
  };

  const [studentDetails, setStudentDetails] = useState<any[]>(() => mapStudentDetails(data.studentDetails));

  useEffect(() => {
    setStudentDetails(mapStudentDetails(data.studentDetails));
  }, [data.studentDetails]);

  const persist = async (updated: any, showToast = false) => {
    if (!onPersist) return;
    try { await onPersist(updated, showToast); }
    catch (err) { console.error('Failed to persist research guidance', err); }
  };

  // Dynamically calculate metrics from studentDetails
  const phdAwardedCount = String(studentDetails.filter((s: any) => isPhd(s.degree) && (s.status || 'Ongoing') === 'Completed' && s.studentName?.trim()).length);
  const phdOngoingCount = String(studentDetails.filter((s: any) => isPhd(s.degree) && (s.status || 'Ongoing') === 'Ongoing').length);
  const mphilGuidedCount = String(studentDetails.filter((s: any) => isMphil(s.degree) && (s.status || 'Ongoing') === 'Completed').length);
  const completedStudentsNames = studentDetails
    .filter((s: any) => isPhd(s.degree) && (s.status || 'Ongoing') === 'Completed' && s.studentName?.trim())
    .map((s: any) => s.studentName.trim())
    .join(', ');

  const update = (k: string, v: any, shouldPersist = false) => {
    const updatedDetails = k === 'studentDetails' ? v : studentDetails;

    const newPhdCompleted = String(updatedDetails.filter((s: any) => isPhd(s.degree) && (s.status || 'Ongoing') === 'Completed' && s.studentName?.trim()).length);
    const newPhdInProgress = String(updatedDetails.filter((s: any) => isPhd(s.degree) && (s.status || 'Ongoing') === 'Ongoing').length);
    const newMphilCompleted = String(updatedDetails.filter((s: any) => isMphil(s.degree) && (s.status || 'Ongoing') === 'Completed').length);
    const newMphilInProgress = String(updatedDetails.filter((s: any) => isMphil(s.degree) && (s.status || 'Ongoing') === 'Ongoing').length);
    const newCompletedNames = updatedDetails
      .filter((s: any) => isPhd(s.degree) && (s.status || 'Ongoing') === 'Completed' && s.studentName?.trim())
      .map((s: any) => s.studentName.trim())
      .join(', ');

    const updated = {
      ...data,
      [k]: v,
      phdCompleted: newPhdCompleted,
      phdInProgress: newPhdInProgress,
      mphilCompleted: newMphilCompleted,
      mphilInProgress: newMphilInProgress,
      completedStudentsNames: newCompletedNames,
      phdAwardedCount: newPhdCompleted,
      phdOngoingCount: newPhdInProgress,
      mphilGuidedCount: newMphilCompleted,
    };

    onChange(updated);
    // Persist asynchronously ONLY when explicitly requested (e.g. Save/Delete)
    if (shouldPersist) {
      void persist(updated, shouldPersist);
    }
  };

  const [isDirty, setIsDirty] = useState(false);

  const updStudent = (i: number, k: string, v: string) => {
    setIsDirty(true);
    const arr = [...studentDetails];
    arr[i] = { ...arr[i], [k]: v };
    setStudentDetails(arr);
    update('studentDetails', arr);
  };

  const toggleEdit = (i: number, state: boolean) => {
    setIsDirty(false);
    const arr = [...studentDetails];
    arr[i] = { ...arr[i], isEditing: state };
    setStudentDetails(arr);
    update('studentDetails', arr, !state);
  };

  const deleteRow = (i: number) => {
    setIsDirty(false);
    const arr = studentDetails.filter((_: any, idx: number) => idx !== i);
    setStudentDetails(arr);
    update('studentDetails', arr, true);
  };

  const addRow = () => {
    setIsDirty(false);
    const tempId = 'student-' + Math.random().toString(36).substr(2, 9);
    const arr = [
      { id: tempId, studentName: '', topic: '', year: '', fellowship: '', degree: 'Ph.D', status: 'Ongoing', scholarGender: '', guidanceType: '', supervisionCategory: '', isEditing: true },
      ...studentDetails
    ];
    setStudentDetails(arr);
    update('studentDetails', arr);
  };

  const isComplete = (st: any) => !!st.studentName?.trim() && !!st.degree && !!st.status;

  return (
    <div className="section-container" style={{ padding: 24, backgroundColor: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
      {/* ── Summary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Ph.D. Awarded */}
        <div style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: '1px solid #c7d2fe', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#3730a3', lineHeight: 1 }}>{phdAwardedCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ph.D. Awarded</div>
          </div>
        </div>

        {/* Ph.D. Ongoing */}
        <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#92400e', lineHeight: 1 }}>{phdOngoingCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#b45309', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ph.D. Ongoing</div>
          </div>
        </div>

        {/* M.Phil. Completed */}
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#14532d', lineHeight: 1 }}>{mphilGuidedCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>M.Phil. Completed</div>
          </div>
        </div>
      </div>

      {/* ── Completed Ph.D. Student Names ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginBottom: 8, boxShadow: '0 1px 4px rgba(79,70,229,0.06)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Completed Ph.D. Students</span>
          {completedStudentsNames && (
            <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
              {completedStudentsNames.split(', ').length} student{completedStudentsNames.split(', ').length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: completedStudentsNames ? '8px 0' : '20px' }}>
          {completedStudentsNames ? (
            completedStudentsNames.split(', ').map((name: string, idx: number) => {
              const avatarColors = [
                { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
                { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
                { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
                { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
              ];
              const color = avatarColors[idx % avatarColors.length];
              const initials = name.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 20px',
                  borderBottom: idx < completedStudentsNames.split(', ').length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Number badge */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', width: 20, textAlign: 'right', flexShrink: 0 }}>{idx + 1}.</div>
                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: color.bg, border: `1.5px solid ${color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: color.text }}>{initials}</span>
                  </div>
                  {/* Name */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{name.trim()}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Ph.D. Awarded</div>
                  </div>
                  {/* Checkmark */}
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dcfce7', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
              <svg width="32" height="32" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              <span style={{ fontSize: 13, fontStyle: 'italic' }}>No completed Ph.D. students yet.</span>
            </div>
          )}
        </div>
      </div>


      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Student Names, Topics, Year</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Rows are collapsible with preview. Click a row to view more details.</div>
          </div>
          <button type="button" onClick={addRow} style={{
            padding: '8px 16px', fontSize: '14px', cursor: 'pointer',
            backgroundColor: '#4f46e5', color: 'white', border: 'none',
            borderRadius: '6px', display: 'inline-flex', alignItems: 'center',
            gap: '8px', fontWeight: 600,
          }}>
            <Plus size={16} /> Add Student
          </button>
        </div>

        <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {studentDetails.map((st: any, i: number) => {
            const rowKey = st.id || st._id || st.studentName || `idx-${i}`;
            return (
              <div key={rowKey} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {st.isEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>Student Detail {i + 1}</h3>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button type="button" onClick={() => deleteRow(i)} style={cancelBtnStyle}>
                        <X size={14} /> Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleEdit(i, false)}
                        disabled={!isComplete(st)}
                        title={!isComplete(st) ? 'Please enter student name, degree and status' : 'Save'}
                        style={isComplete(st) ? saveBtnStyle : { ...saveBtnStyle, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
                      >
                        <Check size={14} /> Save
                      </button>
                    </div>
                  </div>

                  <div className="form-row form-row-2">
                    {fg('Student Name *', inp(st.studentName, v => updStudent(i, 'studentName', v), 'Enter student name'))}
                    {fg('Scholar Gender', sel(st.scholarGender, v => updStudent(i, 'scholarGender', v), genders, "Select..."))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Degree *', sel(st.degree || 'Ph.D', v => updStudent(i, 'degree', v), degrees, "Select..."))}
                    {fg('Status *', sel(st.status || 'Ongoing', v => updStudent(i, 'status', v), statuses, "Select..."))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Guidance Type', sel(st.guidanceType, v => updStudent(i, 'guidanceType', v), guidanceTypes, "Select..."))}
                    {fg('Supervision Category', sel(st.supervisionCategory, v => updStudent(i, 'supervisionCategory', v), categories, "Select..."))}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Topic', inp(st.topic, v => updStudent(i, 'topic', v), 'Enter research topic'))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Year', yearSel(st.year, v => updStudent(i, 'year', v)))}
                    {fg('Fellowship Details', inp(st.fellowship, v => updStudent(i, 'fellowship', v), 'Enter fellowship details (optional)'))}
                  </div>
                  {isDirty && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                      <button type="button" onClick={() => deleteRow(i)} style={cancelBtnStyle}>
                        <X size={14} /> Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleEdit(i, false)}
                        disabled={!isComplete(st)}
                        title={!isComplete(st) ? 'Please enter student name, degree and status' : 'Save'}
                        style={isComplete(st) ? saveBtnStyle : { ...saveBtnStyle, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
                      >
                        <Check size={14} /> Save
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                        {st.studentName || 'Untitled Student'}
                        <span style={{ marginLeft: '8px', fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{st.degree || 'Ph.D'}</span>
                        <span style={{
                          marginLeft: '4px', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                          background: (st.status || 'Ongoing') === 'Completed' ? '#dcfce7' : '#fef3c7',
                          color: (st.status || 'Ongoing') === 'Completed' ? '#15803d' : '#b45309'
                        }}>{st.status || 'Ongoing'}</span>
                      </h3>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                        {st.topic ? `Topic: ${st.topic}` : 'No topic'}
                        {st.year ? ` • Year: ${st.year}` : ''}
                        {st.fellowship ? ` • Fellowship: ${st.fellowship}` : ''}
                        {st.scholarGender ? ` • Gender: ${st.scholarGender}` : ''}
                        {st.guidanceType ? ` • Guidance: ${st.guidanceType}` : ''}
                        {st.supervisionCategory ? ` • Category: ${st.supervisionCategory}` : ''}
                      </div>
                    </div>
                  </div>
                  <div>
                    <button type="button" onClick={() => toggleEdit(i, true)} style={{
                      padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                      backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
                      borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      <Edit2 size={12} /> Edit
                    </button>
                    <button type="button" onClick={() => confirmDelete(() => deleteRow(i))} style={{
                      marginLeft: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                      backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
                      borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>
      </div>
      <ConfirmDeleteDialog />
    </div>
  );
}
