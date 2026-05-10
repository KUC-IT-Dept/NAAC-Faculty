import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, GraduationCap, Eye, PanelLeftClose, ChevronDown, UserPen, Globe } from 'lucide-react';

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
    { id: 'work-experience', label: '05 - Work Experience', path: `${base}/work-experience` },
    { id: 'research-publications', label: '06 - Research & Publications', path: `${base}/research-publications` },
    { id: 'awards-honours', label: '07 - Awards & Honours', path: `${base}/awards-honours` },
    { id: 'research-projects', label: '08 - Research Projects', path: `${base}/research-projects` },
    { id: 'research-supervision', label: '09 - Research Supervision', path: `${base}/research-supervision` },
    { id: 'academic-responsibilities', label: '10 - Academic Responsibilities', path: `${base}/academic-responsibilities` },
    { id: 'memberships', label: '11 - Memberships', path: `${base}/memberships` },
    { id: 'fdp-workshops', label: '12 - FDP & Workshops', path: `${base}/fdp-workshops` },
    { id: 'online-courses', label: '13 - Online Courses', path: `${base}/online-courses` },
    { id: 'international-experience', label: '14 - International Experience', path: `${base}/international-experience` },
    { id: 'documents', label: '15 - Documents', path: `${base}/documents` },
  ];
};

export default function AppLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems = user?.role === 'admin' ? adminNav : facultyNav;
  const isActive = (item: NavItem) => item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  const visibilityPath = user?.role === 'admin' ? '/admin/edit-profile/visibility' : '/faculty/profile/edit/visibility';
  const isVisibilityActive = location.pathname.includes('/visibility');

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
                <div key="edit-profile-group" style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: profileDropdownOpen && !collapsed ? 1 : 'none',
                  minHeight: 0
                }}>
                  <button
                    className={`nav-item ${isActive(item) || profileDropdownOpen ? 'active' : ''}`}
                    onClick={() => {
                      if (collapsed) setCollapsed(false);
                      setProfileDropdownOpen(!profileDropdownOpen);
                    }}
                    style={{ justifyContent: 'space-between', paddingRight: '14px', background: profileDropdownOpen ? '#EEF2FF' : '', color: profileDropdownOpen ? '#2563EB' : '', flexShrink: 0 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span className="nav-item-button" style={{ background: profileDropdownOpen ? 'transparent' : '', color: profileDropdownOpen ? '#2563EB' : '' }}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="nav-item-label">{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        size={18}
                        style={{
                          transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 300ms ease',
                          color: profileDropdownOpen ? '#2563EB' : '#64748B'
                        }}
                      />
                    )}
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      flex: profileDropdownOpen && !collapsed ? 1 : 'none',
                      minHeight: 0,
                      height: profileDropdownOpen && !collapsed ? 'auto' : '0px',
                      overflow: 'hidden',
                      transition: 'opacity 200ms ease',
                      opacity: profileDropdownOpen && !collapsed ? 1 : 0,
                    }}
                  >
                    <div className="dropdown-scroll" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      overflowY: 'auto',
                      marginLeft: '12px',
                      marginTop: '8px',
                      paddingLeft: '12px',
                      borderLeft: '1px solid #E5E7EB',
                      paddingBottom: '8px',
                    }}>
                      {profileDropdownItems(user?.role).map((subItem) => {
                        const isSubActive = location.pathname.includes(subItem.path) || (location.search && subItem.path.includes(location.search));
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => navigate(subItem.path)}
                            style={{
                              height: '42px',
                              minHeight: '42px',
                              borderRadius: '12px',
                              paddingLeft: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              background: isSubActive ? '#EEF2FF' : 'transparent',
                              color: isSubActive ? '#2563EB' : '#64748B',
                              borderLeft: isSubActive ? '3px solid #2563EB' : '3px solid transparent',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              border: 'none',
                              borderBottom: 'none',
                              borderRight: 'none',
                              borderTop: 'none',
                              textAlign: 'left',
                              width: '100%',
                              transition: 'all 200ms ease',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseOver={(e) => {
                              if (!isSubActive) e.currentTarget.style.background = '#F8FAFC';
                            }}
                            onMouseOut={(e) => {
                              if (!isSubActive) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            {subItem.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            {!collapsed && <div className="sidebar-section-label" style={{ padding: '0 0 8px' }}>Public</div>}

            <button
              className="nav-item"
              onClick={() => navigate(visibilityPath)}
              style={isVisibilityActive ? { borderLeft: '3px solid #2563EB', borderRadius: '12px', background: '#EEF2FF', color: '#2563EB' } : { borderRadius: '12px', borderLeft: '3px solid transparent' }}
            >
              <span className="nav-item-button" style={isVisibilityActive ? { background: 'transparent', color: '#2563EB' } : {}}><Eye size={18} /></span>
              {!collapsed && <span className="nav-item-label" style={isVisibilityActive ? { fontWeight: 500 } : {}}>Visibility</span>}
            </button>

            <button
              className="nav-item"
              onClick={() => window.open(`/profile/${user?.username}`, '_blank')}
              style={{ borderRadius: '12px' }}
            >
              <span className="nav-item-button"><Globe size={18} /></span>
              {!collapsed && <span className="nav-item-label">View Public Profile</span>}
            </button>
          </div>

          <div className="sidebar-bottom-card">
            <div className="sidebar-user-profile">
              <div className="sidebar-user-avatar">{initials}</div>
              {!collapsed && (
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user?.username}</div>
                  <div className="sidebar-user-role">{user?.role}</div>
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
        <main className="page-content animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}
