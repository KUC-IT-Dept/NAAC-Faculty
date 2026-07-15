import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { fg, inp, sel, ta, yearSel } from './sectionUtils';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
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

  const updStudent = (i: number, k: string, v: string) => {
    const arr = [...studentDetails];
    arr[i] = { ...arr[i], [k]: v };
    setStudentDetails(arr);
    update('studentDetails', arr);
  };

  const toggleEdit = (i: number, state: boolean) => {
    const arr = [...studentDetails];
    arr[i] = { ...arr[i], isEditing: state };
    setStudentDetails(arr);
    update('studentDetails', arr, !state);
  };

  const deleteRow = (i: number) => {
    const arr = studentDetails.filter((_: any, idx: number) => idx !== i);
    setStudentDetails(arr);
    update('studentDetails', arr, true);
  };

  const addRow = () => {
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
      <div className="form-row form-row-1">
        {fg('Names of completed Ph.D. students', <textarea className="form-input" style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed', minHeight: 60 }} value={completedStudentsNames} readOnly placeholder="No completed Ph.D. students added yet..." />)}
      </div>

      <div className="form-row form-row-2">
        {fg('Number of Ph.D. students Awarded (Completed)', <input className="form-input" style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }} value={phdAwardedCount} readOnly />)}
        {fg('Number of Ph.D. students Ongoing', <input className="form-input" style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }} value={phdOngoingCount} readOnly />)}
      </div>

      <div className="form-row form-row-1">
        {fg('Number of M.Phil. students Guided (Completed)', <input className="form-input" style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }} value={mphilGuidedCount} readOnly />)}
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
                    <button type="button" onClick={() => deleteRow(i)} style={{
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
    </div>
  );
}
