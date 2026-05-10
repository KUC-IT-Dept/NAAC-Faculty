import { useState } from 'react';
import { Plus, Trash2, Edit2, Save } from 'lucide-react';
import { fg, inp, sel, ta, yearSel } from './sectionUtils';

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#ffffff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#2563eb', color: '#ffffff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnSaveDisabled: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#bfdbfe', color: '#60a5fa', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'not-allowed' };

const NUM_OPTS_100 = Array.from({ length: 100 }, (_, i) => String(i + 1));
const NUM_OPTS_10 = Array.from({ length: 10 }, (_, i) => String(i + 1));

export default function ResearchSupervision({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const phdAwardedCount = data.phdAwardedCount || '';
  const phdOngoingCount = data.phdOngoingCount || '';
  const completedStudentsNames = data.completedStudentsNames || '';
  const mphilGuidedCount = data.mphilGuidedCount || '';
  const studentDetails = data.studentDetails || [];

  const update = (k: string, v: any) => onChange({ ...data, [k]: v });

  const updStudent = (i: number, k: string, v: string) => {
    const arr = [...studentDetails];
    arr[i] = { ...arr[i], [k]: v };
    update('studentDetails', arr);
  };

  const toggleEdit = (i: number, state: boolean) => {
    const arr = [...studentDetails];
    arr[i] = { ...arr[i], isEditing: state };
    update('studentDetails', arr);
  };

  const deleteRow = (i: number) => {
    update('studentDetails', studentDetails.filter((_: any, idx: number) => idx !== i));
  };

  const addRow = () => {
    update('studentDetails', [{ studentName: '', topic: '', year: '', fellowship: '', isEditing: true }, ...studentDetails]);
  };

  const isComplete = (st: any) => !!st.studentName?.trim();

  return (
    <div className="section-container" style={{ padding: 24, backgroundColor: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div className="form-row form-row-2">
        {fg('Number of Ph.D. students Awarded', sel(phdAwardedCount, v => update('phdAwardedCount', v), NUM_OPTS_100))}
        {fg('Number of Ph.D. students Ongoing', sel(phdOngoingCount, v => update('phdOngoingCount', v), NUM_OPTS_10))}
      </div>
      
      <div className="form-row form-row-1">
        {fg('Names of completed students', ta(completedStudentsNames, v => update('completedStudentsNames', v), 'List the names of completed Ph.D. students'))}
      </div>

      <div className="form-row form-row-1">
        {fg('Number of M.Phil. students Guided', sel(mphilGuidedCount, v => update('mphilGuidedCount', v), NUM_OPTS_100))}
      </div>

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Student Names, Topics, Year</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Rows are collapsible with preview. Click a row to view more details.</div>
          </div>
          <button type="button" style={btnAdd} onClick={addRow}>
            <Plus size={14} /> Add Row
          </button>
        </div>

        <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {studentDetails.map((st: any, i: number) => (
            <div key={i} className={`list-item-card ${st.isEditing ? 'is-editing' : 'is-preview'}`} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, backgroundColor: '#fafafa' }}>
              {st.isEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Student Detail {i + 1}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Expanded</span>
                      </div>
                      {!st.studentName && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>No student detail entered yet</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        type="button" 
                        style={isComplete(st) ? btnSave : btnSaveDisabled} 
                        onClick={() => toggleEdit(i, false)}
                        disabled={!isComplete(st)}
                        title={!isComplete(st) ? 'Please enter a student name' : 'Save'}
                      >
                        <Save size={14} /> Save
                      </button>
                      <button type="button" style={btnDelete} onClick={() => deleteRow(i)}><Trash2 size={14} /> Delete</button>
                    </div>
                  </div>

                  <div className="form-row form-row-1">
                    {fg('Student Name *', inp(st.studentName, v => updStudent(i, 'studentName', v), 'Enter student name'))}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{st.studentName || 'Untitled Student'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {st.topic || 'No topic'} 
                      {st.year ? ` • ${st.year}` : ''}
                      {st.fellowship ? ` • ${st.fellowship}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" style={btnEdit} onClick={() => toggleEdit(i, true)}><Edit2 size={14} /> Edit</button>
                    <button type="button" style={btnDelete} onClick={() => deleteRow(i)}><Trash2 size={14} /> Delete</button>
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