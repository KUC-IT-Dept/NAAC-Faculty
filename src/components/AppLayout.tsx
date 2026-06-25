import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, GraduationCap, Eye, PanelLeftClose, UserPen, Globe, Users, Bell, Building2, UserPlus } from 'lucide-react';

interface NavItem { label: string; path: string; icon: ReactNode; exact?: boolean; }

const adminNav: NavItem[] = [
  { label: 'Faculty Accounts', path: '/admin/accounts', icon: <Users size={18} /> },
  { label: 'Org Hierarchy', path: '/admin/hierarchy', icon: <GraduationCap size={18} /> },
  { label: 'Departments', path: '/admin/departments', icon: <Building2 size={18} /> },
  { label: 'Students', path: '/admin/students', icon: <UserPlus size={18} /> },
  { label: 'Notifications', path: '/admin/requests', icon: <Bell size={18} /> },
  { label: 'Edit Form', path: '/admin/edit-profile', icon: <UserPen size={18} /> },
  { label: 'General', path: '/admin/general', icon: <Globe size={18} /> },
];

const facultyNav: NavItem[] = [
  { label: 'Dashboard', path: '/faculty/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Edit Profile', path: '/faculty/profile/edit', icon: <UserPen size={18} /> },
];

const vcNav: NavItem[] = [
  { label: 'Org Hierarchy', path: '/vc/hierarchy', icon: <GraduationCap size={18} /> },
  { label: 'Dashboard', path: '/vc/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Departments', path: '/vc/departments', icon: <Building2 size={18} /> },
  { label: 'Students', path: '/vc/students', icon: <UserPlus size={18} /> },
];

const hodNav: NavItem[] = [
  { label: 'Org Hierarchy', path: '/hod/hierarchy', icon: <GraduationCap size={18} /> },
  { label: 'Department Faculty', path: '/hod/faculty', icon: <Users size={18} /> },
  { label: 'Department Students', path: '/hod/students', icon: <Users size={18} /> },
  { label: 'Notifications', path: '/hod/notifications', icon: <Bell size={18} /> },
];

const profileDropdownItems = (role?: 'admin' | 'faculty' | 'vc' | 'hod') => {
  const base = role === 'admin' ? '/admin/edit-profile' : '/faculty/profile/edit';
  return [
    { id: 'personal-information', label: '01 - Personal Information', path: `${base}/personal-information` },
    { id: 'qualifications', label: '02 - Qualifications', path: `${base}/qualifications` },
    { id: 'eligibility-tests', label: '03 - Eligibility Tests', path: `${base}/eligibility-tests` },
    { id: 'employment-details', label: '04 - Employment Details', path: `${base}/employment-details` },
    { id: 'work-experience', label: '05 - Work Experience', path: `${base}/work-experience` },
    { id: 'research-publications', label: '06 - Research & Publications', path: `${base}/research-publications` },
    { id: 'awards-honours', label: '07 - Awards & Honours', path: `${base}/awards-honours` },
    { id: 'research-projects', label: '08 - Research Projects', path: `${base}/research-projects` },
    { id: 'research-supervision', label: '09 - Research Supervision', path: `${base}/research-supervision` },
    { id: 'academic-responsibilities', label: '10 - Academic Responsibilities', path: `${base}/academic-responsibilities` },
    { id: 'internship-projects', label: '11 - Internship and Projects', path: `${base}/internship-projects` },
    { id: 'memberships', label: '12 - Memberships', path: `${base}/memberships` },
    { id: 'fdp-workshops', label: '13 - Attended FDP & Workshops', path: `${base}/fdp-workshops` },
    { id: 'online-courses', label: '14 - Online Courses', path: `${base}/online-courses` },
    { id: 'international-experience', label: '15 - Academic International Experience', path: `${base}/international-experience` },
    { id: 'admin-non-academic', label: '16 - Admin & Non-Academic Resp.', path: `${base}/admin-non-academic` },
    { id: 'academic-administration', label: '17 - Academic Administration', path: `${base}/academic-administration` },
    { id: 'quality-assurance', label: '18 - Quality Assurance', path: `${base}/quality-assurance` },
    { id: 'research-innovation', label: '19 - Research & Innovation', path: `${base}/research-innovation` },
    { id: 'examination-evaluation', label: '20 - Exam & Evaluation', path: `${base}/examination-evaluation` },
    { id: 'admin-support', label: '21 - Administrative Support', path: `${base}/admin-support` },
    { id: 'dept-charges', label: '22 - Departmental Charges', path: `${base}/dept-charges` },
    { id: 'special-assignments', label: '23 - Special Assignments', path: `${base}/special-assignments` },
    { id: 'extra-institutional', label: '24 - Activities – Extra Institutional', path: `${base}/extra-institutional` },
    { id: 'documents', label: '25 - Documents', path: `${base}/documents` },
  ];
};

export default function AppLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const facultyProfile = JSON.parse(localStorage.getItem('iqac_faculty') || 'null');

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'vc' ? vcNav : user?.role === 'hod' ? hodNav : facultyNav;
  const displayName = user?.username || (user?.role === 'admin' ? 'Administrator' : user?.role === 'vc' ? 'Vice Chancellor' : user?.role === 'hod' ? 'HOD' : 'Faculty User');
  const displayRole = user?.role === 'admin' ? 'Administrator' : user?.role === 'vc' ? 'Vice Chancellor' : user?.role === 'hod' ? 'Head of Department' : 'Faculty User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const editProfileBase = user?.role === 'admin' ? '/admin/edit-profile' : '/faculty/profile/edit';
  const isActive = (item: NavItem) => item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
  const handleLogout = () => { logout(); navigate('/login'); };

  const visibilityPath = user?.role === 'admin' ? '/admin/edit-profile/visibility' : '/faculty/profile/edit/visibility';
  const isVisibilityActive = location.pathname.includes('/visibility');

  useEffect(() => {
    if (location.pathname.startsWith(editProfileBase)) {
      setEditProfileOpen(true);
    } else {
      setEditProfileOpen(false);
    }
  }, [location.pathname, editProfileBase]);

  return (
    <div className="app-layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top" style={{ alignItems: collapsed ? 'center' : 'flex-end', marginBottom: collapsed ? '28px' : '0' }}>
          {!collapsed ? (
            <button type="button" className="sidebar-toggle" onClick={() => setCollapsed(true)}>
              <PanelLeftClose size={20} />
            </button>
          ) : (
            <button type="button" className="sidebar-logo-button" onClick={() => setCollapsed(false)}>
              <GraduationCap size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {!collapsed && <div className="sidebar-section-label">{user?.role === 'admin' ? 'Admin Panel' : user?.role === 'vc' ? 'University Overview' : user?.role === 'hod' ? (facultyProfile?.employmentDetails?.department || 'Department Panel') : 'My Account'}</div>}
          {navItems.map(item => {
            if (item.label === 'Edit Profile' || item.label === 'Edit Form') {
              return (
                <div key={item.path} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className={`nav-item ${isActive(item) ? 'active' : ''}`}
                    onClick={() => {
                      if (collapsed) setCollapsed(false);
                      setEditProfileOpen(prev => !prev);
                    }}
                  >
                    <span className="nav-item-button">{item.icon}</span>
                    {!collapsed && <span className="nav-item-label">{item.label}</span>}
                  </button>

                  {editProfileOpen && (
                    <div className="sidebar-subitems">
                      {profileDropdownItems(user?.role).map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <button
                            key={subItem.id}
                            className={`nav-item nav-subitem ${isSubActive ? 'active' : ''}`}
                            onClick={() => navigate(subItem.path)}
                          >
                            {!collapsed && <span className="nav-item-label">{subItem.label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.path} to={item.path} className={`nav-item ${isActive(item) ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
                <span className="nav-item-button">{item.icon}</span>
                {!collapsed && <span className="nav-item-label">{item.label}</span>}
              </Link>
            );
          })}

        </nav>

        <div className="sidebar-footer">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px', paddingTop: '4px' }}>
            {user?.role === 'faculty' && !collapsed && <div className="sidebar-section-label" style={{ padding: '0 0 6px' }}>Public</div>}

            {user?.role === 'faculty' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '10px' }}>
                <button
                  className="nav-item"
                  onClick={() => navigate(visibilityPath)}
                  style={isVisibilityActive ? { borderLeft: '3px solid #2563EB', borderRadius: '12px', background: '#EEF2FF', color: '#2563EB', height: '40px', padding: '0 10px' } : { borderRadius: '12px', borderLeft: '3px solid transparent', height: '40px', padding: '0 10px' }}
                >
                  <span className="nav-item-button" style={isVisibilityActive ? { background: 'transparent', color: '#2563EB', width: '34px', height: '34px' } : { width: '34px', height: '34px' }}><Eye size={16} /></span>
                  {!collapsed && <span className="nav-item-label" style={isVisibilityActive ? { fontWeight: 500, fontSize: '0.88rem', lineHeight: 1.2 } : { fontSize: '0.88rem', lineHeight: 1.2 }}>Visibility</span>}
                </button>

                <button
                  className="nav-item"
                  onClick={() => window.open(`/profile/${user?.username}`, '_blank')}
                  style={{ borderRadius: '12px', height: '40px', padding: '0 10px' }}
                >
                  <span className="nav-item-button" style={{ width: '34px', height: '34px' }}><Globe size={16} /></span>
                  {!collapsed && <span className="nav-item-label" style={{ fontSize: '0.88rem', lineHeight: 1.2 }}>View Public Profile</span>}
                </button>
              </div>
            )}
          </div>

          <div className="sidebar-bottom-card">
            <div className="sidebar-user-profile">
              <div className="sidebar-user-avatar">{initials}</div>
              {!collapsed && (
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{displayName}</div>
                  <div className="sidebar-user-role">{displayRole}</div>
                </div>
              )}
            </div>
            <button type="button" className="sidebar-logout-button" onClick={handleLogout}>
              <LogOut size={18} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-bar">
          <span className="top-bar-title">{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--accent-pale)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
              {user?.role === 'admin' ? '⚡ Administrator' : user?.role === 'vc' ? '👑 Vice Chancellor' : user?.role === 'hod' ? '⭐ HOD' : '👤 Faculty'}
            </span>
          </div>
        </header>
        <main className="page-content">
          <div className="page-content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
