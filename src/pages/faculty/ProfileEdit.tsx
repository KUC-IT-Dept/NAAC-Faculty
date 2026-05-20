import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

import PersonalInfo from '../../components/sections/S01_PersonalInfo';
import Qualifications from '../../components/sections/S02_Qualifications';
import EligibilityTests from '../../components/sections/S03_EligibilityTests';
import EmploymentDetails from '../../components/sections/S04_EmploymentDetails';
import Publications from '../../components/sections/S06_Publications';
import Awards from '../../components/sections/S07_Awards';
import ResearchProjects from '../../components/sections/S08_ResearchProjects';
import ResearchSupervision from '../../components/sections/S09_ResearchSupervision';
import AcademicResp from '../../components/sections/S10_AcademicResponsibilities';
import Memberships from '../../components/sections/S11_Memberships';
import FdpWorkshops from '../../components/sections/S12_FdpWorkshops';
import OnlineCourses from '../../components/sections/S13_OnlineCourses';
import InternationalExp from '../../components/sections/S14_InternationalExperience';
import Documents from '../../components/sections/S15_Documents';
import AdminNonAcademicResp from '../../components/sections/S16_AdminNonAcademicResponsibilities';
import AcademicAdmin from '../../components/sections/S17_AcademicAdministration';
import QualityAssurance from '../../components/sections/S18_QualityAssurance';
import ResearchInnovation from '../../components/sections/S19_ResearchAndInnovation';
import ExaminationAndEvaluation from '../../components/sections/S20_ExaminationAndEvaluation';
import AdministrativeSupport from '../../components/sections/S21_AdministrativeSupport';
import DepartmentalCharges from '../../components/sections/S22_DepartmentalCharges';
import SpecialAssignments from '../../components/sections/S23_SpecialAssignments';
import ExtraInstitutionalActivities from '../../components/sections/S24_ExtraInstitutionalActivities';





const SECTION_MAP: Record<string, { key: string, label: string }> = {
  'personal-information': { key: 'personalInfo', label: 'Personal Information' },
  'qualifications': { key: 'qualifications', label: 'Qualifications' },
  'eligibility-tests': { key: 'eligibilityTests', label: 'Eligibility Tests' },
  'employment-details': { key: 'employmentDetails', label: 'Employment Details' },
  'research-publications': { key: 'publications', label: 'Research & Publications' },
  'awards-honours': { key: 'awards', label: 'Awards & Honours' },
  'research-projects': { key: 'projects', label: 'Research Projects' },
  'research-supervision': { key: 'researchSupervision', label: 'Research Supervision' },
  'academic-responsibilities': { key: 'academicResponsibilities', label: 'Academic Responsibilities' },
  'memberships': { key: 'memberships', label: 'Memberships' },
  'fdp-workshops': { key: 'fdpWorkshops', label: 'FDP & Workshops' },
  'online-courses': { key: 'onlineCourses', label: 'Online Courses' },
  'international-experience': { key: 'internationalExperience', label: 'International Experience' },
  'admin-non-academic': { key: 'adminNonAcademicResponsibilities', label: 'Admin & Non-Academic Responsibilities' },
  'academic-administration': { key: 'academicAdministration', label: 'Academic Administration' },
  'quality-assurance': { key: 'qualityAssurance', label: 'Quality Assurance' },
  'research-innovation': { key: 'researchAndInnovation', label: 'Research and Innovation' },
  'examination-evaluation': { key: 'examinationAndEvaluation', label: 'Examination & Evaluation' },
  'admin-support': { key: 'administrativeSupport', label: 'Administrative Support' },
  'dept-charges': { key: 'departmentalCharges', label: 'Departmental Charges' },
  'special-assignments': { key: 'specialAssignments', label: 'Special Assignments' },
  'extra-institutional': { key: 'extraInstitutionalActivities', label: 'Activities – Extra Institutional' },
  'documents': { key: 'documents', label: 'Documents' },
  'visibility': { key: 'visibility', label: 'Visibility' },
};

const VIS_ITEMS = [
  { key: 'personalInfo', label: 'Personal Information', desc: 'Name, contact, address' },
  { key: 'photo', label: 'Profile Photo', desc: 'Show photo publicly' },
  { key: 'qualifications', label: 'Qualifications', desc: 'Degrees & education' },
  { key: 'eligibilityTests', label: 'Eligibility Tests', desc: 'NET / SET / GATE' },
  { key: 'employmentDetails', label: 'Employment Details', desc: 'Current and previous positions' },
  { key: 'publications', label: 'Publications', desc: 'Journals, books, conferences' },
  { key: 'projects', label: 'Research Projects', desc: 'Funded projects' },
  { key: 'awards', label: 'Awards & Honours', desc: 'Recognition' },
  { key: 'researchSupervision', label: 'Research Supervision', desc: 'Ph.D / M.Phil scholars' },
  { key: 'academicResponsibilities', label: 'Academic Responsibilities', desc: 'Committees & courses' },
  { key: 'memberships', label: 'Memberships', desc: 'Professional bodies' },
  { key: 'fdpWorkshops', label: 'FDP / Workshops', desc: 'Training programmes' },
  { key: 'onlineCourses', label: 'Online Courses', desc: 'Certifications' },
  { key: 'internationalExperience', label: 'International Experience', desc: 'Research visits abroad' },
  { key: 'adminNonAcademicResponsibilities', label: 'Admin & Non-Academic', desc: 'Administrative charges' },
  { key: 'academicAdministration', label: 'Academic Administration', desc: 'Board & committee roles' },
  { key: 'qualityAssurance', label: 'Quality Assurance', desc: 'Accreditation, ranking & feedback' },
  { key: 'researchAndInnovation', label: 'Research & Innovation', desc: 'Research & proposals' },
  { key: 'examinationAndEvaluation', label: 'Exam & Evaluation', desc: 'Exam roles & duties' },
  { key: 'administrativeSupport', label: 'Administrative Support', desc: 'Student support, workload & records' },
  { key: 'departmentalCharges', label: 'Departmental Charges', desc: 'HOD, cultural activities, libraries & committees' },
  { key: 'specialAssignments', label: 'Special Assignments', desc: 'Community service, NSS, NCC, LMS & ICT' },
  { key: 'extraInstitutionalActivities', label: 'Extra Institutional Activities', desc: 'Syndicate, BOS, visiting professor, examiner, syllabus committee, Dean' },
];

const EMPTY: any = {
  personalInfo: {}, qualifications: [], eligibilityTests: [], employmentDetails: {},
  publications: [], awards: [], projects: [],
  researchSupervision: { scholars: [], patents: [] },
  academicResponsibilities: { responsibilities: [], coursesTaught: [] },
  memberships: [], fdpWorkshops: [], onlineCourses: [], internationalExperience: [],
  adminNonAcademicResponsibilities: [],
  academicAdministration: [], qualityAssurance: [],
  researchAndInnovation: [],
  examinationAndEvaluation: [],
  administrativeSupport: [],
  departmentalCharges: [],
  specialAssignments: [],
  extraInstitutionalActivities: [],
  documents: {}, visibility: {},
};

export default function ProfileEdit() {
  const { sectionId } = useParams();
  const section = sectionId && SECTION_MAP[sectionId] ? SECTION_MAP[sectionId] : null;

  const [profile, setProfile] = useState<any>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/faculty/me')
      .then(r => setProfile({ ...EMPTY, ...Object.fromEntries(Object.entries(r.data).filter(([k]) => k in EMPTY)) }))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (!section && !loading) {
    return (
      <AppLayout title="Edit Profile">
        <div style={{ padding: '48px 24px', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.7 }}>
          Select one of the profile sections from the sidebar to begin editing.
        </div>
      </AppLayout>
    );
  }

  const tab = section?.key;

  const save = async () => {
    if (!tab) return;
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
              {tab === 'personalInfo' && <PersonalInfo data={profile.personalInfo} onChange={v => set('personalInfo', v)} />}
              {tab === 'qualifications' && <Qualifications data={profile.qualifications} onChange={v => set('qualifications', v)} />}
              {tab === 'eligibilityTests' && <EligibilityTests data={profile.eligibilityTests} onChange={v => set('eligibilityTests', v)} />}
              {tab === 'employmentDetails' && <EmploymentDetails data={profile.employmentDetails} onChange={v => set('employmentDetails', v)} />}
              {tab === 'publications' && <Publications data={profile.publications} onChange={v => set('publications', v)} />}
              {tab === 'awards' && <Awards data={profile.awards} onChange={v => set('awards', v)} />}
              {tab === 'projects' && <ResearchProjects data={profile.projects} onChange={v => set('projects', v)} />}
              {tab === 'researchSupervision' && <ResearchSupervision data={profile.researchSupervision} onChange={v => set('researchSupervision', v)} />}
              {tab === 'academicResponsibilities' && <AcademicResp data={profile.academicResponsibilities} onChange={v => set('academicResponsibilities', v)} />}
              {tab === 'memberships' && <Memberships data={profile.memberships} onChange={v => set('memberships', v)} />}
              {tab === 'fdpWorkshops' && <FdpWorkshops data={profile.fdpWorkshops} onChange={v => set('fdpWorkshops', v)} />}
              {tab === 'onlineCourses' && <OnlineCourses data={profile.onlineCourses} onChange={v => set('onlineCourses', v)} />}
              {tab === 'internationalExperience' && <InternationalExp data={profile.internationalExperience} onChange={v => set('internationalExperience', v)} />}
              {tab === 'adminNonAcademicResponsibilities' && <AdminNonAcademicResp data={profile.adminNonAcademicResponsibilities} onChange={v => set('adminNonAcademicResponsibilities', v)} />}
              {tab === 'academicAdministration' && <AcademicAdmin data={profile.academicAdministration} onChange={v => set('academicAdministration', v)} />}
              {tab === 'qualityAssurance' && <QualityAssurance data={profile.qualityAssurance} onChange={v => set('qualityAssurance', v)} />}
              {tab === 'researchAndInnovation' && <ResearchInnovation data={profile.researchAndInnovation} onChange={v => set('researchAndInnovation', v)} />}
              {tab === 'examinationAndEvaluation' && <ExaminationAndEvaluation data={profile.examinationAndEvaluation} onChange={v => set('examinationAndEvaluation', v)} />}
              {tab === 'administrativeSupport' && <AdministrativeSupport data={profile.administrativeSupport} onChange={v => set('administrativeSupport', v)} />}
              {tab === 'departmentalCharges' && <DepartmentalCharges data={profile.departmentalCharges} onChange={v => set('departmentalCharges', v)} />}
              {tab === 'specialAssignments' && <SpecialAssignments data={profile.specialAssignments} onChange={v => set('specialAssignments', v)} />}
              {tab === 'extraInstitutionalActivities' && <ExtraInstitutionalActivities data={profile.extraInstitutionalActivities} onChange={v => set('extraInstitutionalActivities', v)} />}
              {tab === 'documents' && <Documents data={profile.documents} onChange={v => set('documents', v)} />}


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
