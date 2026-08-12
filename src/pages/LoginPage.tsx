import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, Lock, Mail, ArrowRight, BookOpen, Award, Users } from 'lucide-react';
import qaiLogo from '../assets/qai-logo-transparent.png';

const features = [
  { icon: <BookOpen size={18} />, text: 'Comprehensive faculty profile management' },
  { icon: <Award size={18} />, text: 'Research, publications & achievements tracking' },
  { icon: <Users size={18} />, text: 'Public shareable profile pages' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      const u = JSON.parse(localStorage.getItem('iqac_user') || '{}');
      if (u.role === 'admin') {
        toast.success('Welcome back, Admin!');
        navigate('/admin');
      } else if (u.role === 'vc') {
        toast.success('Welcome back, Vice Chancellor!');
        navigate('/vc');
      } else if (u.role === 'hod') {
        toast.success('Welcome back, HOD!');
        navigate('/hod');
      } else if (u.isFirstLogin) {
        navigate('/faculty/setup');
      } else {
        toast.success('Welcome back!');
        navigate('/faculty/dashboard');
      }
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div style={{ maxWidth: 440, width: '100%', position: 'relative', zIndex: 1 }}>
          <img 
            src={qaiLogo} 
            alt="QAI / QARTINT Logo" 
            style={{ 
              width: '100%', 
              maxWidth: 250, 
              height: 'auto', 
              marginBottom: 20, 
              display: 'block' 
            }} 
          />
          <div className="login-tagline">IQAC Faculty<br />Profile Portal</div>
          <p className="login-desc">
            Internal Quality Assurance Cell — a unified system for faculty to manage, update, and publicly showcase their academic credentials.
          </p>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(232,160,32,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.875rem' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>IQAC Portal</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', marginBottom: 4, color: 'var(--primary-dark)' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>Sign in to access your faculty profile dashboard.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="your@email.edu.in"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoFocus
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {err && (
            <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 7, padding: '9px 13px', fontSize: '0.82rem', color: '#c53030', marginBottom: 14 }}>
              {err}
            </div>
          )}

          <button id="login-submit" className="btn btn-primary w-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Demo Credentials</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { label: 'Vice Chancellor', email: 'vc@profcv.edu', pass: 'password123' },
              { label: 'Admin', email: 'admin@profcv.edu', pass: 'password123' },
              { label: 'HOD (Computer Science)', email: 'hod_it@profcv.edu', pass: 'password123' },
              { label: 'Faculty (Dr. Priya Sharma)', email: 'dr.priya.sharma@university.edu.in', pass: 'password123' },
            ].map(c => (
              <button
                key={c.email}
                type="button"
                onClick={() => setForm({ email: c.email, password: c.pass })}
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px', textAlign: 'left', cursor: 'pointer', transition: 'border-color .15s', fontFamily: 'var(--font-body)' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--primary-light)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 1 }}>{c.label}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{c.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
