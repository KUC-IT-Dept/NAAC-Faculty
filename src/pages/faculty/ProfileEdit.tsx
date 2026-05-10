import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Save, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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

const SECTION_MAP: Record<string, { key: string, label: string }> = {
  'personal-information': { key: 'personalInfo', label: 'Personal Information' },
  'qualifications': { key: 'qualifications', label: 'Qualifications' },
  'eligibility-tests': { key: 'eligibilityTests', label: 'Eligibility Tests' },
  'employment-details': { key: 'employmentDetails', label: 'Employment Details' },
  'work-experience': { key: 'workExperience', label: 'Work Experience' },
  'research-publications': { key: 'publications', label: 'Research & Publications' },
  'awards-honours': { key: 'awards', label: 'Awards & Honours' },
  'research-projects': { key: 'projects', label: 'Research Projects' },
  'research-supervision': { key: 'researchSupervision', label: 'Research Supervision' },
  'academic-responsibilities': { key: 'academicResponsibilities', label: 'Academic Responsibilities' },
  'memberships': { key: 'memberships', label: 'Memberships' },
  'fdp-workshops': { key: 'fdpWorkshops', label: 'FDP & Workshops' },
  'online-courses': { key: 'onlineCourses', label: 'Online Courses' },
  'international-experience': { key: 'internationalExperience', label: 'International Experience' },
  'documents': { key: 'documents', label: 'Documents' },
  'visibility': { key: 'visibility', label: 'Visibility' },
};

const VIS_ITEMS = [
  { key: 'personalInfo',           label: 'Personal Information',       desc: 'Name, contact, address' },
  { key: 'photo',                  label: 'Profile Photo',              desc: 'Show photo publicly' },
  { key: 'qualifications',         label: 'Qualifications',             desc: 'Degrees & education' },
  { key: 'eligibilityTests',       label: 'Eligibility Tests',          desc: 'NET / SET / GATE' },
  { key: 'employmentDetails',      label: 'Employment Details',         desc: 'Current position & pay' },
  { key: 'workExperience',         label: 'Work Experience',            desc: 'Previous positions' },
  { key: 'publications',           label: 'Publications',               desc: 'Journals, books, conferences' },
  { key: 'projects',               label: 'Research Projects',          desc: 'Funded projects' },
  { key: 'awards',                 label: 'Awards & Honours',           desc: 'Recognition' },
  { key: 'researchSupervision',    label: 'Research Supervision',       desc: 'Ph.D / M.Phil scholars' },
  { key: 'academicResponsibilities', label: 'Academic Responsibilities', desc: 'Committees & courses' },
  { key: 'memberships',            label: 'Memberships',                desc: 'Professional bodies' },
  { key: 'fdpWorkshops',           label: 'FDP / Workshops',            desc: 'Training programmes' },
  { key: 'onlineCourses',          label: 'Online Courses',             desc: 'Certifications' },
  { key: 'internationalExperience', label: 'International Experience',  desc: 'Research visits abroad' },
];

const EMPTY: any = {
  personalInfo: {}, qualifications: [], eligibilityTests: [], employmentDetails: {},
  workExperience: [], publications: [], awards: [], projects: [],
  researchSupervision: { scholars: [], patents: [] },
  academicResponsibilities: { responsibilities: [], coursesTaught: [] },
  memberships: [], fdpWorkshops: [], onlineCourses: [], internationalExperience: [],
  documents: {}, visibility: {},
};

export default function ProfileEdit() {
  const { sectionId } = useParams();
  const section = sectionId && SECTION_MAP[sectionId] ? SECTION_MAP[sectionId] : null;

  const [profile, setProfile] = useState<any>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/faculty/me')
      .then(r => setProfile({ ...EMPTY, ...Object.fromEntries(Object.entries(r.data).filter(([k]) => k in EMPTY)) }))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (!section && !loading) {
    return <Navigate to="/faculty/profile/edit/personal-information" replace />;
  }

  const tab = section?.key || 'personalInfo';

  const save = async () => {
    setSaving(true);
    try {
      if (tab === 'visibility') await api.patch('/faculty/me/visibility', profile.visibility);
      else await api.put('/faculty/me', { [tab]: profile[tab] });
      toast.success('Saved!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const set = (k: string, v: any) => setProfile((p: any) => ({ ...p, [k]: v }));
  const setVis = (k: string, v: boolean) => setProfile((p: any) => ({ ...p, visibility: { ...p.visibility, [k]: v } }));

  if (loading) return (
    <AppLayout title="Edit Profile">
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <div className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title="Edit Profile">
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {/* Main form area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ color: 'var(--primary-dark)' }}>{section?.label}</h3>
                <p className="text-xs text-muted" style={{ marginTop: 2 }}>Changes are saved per section.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
 
                <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Saving…</> : <><Save size={14} /> Save</>}
                </button>
              </div>
            </div>

            <div className="card-body animate-fadeIn">
              {tab === 'personalInfo'             && <PersonalInfo        data={profile.personalInfo}             onChange={v => set('personalInfo', v)} />}
              {tab === 'qualifications'            && <Qualifications       data={profile.qualifications}            onChange={v => set('qualifications', v)} />}
              {tab === 'eligibilityTests'          && <EligibilityTests     data={profile.eligibilityTests}          onChange={v => set('eligibilityTests', v)} />}
              {tab === 'employmentDetails'         && <EmploymentDetails    data={profile.employmentDetails}         onChange={v => set('employmentDetails', v)} />}
              {tab === 'workExperience'            && <WorkExperience       data={profile.workExperience}            onChange={v => set('workExperience', v)} />}
              {tab === 'publications'              && <Publications          data={profile.publications}              onChange={v => set('publications', v)} />}
              {tab === 'awards'                   && <Awards               data={profile.awards}                   onChange={v => set('awards', v)} />}
              {tab === 'projects'                 && <ResearchProjects     data={profile.projects}                 onChange={v => set('projects', v)} />}
              {tab === 'researchSupervision'       && <ResearchSupervision  data={profile.researchSupervision}       onChange={v => set('researchSupervision', v)} />}
              {tab === 'academicResponsibilities'  && <AcademicResp         data={profile.academicResponsibilities}  onChange={v => set('academicResponsibilities', v)} />}
              {tab === 'memberships'               && <Memberships          data={profile.memberships}               onChange={v => set('memberships', v)} />}
              {tab === 'fdpWorkshops'              && <FdpWorkshops         data={profile.fdpWorkshops}              onChange={v => set('fdpWorkshops', v)} />}
              {tab === 'onlineCourses'             && <OnlineCourses        data={profile.onlineCourses}             onChange={v => set('onlineCourses', v)} />}
              {tab === 'internationalExperience'   && <InternationalExp     data={profile.internationalExperience}   onChange={v => set('internationalExperience', v)} />}
              {tab === 'documents'                && <Documents            data={profile.documents}                onChange={v => set('documents', v)} />}

              {tab === 'visibility' && (
                <div>
                  <div className="info-banner info-banner-info" style={{ marginBottom: 16 }}>
                    Toggle sections to control what appears on your public profile page.
                  </div>
                  {VIS_ITEMS.map(item => (
                    <div key={item.key} className="visibility-row">
                      <div>
                        <div className="visibility-row-label">{item.label}</div>
                        <div className="visibility-row-desc">{item.desc}</div>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked={profile.visibility[item.key] !== false} onChange={e => setVis(item.key, e.target.checked)} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
