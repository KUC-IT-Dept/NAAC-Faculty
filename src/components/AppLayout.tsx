import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, GraduationCap, UserCircle, Eye } from 'lucide-react';

interface NavItem { label: string; path: string; icon: ReactNode; exact?: boolean; }

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={16} />, exact: true },
];

const facultyNav: NavItem[] = [
  { label: 'Dashboard', path: '/faculty/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Edit Profile', path: '/faculty/profile/edit', icon: <UserCircle size={16} /> },
];

export default function AppLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = user?.role === 'admin' ? adminNav : facultyNav;
  const isActive = (item: NavItem) => item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <h2>IQAC Portal</h2>
            <p>Faculty Management</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">{user?.role === 'admin' ? 'Admin Panel' : 'My Account'}</div>
          {navItems.map(item => (
            <button key={item.path} className={`nav-item ${isActive(item) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
              {item.icon} {item.label}
            </button>
          ))}

          {user?.role === 'faculty' && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 8 }}>Public</div>
              <button className="nav-item" onClick={() => window.open(`/profile/${user.username}`, '_blank')}>
                <Eye size={16} /> View Public Profile
              </button>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.username}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost w-full btn-sm" style={{ color: 'rgba(255,255,255,0.5)' }} onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-bar">
          <span className="top-bar-title">{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
              {user?.role === 'admin' ? '⚡ Administrator' : '👤 Faculty'}
            </span>
          </div>
        </header>
        <main className="page-content animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}
