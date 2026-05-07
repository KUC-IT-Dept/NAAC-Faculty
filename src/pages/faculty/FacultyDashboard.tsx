import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Edit3, Eye, Share2, BookOpen, Award, Briefcase, GraduationCap, FlaskConical, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faculty/me').then(r => setProfile(r.data)).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Faculty Dashboard"><div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} /></div></AppLayout>;

  const pct = profile?.completionPercentage || 0;
  const pi = profile?.personalInfo || {};

  const sections = [
    { key: 'qualifications', label: 'Qualifications', icon: <GraduationCap size={18} />, count: profile?.qualifications?.length },
    { key: 'teachingExperience', label: 'Teaching Exp.', icon: <Briefcase size={18} />, count: profile?.teachingExperience?.length },
    { key: 'publications', label: 'Publications', icon: <BookOpen size={18} />, count: profile?.publications?.length },
    { key: 'projects', label: 'Projects', icon: <FlaskConical size={18} />, count: profile?.projects?.length },
    { key: 'awards', label: 'Awards', icon: <Award size={18} />, count: profile?.awards?.length },
  ];

  const publicUrl = `${window.location.origin}/profile/${user?.username}`;

  return (
    <AppLayout title="Faculty Dashboard">
      {/* Welcome header */}
      <div style={{ background: 'linear-gradient(135deg,var(--navy-dark),var(--navy))', borderRadius: 'var(--radius)', padding: '28px 32px', marginBottom: 24, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="avatar avatar-lg" style={{ background: 'rgba(255,255,255,0.15)', fontSize: '2rem', border: '3px solid rgba(201,162,39,0.6)' }}>
            {pi.photoUrl ? <img src={pi.photoUrl} alt="profile" /> : (pi.fullName || user?.username || 'F').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 style={{ color: '#fff', fontFamily: 'var(--font-heading)', marginBottom: 4 }}>
              {pi.fullName || user?.username}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              {pi.designation}{pi.designation && pi.department ? ' · ' : ''}{pi.department}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: 4 }}>{pi.institution}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => window.open(`/profile/${user?.username}`, '_blank')}>
            <Eye size={16} /> Public Profile
          </button>
          <button className="btn btn-gold" onClick={() => navigate('/faculty/profile/edit')}>
            <Edit3 size={16} /> Edit Profile
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Left */}
        <div>
          {/* Completion */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: '1rem' }}>Profile Completion</h3>
                <span style={{ fontWeight: 700, fontSize: '1.5rem', color: pct >= 60 ? 'var(--success)' : pct >= 30 ? 'var(--warning)' : 'var(--danger)', fontFamily: 'var(--font-heading)' }}>{pct}%</span>
              </div>
              <div className="progress-bar-wrap" style={{ height: 12 }}>
                <div className="progress-bar" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {pct >= 30 ? <CheckCircle2 size={15} color="var(--success)" /> : <AlertCircle size={15} color="var(--warning)" />}
                {pct >= 30 ? 'Profile is publicly visible.' : 'Complete at least 30% to make profile public.'}
              </div>
            </div>
          </div>

          {/* Section stats */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ paddingBottom: 0 }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Profile Sections</h3>
            </div>
            <div className="card-body" style={{ paddingTop: 0 }}>
              {sections.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ color: 'var(--navy)' }}>{s.icon}</div>
                    <span style={{ fontSize: '0.9rem' }}>{s.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge ${(s.count || 0) > 0 ? 'badge-active' : 'badge-pending'}`}>{s.count || 0} entries</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/faculty/profile/edit')}>
                      <Edit3 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Public URL */}
          <div className="card">
            <div className="card-body">
              <h4 style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Share2 size={16} color="var(--navy)" /> Public Profile URL</h4>
              <div style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 12px', fontSize: '0.78rem', wordBreak: 'break-all', color: 'var(--navy)', fontWeight: 500, border: '1px solid var(--border)', marginBottom: 10 }}>
                {publicUrl}
              </div>
              <button
                className="btn btn-outline w-full btn-sm"
                onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copied!'); }}
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Visibility quick info */}
          <div className="card">
            <div className="card-body">
              <h4 style={{ marginBottom: 12, fontSize: '0.95rem' }}>Visibility Settings</h4>
              <p className="text-sm text-muted" style={{ marginBottom: 10 }}>Control which sections appear on your public profile.</p>
              <button className="btn btn-primary w-full btn-sm" onClick={() => navigate('/faculty/profile/edit?tab=visibility')}>
                Manage Visibility
              </button>
            </div>
          </div>

          {/* IDs */}
          {(pi.orcidId || pi.googleScholarId || pi.scopusId) && (
            <div className="card">
              <div className="card-body">
                <h4 style={{ marginBottom: 10, fontSize: '0.95rem' }}>Research IDs</h4>
                {pi.orcidId && <div className="text-xs text-muted" style={{ marginBottom:4 }}>ORCID: <strong>{pi.orcidId}</strong></div>}
                {pi.googleScholarId && <div className="text-xs text-muted" style={{ marginBottom:4 }}>Scholar: <strong>{pi.googleScholarId}</strong></div>}
                {pi.scopusId && <div className="text-xs text-muted">Scopus: <strong>{pi.scopusId}</strong></div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
