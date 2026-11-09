import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, CalendarDays, FileEdit, User as UserIcon, ChevronLeft, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import devagiriLogo from '../../../assets/devagiri-college-logo.png';

// This is a deliberately SEPARATE shell from <AppLayout> — the Campus
// Events Tracker is meant to feel like a standalone faculty mobile app,
// not the desktop NAAC dashboard squeezed into a phone screen. It never
// renders the sidebar, and it never links to Library, MMTTC, Analytics or
// any other unrelated IQAC module.
export default function PWAShell({
  children, title, backTo, tab,
}: { children: React.ReactNode; title?: string; backTo?: string; tab?: 'home' | 'events' | 'drafts' | 'profile' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const facultyProfile = (() => {
    try { return JSON.parse(localStorage.getItem('iqac_faculty') || 'null'); } catch { return null; }
  })();
  const displayName = facultyProfile?.personalInfo?.fullName || user?.name || user?.username || 'Faculty';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#eef2f9', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#fff', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {backTo ? (
            <button onClick={() => navigate(backTo)} aria-label="Back" style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
              <ChevronLeft size={18} />
            </button>
          ) : (
            <img src={devagiriLogo} alt="Devagiri College" style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', objectFit: 'contain' }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {backTo ? (
              <strong style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{title}</strong>
            ) : (
              <>
                <div style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase' }}>IQAC – Devagiri College</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title || 'Current Activities Tracker'}</div>
              </>
            )}
          </div>
          <span title={isOnline ? 'Online' : 'Offline'} style={{ display: 'flex', alignItems: 'center' }}>
            {isOnline ? <Wifi size={16} color="#86efac" /> : <WifiOff size={16} color="#fca5a5" />}
          </span>
          {!backTo && (
            <button
              onClick={() => navigate('/faculty/profile/edit')}
              aria-label="Profile"
              style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', border: 'none', color: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {initials}
            </button>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: '16px', paddingBottom: 90, maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', padding: '8px 4px calc(8px + env(safe-area-inset-bottom, 0px))', zIndex: 20 }}>
        <TabButton icon={<Home size={19} />} label="Home" active={tab === 'home'} onClick={() => navigate('/faculty/events')} />
        <TabButton icon={<CalendarDays size={19} />} label="Events" active={tab === 'events'} onClick={() => navigate('/faculty/events?view=all')} />
        <TabButton icon={<FileEdit size={19} />} label="Drafts" active={tab === 'drafts'} onClick={() => navigate('/faculty/events?view=drafts')} />
        <TabButton icon={<UserIcon size={19} />} label="Profile" active={tab === 'profile'} onClick={() => navigate('/faculty/profile/edit')} />
      </nav>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        color: active ? '#1e3a8a' : '#94a3b8', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', padding: '4px 10px',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
