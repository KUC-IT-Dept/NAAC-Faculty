/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/institutional/MMTTCPage.tsx
//
// Same conventions as LibraryPage.tsx. Courses are managed as their own
// sub-resource against the dedicated /api/mmttc/:year/courses[...]
// endpoints, mirroring how the backend itself models them.
import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { mmttcApi, MMTTCRecord, MMTTCCourse } from '../../lib/institutionalApi';
import { setPath } from './formUtils';
import MMTTCWizard from './MMTTCWizard';
import toast from 'react-hot-toast';
import { GraduationCap, Plus, Eye, Pencil, Trash2, X } from 'lucide-react';
import { useConfirmDelete } from '../../components/useConfirmDelete';

function emptyCourse(): MMTTCCourse {
  return {
    year: new Date().getFullYear(),
    courseType: 'refresher',
    courseCode: '',
    subjects: [],
    courseTitle: '',
    coordinator: { name: '', department: '', qualification: '' },
    eligibility: '',
    participants: { total: 0, outsideUniversity: 0, outsideState: 0, outsideIndia: 0 },
    facultyParticipants: 0,
    mode: 'online',
    fundingSource: 'govt',
    expenditure: 0,
    publications: '',
    feedbackFormUrl: ''
  };
}

function NumField({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
function TextField({ label, value, onChange }: { label: string; value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function MMTTCPage() {
  const { user } = useAuth();
  const canAccess = user?.role === 'admin' || user?.role === 'mmttc_director' || (user?.modulePermissions || []).includes('mmttc');

  const [records, setRecords] = useState<MMTTCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MMTTCRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [manageYear, setManageYear] = useState<MMTTCRecord | null>(null);
  const [courseForm, setCourseForm] = useState<MMTTCCourse | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const { confirmDelete, ConfirmDialog } = useConfirmDelete();

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await mmttcApi.list();
      setRecords(data);
    } catch (err: any) {
      setLoadError(err.response?.status === 403 ? 'You do not have permission to view MMTTC records.' : 'Failed to load MMTTC records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) load();
    else setLoading(false);
  }, [canAccess]);

  const openCreate = () => { setEditingRecord(null); setFormOpen(true); };
  const openEdit = (r: MMTTCRecord) => { setEditingRecord(r); setFormOpen(true); };

  // `payload` never contains `courses` (see MMTTCWizard), so a record save cannot
  // overwrite course changes made through the dedicated courses endpoints.
  const handleSave = async (payload: any, editingYear: string | null) => {
    setSaving(true);
    try {
      if (editingYear) {
        await mmttcApi.update(editingYear, payload);
        toast.success('MMTTC record updated.');
      } else {
        await mmttcApi.create(payload);
        toast.success('MMTTC record created.');
      }
      setFormOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save MMTTC record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (r: MMTTCRecord) => {
    confirmDelete(async () => {
      try {
        await mmttcApi.remove(r.academicYear);
        toast.success('MMTTC record deleted.');
        load();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete MMTTC record.');
      }
    }, `This will permanently delete the MMTTC record for ${r.academicYear}, including all its courses.`, 'Delete MMTTC Record');
  };

  const refreshManageYear = async (academicYear: string) => {
    const fresh = await mmttcApi.getByYear(academicYear);
    setManageYear(fresh);
    setRecords((prev) => prev.map((r) => (r.academicYear === academicYear ? fresh : r)));
  };

  const openAddCourse = () => { setEditingCourseId(null); setCourseForm(emptyCourse()); };
  const openEditCourse = (c: MMTTCCourse) => { setEditingCourseId(c._id || null); setCourseForm(c); };
  const setCourse = (path: string, value: any) => setCourseForm((prev) => (prev ? setPath(prev, path, value) : prev));

  const handleSaveCourse = async () => {
    if (!manageYear || !courseForm) return;
    try {
      if (editingCourseId) {
        await mmttcApi.updateCourse(manageYear.academicYear, editingCourseId, courseForm);
        toast.success('Course updated.');
      } else {
        await mmttcApi.addCourse(manageYear.academicYear, courseForm);
        toast.success('Course added.');
      }
      setCourseForm(null);
      setEditingCourseId(null);
      refreshManageYear(manageYear.academicYear);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save course.');
    }
  };

  const handleRemoveCourse = (c: MMTTCCourse) => {
    if (!manageYear || !c._id) return;
    confirmDelete(async () => {
      try {
        await mmttcApi.removeCourse(manageYear.academicYear, c._id!);
        toast.success('Course removed.');
        refreshManageYear(manageYear.academicYear);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to remove course.');
      }
    }, `Remove "${c.courseTitle || c.courseCode || 'this course'}" from ${manageYear.academicYear}?`, 'Remove Course');
  };

  if (!canAccess) {
    return (
      <AppLayout title="MMTTC">
        <div className="card">
          <div className="card-body" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            You do not have permission to access the MMTTC module.
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="MMTTC">
      {!formOpen && <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={20} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>MMTTC Records</h2>
              <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>One record per academic year, with repeatable courses (NAAC criterion 0.11)</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate} title="Create a new annual MMTTC record">
            <Plus size={14} /> Add Record
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Academic Year</th>
                  <th>Centre</th>
                  <th>Courses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : loadError ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--danger, #dc2626)' }}>{loadError}</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No MMTTC records yet.</td></tr>
                ) : records.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r.academicYear}</td>
                    <td>{r.centre?.name || '—'}</td>
                    <td><span className="badge badge-secondary">{r.courses?.length || 0}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setManageYear(r)}><Eye size={14} /> Courses</button>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

      {formOpen && (
        <MMTTCWizard
          record={editingRecord}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {manageYear && (
        <div className="modal-overlay" onClick={() => setManageYear(null)}>
          <div className="modal" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Courses — {manageYear.academicYear}</h3>
              <button className="btn-icon" onClick={() => setManageYear(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button className="btn btn-primary btn-sm" onClick={openAddCourse}><Plus size={14} /> Add Course</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Mode</th>
                      <th>Funding</th>
                      <th>Participants</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manageYear.courses.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No courses added yet.</td></tr>
                    ) : manageYear.courses.map((c) => (
                      <tr key={c._id}>
                        <td>{c.courseTitle || '—'}</td>
                        <td><span className="badge badge-secondary">{c.courseType.replace('_', ' ')}</span></td>
                        <td>{c.mode}</td>
                        <td>{c.fundingSource}</td>
                        <td>{c.participants?.total ?? 0}</td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEditCourse(c)}><Pencil size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemoveCourse(c)}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setManageYear(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {courseForm && (
        <div className="modal-overlay" onClick={() => setCourseForm(null)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingCourseId ? 'Edit Course' : 'Add Course'}</h3>
              <button className="btn-icon" onClick={() => setCourseForm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div className="form-row-2">
                <TextField label="Course Title" value={courseForm.courseTitle} onChange={(v) => setCourse('courseTitle', v)} />
                <TextField label="Course Code" value={courseForm.courseCode} onChange={(v) => setCourse('courseCode', v)} />
              </div>
              <div className="form-row-3">
                <NumField label="Year" value={courseForm.year} onChange={(v) => setCourse('year', v)} />
                <div className="form-group">
                  <label className="form-label">Course Type</label>
                  <select className="form-select" value={courseForm.courseType} onChange={(e) => setCourse('courseType', e.target.value)}>
                    <option value="refresher">Refresher</option>
                    <option value="orientation">Orientation</option>
                    <option value="short_term">Short Term</option>
                  </select>
                </div>
                <NumField label="Duration (days, 1–30)" value={courseForm.durationDays} onChange={(v) => setCourse('durationDays', v)} />
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Mode</label>
                  <select className="form-select" value={courseForm.mode} onChange={(e) => setCourse('mode', e.target.value)}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Funding Source</label>
                  <select className="form-select" value={courseForm.fundingSource} onChange={(e) => setCourse('fundingSource', e.target.value)}>
                    <option value="govt">Government</option>
                    <option value="private">Private</option>
                    <option value="trust">Trust</option>
                  </select>
                </div>
                <NumField label="Expenditure" value={courseForm.expenditure} onChange={(v) => setCourse('expenditure', v)} />
              </div>
              <div className="form-row-3">
                <TextField label="Coordinator Name" value={courseForm.coordinator.name} onChange={(v) => setCourse('coordinator.name', v)} />
                <TextField label="Coordinator Department" value={courseForm.coordinator.department} onChange={(v) => setCourse('coordinator.department', v)} />
                <TextField label="Coordinator Qualification" value={courseForm.coordinator.qualification} onChange={(v) => setCourse('coordinator.qualification', v)} />
              </div>
              <TextField label="Eligibility" value={courseForm.eligibility} onChange={(v) => setCourse('eligibility', v)} />
              <div className="form-row-4">
                <NumField label="Total Participants" value={courseForm.participants.total} onChange={(v) => setCourse('participants.total', v)} />
                <NumField label="Outside University" value={courseForm.participants.outsideUniversity} onChange={(v) => setCourse('participants.outsideUniversity', v)} />
                <NumField label="Outside State" value={courseForm.participants.outsideState} onChange={(v) => setCourse('participants.outsideState', v)} />
                <NumField label="Outside India" value={courseForm.participants.outsideIndia} onChange={(v) => setCourse('participants.outsideIndia', v)} />
              </div>
              <div className="form-row-2">
                <NumField label="Faculty Participants" value={courseForm.facultyParticipants} onChange={(v) => setCourse('facultyParticipants', v)} />
                <TextField label="Feedback Form URL" value={courseForm.feedbackFormUrl} onChange={(v) => setCourse('feedbackFormUrl', v)} />
              </div>
              <TextField label="Publications" value={courseForm.publications} onChange={(v) => setCourse('publications', v)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setCourseForm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveCourse}>{editingCourseId ? 'Update Course' : 'Add Course'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </AppLayout>
  );
}
