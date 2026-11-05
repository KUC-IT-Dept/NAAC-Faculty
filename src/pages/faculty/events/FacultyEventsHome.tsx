/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../../components/AppLayout';
import { useAuth } from '../../../context/AuthContext';
import { getFacultyHome, Booking } from '../../../lib/eventsApi';
import toast from 'react-hot-toast';
import { CalendarDays, Clock, AlertTriangle, CheckCircle2, Eye, Pencil, MapPin, Download, Wifi, WifiOff } from 'lucide-react';

type Bucket = {
  upcoming: Booking[]; inProgress: Booking[]; reportPending: Booking[]; overdue: Booking[];
  submitted: Booking[]; underReview: Booking[]; correctionRequested: Booking[];
};

const SECTIONS: { key: keyof Bucket; label: string; icon: React.ReactNode; badge: string }[] = [
  { key: 'overdue', label: 'Overdue', icon: <AlertTriangle size={16} />, badge: 'badge-inactive' },
  { key: 'correctionRequested', label: 'Corrections Requested', icon: <Pencil size={16} />, badge: 'badge-pending' },
  { key: 'reportPending', label: 'Reports Pending', icon: <Clock size={16} />, badge: 'badge-pending' },
  { key: 'inProgress', label: 'In Progress', icon: <CalendarDays size={16} />, badge: 'badge-primary' },
  { key: 'upcoming', label: 'Upcoming', icon: <CalendarDays size={16} />, badge: 'badge-primary' },
  { key: 'underReview', label: 'Under HOD Review', icon: <Eye size={16} />, badge: 'badge-primary' },
  { key: 'submitted', label: 'Submitted', icon: <CheckCircle2 size={16} />, badge: 'badge-active' },
];

export default function FacultyEventsHome() {
  const [data, setData] = useState<Bucket | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = () => getFacultyHome().then(setData).catch(() => toast.error('Failed to load your events'));
  useEffect(() => { load(); }, []);

  // Installable PWA (Part 2): manifest + service worker registration, plus
  // the real beforeinstallprompt flow — a dedicated "Install App" button,
  // not just a theoretical manifest sitting unused.
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/events-manifest.webmanifest';
    document.head.appendChild(link);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/events-sw.js').catch(() => {});
    }
    const onBeforeInstall = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      document.head.removeChild(link);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const doInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <AppLayout title="My Events">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Welcome, {user?.username}</h2>
            <p className="text-muted text-sm" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              {isOnline ? <Wifi size={14} color="var(--success)" /> : <WifiOff size={14} color="var(--warning)" />}
              {isOnline ? 'Online' : 'Offline — changes will sync once you reconnect'}
            </p>
          </div>
          {installPrompt && (
            <button className="btn btn-primary btn-sm" onClick={doInstall}><Download size={14} /> Install App</button>
          )}
        </div>
      </div>

      {!data && <p className="text-muted">Loading…</p>}

      {data && SECTIONS.map((s) => (
        data[s.key].length > 0 && (
          <div className="card" key={s.key} style={{ marginBottom: 16 }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--primary)', display: 'flex' }}>{s.icon}</span>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>{s.label}</h3>
              <span className={`badge ${s.badge}`}>{data[s.key].length}</span>
            </div>
            <div className="card-body" style={{ display: 'grid', gap: 10 }}>
              {data[s.key].map((b) => {
                const venueName = typeof b.venue === 'string' ? b.venue : b.venue.name;
                return (
                  <button
                    key={b._id}
                    onClick={() => navigate(`/faculty/events/${b._id}`)}
                    className="list-item-card"
                    style={{ textAlign: 'left', cursor: 'pointer', width: '100%', border: '1px solid var(--border)' }}
                  >
                    <strong style={{ fontSize: '0.92rem' }}>{b.programName}</strong>
                    <p className="text-muted text-sm" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {venueName} · {new Date(b.date).toDateString()}
                    </p>
                    <p className="text-sm" style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                      Report deadline: {new Date(b.reportDeadline).toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )
      ))}

      {data && Object.values(data).every((arr) => arr.length === 0) && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No assigned events right now.</div></div>
      )}
    </AppLayout>
  );
}
