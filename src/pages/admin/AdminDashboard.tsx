/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { Users, UserCheck, UserX, BookOpen, Plus, Trash2, ToggleLeft, ToggleRight, X, Eye, Check, XCircle, MessageSquare, RefreshCw, Search, Clock3, Building2, UserPlus } from 'lucide-react';
import OrgHierarchy from '../../components/admin/OrgHierarchy';
import SearchableSelect from '../../components/SearchableSelect';
import axios from 'axios';

const dropdownKeyToFormMap: Record<string, string> = {
  genderOptions: '01 - Personal Information',
  bloodGroupOptions: '01 - Personal Information',
  nationalityOptions: '01 - Personal Information',
  religionOptions: '01 - Personal Information',
  categoryOptions: '01 - Personal Information',
  subCategoryOptions: '01 - Personal Information',
  maritalStatusOptions: '01 - Personal Information',
  disabilityStatusOptions: '01 - Personal Information',
  disabilityTypeOptions: '01 - Personal Information',
  stateOptions: '01 - Personal Information',
  countryOptions: '01 - Personal Information',
  degreeLevelOptions: '02 - Qualifications',
  degreeNameOptions: '02 - Qualifications',
  specializationOptions: '02 - Qualifications',
  divisionOptions: '02 - Qualifications',
  studyModeOptions: '02 - Qualifications',
  gradeTypeOptions: '02 - Qualifications',
  examNameOptions: '03 - Eligibility Tests',
  subjectPaperOptions: '03 - Eligibility Tests',
  stateForSetOptions: '03 - Eligibility Tests',
  validityStatusOptions: '03 - Eligibility Tests',
  designationOptions: '04 - Employment Details',
  departmentOptions: '04 - Employment Details',
  institutionTypeOptions: '04 - Employment Details',
  affiliatedUniversityOptions: '04 - Employment Details',
  natureOfAppointmentOptions: '04 - Employment Details',
  approvalStatusOptions: '04 - Employment Details',
  payScaleOptions: '04 - Employment Details',
  publicationTypeOptions: '05 - Research & Publications',
  publicationLevelOptions: '05 - Research & Publications',
  authorRoleOptions: '05 - Research & Publications',
  indexedInOptions: '05 - Research & Publications',
  peerReviewedStatusOptions: '05 - Research & Publications',
  journalCategoryOptions: '05 - Research & Publications',
  awardCategoryOptions: '06 - Awards & Honours',
  awardLevelOptions: '06 - Awards & Honours',
  awardingAgencyTypeOptions: '06 - Awards & Honours',
  honourTypeOptions: '06 - Awards & Honours',
  recognitionStatusOptions: '06 - Awards & Honours',
  fundingAgencyOptions: '07 - Research Projects',
  projectStatusOptions: '07 - Research Projects',
  roleInProjectOptions: '07 - Research Projects',
  projectCategoryOptions: '07 - Research Projects',
  fundingTypeOptions: '07 - Research Projects',
  researchDegreeOptions: '08 - Research Supervision',
  scholarGenderOptions: '08 - Research Supervision',
  researchStatusOptions: '08 - Research Supervision',
  guidanceTypeOptions: '08 - Research Supervision',
  patentStatusOptions: '08 - Research Supervision',
  patentTypeOptions: '08 - Research Supervision',
  supervisionCategoryOptions: '08 - Research Supervision',
  committeeTypeOptions: '09 - Academic Responsibilities',
  responsibilityRoleOptions: '09 - Academic Responsibilities',
  courseLevelOptions: '09 - Academic Responsibilities',
  semesterTypeOptions: '09 - Academic Responsibilities',
  academicSessionTypeOptions: '09 - Academic Responsibilities',
  teachingCategoryOptions: '09 - Academic Responsibilities',
  responsibilityStatusOptions: '09 - Academic Responsibilities',
  organisationOptions: '10 - Internship and Projects',
  internRoleOptions: '10 - Internship and Projects',
  projectTypeOptions: '10 - Internship and Projects',
  professionalBodyOptions: '11 - Memberships',
  membershipTypeOptions: '11 - Memberships',
  membershipCategoryOptions: '11 - Memberships',
  membershipStatusOptions: '11 - Memberships',
  membershipLevelOptions: '11 - Memberships',
  organizationTypeOptions: '11 - Memberships',
  programmeTypeOptions: '12 - Attended FDP & Workshops',
  sponsoringAgencyOptions: '12 - Attended FDP & Workshops',
  participationOptions: '12 - Attended FDP & Workshops',
  coursePlatformOptions: '13 - Online Courses',
  courseTypeOptions: '13 - Online Courses',
  completionStatusOptions: '13 - Online Courses',
  certificationTypeOptions: '13 - Online Courses',
  learningModeOptions: '13 - Online Courses',
  countryVisitOptions: '14 - Academic International Experience',
  purposeOfVisitOptions: '14 - Academic International Experience',
  fundingSourceOptions: '14 - Academic International Experience',
  visitCategoryOptions: '14 - Academic International Experience',
  collaborationTypeOptions: '14 - Academic International Experience',
  visitStatusOptions: '14 - Academic International Experience',
  adminChargeOptions: '15 - Admin & Non-Academic Responsibilities',
  academicAdminOptions: '16 - Academic Administration',
  qualityAssuranceOptions: '17 - Quality Assurance',
  researchInnovationOptions: '18 - Research and Innovation',
  examinationEvaluationOptions: '19 - Examination and Evaluation',
  adminSupportOptions: '20 - Administrative Support',
  departmentalChargesOptions: '21 - Departmental Charges',
  specialAssignmentsOptions: '22 - Special Assignments',
  extraInstitutionalOptions: '23 - Activities - Extra Institutional',
  documentTypeOptions: '24 - Documents'
};

interface FacultyUser {
  _id: string;
  username: string;
  email: string;
  role?: string;
  isActive: boolean;
  isFirstLogin: boolean;
  createdAt: string;
  profile?: {
    personalInfo?: { fullName?: string; designation?: string; department?: string; photoUrl?: string };
    employmentDetails?: { designation?: string; department?: string };
    profileComplete?: boolean;
    completionPercentage?: number;
  };
}

interface Stats { total: number; active: number; inactive: number; profilesComplete: number; }

export default function AdminDashboard() {
  const [faculty, setFaculty] = useState<FacultyUser[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, profilesComplete: 0 });
  const [requests, setRequests] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [departmentFaculty, setDepartmentFaculty] = useState<FacultyUser[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const { tabId } = useParams();
  const activeTab = tabId || 'accounts';
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', department: '' });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', hodEmail: '' });
  
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    department: '',
    tutorName: '',
    tutorEmail: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [facultySearchQuery, setFacultySearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'username' | 'email' | 'completion'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showHistory, setShowHistory] = useState(false);
  
  // For action modals
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; type: 'approve' | 'reject'; requestId: string; message: string }>({ isOpen: false, type: 'approve', requestId: '', message: '' });

  const fetchData = async () => {
    try {
      const [fRes, sRes, rRes, dRes] = await Promise.all([
        api.get('/admin/faculty'), 
        api.get('/admin/stats'), 
        api.get('/admin/option-requests'),
        api.get('/departments')
      ]);
      setFaculty(fRes.data);
      setStats(sRes.data);
      setRequests(rRes.data);
      setDepartmentsList(dRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const backendBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/faculty\/?$/, '').replace(/\/$/, '');
      const rawRes = await fetch(`${backendBase}/api/student/all-students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({})
      });
      if (!rawRes.ok) throw new Error(`Server returned ${rawRes.status}`);
      const resData = await rawRes.json();
      const data = Array.isArray(resData) ? resData : (resData.data || resData.students || resData.student || []);
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
      toast.error('Failed to fetch students');
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab]);

  useEffect(() => {
    if (studentForm.department) {
      api.get(`/departments/${encodeURIComponent(studentForm.department)}/faculty`)
        .then(res => setDepartmentFaculty(res.data))
        .catch(() => setDepartmentFaculty([]));
    } else {
      setDepartmentFaculty([]);
    }
  }, [studentForm.department]);

  const toggleStatus = async (id: string) => {
    try {
      const { data } = await api.patch(`/admin/faculty/${id}/status`);
      toast.success(data.message);
      fetchData();
    } catch { toast.error('Action failed'); }
  };

  const deleteFaculty = async (id: string, username: string) => {
    if (!confirm(`Delete account for ${username}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/faculty/${id}`);
      toast.success('Faculty account deleted');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department) {
      toast.error('Department is required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/faculty', form);
      toast.success(`Account created for ${form.email}`);
      setShowModal(false);
      setForm({ email: '', fullName: '', department: '' });
      fetchData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/departments', deptForm);
      toast.success(`Department ${deptForm.name} created successfully!`);
      setShowDeptModal(false);
      setDeptForm({ name: '', hodEmail: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...studentForm, role: 'student' };
      const backendBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/faculty\/?$/, '').replace(/\/$/, '');
      await axios.post(`${backendBase}/api/student/auth/register`, payload);
      toast.success(`Student account created for ${studentForm.email}`);
      setShowStudentModal(false);
      setStudentForm({ name: '', email: '', phone: '', password: '', department: '', tutorName: '', tutorEmail: '' });
      fetchStudents();
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Student creation failed'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleRequestAction = async (e?: React.FormEvent, overrideId?: string, overrideType?: 'undo') => {
    if (e) e.preventDefault();
    const requestId = overrideId || actionModal.requestId;
    const type = overrideType || actionModal.type;
    const message = actionModal.message;

    setSubmitting(true);
    try {
      if (overrideType === 'undo') {
        await api.patch(`/admin/option-requests/${requestId}/undo`);
      } else {
        await api.patch(`/admin/option-requests/${requestId}/${type}`, { adminMessage: message });
      }
      toast.success(`Request ${type === 'undo' ? 'undone' : type + 'd'} successfully`);
      fetchData();
      if (!overrideType) setActionModal({ ...actionModal, isOpen: false });
      
      // Inform users to refresh if they want the new options immediately
      if (type === 'approve' || type === 'undo') {
        window.dispatchEvent(new CustomEvent('dropdownOptionsUpdated')); 
      }
    } catch (err) {
      toast.error(`Failed to ${type} request`);
    } finally {
      setSubmitting(false);
    }
  };

  const statCards = [
    { label: 'Total Faculty', value: stats.total, icon: <Users size={20} />, color: 'var(--primary)', bg: 'rgba(15,76,117,0.1)' },
    { label: 'Active', value: stats.active, icon: <UserCheck size={20} />, color: 'var(--success)', bg: 'rgba(5,150,105,0.1)' },
    { label: 'Inactive', value: stats.inactive, icon: <UserX size={20} />, color: 'var(--danger)', bg: 'rgba(229,62,62,0.1)' },
    { label: 'Profiles Complete', value: stats.profilesComplete, icon: <BookOpen size={20} />, color: 'var(--accent)', bg: 'rgba(232,160,32,0.12)' },
  ];

  const departments = ['All', ...Array.from(new Set(faculty.map(f => f.profile?.employmentDetails?.department).filter(Boolean)))];

  const filteredFaculty = faculty.filter(f => {
    const q = facultySearchQuery.toLowerCase();
    const name = (f.profile?.personalInfo?.fullName || '').toLowerCase();
    const username = f.username.toLowerCase();
    const email = f.email.toLowerCase();
    const matchesSearch = name.includes(q) || username.includes(q) || email.includes(q);
    const matchesDept = departmentFilter === 'All' || f.profile?.employmentDetails?.department === departmentFilter;
    return matchesSearch && matchesDept;
  }).sort((a, b) => {
    let valA: any = '';
    let valB: any = '';
    if (sortBy === 'name') {
      valA = (a.profile?.personalInfo?.fullName || '').toLowerCase();
      valB = (b.profile?.personalInfo?.fullName || '').toLowerCase();
    } else if (sortBy === 'username') {
      valA = a.username.toLowerCase();
      valB = b.username.toLowerCase();
    } else if (sortBy === 'email') {
      valA = a.email.toLowerCase();
      valB = b.email.toLowerCase();
    } else if (sortBy === 'completion') {
      valA = a.profile?.completionPercentage || 0;
      valB = b.profile?.completionPercentage || 0;
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredRequests = requests.filter(r => {
    const matchesStatus = showHistory ? (r.status !== 'PENDING') : (r.status === 'PENDING');
    if (!matchesStatus) return false;
    
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = r.user?.username?.toLowerCase() || '';
    const email = r.user?.email?.toLowerCase() || '';
    const category = r.dropdownKey?.toLowerCase() || '';
    const val = r.requestedValue?.toLowerCase() || '';
    const date = new Date(r.createdAt).toLocaleDateString().toLowerCase();
    
    return name.includes(q) || email.includes(q) || category.includes(q) || val.includes(q) || date.includes(q);
  });

  return (
    <AppLayout title={activeTab === 'accounts' ? 'Faculty Accounts' : activeTab === 'hierarchy' ? 'Org Hierarchy' : 'Notifications'}>

      {activeTab === 'accounts' ? (
        <>
          {/* Stats */}
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            {statCards.map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-card-icon" style={{ background: s.bg }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div className="stat-card-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Faculty Table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: '1rem' }}>Faculty Accounts</h2>
                <p className="text-muted text-sm">Manage all registered faculty members</p>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 200 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="text" 
                    placeholder="Search faculty..." 
                    value={facultySearchQuery}
                    onChange={e => setFacultySearchQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 30, height: 32, fontSize: '13px' }}
                  />
                </div>
                <select
                  value={departmentFilter}
                  onChange={e => setDepartmentFilter(e.target.value)}
                  className="form-input"
                  style={{ height: 32, fontSize: '13px', minWidth: 120, padding: '0 8px' }}
                >
                  {departments.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                </select>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="form-input"
                  style={{ height: 32, fontSize: '13px', minWidth: 100, padding: '0 8px' }}
                >
                  <option value="name">Sort: Name</option>
                  <option value="username">Sort: Username</option>
                  <option value="email">Sort: Email</option>
                  <option value="completion">Sort: Completion</option>
                </select>
                <button 
                  className="btn btn-sm"
                  onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                  style={{ height: 32, padding: '0 8px', background: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1' }}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
                <button id="add-faculty-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
                  <Plus size={14} /> Add Faculty
                </button>
              </div>
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
                    <th>Account</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                  ) : filteredFaculty.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No faculty found.</td></tr>
                  ) : filteredFaculty.map(f => (
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
                        <span className={`badge ${f.isActive ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                          {f.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" title="View public profile" onClick={() => window.open(`/profile/${f.username}`, '_blank')} style={{ padding: '6px' }}>
                            <Eye size={12} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title={f.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleStatus(f._id)}
                            style={{ padding: '6px' }}
                          >
                            {f.isActive ? <ToggleRight size={14} color="var(--success)" /> : <ToggleLeft size={14} />}
                          </button>
                          <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => deleteFaculty(f._id, f.username)} style={{ padding: '6px' }}>
                            <Trash2 size={12} color="var(--danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeTab === 'requests' ? (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem' }}>{showHistory ? 'Request History' : 'Notifications (Pending Requests)'}</h2>
              <p className="text-muted text-sm">{showHistory ? 'View processed requests (Approved / Rejected)' : 'Review requests from faculty to add new custom dropdown options'}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  type="text" 
                  placeholder="Search name, category, date..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 30, height: 32, fontSize: '13px' }}
                />
              </div>
              <button 
                className="btn btn-sm"
                onClick={() => setShowHistory(!showHistory)}
                style={{ 
                  background: showHistory ? '#e2e8f0' : 'transparent', 
                  border: '1px solid #cbd5e1',
                  color: '#334155'
                }}
              >
                <Clock3 size={14} /> {showHistory ? 'View Pending' : 'History'}
              </button>
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
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : filteredRequests.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No requests found.</td></tr>
                ) : filteredRequests.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.user?.username}</div>
                      <div className="text-xs text-muted">{r.user?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontSize: '0.85rem' }}>
                        {dropdownKeyToFormMap[r.dropdownKey] || 'Unknown Form'}
                      </div>
                      <span className="badge badge-secondary">{r.dropdownKey}</span>
                    </td>
                    <td><strong style={{ color: 'var(--primary)' }}>{r.requestedValue}</strong></td>
                    <td className="text-sm text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      {r.status === 'PENDING' && <span className="badge badge-pending">Pending</span>}
                      {r.status === 'APPROVED' && <span className="badge badge-active">Approved</span>}
                      {r.status === 'REJECTED' && <span className="badge badge-inactive">Rejected</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {r.status === 'PENDING' ? (
                          <>
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
                          </>
                        ) : (
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => handleRequestAction(undefined, r._id, 'undo')}
                            title="Undo this action"
                          >
                            <RefreshCw size={14} /> Undo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'hierarchy' ? (
        <OrgHierarchy />
      ) : activeTab === 'departments' ? (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem' }}>University Departments</h2>
              <p className="text-muted text-sm">Manage academic departments and assign HODs</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={() => setShowDeptModal(true)}>
                <Plus size={14} /> Add Department
              </button>
            </div>
          </div>
          
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>HOD Assigned</th>
                  <th>HOD Email</th>
                  <th>Added On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : departmentsList.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No departments configured.</td></tr>
                ) : departmentsList.map(d => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building2 size={16} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.name}</span>
                      </div>
                    </td>
                    <td>
                      {d.hod ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>
                            {d.hod.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{d.hod.username}</span>
                        </div>
                      ) : (
                        <span className="badge badge-inactive">No HOD</span>
                      )}
                    </td>
                    <td className="text-sm text-muted">{d.hod?.email || '—'}</td>
                    <td className="text-sm text-muted">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-ghost" 
                        title="Add student to this department"
                        onClick={() => { setStudentForm(f => ({ ...f, department: d.name })); setShowStudentModal(true); }}
                      >
                        <UserPlus size={14} /> Add Student
                      </button>
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
              <h2 style={{ fontSize: '1rem' }}>Student Accounts</h2>
              <p className="text-muted text-sm">Manage students across all departments</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setStudentForm(f => ({ ...f, department: '' })); setShowStudentModal(true); }}>
              <UserPlus size={14} /> Add Student
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
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No students found.</td></tr>
                ) : students.map((s, idx) => (
                  <tr key={s._id || idx}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{s.personal_details?.fullName || s.name || s.username || '—'}</div>
                    </td>
                    <td className="text-sm text-muted" style={{ fontSize: '0.8rem' }}>{s.contact_details?.personalEmail || s.email || '—'}</td>
                    <td className="text-sm text-muted" style={{ fontSize: '0.8rem' }}>{s.contact_details?.personalMobile?.number || s.phone || '—'}</td>
                    <td><span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{s.academic_details?.department || s.department || '—'}</span></td>
                    <td><span className="text-sm">{s.mentor_details?.tutorName || s.tutorName || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDeptModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Create Department & Assign HOD</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeptModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateDept}>
              <div className="modal-body">
                <div className="info-banner info-banner-info" style={{ marginBottom: 16 }}>
                  <span>Creating a department will automatically generate a new HOD account with a default password of <strong>password123</strong>.</span>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    required 
                    placeholder="e.g. Computer Science" 
                    value={deptForm.name} 
                    onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} 
                    autoFocus 
                  />
                </div>


                <div className="form-group">
                  <label className="form-label">HOD Email Address *</label>
                  <input 
                    className="form-input" 
                    type="email" 
                    required 
                    placeholder="hod@university.edu.in" 
                    value={deptForm.hodEmail} 
                    onChange={e => setDeptForm(f => ({ ...f, hodEmail: e.target.value }))} 
                  />
                  <p className="form-hint">This email will be used for the HOD to log in.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowDeptModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Creating...</> : 'Create Department'}
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
              <h3>Create Student Account</h3>
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
                    <label className="form-label">Department *</label>
                    <SearchableSelect
                      value={studentForm.department}
                      onChange={val => setStudentForm(f => ({ ...f, department: val, tutorName: '', tutorEmail: '' }))}
                      options={departmentsList.map(d => d.name)}
                      placeholder="— Select Department —"
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
                            tutorEmail: tutor?.email || ''
                          }));
                        }}
                        options={departmentFaculty.filter(f => f.role !== 'hod').map(f => f.profile?.personalInfo?.fullName || f.username || '')}
                        placeholder={studentForm.department ? "— Select Tutor —" : "Select department first"}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tutor Email *</label>
                    <input 
                      className="form-input" 
                      type="email" 
                      required 
                      readOnly 
                      value={studentForm.tutorEmail} 
                      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }} 
                      placeholder="Auto-filled"
                    />
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
                  <span>Faculty will receive a default password of <strong>password123</strong>. They'll be prompted to change it on first login.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" required placeholder="faculty@university.edu.in" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} autoFocus />
                  <p className="form-hint">Username will be auto-generated from the email address.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <SearchableSelect
                    value={form.department}
                    onChange={val => setForm(f => ({ ...f, department: val }))}
                    options={departmentsList.map(d => d.name)}
                    placeholder="— Select Department —"
                  />
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
                  {actionModal.type === 'reject' && (
                    <p className="form-hint" style={{ color: 'var(--danger)' }}>This message will be shown to the faculty member.</p>
                  )}
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
