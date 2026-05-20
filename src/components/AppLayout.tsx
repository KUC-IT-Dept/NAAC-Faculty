import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, GraduationCap, Eye, PanelLeftClose, UserPen, Globe } from 'lucide-react';

interface NavItem { label: string; path: string; icon: ReactNode; exact?: boolean; }

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} />, exact: true },
  { label: 'Edit Profile', path: '/admin/edit-profile', icon: <UserPen size={18} /> },
];

const facultyNav: NavItem[] = [
  { label: 'Dashboard', path: '/faculty/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Edit Profile', path: '/faculty/profile/edit', icon: <UserPen size={18} /> },
];

const profileDropdownItems = (role?: 'admin' | 'faculty') => {
  const base = role === 'admin' ? '/admin/edit-profile' : '/faculty/profile/edit';
  return [
    { id: 'personal-information', label: '01 - Personal Information', path: `${base}/personal-information` },
    { id: 'qualifications', label: '02 - Qualifications', path: `${base}/qualifications` },
    { id: 'eligibility-tests', label: '03 - Eligibility Tests', path: `${base}/eligibility-tests` },
    { id: 'employment-details', label: '04 - Employment Details', path: `${base}/employment-details` },
    { id: 'research-publications', label: '05 - Research & Publications', path: `${base}/research-publications` },
    { id: 'awards-honours', label: '06 - Awards & Honours', path: `${base}/awards-honours` },
    { id: 'research-projects', label: '07 - Research Projects', path: `${base}/research-projects` },
    { id: 'research-supervision', label: '08 - Research Supervision', path: `${base}/research-supervision` },
    { id: 'academic-responsibilities', label: '09 - Academic Responsibilities', path: `${base}/academic-responsibilities` },
    { id: 'memberships', label: '10 - Memberships', path: `${base}/memberships` },
    { id: 'fdp-workshops', label: '11 - FDP & Workshops', path: `${base}/fdp-workshops` },
    { id: 'online-courses', label: '12 - Online Courses', path: `${base}/online-courses` },
    { id: 'international-experience', label: '13 - International Experience', path: `${base}/international-experience` },
    { id: 'admin-non-academic', label: '14 - Admin & Non-Academic Resp.', path: `${base}/admin-non-academic` },
    { id: 'academic-administration', label: '15 - Academic Administration', path: `${base}/academic-administration` },
    { id: 'quality-assurance', label: '16 - Quality Assurance', path: `${base}/quality-assurance` },
    { id: 'research-innovation', label: '17 - Research & Innovation', path: `${base}/research-innovation` },
    { id: 'examination-evaluation', label: '18 - Exam & Evaluation', path: `${base}/examination-evaluation` },
    { id: 'admin-support', label: '19 - Administrative Support', path: `${base}/admin-support` },
    { id: 'dept-charges', label: '20 - Departmental Charges', path: `${base}/dept-charges` },
    { id: 'special-assignments', label: '21 - Special Assignments', path: `${base}/special-assignments` },
    { id: 'extra-institutional', label: '22 - Activities – Extra Institutional', path: `${base}/extra-institutional` },
    { id: 'documents', label: '23 - Documents', path: `${base}/documents` },
  ];
};

export default function AppLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const navItems = user?.role === 'admin' ? adminNav : facultyNav;
  const displayName = user?.username || (user?.role === 'admin' ? 'Administrator' : 'Faculty User');
  const displayRole = user?.role === 'admin' ? 'Administrator' : 'Faculty User';
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
          {!collapsed && <div className="sidebar-section-label">{user?.role === 'admin' ? 'Admin Panel' : 'My Account'}</div>}
          {navItems.map(item => {
            if (item.label === 'Edit Profile') {
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
              <button key={item.path} className={`nav-item ${isActive(item) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
                <span className="nav-item-button">{item.icon}</span>
                {!collapsed && <span className="nav-item-label">{item.label}</span>}
              </button>
            );
          })}

        </nav>

        <div className="sidebar-footer">
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px', paddingTop: '4px' }}>
            {!collapsed && <div className="sidebar-section-label" style={{ padding: '0 0 6px' }}>Public</div>}

            {user?.role !== 'admin' && (
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
              {user?.role === 'admin' ? '⚡ Administrator' : '👤 Faculty'}
            </span>
          </div>
        </header>
        <main className="page-content" style={{ overflow: 'hidden', maxHeight: 'calc(100vh - var(--header-h))' }}>
          <div style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
