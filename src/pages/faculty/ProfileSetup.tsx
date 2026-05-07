import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { GraduationCap, ChevronRight, ChevronLeft, CheckCircle2, Lock } from 'lucide-react';
import PersonalInfo        from '../../components/sections/S01_PersonalInfo';
import Qualifications      from '../../components/sections/S02_Qualifications';
import EligibilityTests    from '../../components/sections/S03_EligibilityTests';
import EmploymentDetails   from '../../components/sections/S04_EmploymentDetails';
import WorkExperience      from '../../components/sections/S05_WorkExperience';
import Publications        from '../../components/sections/S06_Publications';
import Awards              from '../../components/sections/S07_Awards';
import ResearchProjects    from '../../components/sections/S08_ResearchProjects';
import ResearchSupervision from '../../components/sections/S09_ResearchSupervision';
import AcademicResp        from '../../components/sections/S10_AcademicResponsibilities';
import Memberships         from '../../components/sections/S11_Memberships';
import FdpWorkshops        from '../../components/sections/S12_FdpWorkshops';
import OnlineCourses       from '../../components/sections/S13_OnlineCourses';
import InternationalExp    from '../../components/sections/S14_InternationalExperience';
import Documents           from '../../components/sections/S15_Documents';

const STEPS = [
  { id: 0,  label: 'Password',      title: 'Change Your Password',          key: '' },
  { id: 1,  label: 'Personal',      title: 'Personal Information',           key: 'personalInfo' },
  { id: 2,  label: 'Qualifications',title: 'Educational Qualifications',     key: 'qualifications' },
  { id: 3,  label: 'Eligibility',   title: 'Eligibility Tests',              key: 'eligibilityTests' },
  { id: 4,  label: 'Employment',    title: 'Employment Details',             key: 'employmentDetails' },
  { id: 5,  label: 'Experience',    title: 'Work Experience',                key: 'workExperience' },
  { id: 6,  label: 'Publications',  title: 'Research & Publications',        key: 'publications' },
  { id: 7,  label: 'Awards',        title: 'Awards & Honours',               key: 'awards' },
  { id: 8,  label: 'Projects',      title: 'Research Projects',              key: 'projects' },
  { id: 9,  label: 'Supervision',   title: 'Research Supervision & Patents', key: 'researchSupervision' },
  { id: 10, label: 'Academic',      title: 'Academic Responsibilities',      key: 'academicResponsibilities' },
  { id: 11, label: 'Memberships',   title: 'Professional Memberships',       key: 'memberships' },
  { id: 12, label: 'FDP',           title: 'FDP & Workshops',               key: 'fdpWorkshops' },
  { id: 13, label: 'Online',        title: 'Online Courses & Certifications',key: 'onlineCourses' },
  { id: 14, label: 'International', title: 'International Experience',       key: 'internationalExperience' },
  { id: 15, label: 'Documents',     title: 'Documents to Upload',            key: 'documents' },
];

const EMPTY: any = {
  personalInfo: {}, qualifications: [], eligibilityTests: [], employmentDetails: {},
  workExperience: [], publications: [], awards: [], projects: [],
  researchSupervision: { scholars: [], patents: [] },
  academicResponsibilities: { responsibilities: [], coursesTaught: [] },
  memberships: [], fdpWorkshops: [], onlineCourses: [], internationalExperience: [],
  documents: {},
};

export default function ProfileSetup() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState('');
  const [profile, setProfile] = useState<any>(EMPTY);

  useEffect(() => {
    api.get('/faculty/me').then(r => {
      setProfile({ ...EMPTY, ...Object.fromEntries(Object.entries(r.data).filter(([k]) => k in EMPTY)) });
      if (!user?.isFirstLogin) setStep(1);
    }).catch(() => {});
  }, []);

  const handlePwChange = async () => {
    setPwErr('');
    if (pw.next !== pw.confirm) return setPwErr('Passwords do not match');
    if (pw.next.length < 8) return setPwErr('Minimum 8 characters required');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pw.current, newPassword: pw.next });
      await refreshUser();
      toast.success('Password updated!');
      setStep(1);
    } catch (e: any) { setPwErr(e.response?.data?.message || 'Failed to change password'); }
    finally { setSaving(false); }
  };

  const saveAndNext = async () => {
    const key = STEPS[step].key;
    if (key) {
      setSaving(true);
      try { await api.put('/faculty/me', { [key]: profile[key] }); toast.success('Saved!'); }
      catch { toast.error('Save failed'); }
      finally { setSaving(false); }
    }
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else { toast.success('Profile setup complete! 🎉'); navigate('/faculty/dashboard'); }
  };

  const set = (k: string, v: any) => setProfile((p: any) => ({ ...p, [k]: v }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--sidebar-bg)', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '3px solid var(--accent)' }}>
        <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GraduationCap size={19} color="#fff" />
        </div>
        <div>
          <h1 style={{ color: '#fff', fontSize: '0.95rem', fontFamily: 'var(--font-heading)', margin: 0 }}>IQAC Faculty Profile Setup</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', margin: 0 }}>Step {step + 1} of {STEPS.length}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div className="progress-bar-wrap" style={{ width: 160 }}>
            <div className="progress-bar" style={{ width: `${Math.round((step / (STEPS.length - 1)) * 100)}%` }} />
          </div>
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', textAlign: 'right', marginTop: 4 }}>
            {Math.round((step / (STEPS.length - 1)) * 100)}% complete
          </p>
        </div>
      </div>

      {/* Step pills */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '10px 28px', overflowX: 'auto', display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
        {STEPS.map((s, idx) => (
          <button key={s.id} type="button" onClick={() => idx < step && setStep(idx)} style={{
            padding: '4px 11px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
            border: 'none', cursor: idx < step ? 'pointer' : 'default', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
            background: idx < step ? 'var(--success)' : idx === step ? 'var(--primary)' : 'var(--bg2)',
            color: idx <= step ? '#fff' : 'var(--text-light)',
            transition: 'all .15s',
          }}>
            {idx < step ? '✓ ' : ''}{s.label}
          </button>
        ))}
      </div>

      {/* Form card */}
      <div style={{ maxWidth: 820, margin: '28px auto', padding: '0 20px 60px' }}>
        <div className="card">
          <div className="card-header" style={{ paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ color: 'var(--primary-dark)', fontSize: '1.1rem' }}>{STEPS[step].title}</h2>
            <p className="text-sm text-muted" style={{ marginTop: 3 }}>Fill what you can — you can update any section later from the Edit Profile page.</p>
          </div>

          <div className="card-body">
            {step === 0 && (
              <div style={{ maxWidth: 440 }}>
                <div className="info-banner info-banner-warn" style={{ marginBottom: 20 }}>
                  <Lock size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Your account uses the default password <strong>password123</strong>. Please set a new secure password before continuing.</span>
                </div>
                {[
                  { label: 'Current Password', ph: 'password123', key: 'current', type: 'password' },
                  { label: 'New Password', ph: 'Min. 8 characters', key: 'next', type: 'password' },
                  { label: 'Confirm New Password', ph: 'Re-enter new password', key: 'confirm', type: 'password' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" type={f.type} placeholder={f.ph}
                      value={(pw as any)[f.key]} onChange={e => setPw(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                {pwErr && <p className="form-error">{pwErr}</p>}
              </div>
            )}
            {step === 1  && <PersonalInfo        data={profile.personalInfo}             onChange={v => set('personalInfo', v)} />}
            {step === 2  && <Qualifications       data={profile.qualifications}            onChange={v => set('qualifications', v)} />}
            {step === 3  && <EligibilityTests     data={profile.eligibilityTests}          onChange={v => set('eligibilityTests', v)} />}
            {step === 4  && <EmploymentDetails    data={profile.employmentDetails}         onChange={v => set('employmentDetails', v)} />}
            {step === 5  && <WorkExperience       data={profile.workExperience}            onChange={v => set('workExperience', v)} />}
            {step === 6  && <Publications          data={profile.publications}              onChange={v => set('publications', v)} />}
            {step === 7  && <Awards               data={profile.awards}                   onChange={v => set('awards', v)} />}
            {step === 8  && <ResearchProjects     data={profile.projects}                 onChange={v => set('projects', v)} />}
            {step === 9  && <ResearchSupervision  data={profile.researchSupervision}       onChange={v => set('researchSupervision', v)} />}
            {step === 10 && <AcademicResp         data={profile.academicResponsibilities}  onChange={v => set('academicResponsibilities', v)} />}
            {step === 11 && <Memberships          data={profile.memberships}               onChange={v => set('memberships', v)} />}
            {step === 12 && <FdpWorkshops         data={profile.fdpWorkshops}              onChange={v => set('fdpWorkshops', v)} />}
            {step === 13 && <OnlineCourses        data={profile.onlineCourses}             onChange={v => set('onlineCourses', v)} />}
            {step === 14 && <InternationalExp     data={profile.internationalExperience}   onChange={v => set('internationalExperience', v)} />}
            {step === 15 && <Documents            data={profile.documents}                onChange={v => set('documents', v)} />}
          </div>

          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={15} /> Back
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 0 && step < STEPS.length - 1 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s + 1)}>Skip</button>
              )}
              <button className="btn btn-primary" disabled={saving} onClick={step === 0 ? handlePwChange : saveAndNext}>
                {saving
                  ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                  : step === STEPS.length - 1
                    ? <><CheckCircle2 size={15} /> Finish</>
                    : <>Next <ChevronRight size={15} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
