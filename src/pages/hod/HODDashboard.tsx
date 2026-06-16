/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import OrgHierarchy from '../../components/admin/OrgHierarchy';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { Users, BookOpen, Plus, Eye, Check, XCircle, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import SearchableSelect from '../../components/SearchableSelect';

const dropdownKeyToFormMap: Record<string, string> = {
  genderOptions: '01 - Personal Information',
  departmentOptions: '04 - Employment Details',
  designationOptions: '04 - Employment Details',
  // Note: Copied a subset for brevity, add full map if needed or export it
  publicationTypeOptions: '05 - Research & Publications',
  fundingAgencyOptions: '07 - Research Projects',
};

interface FacultyUser {
  _id: string;
  username: string;
  email: string;
  role?: string;
  isActive: boolean;
  isFirstLogin: boolean;
  profile?: {
    personalInfo?: { fullName?: string; designation?: string; department?: string; photoUrl?: string };
    employmentDetails?: { designation?: string; department?: string };
    profileComplete?: boolean;
    completionPercentage?: number;
  };
}

export default function HODDashboard() {
  const { tabId } = useParams();
  const activeTab = tabId || 'hierarchy';
  const [faculty, setFaculty] = useState<FacultyUser[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentFaculty, setDepartmentFaculty] = useState<FacultyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const { user } = useAuth();

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '' });
  const [submitting, setSubmitting] = useState(false);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const getHodDepartment = () => {
    try {
      const facStr = localStorage.getItem('iqac_faculty');
      if (facStr) {
        const fac = JSON.parse(facStr);
        return fac?.employmentDetails?.department || '';
      }
    } catch { }
    return '';
  };
  const hodDepartment = getHodDepartment();

  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    department: hodDepartment,
    tutorName: '',
    tutorEmail: ''
  });

  const [actionModal, setActionModal] = useState<{ isOpen: boolean; type: 'approve' | 'reject'; requestId: string; message: string }>({ isOpen: false, type: 'approve', requestId: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, rRes, dRes] = await Promise.all([
        api.get('/hod/faculty'),
        api.get('/hod/option-requests'),
        api.get('/departments')
      ]);
      setFaculty(fRes.data);
      setRequests(rRes.data);
      setDepartments(dRes.data);
    } catch (err) {
      toast.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchStudents = async () => {
    if (!hodDepartment) {
      console.warn('fetchStudents: hodDepartment is not set or empty in localStorage.');
      return;
    }
    setStudentsLoading(true);
    console.log('--- Fetching Students Start ---');
    console.log('HOD Logged-in Department:', hodDepartment);
    const url = '/api/student/by-department';
    console.log('Sending POST Request URL:', url);
    console.log('Request body:', { department: hodDepartment });
    try {
      const rawRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ department: hodDepartment })
      });
      console.log('POST /api/student/by-department Response status:', rawRes.status);
      if (!rawRes.ok) throw new Error(`Server returned ${rawRes.status}`);
      const resData = await rawRes.json();
      console.log('POST /api/student/by-department Response data:', resData);
      const data = Array.isArray(resData) ? resData : (resData.data || resData.students || resData.student || []);
      console.log('POST /api/student/by-department Parsed students list:', data);
      setStudents(data);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      toast.error('Failed to fetch students');
    } finally {
      console.log('--- Fetching Students End ---');
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab, hodDepartment]);

  useEffect(() => {
    if (studentForm.department) {
      console.log('Fetching faculty/tutors for department:', studentForm.department);
      api.get(`/departments/${encodeURIComponent(studentForm.department)}/faculty`)
        .then(res => {
          console.log('Fetched department faculty:', res.data);
          setDepartmentFaculty(res.data);
        })
        .catch(err => {
          console.error('Error fetching department faculty:', err);
          setDepartmentFaculty([]);
        });
    } else {
      setDepartmentFaculty([]);
    }
  }, [studentForm.department]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/hod/faculty', form);
      toast.success(`Account created for ${form.email}`);
      setShowModal(false);
      setForm({ email: '', fullName: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...studentForm,
        role: 'student',
        hodName: user?.username || 'HOD',
        hodEmail: user?.email || 'hod@test.com'
      };
      await axios.post('/api/student/auth/register', payload);
      toast.success(`Student account created for ${studentForm.email}`);
      setShowStudentModal(false);
      setStudentForm({ name: '', email: '', phone: '', password: '', department: hodDepartment, tutorName: '', tutorEmail: '' });
      fetchStudents();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Student creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestAction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const { requestId, type, message } = actionModal;

    setSubmitting(true);
    try {
      await api.patch(`/hod/option-requests/${requestId}/${type}`, { adminMessage: message });
      toast.success(`Request ${type}d successfully`);
      fetchData();
      setActionModal({ ...actionModal, isOpen: false });
    } catch (err) {
      toast.error(`Failed to ${type} request`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (r.status !== 'PENDING') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = r.user?.username?.toLowerCase() || '';
    const email = r.user?.email?.toLowerCase() || '';
    const val = r.requestedValue?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || val.includes(q);
  });

  return (
    <AppLayout title="Head of Department Dashboard">

      {activeTab === 'hierarchy' ? (
        <OrgHierarchy />
      ) : activeTab === 'faculty' ? (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem' }}>Department Faculty</h2>
              <p className="text-muted text-sm">Manage faculty members in your department</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add Faculty
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Profile Status</th>
                  <th>Completion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : faculty.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No faculty accounts yet. Add one above.</td></tr>
                ) : faculty.map(f => (
                  <tr key={f._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar">
                          {((f.profile?.personalInfo?.fullName || f.username || '').slice(0, 2)).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{f.profile?.personalInfo?.fullName || '—'}</div>
                          <div className="text-xs text-muted">
                            {f.profile?.employmentDetails?.designation || f.profile?.personalInfo?.designation || 'Profile Incomplete'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{f.username}</code></td>
                    <td className="text-sm text-muted" style={{ fontSize: '0.8rem' }}>{f.email}</td>
                    <td>
                      <span className={`badge ${f.profile?.profileComplete ? 'badge-active' : 'badge-pending'}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                        {f.profile?.profileComplete ? 'Complete' : f.isFirstLogin ? 'First Login' : 'Incomplete'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
                        <div className="progress-bar-wrap" style={{ flex: 1 }}>
                          <div className="progress-bar" style={{ width: `${f.profile?.completionPercentage || 0}%` }} />
                        </div>
                        <span className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>{f.profile?.completionPercentage || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" title="View public profile" onClick={() => window.open(`/profile/${f.username}`, '_blank')} style={{ padding: '6px' }}>
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'requests' || activeTab === 'notifications' ? (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem' }}>Pending Requests</h2>
              <p className="text-muted text-sm">Review dropdown option requests from your faculty</p>
            </div>
            <div style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 30, height: 32, fontSize: '13px' }}
              />
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Category (Dropdown)</th>
                  <th>Requested Option</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : filteredRequests.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No pending requests.</td></tr>
                ) : filteredRequests.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.user?.username}</div>
                      <div className="text-xs text-muted">{r.user?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontSize: '0.85rem' }}>
                        {dropdownKeyToFormMap[r.dropdownKey] || 'Dropdown Form'}
                      </div>
                      <span className="badge badge-secondary">{r.dropdownKey}</span>
                    </td>
                    <td><strong style={{ color: 'var(--primary)' }}>{r.requestedValue}</strong></td>
                    <td className="text-sm text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                          onClick={() => setActionModal({ isOpen: true, type: 'approve', requestId: r._id, message: '' })}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                          onClick={() => setActionModal({ isOpen: true, type: 'reject', requestId: r._id, message: '' })}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'students' ? (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem' }}>Department Students</h2>
              <p className="text-muted text-sm">Manage students in your department</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowStudentModal(true)}>
              <Plus size={14} /> Add Student
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Tutor</th>
                </tr>
              </thead>
              <tbody>
                {studentsLoading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No students found in your department.</td></tr>
                ) : students.map((s, idx) => (
                  <tr key={s._id || idx}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{s.personal_details?.fullName || s.name || s.username || '—'}</div>
                    </td>
                    <td className="text-sm text-muted" style={{ fontSize: '0.8rem' }}>{s.contact_details?.personalEmail || s.email || '—'}</td>
                    <td className="text-sm text-muted" style={{ fontSize: '0.8rem' }}>{s.contact_details?.personalMobile?.number || s.phone || '—'}</td>
                    <td><span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{s.academic_details?.department || s.department || hodDepartment}</span></td>
                    <td><span className="text-sm">{s.mentor_details?.tutorName || s.tutorName || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Add Faculty Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add Faculty Account</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="info-banner info-banner-info" style={{ marginBottom: 16 }}>
                  <span>Faculty will be added to your department and receive a default password of <strong>password123</strong>.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" required placeholder="faculty@university.edu.in" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} autoFocus />
                  <p className="form-hint">Username will be auto-generated from the email address.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name (Optional)</label>
                  <input className="form-input" type="text" placeholder="e.g. Dr. Jane Smith" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Creating...</> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showStudentModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowStudentModal(false)}>
          <div className="modal" style={{ maxWidth: '750px', overflow: 'visible' }}>
            <div className="modal-header">
              <h3>Add Student Account</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowStudentModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateStudent}>
              <div className="modal-body" style={{ overflow: 'visible' }}>
                <div className="info-banner info-banner-info" style={{ marginBottom: 16 }}>
                  <span>This will create a new student account in the external system.</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" type="text" required placeholder="Student Name" value={studentForm.name} onChange={e => setStudentForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input className="form-input" type="email" required placeholder="student@university.edu.in" value={studentForm.email} onChange={e => setStudentForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input className="form-input" type="text" required placeholder="9000000001" value={studentForm.phone} onChange={e => setStudentForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input className="form-input" type="password" required placeholder="Password" value={studentForm.password} onChange={e => setStudentForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Department</label>
                    <input
                      className="form-input"
                      type="text"
                      value={studentForm.department || '— No Department —'}
                      readOnly
                      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tutor Name *</label>
                    <div style={{ pointerEvents: studentForm.department ? 'auto' : 'none', opacity: studentForm.department ? 1 : 0.6 }}>
                      <SearchableSelect
                        value={studentForm.tutorName}
                        onChange={val => {
                          const validTutors = departmentFaculty.filter(f => f.role !== 'hod');
                          const tutor = validTutors.find(f => (f.profile?.personalInfo?.fullName || f.username || '') === val);
                          setStudentForm(f => ({
                            ...f,
                            tutorName: val,
                            tutorEmail: tutor ? tutor.email : ''
                          }));
                        }}
                        options={departmentFaculty.filter(f => f.role !== 'hod').map(f => f.profile?.personalInfo?.fullName || f.username || '')}
                        placeholder={studentForm.department ? '— Select Tutor —' : '— Select Dept First —'}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tutor Email *</label>
                    <input className="form-input" type="email" required placeholder="tutor@test.com" value={studentForm.tutorEmail} readOnly style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowStudentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Creating...</> : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setActionModal({ ...actionModal, isOpen: false })}>
          <div className="modal">
            <div className="modal-header">
              <h3>{actionModal.type === 'approve' ? 'Approve Request' : 'Reject Request'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setActionModal({ ...actionModal, isOpen: false })}><X size={18} /></button>
            </div>
            <form onSubmit={handleRequestAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Message to Faculty {actionModal.type === 'reject' ? '*' : '(Optional)'}</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    required={actionModal.type === 'reject'}
                    placeholder={actionModal.type === 'reject' ? "Please provide a reason for rejection..." : "E.g. Added to the list."}
                    value={actionModal.message}
                    onChange={e => setActionModal({ ...actionModal, message: e.target.value })}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setActionModal({ ...actionModal, isOpen: false })}>Cancel</button>
                <button
                  type="submit"
                  className="btn"
                  style={actionModal.type === 'approve' ? { background: '#059669', color: 'white' } : { background: '#dc2626', color: 'white' }}
                  disabled={submitting}
                >
                  {submitting ? <><span className="spinner" /> Processing...</> : actionModal.type === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}