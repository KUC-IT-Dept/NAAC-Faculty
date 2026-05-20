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

  const pi = profile?.personalInfo || {};
  const employment = profile?.employmentDetails || {};

  // Calculate Personal Information Progress
  const piCoreFields = [
    'firstName', 'lastName', 'dateOfBirth', 'gender', 'bloodGroup',
    'mobileNumber', 'officialEmailId', 'permanentAddress', 'permanentCity',
    'permanentState', 'permanentPin', 'aadhaarNumber', 'panNumber', 'photoUrl'
  ];
  const piCompleted = piCoreFields.filter(f => pi[f] && typeof pi[f] === 'string' && pi[f].trim() !== '').length;
  const piProgress = profile ? Math.round((piCompleted / piCoreFields.length) * 100) : 0;

  // Calculate Documents Progress
  const requiredDocs = ['photo', 'signature', 'aadhar', 'ssc', 'hsc', 'ug', 'apptLetter'];
  const docs = profile?.documents || {};
  const docsCompleted = requiredDocs.filter(d => docs[d]).length;
  const docsProgress = profile ? Math.round((docsCompleted / requiredDocs.length) * 100) : 0;

  // Calculate Main Profile Completion
  const mainSectionsStatus = [
    piProgress >= 50, // Personal Information (at least 50% filled)
    (profile?.qualifications?.length || 0) > 0, // Qualifications
    !!employment?.designation, // Employment Details
    docsProgress >= 50, // Documents (at least 50% uploaded)
    (profile?.publications?.length || 0) > 0, // Publications
    (profile?.projects?.length || 0) > 0, // Projects
    (profile?.awards?.length || 0) > 0, // Awards & Honours
    !!(pi.orcidId || pi.googleScholarId || pi.scopusId), // Research IDs
    Object.keys(profile?.visibility || {}).length > 0, // Visibility Settings
    (profile?.workExperience?.length || 0) > 0 // Other sections (e.g. Work Experience)
  ];
  const completedSectionsCount = mainSectionsStatus.filter(Boolean).length;
  const pct = profile ? Math.round((completedSectionsCount / mainSectionsStatus.length) * 100) : 0;

  const rawName = pi.fullName || [pi.firstName, pi.middleName, pi.lastName].filter(Boolean).join(' ').trim() || user?.username;
  const displayName = rawName?.replace(/^temp--/i, '').trim();
  const displayHeadline = pi.professionalHeadline;

  const sections = [
    { key: 'qualifications', label: 'Qualifications', icon: <GraduationCap size={20} />, count: profile?.qualifications?.length },
    { key: 'workExperience', label: 'Work Experience', icon: <Briefcase size={20} />, count: profile?.workExperience?.length },
    { key: 'publications', label: 'Publications', icon: <BookOpen size={20} />, count: profile?.publications?.length },
    { key: 'projects', label: 'Research Projects', icon: <FlaskConical size={20} />, count: profile?.projects?.length },
    { key: 'awards', label: 'Awards & Honors', icon: <Award size={20} />, count: profile?.awards?.length },
  ];

  const publicUrl = `${window.location.origin}/profile/${user?.username}`;

  return (
    <AppLayout title="Dashboard">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Profile Header Section */}
        <div style={{ marginBottom: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }} className="profile-header">
              {/* Avatar */}
              <div className="avatar avatar-xl" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', border: '4px solid #fff', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
                {profile?.personalInfo?.photoUrl ? (
                  <img src={profile.personalInfo.photoUrl} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (displayName || 'F').slice(0, 2).toUpperCase()}
              </div>

              {/* Profile Info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text)', marginBottom: '4px', lineHeight: '1.2' }}>
                  {displayName}
                </h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {employment.designation}{employment.designation && employment.department ? ' · ' : ''}{employment.department}
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {employment.institution}
                </p>
                {displayHeadline && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {displayHeadline}
                  </p>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="action-buttons">
                  <button
                    className="btn btn-outline"
                    onClick={() => window.open(`/profile/${user?.username}`, '_blank')}
                  >
                    <Eye size={14} /> Public Profile
                  </button>
                  <button className="btn btn-primary" onClick={() => navigate('/faculty/profile/edit')}>
                    <Edit3 size={14} /> Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '20px', alignItems: 'start' }} className="faculty-dashboard-grid">
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Premium Progress UI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* 1. Main Profile Completion Card */}
              <div style={{
                background: 'linear-gradient(135deg, #F8FBFF, #EEF5FF)',
                border: '1px solid #93C5FD',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)',
              }}>
                {/* Top Section */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Icon Container */}
                    <div style={{
                      width: '56px', height: '56px',
                      background: '#EAF2FF',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ClipboardCheck size={28} color="#2563EB" />
                    </div>

                    {/* Title & Badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1 }}>
                          Profile Completion
                        </h2>
                        <span style={{
                          background: '#DBEAFE', color: '#2563EB',
                          borderRadius: '999px', padding: '6px 14px',
                          fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em'
                        }}>
                          MAIN PROFILE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Percentage */}
                  <div style={{ fontSize: '56px', fontWeight: 700, color: '#2563EB', lineHeight: 1 }}>
                    {pct}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ width: '100%', height: '12px', background: '#DBEAFE', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: 'linear-gradient(90deg, #2563EB, #3B82F6, #60A5FA)',
                      borderRadius: '999px',
                      boxShadow: '0 0 12px rgba(37, 99, 235, 0.3)',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>

                {/* Status Message */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: pct >= 30 ? '#ECFDF5' : '#FFFBEB', borderRadius: '999px', padding: '10px 16px' }}>
                  {pct >= 30 ? <CheckCircle2 size={16} color="#059669" /> : <AlertCircle size={16} color="#F59E0B" />}
                  <span style={{ color: pct >= 30 ? '#059669' : '#D97706', fontWeight: 500, fontSize: '0.9rem' }}>
                    {pct >= 30 ? 'Profile is publicly visible.' : 'Complete at least 30% to make profile public.'}
                  </span>
                </div>
              </div>

              {/* 2. Personal Information Card */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                    Personal Information
                  </h3>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: '#2563EB', lineHeight: 1 }}>
                    {piProgress}%
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${piProgress}%`, height: '100%',
                      background: 'linear-gradient(90deg, #2563EB, #3B82F6)',
                      borderRadius: '999px',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {piProgress === 100 ? <CheckCircle2 size={16} color="#059669" /> : <AlertCircle size={16} color="#F59E0B" />}
                  <span style={{ color: piProgress === 100 ? '#059669' : '#64748B', fontWeight: 500, fontSize: '0.9rem' }}>
                    This section is {piProgress}% complete.
                  </span>
                </div>
              </div>

              {/* 3. Documents Card */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                    Documents
                  </h3>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: '#EA580C', lineHeight: 1 }}>
                    {docsProgress}%
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${docsProgress}%`, height: '100%',
                      background: 'linear-gradient(90deg, #EA580C, #F97316)',
                      borderRadius: '999px',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {docsProgress === 100 ? <CheckCircle2 size={16} color="#059669" /> : <AlertCircle size={16} color="#F59E0B" />}
                  <span style={{ color: docsProgress === 100 ? '#059669' : '#64748B', fontWeight: 500, fontSize: '0.9rem' }}>
                    This section is {docsProgress}% complete.
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Sections Card */}
            <div className="card">
              <div className="card-header" style={{ paddingBottom: '6px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                  Profile Sections
                </h3>
              </div>
              <div className="card-body" style={{ paddingTop: '6px' }}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {sections.map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', transition: 'all 0.2s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                          {s.icon}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text)' }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge ${(s.count || 0) > 0 ? 'badge-active' : 'badge-pending'}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                          {s.count || 0} entries
                        </span>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Public Profile URL */}
            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '10px' }}>
                  <Share2 size={16} color="var(--primary)" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                    Public Profile URL
                  </h4>
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-xs)', padding: '8px 12px', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--primary)', fontWeight: 500, border: '1px solid var(--border)', marginBottom: '12px' }}>
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

            {/* Visibility Settings */}
            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '10px' }}>
                  <Settings size={16} color="var(--primary)" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                    Visibility Settings
                  </h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.4' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '10px' }}>
                    <Globe size={16} color="var(--primary)" />
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                      Research IDs
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {pi.orcidId && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>ORCID:</strong> {pi.orcidId}
                      </div>
                    )}
                    {pi.googleScholarId && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text)' }}>Google Scholar:</strong> {pi.googleScholarId}
                      </div>
                    )}
                    {pi.scopusId && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
