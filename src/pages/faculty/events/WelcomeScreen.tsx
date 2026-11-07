/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import devagiriLogo from '../../../assets/devagiri-college-logo.png';

// PWA Screen 1 (manifest start_url). Public — no auth required to view it.
// Already-signed-in faculty/hod are bounced straight to the dashboard.
export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    if (user && ['faculty', 'hod'].includes(user.role)) navigate('/faculty/events', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/events-manifest.webmanifest';
    document.head.appendChild(link);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/events-sw.js').catch(() => {});

    const onBeforeInstall = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => { document.head.removeChild(link); window.removeEventListener('beforeinstallprompt', onBeforeInstall); };
  }, []);

  const doInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center', color: '#fff',
    }}>
      <img src={devagiriLogo} alt="Devagiri College" style={{ width: 92, height: 92, borderRadius: '50%', background: '#fff', padding: 6, marginBottom: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }} />
      <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#93c5fd', fontWeight: 700, marginBottom: 6 }}>IQAC – Devagiri College</p>
      <h1 style={{ fontSize: '1.6rem', margin: '0 0 6px', fontWeight: 800 }}>Current Activities Tracker</h1>
      <p style={{ color: '#cbd5e1', fontSize: '0.9rem', maxWidth: 320, margin: '0 0 36px' }}>
        Faculty Portal — update event progress and submit evidence, from your phone.
      </p>

      <div style={{ width: '100%', maxWidth: 320, display: 'grid', gap: 12 }}>
        <button
          onClick={() => navigate('/login?redirect=/faculty/events')}
          style={{
            background: '#fff', color: '#1e3a8a', border: 'none', borderRadius: 12, padding: '14px 20px',
            fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
          }}
        >
          Sign In <ArrowRight size={17} />
        </button>
        {installPrompt && (
          <button
            onClick={doInstall}
            style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 12,
              padding: '14px 20px', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            }}
          >
            <Download size={16} /> Install App
          </button>
        )}
      </div>

      <p style={{ marginTop: 40, fontSize: '0.72rem', color: '#64748b' }}>For faculty coordinators assigned to campus events.</p>
    </div>
  );
}
