import { useState, useRef, useEffect } from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';

export const sectionsData = [
  { id: 'personal-information', title: '01 - Personal Information', configs: [
    { name: 'Gender', options: ['Male', 'Female', 'Transgender', 'Other'] },
    { name: 'Blood Group', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { name: 'Nationality', options: ['Indian', 'Other'] },
    { name: 'Religion', options: ['Hindu', 'Muslim', 'Christian', 'Buddhist', 'Sikh', 'Jain', 'Other'] },
    { name: 'Category', options: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
    { name: 'Sub-Category', options: ['None', 'Ex-Serviceman', 'Sports'] },
    { name: 'Marital Status', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
    { name: 'Disability Status', options: ['Yes', 'No'] },
    { name: 'Disability Type', options: ['Visual', 'Hearing', 'Locomotor', 'Other'] },
    { name: 'State', options: ['Kerala', 'Tamil Nadu', 'Karnataka', 'Maharashtra'] },
    { name: 'Country', options: ['India', 'USA', 'UK', 'Australia'] },
  ] },
  { id: 'qualifications', title: '02 - Qualifications', configs: [
    { name: 'Degree Level', options: ['UG', 'PG', 'Ph.D', 'Diploma', 'Certificate'] },
    { name: 'Degree / Certificate Name', options: ['B.A.', 'B.Sc.', 'B.Tech', 'M.A.', 'M.Sc.', 'M.Tech', 'Ph.D'] },
    { name: 'Specialization / Subject', options: ['Computer Science', 'Physics', 'Mathematics', 'English'] },
    { name: 'Division / Class', options: ['First Class with Distinction', 'First Class', 'Second Class', 'Pass'] },
    { name: 'Study Mode', options: ['Regular', 'Distance', 'Online', 'Part Time'] },
    { name: 'Grade Type', options: ['CGPA', 'Percentage', 'Grade'] }
  ] },
  { id: 'eligibility-tests', title: '03 - Eligibility Tests', configs: [
    { name: 'Exam Name', options: ['NET', 'JRF', 'SET', 'SLET', 'GATE', 'UGC-NET', 'CSIR-NET'] },
    { name: 'Subject / Paper', options: ['Computer Science', 'Computer Science & Applications', 'Physics', 'Chemistry', 'Mathematics', 'Commerce', 'English'] },
    { name: 'State (for SET/SLET)', options: ['Kerala', 'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Gujarat'] },
    { name: 'Validity Status', options: ['Lifetime', 'Valid', 'Expired', 'Limited Period'] }
  ] },
  { id: 'employment-details', title: '04 - Employment Details', configs: [
    { name: 'Designation', options: ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Dean'] },
    { name: 'Department', options: ['Computer Science', 'Physics', 'Mathematics', 'Commerce', 'English'] },
    { name: 'Institution / College Type', options: ['State', 'Central', 'Private', 'Deemed'] },
    { name: 'Affiliated University', options: ['University of Delhi', 'Anna University', 'Mumbai University'] },
    { name: 'Nature of Appointment', options: ['Regular', 'Temporary', 'Contract', 'Guest Faculty'] },
    { name: 'Approval Status', options: ['Approved', 'Pending', 'Rejected'] },
    { name: 'Pay Scale / Band', options: ['AGP 6000', 'AGP 7000', 'AGP 8000', 'Level 10', 'Level 11'] }
  ] },
  { id: 'work-experience', title: '05 - Work Experience', configs: [
    { name: 'Designation / Post', options: ['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer', 'HOD'] },
    { name: 'Nature of Work', options: ['Teaching', 'Research', 'Administration', 'Industry Experience', 'Consultancy'] },
    { name: 'Employment Type', options: ['Full Time', 'Part Time', 'Contract', 'Temporary', 'Visiting Faculty'] },
    { name: 'Institution Type', options: ['Government', 'Private', 'Autonomous', 'Deemed University', 'Research Institute'] },
    { name: 'Experience Category', options: ['Academic', 'Industry', 'Research', 'Administrative'] }
  ] },
  { id: 'research-publications', title: '06 - Research & Publications', configs: [
    { name: 'Publication Type', options: ['Journal', 'Conference Paper', 'Book Chapter', 'Patent', 'Thesis', 'Article'] },
    { name: 'Publication Level', options: ['International', 'National', 'State', 'Institutional'] },
    { name: 'Author Role', options: ['First Author', 'Co-Author', 'Corresponding Author', 'Editor'] },
    { name: 'Indexed In', options: ['Scopus', 'WoS', 'UGC Care', 'SCI', 'Google Scholar'] },
    { name: 'Peer Reviewed Status', options: ['Yes', 'No'] },
    { name: 'Journal Category', options: ['Q1', 'Q2', 'Q3', 'Q4', 'NA'] }
  ] },
  { id: 'awards-honours', title: '07 - Awards & Honours', configs: [
    { name: 'Award Category', options: ['Research Award', 'Teaching Award', 'Innovation Award', 'Fellowship', 'Excellence Award', 'Young Scientist Award'] },
    { name: 'Award Level', options: ['International', 'National', 'State', 'University', 'Institutional'] },
    { name: 'Awarding Agency Type', options: ['Government', 'University', 'Research Organization', 'Private Institution', 'Professional Body'] },
    { name: 'Honour Type', options: ['Medal', 'Certificate', 'Fellowship', 'Trophy', 'Recognition'] },
    { name: 'Recognition Status', options: ['Active', 'Archived', 'Featured'] }
  ] },
  { id: 'research-projects', title: '08 - Research Projects', configs: [
    { name: 'Funding Agency', options: ['DST-SERB', 'UGC', 'AICTE', 'DRDO', 'ISRO', 'ICMR', 'DBT'] },
    { name: 'Project Status', options: ['Ongoing', 'Completed', 'Submitted', 'Approved', 'Pending'] },
    { name: 'Role in Project', options: ['Principal Investigator', 'Co-Investigator', 'Research Associate', 'Coordinator'] },
    { name: 'Project Category', options: ['Research', 'Development', 'Consultancy', 'Innovation', 'Sponsored Project'] },
    { name: 'Funding Type', options: ['Government', 'Private', 'International', 'Institutional'] }
  ] },
  { id: 'research-supervision', title: '09 - Research Supervision', configs: [
    { name: 'Research Degree', options: ['Ph.D', 'M.Phil', 'PG Dissertation', 'Post Doctorate'] },
    { name: 'Scholar Gender', options: ['Male', 'Female', 'Transgender', 'Other'] },
    { name: 'Research Status', options: ['Ongoing', 'Completed', 'Submitted', 'Awarded'] },
    { name: 'Guidance Type', options: ['Supervisor', 'Co-Supervisor', 'Mentor', 'Advisor'] },
    { name: 'Patent Status', options: ['Filed', 'Published', 'Granted', 'Pending'] },
    { name: 'Patent Type', options: ['Utility Patent', 'Design Patent', 'Copyright', 'Trademark'] },
    { name: 'Supervision Category', options: ['Academic', 'Research', 'Industrial Research'] }
  ] },
  { id: 'academic-responsibilities', title: '10 - Academic Responsibilities', configs: [
    { name: 'Committee Type', options: ['IQAC', 'BOS', 'Anti-Ragging', 'Examination Cell', 'NAAC Committee', 'Discipline Committee', 'Placement Cell'] },
    { name: 'Responsibility Role', options: ['Chairman', 'Coordinator', 'Convener', 'Member', 'Head', 'Faculty Incharge'] },
    { name: 'Course Level', options: ['UG', 'PG', 'Ph.D', 'Diploma', 'Certificate'] },
    { name: 'Semester Type', options: ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII'] },
    { name: 'Academic Session Type', options: ['Odd Semester', 'Even Semester', 'Annual', 'Trimester'] },
    { name: 'Teaching Category', options: ['Core Subject', 'Elective', 'Laboratory', 'Project Guidance', 'Seminar'] },
    { name: 'Responsibility Status', options: ['Active', 'Completed', 'Ongoing', 'Inactive'] }
  ] },
  { id: 'memberships', title: '11 - Memberships', configs: [
    { name: 'Professional Body / Society', options: ['IEEE', 'CSI', 'ACM', 'ISTE', 'IETE', 'IEI', 'IAENG', 'ACM India'] },
    { name: 'Membership Type', options: ['Lifetime', 'Annual', 'Student', 'Professional', 'Institutional'] },
    { name: 'Membership Category', options: ['National', 'International', 'State Level', 'Regional'] },
    { name: 'Membership Status', options: ['Active', 'Expired', 'Pending', 'Suspended'] },
    { name: 'Membership Level', options: ['Member', 'Senior Member', 'Fellow', 'Associate Member', 'Student Member'] },
    { name: 'Organization Type', options: ['Technical Society', 'Research Organization', 'Academic Association', 'Professional Council', 'Scientific Community'] }
  ] },
  { id: 'fdp-workshops', title: '12 - FDP & Workshops', configs: [
    { name: 'Programme Type', options: ['FDP', 'Workshop', 'Seminar', 'Conference', 'Short Term Course', 'Refresher Course', 'Orientation Programme', 'Training Programme'] },
    { name: 'Sponsoring / Funding Agency', options: ['AICTE', 'UGC', 'TEQIP', 'MHRD', 'DST', 'Self-Funded', 'University Funded', 'Institutional'] },
    { name: 'Participation', options: ['Attended', 'Organized', 'Resource Person', 'Presented', 'Chaired Session'] }
  ] },
  { id: 'online-courses', title: '13 - Online Courses', configs: [
    { name: 'Course Platform / Provider', options: ['Coursera', 'NPTEL', 'SWAYAM', 'Udemy', 'edX', 'FutureLearn', 'IIT Online', 'Google'] },
    { name: 'Course Type', options: ['Certification', 'Diploma', 'Skill Development', 'Faculty Development', 'Professional Training'] },
    { name: 'Completion Status', options: ['Completed', 'Ongoing', 'In Progress', 'Certified'] },
    { name: 'Certification Type', options: ['Free Certificate', 'Paid Certificate', 'Verified Certificate', 'University Certificate'] },
    { name: 'Learning Mode', options: ['Online', 'Hybrid', 'Self Paced', 'Instructor Led'] }
  ] },
  { id: 'international-experience', title: '14 - International Experience', configs: [
    { name: 'Country', options: ['Singapore', 'USA', 'UK', 'Germany', 'Canada', 'Australia', 'Japan', 'France'] },
    { name: 'Purpose of Visit', options: ['Conference', 'Research Collaboration', 'Faculty Exchange', 'Workshop', 'Seminar', 'Training Program'] },
    { name: 'Funding Source', options: ['DST Travel Grant', 'UGC', 'AICTE', 'Self Funded', 'International Fellowship', 'University Sponsorship'] },
    { name: 'Visit Category', options: ['Academic', 'Research', 'Industry', 'Government', 'International Event'] },
    { name: 'Collaboration Type', options: ['MoU Activity', 'Joint Research', 'Publication', 'Exchange Program', 'Technical Collaboration'] },
    { name: 'Visit Status', options: ['Completed', 'Ongoing', 'Planned', 'Approved'] }
  ] },
  { id: 'documents', title: '15 - Documents', configs: [
    { name: 'Document Type', options: ['Aadhar', 'PAN', 'Passport'] }
  ] },
  { id: 'visibility', title: 'Visibility', configs: [] },
];

export function EditProfileLayout() {
  return (
    <AppLayout title="Profile Management">
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '32px' }}>
        <Outlet />
      </div>
    </AppLayout>
  );
}

function DropdownOption({ opt, isSelected, onClick }: { opt: string, isSelected: boolean, onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        height: '40px',
        padding: '10px 12px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: isSelected ? '#2563EB' : isHovered ? '#EFF6FF' : 'transparent',
        transition: 'background 150ms ease',
        cursor: 'pointer',
        color: isSelected ? '#FFFFFF' : '#111827'
      }}
    >
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{opt}</span>
      {isHovered && (
        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isSelected ? '#BFDBFE' : '#64748B', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.color = isSelected ? '#FFFFFF' : '#2563EB'} onMouseOut={e => e.currentTarget.style.color = isSelected ? '#BFDBFE' : '#64748B'}>
            <Edit2 size={14} />
          </button>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isSelected ? '#FECACA' : '#64748B', padding: '4px', borderRadius: '4px' }} onMouseOver={e => e.currentTarget.style.color = isSelected ? '#FFFFFF' : '#EF4444'} onMouseOut={e => e.currentTarget.style.color = isSelected ? '#FECACA' : '#64748B'}>
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function DropdownConfigList({ config }: { config: any }) {
  const [selected, setSelected] = useState(config.options[0] || 'Select an option');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(config.options[0] || 'Select an option');
  }, [config]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B', margin: 0, paddingLeft: '4px' }}>{config.name}</h3>
      <div ref={containerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            height: '48px',
            background: '#FFFFFF',
            borderRadius: '12px',
            border: isOpen ? '1px solid #2563EB' : '1px solid #D1D5DB',
            boxShadow: isOpen ? '0 0 0 2px rgba(37, 99, 235, 0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            color: '#111827',
            transition: 'all 0.2s',
            textAlign: 'left'
          }}
        >
          <span>{selected}</span>
          <ChevronDown size={16} style={{ color: '#64748B', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
        </button>

        {isOpen && (
          <div style={{ 
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#FFFFFF', 
            borderRadius: '14px', 
            border: '1px solid #E5E7EB', 
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 50,
            padding: '8px',
            animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'top center'
          }}>
            <div className="dropdown-scroll" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {config.options.map((opt: string, oIdx: number) => {
                const isSelected = selected === opt;
                return (
                  <DropdownOption 
                    key={oIdx} 
                    opt={opt} 
                    isSelected={isSelected} 
                    onClick={() => {
                      setSelected(opt);
                      setIsOpen(false);
                    }} 
                  />
                );
              })}
            </div>
            <button style={{
              height: '40px',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: '#2563EB',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 150ms ease',
              width: '100%',
              marginTop: '4px'
            }} onMouseOver={e => e.currentTarget.style.background = '#EFF6FF'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <Plus size={14} /> Add Custom Option
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminProfileSection() {
  const { sectionId } = useParams();
  const currentSection = sectionsData.find(s => s.id === sectionId);

  if (!currentSection) return <Navigate to="/admin/edit-profile/personal-information" replace />;

  return (
    <>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>{currentSection.title}</h1>
        <p style={{ color: '#64748B', margin: 0 }}>Manage dropdown configurations for this section.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {currentSection.configs.map((config, idx) => (
          <DropdownConfigList key={`${currentSection.id}-${config.name}`} config={config} />
        ))}
        
        {currentSection.configs.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748B', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #D1D5DB' }}>
            No dropdown configurations available for this section.
          </div>
        )}
      </div>
    </>
  );
}
