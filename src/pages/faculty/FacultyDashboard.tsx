import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Edit3, Eye, Share2, BookOpen, Award, Briefcase, GraduationCap, FlaskConical, CheckCircle2, AlertCircle, Settings, Globe, ClipboardCheck } from 'lucide-react';

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
    { key: 'qualifications', label: 'Qualifications', icon: <GraduationCap size={20} />, count: profile?.qualifications?.length },
    { key: 'teachingExperience', label: 'Teaching Experience', icon: <Briefcase size={20} />, count: profile?.teachingExperience?.length },
    { key: 'publications', label: 'Publications', icon: <BookOpen size={20} />, count: profile?.publications?.length },
    { key: 'projects', label: 'Research Projects', icon: <FlaskConical size={20} />, count: profile?.projects?.length },
    { key: 'awards', label: 'Awards & Honors', icon: <Award size={20} />, count: profile?.awards?.length },
  ];

  const publicUrl = `${window.location.origin}/profile/${user?.username}`;

  return (
    <AppLayout title="Dashboard">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Profile Header Section */}
        <div style={{ marginBottom: '32px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }} className="profile-header">
              {/* Avatar */}
              <div className="avatar avatar-xl" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', border: '4px solid #fff', boxShadow: 'var(--shadow-md)' }}>
                {pi.photoUrl ? <img src={pi.photoUrl} alt="profile" /> : (pi.fullName || user?.username || 'F').slice(0, 2).toUpperCase()}
              </div>

              {/* Profile Info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text)', marginBottom: '4px', lineHeight: '1.2' }}>
                  {pi.fullName || user?.username}
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {pi.designation}{pi.designation && pi.department ? ' · ' : ''}{pi.department}
                </p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {pi.institution}
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="action-buttons">
                  <button
                    className="btn btn-outline"
                    onClick={() => window.open(`/profile/${user?.username}`, '_blank')}
                    style={{ borderColor: 'var(--border-strong)', color: 'var(--primary)' }}
                  >
                    <Eye size={16} /> Public Profile
                  </button>
                  <button className="btn btn-primary" onClick={() => navigate('/faculty/profile/edit')}>
                    <Edit3 size={16} /> Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }} className="faculty-dashboard-grid">
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Premium Progress UI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* 1. Main Profile Completion Card */}
              <div style={{
                background: 'linear-gradient(135deg, #F8FBFF, #EEF5FF)',
                border: '1px solid #93C5FD',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 10px 30px rgba(37, 99, 235, 0.12)',
              }}>
                {/* Top Section */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Icon Container */}
                    <div style={{
                      width: '72px', height: '72px',
                      background: '#EAF2FF',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ClipboardCheck size={34} color="#2563EB" />
                    </div>
                    
                    {/* Title & Badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1 }}>
                          Profile Completion
                        </h2>
                        <span style={{
                          background: '#DBEAFE', color: '#2563EB',
                          borderRadius: '999px', padding: '10px 18px',
                          fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em'
                        }}>
                          MAIN PROFILE
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Percentage */}
                  <div style={{ fontSize: '72px', fontWeight: 800, color: '#2563EB', lineHeight: 1 }}>
                    {pct}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ width: '100%', height: '16px', background: '#DBEAFE', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: 'linear-gradient(90deg, #2563EB, #3B82F6, #60A5FA)',
                      borderRadius: '999px',
                      boxShadow: '0 0 16px rgba(37, 99, 235, 0.3)',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>

                {/* Status Message */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: pct >= 30 ? '#ECFDF5' : '#FFFBEB', borderRadius: '999px', padding: '14px 22px' }}>
                  {pct >= 30 ? <CheckCircle2 size={20} color="#059669" /> : <AlertCircle size={20} color="#F59E0B" />}
                  <span style={{ color: pct >= 30 ? '#059669' : '#D97706', fontWeight: 600, fontSize: '0.95rem' }}>
                    {pct >= 30 ? 'Profile is publicly visible.' : 'Complete at least 30% to make profile public.'}
                  </span>
                </div>
              </div>

              {/* 2. Personal Information Card */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '24px',
                padding: '32px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Personal Information
                  </h3>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#2563EB', lineHeight: 1 }}>
                    75%
                  </span>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ width: '100%', height: '12px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: '75%', height: '100%',
                      background: 'linear-gradient(90deg, #2563EB, #3B82F6)',
                      borderRadius: '999px',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} color="#F59E0B" />
                  <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.95rem' }}>
                    This section is 75% complete.
                  </span>
                </div>
              </div>

              {/* 3. Documents Card */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '24px',
                padding: '32px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Documents
                  </h3>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: '#EA580C', lineHeight: 1 }}>
                    60%
                  </span>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ width: '100%', height: '12px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: '60%', height: '100%',
                      background: 'linear-gradient(90deg, #EA580C, #F97316)',
                      borderRadius: '999px',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} color="#F59E0B" />
                  <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.95rem' }}>
                    This section is 60% complete.
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Sections Card */}
            <div className="card">
              <div className="card-header" style={{ paddingBottom: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                  Profile Sections
                </h3>
              </div>
              <div className="card-body" style={{ paddingTop: '8px' }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {sections.map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', transition: 'all 0.2s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                          {s.icon}
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text)' }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={`badge ${(s.count || 0) > 0 ? 'badge-active' : 'badge-pending'}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                          {s.count || 0} entries
                        </span>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate('/faculty/profile/edit')}
                          style={{ padding: '6px', color: 'var(--text-muted)' }}
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Public Profile URL */}
            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                  <Share2 size={18} color="var(--primary)" />
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                    Public Profile URL
                  </h4>
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-xs)', padding: '10px 14px', fontSize: '0.85rem', wordBreak: 'break-all', color: 'var(--primary)', fontWeight: 500, border: '1px solid var(--border)', marginBottom: '14px' }}>
                  {publicUrl}
                </div>
                <button
                  className="btn btn-outline w-full btn-sm"
                  onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copied!'); }}
                  style={{ borderColor: 'var(--border-strong)' }}
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Visibility Settings */}
            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                  <Settings size={18} color="var(--primary)" />
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                    Visibility Settings
                  </h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                  Control which sections appear on your public profile.
                </p>
                <button
                  className="btn btn-primary w-full btn-sm"
                  onClick={() => navigate('/faculty/profile/edit?tab=visibility')}
                >
                  Manage Visibility
                </button>
              </div>
            </div>

            {/* Research IDs */}
            {(pi.orcidId || pi.googleScholarId || pi.scopusId) && (
              <div className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                    <Globe size={18} color="var(--primary)" />
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                      Research IDs
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pi.orcidId && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>ORCID:</strong> {pi.orcidId}
                      </div>
                    )}
                    {pi.googleScholarId && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>Google Scholar:</strong> {pi.googleScholarId}
                      </div>
                    )}
                    {pi.scopusId && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>Scopus:</strong> {pi.scopusId}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
