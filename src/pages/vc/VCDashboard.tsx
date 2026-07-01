import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import OrgHierarchy from '../../components/admin/OrgHierarchy';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  User, 
  BookOpen, 
  Award, 
  LayoutDashboard, 
  Activity, 
  Users as UsersIcon,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  Briefcase,
  TrendingUp,
  FileText,
  BookOpenText,
  AlertCircle,
  Search,
  X,
  Filter,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  UserPlus
} from 'lucide-react';
import axios from 'axios';
import SearchableSelect from '../../components/SearchableSelect';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DepartmentModal from './DepartmentModal';

interface DeptSummary { department: string; count: number; avgCompletion: number; members: any[] }

interface VCStats {
  totalFaculty: number;
  totalDepartments: number;
  facultyProfiles: number;
  totalStudents: number;
  totalPublications: number;
  totalProjects: number;
  totalAwards: number;
  activeUsers: number;
}

interface DeptOverview {
  name: string;
  hodName: string;
  stats: {
    facultyCount: number;
    totalPublications: number;
    totalProjects: number;
    totalQualifications: number;
    avgPublications: number;
    studentCount: number;
  };
  facultyMembers: {
    name: string;
    designation: string;
    completionPercentage: number;
  }[];
  publications: {
    total: number;
    scopus: number;
    ugc: number;
    bookChapters: number;
    books: number;
  };
  students: {
    total: number;
    ug: number;
    pg: number;
    scholars: number;
  };
  performance: {
    facultyCount: number;
    publications: number;
    projects: number;
    awards: number;
    profileCompletionRate: number;
  };
}

interface DeptListItem {
  _id: string;
  name: string;
  hod: {
    _id: string;
    username: string;
    email: string;
    name?: string;
  } | null;
  hodName: string;
  facultyCount: number;
  createdAt: string;
}

const getInitials = (name?: string) => {
  if (!name || name === 'No HOD Assigned') return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const themes = [
  {
    key: 'blue',
    iconBg: 'rgba(37, 99, 235, 0.08)',
    iconColor: '#2563EB',
    hodColor: '#2563EB',
    btnBg: 'rgba(37, 99, 235, 0.05)',
    btnColor: '#2563EB',
    btnHoverBg: 'rgba(37, 99, 235, 0.1)',
  },
  {
    key: 'green',
    iconBg: 'rgba(16, 185, 129, 0.08)',
    iconColor: '#10B981',
    hodColor: '#10B981',
    btnBg: 'rgba(16, 185, 129, 0.05)',
    btnColor: '#10B981',
    btnHoverBg: 'rgba(16, 185, 129, 0.1)',
  },
  {
    key: 'purple',
    iconBg: 'rgba(139, 92, 246, 0.08)',
    iconColor: '#8B5CF6',
    hodColor: '#8B5CF6',
    btnBg: 'rgba(139, 92, 246, 0.05)',
    btnColor: '#8B5CF6',
    btnHoverBg: 'rgba(139, 92, 246, 0.1)',
  },
  {
    key: 'amber',
    iconBg: 'rgba(245, 158, 11, 0.08)',
    iconColor: '#F59E0B',
    hodColor: '#F59E0B',
    btnBg: 'rgba(245, 158, 11, 0.05)',
    btnColor: '#F59E0B',
    btnHoverBg: 'rgba(245, 158, 11, 0.1)',
  },
  {
    key: 'teal',
    iconBg: 'rgba(20, 184, 166, 0.08)',
    iconColor: '#14B8A6',
    hodColor: '#14B8A6',
    btnBg: 'rgba(20, 184, 166, 0.05)',
    btnColor: '#14B8A6',
    btnHoverBg: 'rgba(20, 184, 166, 0.1)',
  },
  {
    key: 'rose',
    iconBg: 'rgba(244, 63, 94, 0.08)',
    iconColor: '#F43F5E',
    hodColor: '#F43F5E',
    btnBg: 'rgba(244, 63, 94, 0.05)',
    btnColor: '#F43F5E',
    btnHoverBg: 'rgba(244, 63, 94, 0.1)',
  }
];

function DepartmentCard({ dept, onClick }: { dept: DeptListItem; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const deptCode = useMemo(() => {
    const parts = dept.name.split(/\s+/).filter(p => !['of', 'and', 'the', '&'].includes(p.toLowerCase()));
    if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
    return parts.map(p => p[0]).join('').toUpperCase();
  }, [dept.name]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: hovered ? '1.5px solid var(--primary)' : '1px solid var(--border)',
        boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '24px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '190px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative accent bar on left */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        background: hovered ? 'var(--primary)' : 'var(--border)',
        transition: 'background 0.3s'
      }} />

      <div>
        {/* Top Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--primary)',
            background: 'rgba(37, 99, 235, 0.08)',
            padding: '4px 10px',
            borderRadius: '20px',
            letterSpacing: '0.05em'
          }}>
            {deptCode}
          </span>
          <ChevronRight size={18} style={{
            color: hovered ? 'var(--primary)' : 'var(--text-light)',
            transform: hovered ? 'translateX(4px)' : 'none',
            transition: 'transform 0.3s, color 0.3s'
          }} />
        </div>

        {/* Name */}
        <h3 style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '20px',
          lineHeight: '1.4'
        }}>
          {dept.name}
        </h3>
      </div>

      {/* Bottom Footer Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border)',
        paddingTop: '16px',
        marginTop: 'auto'
      }}>
        {/* HOD Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '65%' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--bg2)',
            color: 'var(--text)',
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {getInitials(dept.hod?.username || dept.hodName)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HOD</span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }} title={dept.hod?.username || dept.hodName}>
              {dept.hod?.username || dept.hodName}
            </span>
          </div>
        </div>

        {/* Faculty Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg)', padding: '6px 10px', borderRadius: '8px' }}>
          <Users size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
            {dept.facultyCount} Faculty
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VCDashboard() {
  const { tabId } = useParams();
  const activeTab = tabId || 'hierarchy';
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<VCStats | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Publications state
  const [publicationsList, setPublicationsList] = useState<any[]>([]);
  const [publicationsLoading, setPublicationsLoading] = useState(false);
  const [pubSearchQuery, setPubSearchQuery] = useState('');
  const [pubSortBy, setPubSortBy] = useState('year-desc');

  // Department navigation and overview states
  const [departmentsList, setDepartmentsList] = useState<DeptListItem[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [deptOverview, setDeptOverview] = useState<DeptOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', hodEmail: '' });
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [editDeptForm, setEditDeptForm] = useState({ id: '', name: '' });
  const [currentPage, setCurrentPage] = useState(1);

  // Add Student modal state (mirror Admin behavior)
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', phone: '', password: '', department: '', tutorName: '', tutorEmail: '' });
  const [departmentFaculty, setDepartmentFaculty] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Student accounts list state
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSortBy, setStudentSortBy] = useState<'alphabetical' | 'department'>('alphabetical');

  const fetchDepartmentsList = async () => {
    setDeptsLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartmentsList(res.data);
    } catch (err) {
      console.error('Failed to load departments list', err);
      toast.error('Failed to load departments list');
    } finally {
      setDeptsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const backendBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/faculty\/?$/, '').replace(/\/$/, '');
      const token = localStorage.getItem('iqac_token');
      const rawRes = await fetch(`${backendBase}/api/student/all-students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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

  useEffect(() => {
    if (studentForm.department) {
      api.get(`/departments/${encodeURIComponent(studentForm.department)}/faculty`)
        .then(res => setDepartmentFaculty(res.data || []))
        .catch(() => setDepartmentFaculty([]));
    } else {
      setDepartmentFaculty([]);
    }
  }, [studentForm.department]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...studentForm, role: 'student' };
      const backendBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/faculty\/?$/, '').replace(/\/$/, '');
      const token = localStorage.getItem('iqac_token');
      await axios.post(`${backendBase}/api/student/auth/register`, payload, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      toast.success(`Student account created for ${studentForm.email}`);
      setShowStudentModal(false);
      setStudentForm({ name: '', email: '', phone: '', password: '', department: '', tutorName: '', tutorEmail: '' });
      // refresh departments & stats to reflect updated student counts
      fetchDepartments();
      fetchDepartmentsList();
      fetchDashboard();
      if (activeTab === 'students') {
        fetchStudents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Student creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/departments', deptForm);
      toast.success(`Department ${deptForm.name} created successfully!`);
      setShowDeptModal(false);
      setDeptForm({ name: '', hodEmail: '' });
      fetchDepartmentsList();
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/departments/${editDeptForm.id}`, { name: editDeptForm.name });
      toast.success('Department updated successfully');
      setShowEditDeptModal(false);
      fetchDepartmentsList();
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the department "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department deleted successfully');
      fetchDepartmentsList();
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const fetchDeptOverview = async (name: string) => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await api.get(`/departments/${encodeURIComponent(name)}/overview`);
      setDeptOverview(res.data);
    } catch (err) {
      console.error('Failed to load department profile', err);
      setOverviewError('Failed to load department details. Please try again.');
      toast.error('Failed to load department details');
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    if ((activeTab === 'departments' && !selectedDept) || activeTab === 'students') {
      fetchDepartmentsList();
    }
  }, [activeTab, selectedDept]);

  useEffect(() => {
    if (activeTab === 'departments' && selectedDept) {
      fetchDeptOverview(selectedDept);
    }
  }, [activeTab, selectedDept]);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab]);

  const filteredAndSortedStudents = useMemo(() => {
    return students.filter(s => {
      if (!studentSearchQuery) return true;
      const q = studentSearchQuery.toLowerCase();
      const name = (s.personal_details?.fullName || s.name || s.username || '').toLowerCase();
      const email = (s.contact_details?.personalEmail || s.email || '').toLowerCase();
      const phone = (s.contact_details?.personalMobile?.number || s.phone || '').toLowerCase();
      const dept = (s.academic_details?.department || s.department || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || dept.includes(q);
    }).sort((a, b) => {
      if (studentSortBy === 'alphabetical') {
        const nameA = (a.personal_details?.fullName || a.name || a.username || '').toLowerCase();
        const nameB = (b.personal_details?.fullName || b.name || b.username || '').toLowerCase();
        return nameA.localeCompare(nameB);
      } else if (studentSortBy === 'department') {
        const deptA = (a.academic_details?.department || a.department || '').toLowerCase();
        const deptB = (b.academic_details?.department || b.department || '').toLowerCase();
        if (deptA === deptB) {
          const nameA = (a.personal_details?.fullName || a.name || a.username || '').toLowerCase();
          const nameB = (b.personal_details?.fullName || b.name || b.username || '').toLowerCase();
          return nameA.localeCompare(nameB);
        }
        return deptA.localeCompare(deptB);
      }
      return 0;
    });
  }, [students, studentSearchQuery, studentSortBy]);

  const filteredDepartments = useMemo(() => {
    return departmentsList.filter(d => {
      if (!deptSearchQuery) return true;
      const q = deptSearchQuery.toLowerCase();
      const deptName = d.name?.toLowerCase() || '';
      const hodName = d.hod?.username?.toLowerCase() || '';
      const hodEmail = d.hod?.email?.toLowerCase() || '';
      return deptName.includes(q) || hodName.includes(q) || hodEmail.includes(q);
    });
  }, [departmentsList, deptSearchQuery]);

  const itemsPerPage = 9;
  const totalItems = filteredDepartments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  const paginatedDepartments = useMemo(() => {
    return filteredDepartments.slice(startIndex, endIndex);
  }, [filteredDepartments, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deptSearchQuery]);

  const getGreeting = () => {
    const now = new Date();
    const h = now.getHours();
    if (h >= 5 && h < 12) return 'Good Morning';
    if (h >= 12 && h < 17) return 'Good Afternoon';
    if (h >= 17 && h < 21) return 'Good Evening';
    return 'Good Night';
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const sRes = await api.get('/vc/stats');
      setStats(sRes.data);
    } catch (err) {
      console.error('VC dashboard load error', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (activeTab === 'dashboard') fetchDashboard(); }, [activeTab]);

  // refresh periodically (every 60s) and on custom events
  useEffect(() => {
    const iv = setInterval(() => { if (activeTab === 'dashboard') fetchDashboard(); }, 60000);
    const onUpdate = () => { if (activeTab === 'dashboard') fetchDashboard(); };
    window.addEventListener('dataUpdated', onUpdate);
    window.addEventListener('dropdownOptionsUpdated', onUpdate);
    return () => { clearInterval(iv); window.removeEventListener('dataUpdated', onUpdate); window.removeEventListener('dropdownOptionsUpdated', onUpdate); };
  }, [activeTab]);

  // update clock every minute
  useEffect(() => {
    const tick = () => setNow(new Date());
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000 + 50;
    const timeout = setTimeout(() => {
      tick();
      const iv = setInterval(tick, 60000);
      // store iv on closure to clear later
      (window as any).__vcClockIv = iv;
    }, msToNextMinute);
    return () => { clearTimeout(timeout); if ((window as any).__vcClockIv) clearInterval((window as any).__vcClockIv); };
  }, []);

  const statCards = useMemo(() => ([
    { label: 'Total Faculty', value: stats?.totalFaculty ?? '—', icon: <Users size={20} />, color: 'var(--primary)', bg: 'rgba(15,76,117,0.06)' },
    { label: 'Departments', value: stats?.totalDepartments ?? '—', icon: <Building2 size={20} />, color: 'var(--accent)', bg: 'rgba(232,160,32,0.06)' },
    { label: 'Faculty Profiles', value: stats?.facultyProfiles ?? '—', icon: <BookOpen size={20} />, color: 'var(--success)', bg: 'rgba(5,150,105,0.06)' },
    ...(stats ? [
      { label: 'Total Students', value: stats.totalStudents, icon: <UsersIcon size={20} />, color: 'var(--navy)', bg: 'rgba(2,6,23,0.05)' },
      { label: 'Publications', value: stats.totalPublications, icon: <Activity size={18} />, color: 'var(--primary)', bg: 'rgba(15,76,117,0.06)', onClick: () => navigate('/vc/publications') },
      { label: 'Projects', value: stats.totalProjects, icon: <LayoutDashboard size={18} />, color: 'var(--accent)', bg: 'rgba(232,160,32,0.06)' },
      { label: 'Awards', value: stats.totalAwards, icon: <Award size={18} />, color: 'var(--success)', bg: 'rgba(5,150,105,0.06)' },
      { label: 'Active Users', value: stats.activeUsers, icon: <User size={18} />, color: 'var(--danger)', bg: 'rgba(229,62,62,0.06)' }
    ] : [])
  ]), [stats]);

  const [departments, setDepartments] = useState<any[]>([]);
  const [depsLoading, setDepsLoading] = useState(false);

  const fetchDepartments = async () => {
    setDepsLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
      toast.error('Failed to load departments');
    } finally {
      setDepsLoading(false);
    }
  };

  useEffect(() => { if (activeTab === 'dashboard') fetchDepartments(); }, [activeTab]);

  const fetchPublications = async () => {
    setPublicationsLoading(true);
    try {
      const res = await api.get('/vc/publications');
      setPublicationsList(res.data || []);
    } catch (err) {
      console.error('Error fetching publications:', err);
      toast.error('Failed to load publications');
    } finally {
      setPublicationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'publications') {
      fetchPublications();
    }
  }, [activeTab]);

  const renderDeptList = () => {
    return (
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1rem' }}>University Departments</h2>
            <p className="text-muted text-sm">Manage academic departments and assign HODs</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 250, flexShrink: 0 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search departments..."
                value={deptSearchQuery}
                onChange={e => setDeptSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 30, height: 32, fontSize: '13px' }}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowDeptModal(true)} style={{ height: 32, padding: '0 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, boxSizing: 'border-box', flexShrink: 0 }}>
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
              {deptsLoading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
              ) : filteredDepartments.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No departments found.</td></tr>
              ) : paginatedDepartments.map(d => (
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
                          {(d.hod.username || '').substring(0, 2).toUpperCase()}
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
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-sm btn-ghost"
                        title="Add student to this department"
                        onClick={() => { setStudentForm(f => ({ ...f, department: d.name })); setShowStudentModal(true); }}
                      >
                        <UserPlus size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        title="Edit department"
                        onClick={() => { setEditDeptForm({ id: d._id, name: d.name }); setShowEditDeptModal(true); }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        title="Delete department"
                        onClick={() => handleDeleteDept(d._id, d.name)}
                      >
                        <Trash2 size={14} color="var(--danger)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalItems > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {startIndex + 1} to {endIndex} of {totalItems} departments
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                type="button"
                className="btn btn-ghost btn-sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', minWidth: '38px', height: '34px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  type="button"
                  key={p}
                  className={`btn btn-sm ${currentPage === p ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCurrentPage(p)}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px',
                    minWidth: '34px',
                    height: '34px',
                    ...(currentPage === p ? {} : { border: '1px solid var(--border)', background: '#fff', color: '#334155' })
                  }}
                >
                  {p}
                </button>
              ))}
              <button 
                type="button"
                className="btn btn-ghost btn-sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', minWidth: '38px', height: '34px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDeptDetails = () => {
    if (overviewLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
          <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      );
    }

    if (overviewError || !deptOverview) {
      return (
        <div className="card" style={{ padding: '40px', textAlign: 'center', margin: '20px auto', maxWidth: '500px' }}>
          <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>Failed to Load Department</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {overviewError || 'No details available for this department.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => selectedDept && fetchDeptOverview(selectedDept)}
            >
              Retry
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => { setSelectedDept(null); setDeptOverview(null); }}
            >
              Back to List
            </button>
          </div>
        </div>
      );
    }

    const { stats, facultyMembers, publications, students, performance } = deptOverview;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
        {/* Navigation & Header Section */}
        <div>
          <button
            onClick={() => { setSelectedDept(null); setDeptOverview(null); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              background: 'none',
              color: 'var(--primary)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0',
              marginBottom: '16px',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--primary-dark)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--primary)')}
          >
            <ArrowLeft size={16} /> Back to Departments
          </button>

          <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            {/* Soft decorative background glow */}
            <div style={{
              position: 'absolute',
              right: '-50px',
              top: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none'
            }} />

            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'block',
              marginBottom: '6px'
            }}>
              Department Profile
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.2 }}>
              {deptOverview.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                HOD: <span style={{ color: 'var(--primary)' }}>{deptOverview.hodName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: Faculty */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Faculty Members</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(37,99,235,0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stats.facultyCount}</div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>Educators active</span>
          </div>

          {/* Card 2: Total Publications */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Publications</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(99,102,241,0.08)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stats.totalPublications}</div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>Research outputs</span>
          </div>

          {/* Card 3: Research Projects */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Research Projects</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stats.totalProjects}</div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>Ongoing & Completed</span>
          </div>

          {/* Card 4: Qualifications */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Qualifications</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16,185,129,0.08)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stats.totalQualifications}</div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>Total degrees held</span>
          </div>

          {/* Card 5: Avg Publications */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Avg Pubs / Faculty</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stats.avgPublications}</div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>Productivity index</span>
          </div>

          {/* Card 6: Student Count */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Student Count</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(236,72,153,0.08)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UsersIcon size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>{stats.studentCount}</div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>Total enrolled</span>
          </div>
        </div>

        {/* Detailed Breakdown Sections */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: '24px'
        }}>
          {/* Section A: Faculty Members */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Faculty Members</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Educator listing with designations and profile completions</p>
            </div>
            
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {facultyMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>No faculty profiles in this department.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 8px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Name</th>
                      <th style={{ padding: '10px 8px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Designation</th>
                      <th style={{ padding: '10px 8px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyMembers.map((fac, idx) => {
                      const color = fac.completionPercentage >= 90 
                        ? 'var(--success)' 
                        : fac.completionPercentage >= 50 
                          ? 'var(--warning)' 
                          : 'var(--danger)';
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{fac.name}</td>
                          <td style={{ padding: '12px 8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{fac.designation}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{fac.completionPercentage}%</span>
                              <div style={{ width: '60px', height: '6px', background: 'var(--bg2)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${fac.completionPercentage}%`, height: '100%', background: color }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Section B: Research & Publications */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Research & Publications</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Dynamic publication metrics sorted by category & indexing</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Total Stats Panel */}
              <div style={{ background: 'rgba(37,99,235,0.04)', border: '1px dashed rgba(37,99,235,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <BookOpenText size={24} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Departmental Publications</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{publications.total}</div>
                </div>
              </div>

              {/* Detail Items */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Scopus */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scopus Indexed</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{publications.scopus}</span>
                </div>

                {/* UGC Care */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>UGC CARE Listed</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{publications.ugc}</span>
                </div>

                {/* Chapters */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Book Chapters</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{publications.bookChapters}</span>
                </div>

                {/* Books */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Books Authored</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d946ef' }}>{publications.books}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Student Information */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Student Enrollment</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Student metrics divided by study level</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Students</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>{students.total}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                {/* UG */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    <span>Undergraduate (UG)</span>
                    <span>{students.ug} Students</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg2)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: students.total > 0 ? `${(students.ug / students.total) * 100}%` : '0%', height: '100%', background: 'var(--primary)' }} />
                  </div>
                </div>

                {/* PG */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    <span>Postgraduate (PG)</span>
                    <span>{students.pg} Students</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg2)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: students.total > 0 ? `${(students.pg / students.total) * 100}%` : '0%', height: '100%', background: '#8b5cf6' }} />
                  </div>
                </div>

                {/* Scholars */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    <span>Research Scholars (Ph.D / M.Phil)</span>
                    <span>{students.scholars} Scholars</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg2)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: students.total > 0 ? `${(students.scholars / students.total) * 100}%` : '0%', height: '100%', background: 'var(--success)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Department Performance Summary */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Performance Summary</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Key operational parameters consolidated</p>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
              {/* Circular Average completion rate */}
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                border: `8px solid rgba(5,150,105,0.08)`, 
                borderTopColor: 'var(--success)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>
                  {performance.profileCompletionRate}%
                </span>
                <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px', textAlign: 'center' }}>
                  Avg Profile<br/>Complete
                </span>
              </div>

              {/* Stats List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Faculty Tally</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>{performance.facultyCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Publications Count</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>{performance.publications}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Projects Count</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>{performance.projects}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Awards Count</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>{performance.awards}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderPublicationsTab = () => {
    let filteredPublications = publicationsList.filter(p => {
      if (!pubSearchQuery) return true;
      const q = pubSearchQuery.toLowerCase();
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.authorName || '').toLowerCase().includes(q) ||
        (p.department || '').toLowerCase().includes(q) ||
        (p.journal || '').toLowerCase().includes(q)
      );
    });

    filteredPublications.sort((a, b) => {
      switch (pubSortBy) {
        case 'year-desc': return (b.year || 0) - (a.year || 0);
        case 'year-asc': return (a.year || 0) - (b.year || 0);
        case 'title-asc': return (a.title || '').localeCompare(b.title || '');
        case 'author-asc': return (a.authorName || '').localeCompare(b.authorName || '');
        case 'department-asc': return (a.department || '').localeCompare(b.department || '');
        case 'type-asc': return (a.type || '').localeCompare(b.type || '');
        default: return 0;
      }
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '10px 0 6px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>University Publications</h2>
            <p className="text-muted text-sm">Comprehensive list of all publications by university faculty</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div className="relative" style={{ width: '420px', position: 'relative' }}>
              <Search className="absolute text-gray-400" size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by title, author, department..."
                value={pubSearchQuery}
                onChange={e => setPubSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px', height: '36px', fontSize: '13px', width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative" style={{ width: '180px', position: 'relative' }}>
              <Filter className="absolute text-gray-400" size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select
                value={pubSortBy}
                onChange={e => setPubSortBy(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '32px', height: '36px', fontSize: '13px', width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', paddingRight: '8px', cursor: 'pointer' }}
              >
                <option value="year-desc">Year (Newest)</option>
                <option value="year-asc">Year (Oldest)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="author-asc">Author (A-Z)</option>
                <option value="department-asc">Department (A-Z)</option>
                <option value="type-asc">Type (A-Z)</option>
              </select>
            </div>
            
            <button
              onClick={() => navigate('/vc/dashboard')}
              className="btn btn-ghost"
              style={{ height: '36px', padding: '0 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
            >
              <ArrowLeft size={15} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TITLE & JOURNAL</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>AUTHOR & DEPT</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>YEAR</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TYPE & INDEXING</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>LINK</th>
                </tr>
              </thead>
              <tbody>
                {publicationsLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="spinner" style={{ margin: 'auto' }} />
                    </td>
                  </tr>
                ) : filteredPublications.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No publications found.
                    </td>
                  </tr>
                ) : (
                  filteredPublications.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '14px 20px', maxWidth: '300px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={p.title}>
                          {p.title || 'Untitled'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={p.journal}>
                          {p.journal || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                          {p.authorName || '—'}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                          {p.department || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {p.year || '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, marginBottom: '4px' }}>
                          {p.type || 'Article'}
                        </span>
                        {p.indexedIn && (
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            {p.indexedIn}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {p.documentUrl ? (
                          <a href={p.documentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            View <ArrowLeft size={14} style={{ transform: 'rotate(135deg)' }} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentsTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
        {/* Filtering & Control Row (Aligned in a Single Row matching Mockup) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '10px 0 6px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Student Accounts</h2>
            <p className="text-muted text-sm">Manage students across all departments</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div className="relative" style={{ width: '420px', position: 'relative' }}>
              <Search className="absolute text-gray-400" size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px', height: '36px', fontSize: '13px', width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative" style={{ width: '180px', position: 'relative' }}>
              <Filter className="absolute text-gray-400" size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select
                value={studentSortBy}
                onChange={e => setStudentSortBy(e.target.value as any)}
                className="form-input"
                style={{ paddingLeft: '32px', height: '36px', fontSize: '13px', width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', paddingRight: '8px' }}
              >
                <option value="alphabetical">Sort: Alphabetically</option>
                <option value="department">Sort: Department-wise</option>
              </select>
            </div>
            
            {/* Add Student Button */}
            <button
              onClick={() => { setStudentForm(f => ({ ...f, department: '' })); setShowStudentModal(true); }}
              className="btn btn-primary"
              style={{ height: '36px', padding: '0 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '8px' }}
            >
              <UserPlus size={15} />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Data Table Wrapper (Matching card style) */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>STUDENT NAME</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>EMAIL</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PHONE</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>DEPARTMENT</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TUTOR</th>
                </tr>
              </thead>
              <tbody>
                {studentsLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="spinner" style={{ margin: 'auto' }} />
                    </td>
                  </tr>
                ) : filteredAndSortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedStudents.map((s: any, idx: number) => (
                    <tr key={s._id || idx}>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem' }}>
                          {s.personal_details?.fullName || s.name || s.username || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {s.contact_details?.personalEmail || s.email || '—'}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {s.contact_details?.personalMobile?.number || s.phone || '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                          {s.academic_details?.department || s.department || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.85rem' }}>
                        {s.mentor_details?.tutorName || s.tutorName || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout title={activeTab === 'students' ? 'Student Accounts' : 'Vice Chancellor Dashboard'}>
      {activeTab === 'hierarchy' ? (
        <OrgHierarchy />
      ) : activeTab === 'dashboard' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-start' }}>
          <div className="card" style={{ marginBottom: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'var(--primary)', fontWeight: 700 }}>
                {user?.username?.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>{getGreeting()}, {user?.role === 'vc' ? 'Vice Chancellor' : user?.username}</div>
                <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>Welcome back</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', color: 'var(--text-muted)', minWidth: 120 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{now.toLocaleDateString()}</div>
              <div style={{ fontSize: '0.85rem' }}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            width: '100%',
            marginBottom: '16px'
          }}>
            {statCards.map(s => (
              <div 
                key={s.label} 
                className="stat-card" 
                onClick={(s as any).onClick}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px', 
                  alignItems: 'flex-start',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  height: '100%',
                  boxSizing: 'border-box',
                  cursor: (s as any).onClick ? 'pointer' : 'default'
                }}
              >
                <div className="stat-card-icon" style={{ background: (s as any).bg, width: 36, height: 36, borderRadius: 8, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: (s as any).color }}>{s.icon}</span>
                </div>
                <div className="stat-card-value" style={{ color: (s as any).color, fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 0' }}>
                  {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : s.value}
                </div>
                <div className="stat-card-label" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Departments section */}
          <div style={{ marginTop: 15 }}>
            <h3 style={{ fontSize: '0.95rem', margin: '12px 0', fontWeight: 700 }}>Departments</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '20px',
              marginTop: '12px',
              width: '100%'
            }}>
              {depsLoading ? (
                <div style={{ padding: 12 }}><div className="spinner" /></div>
              ) : departments.length === 0 ? (
                <div className="card" style={{ padding: 12, color: 'var(--text-muted)' }}>No departments configured.</div>
              ) : departments.map((d: any, index: number) => {
                const theme = themes[index % themes.length];
                return (
                  <div 
                    key={d._id} 
                    className="dept-card" 
                    onClick={() => navigate(`/vc/department/${encodeURIComponent(d.name)}`)}
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                      padding: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      transition: 'all 0.2s ease-in-out',
                      alignItems: 'stretch',
                      height: '100%',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)';
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '12px', 
                        background: theme.iconBg, 
                        color: theme.iconColor, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Building2 size={22} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.name}>
                          {d.name}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          HOD: <span style={{ color: theme.hodColor, fontWeight: 600 }}>{d.hodName || d.hod?.username || '—'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Divider Line */}
                    <div style={{ borderTop: '1px solid #f1f5f9', width: '100%' }} />

                    {/* Stats Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '4px 0', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{d.facultyCount ?? 0}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>Faculty Members</span>
                      </div>
                      
                      <div style={{ borderLeft: '1px solid #f1f5f9', height: '32px' }} />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{d.studentCount ?? 0}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>Students</span>
                      </div>
                    </div>

                    {/* Footer View Details CTA */}
                    <div style={{ 
                      width: '100%',
                      height: '42px',
                      borderRadius: '12px',
                      background: theme.btnBg,
                      color: theme.btnColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      gap: '8px',
                      transition: 'background 0.2s',
                      marginTop: '12px'
                    }}>
                      <Users size={16} />
                      <span>View Details</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {selectedDept && (
            <DepartmentModal name={selectedDept} onClose={() => setSelectedDept(null)} />
          )}
        </div>
      ) : activeTab === 'departments' ? (
        renderDeptList()
      ) : activeTab === 'students' ? (
        renderStudentsTab()
      ) : activeTab === 'publications' ? (
        renderPublicationsTab()
      ) : (
        <OrgHierarchy />
      )}

      {/* Add Student Modal (mirror Admin implementation) */}
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

      {/* Edit Department Modal */}
      {showEditDeptModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditDeptModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Department</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditDeptModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateDept}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input
                    className="form-input"
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={editDeptForm.name}
                    onChange={e => setEditDeptForm(f => ({ ...f, name: e.target.value }))}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditDeptModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </AppLayout>
  );
}
