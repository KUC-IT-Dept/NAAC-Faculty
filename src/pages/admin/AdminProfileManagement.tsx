import { useState, useRef, useEffect } from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import {
  genderOptions, bloodGroupOptions, nationalityOptions, religionOptions, categoryOptions, subCategoryOptions,
  maritalStatusOptions, disabilityStatusOptions, disabilityTypeOptions, stateOptions, countryOptions,
  degreeLevelOptions, degreeNameOptions, specializationOptions, divisionOptions, studyModeOptions, gradeTypeOptions,
  examNameOptions, subjectPaperOptions, stateForSetOptions, validityStatusOptions,
  designationOptions, departmentOptions, institutionTypeOptions, affiliatedUniversityOptions, natureOfAppointmentOptions, approvalStatusOptions, payScaleOptions,
  designationPostOptions, reasonForLeavingOptions,
  publicationTypeOptions, publicationLevelOptions, authorRoleOptions, indexedInOptions, peerReviewedStatusOptions, journalCategoryOptions,
  awardCategoryOptions, awardLevelOptions, awardingAgencyTypeOptions, honourTypeOptions, recognitionStatusOptions,
  fundingAgencyOptions, projectStatusOptions, roleInProjectOptions, projectCategoryOptions, fundingTypeOptions,
  researchDegreeOptions, scholarGenderOptions, researchStatusOptions, guidanceTypeOptions, patentStatusOptions, patentTypeOptions, supervisionCategoryOptions,
  committeeTypeOptions, responsibilityRoleOptions, courseLevelOptions, semesterTypeOptions, academicSessionTypeOptions, teachingCategoryOptions, responsibilityStatusOptions,
  professionalBodyOptions, membershipTypeOptions, membershipCategoryOptions, membershipStatusOptions, membershipLevelOptions, organizationTypeOptions,
  programmeTypeOptions, sponsoringAgencyOptions, participationOptions,
  coursePlatformOptions, courseTypeOptions, completionStatusOptions, certificationTypeOptions, learningModeOptions,
  countryVisitOptions, purposeOfVisitOptions, fundingSourceOptions, visitCategoryOptions, collaborationTypeOptions, visitStatusOptions,
  documentTypeOptions,
  adminChargeOptions,
  academicAdminOptions,
  qualityAssuranceOptions,
  researchInnovationOptions,
  examinationEvaluationOptions,
  adminSupportOptions,
  departmentalChargesOptions,
  specialAssignmentsOptions,
  extraInstitutionalOptions,
  loadDropdownOptionsFromServer,
  persistDropdownOptions,
  saveDropdownOptionsToServer,
} from '../../shared/dropdownOptions';

export const sectionsData = [
  {
    id: 'personal-information', title: '01 - Personal Information', configs: [
      { name: 'Gender', options: genderOptions },
      { name: 'Blood Group', options: bloodGroupOptions },
      { name: 'Nationality', options: nationalityOptions },
      { name: 'Religion', options: religionOptions },
      { name: 'Category', options: categoryOptions },
      { name: 'Sub-Category', options: subCategoryOptions },
      { name: 'Marital Status', options: maritalStatusOptions },
      { name: 'Disability Status', options: disabilityStatusOptions },
      { name: 'Disability Type', options: disabilityTypeOptions },
      { name: 'State', options: stateOptions },
      { name: 'Country', options: countryOptions },
    ]
  },
  {
    id: 'qualifications', title: '02 - Qualifications', configs: [
      { name: 'Degree Level', options: degreeLevelOptions },
      { name: 'Degree / Certificate Name', options: degreeNameOptions },
      { name: 'Specialization / Subject', options: specializationOptions },
      { name: 'Division / Class', options: divisionOptions },
      { name: 'Study Mode', options: studyModeOptions },
      { name: 'Grade Type', options: gradeTypeOptions }
    ]
  },
  {
    id: 'eligibility-tests', title: '03 - Eligibility Tests', configs: [
      { name: 'Exam Name', options: examNameOptions },
      { name: 'Subject / Paper', options: subjectPaperOptions },
      { name: 'State (for SET/SLET)', options: stateForSetOptions },
      { name: 'Validity Status', options: validityStatusOptions }
    ]
  },
  {
    id: 'employment-details', title: '04 - Employment Details', configs: [
      { name: 'Designation', options: designationOptions },
      { name: 'Department', options: departmentOptions },
      { name: 'Institution / College Type', options: institutionTypeOptions },
      { name: 'Affiliated University', options: affiliatedUniversityOptions },
      { name: 'Nature of Appointment', options: natureOfAppointmentOptions },
      { name: 'Approval Status', options: approvalStatusOptions },
      { name: 'Pay Scale / Band', options: payScaleOptions }
    ]
  },
  {
    id: 'work-experience', title: '05 - Work Experience', configs: [
      { name: 'Designation / Post', options: designationPostOptions },
      { name: 'Department', options: departmentOptions },
      { name: 'Nature of Appointment', options: natureOfAppointmentOptions },
      { name: 'Reason for Leaving', options: reasonForLeavingOptions }
    ]
  },
  {
    id: 'research-publications', title: '06 - Research & Publications', configs: [
      { name: 'Publication Type', options: publicationTypeOptions },
      { name: 'Publication Level', options: publicationLevelOptions },
      { name: 'Author Role', options: authorRoleOptions },
      { name: 'Indexed In', options: indexedInOptions },
      { name: 'Peer Reviewed Status', options: peerReviewedStatusOptions },
      { name: 'Journal Category', options: journalCategoryOptions }
    ]
  },
  {
    id: 'awards-honours', title: '07 - Awards & Honours', configs: [
      { name: 'Award Category', options: awardCategoryOptions },
      { name: 'Award Level', options: awardLevelOptions },
      { name: 'Awarding Agency Type', options: awardingAgencyTypeOptions },
      { name: 'Honour Type', options: honourTypeOptions },
      { name: 'Recognition Status', options: recognitionStatusOptions }
    ]
  },
  {
    id: 'research-projects', title: '08 - Research Projects', configs: [
      { name: 'Funding Agency', options: fundingAgencyOptions },
      { name: 'Project Status', options: projectStatusOptions },
      { name: 'Role in Project', options: roleInProjectOptions },
      { name: 'Project Category', options: projectCategoryOptions },
      { name: 'Funding Type', options: fundingTypeOptions }
    ]
  },
  {
    id: 'research-supervision', title: '09 - Research Supervision', configs: [
      { name: 'Research Degree', options: researchDegreeOptions },
      { name: 'Scholar Gender', options: scholarGenderOptions },
      { name: 'Research Status', options: researchStatusOptions },
      { name: 'Guidance Type', options: guidanceTypeOptions },
      { name: 'Patent Status', options: patentStatusOptions },
      { name: 'Patent Type', options: patentTypeOptions },
      { name: 'Supervision Category', options: supervisionCategoryOptions }
    ]
  },
  {
    id: 'academic-responsibilities', title: '10 - Academic Responsibilities', configs: [
      { name: 'Committee Type', options: committeeTypeOptions },
      { name: 'Responsibility Role', options: responsibilityRoleOptions },
      { name: 'Course Level', options: courseLevelOptions },
      { name: 'Semester Type', options: semesterTypeOptions },
      { name: 'Academic Session Type', options: academicSessionTypeOptions },
      { name: 'Teaching Category', options: teachingCategoryOptions },
      { name: 'Responsibility Status', options: responsibilityStatusOptions }
    ]
  },
  {
    id: 'memberships', title: '11 - Memberships', configs: [
      { name: 'Professional Body / Society', options: professionalBodyOptions },
      { name: 'Membership Type', options: membershipTypeOptions },
      { name: 'Membership Category', options: membershipCategoryOptions },
      { name: 'Membership Status', options: membershipStatusOptions },
      { name: 'Membership Level', options: membershipLevelOptions },
      { name: 'Organization Type', options: organizationTypeOptions }
    ]
  },
  {
    id: 'fdp-workshops', title: '12 - FDP & Workshops', configs: [
      { name: 'Programme Type', options: programmeTypeOptions },
      { name: 'Sponsoring / Funding Agency', options: sponsoringAgencyOptions },
      { name: 'Participation', options: participationOptions }
    ]
  },
  {
    id: 'online-courses', title: '13 - Online Courses', configs: [
      { name: 'Course Platform / Provider', options: coursePlatformOptions },
      { name: 'Course Type', options: courseTypeOptions },
      { name: 'Completion Status', options: completionStatusOptions },
      { name: 'Certification Type', options: certificationTypeOptions },
      { name: 'Learning Mode', options: learningModeOptions }
    ]
  },
  {
    id: 'international-experience', title: '14 - International Experience', configs: [
      { name: 'Country', options: countryVisitOptions },
      { name: 'Purpose of Visit', options: purposeOfVisitOptions },
      { name: 'Funding Source', options: fundingSourceOptions },
      { name: 'Visit Category', options: visitCategoryOptions },
      { name: 'Collaboration Type', options: collaborationTypeOptions },
      { name: 'Visit Status', options: visitStatusOptions }
    ]
  },
  {
    id: 'admin-non-academic', title: '15 - Admin & Non-Academic Responsibilities', configs: [
      { name: 'Administrative Charge', options: adminChargeOptions }
    ]
  },
  {
    id: 'academic-administration', title: '16 - Academic Administration', configs: [
      { name: 'Administrative Charge', options: academicAdminOptions }
    ]
  },
  {
    id: 'quality-assurance', title: '17 - Quality Assurance', configs: [
      { name: 'Administrative Charge', options: qualityAssuranceOptions }
    ]
  },
  {
    id: 'research-innovation', title: '18 - Research and Innovation', configs: [
      { name: 'Administrative Charge', options: researchInnovationOptions }
    ]
  },
  {
    id: 'examination-evaluation', title: '19 - Examination and Evaluation', configs: [
      { name: 'Administrative Charge', options: examinationEvaluationOptions }
    ]
  },
  {
    id: 'admin-support', title: '20 - Administrative Support', configs: [
      { name: 'Administrative Charge', options: adminSupportOptions }
    ]
  },
  {
    id: 'dept-charges', title: '21 - Departmental Charges', configs: [
      { name: 'Administrative charge', options: departmentalChargesOptions }
    ]
  },
  {
    id: 'special-assignments', title: '22 - Special Assignments', configs: [
      { name: 'Administrative charge', options: specialAssignmentsOptions }
    ]
  },
  {
    id: 'extra-institutional', title: '23 - Activities – Extra Institutional', configs: [
      { name: 'Administrative charge', options: extraInstitutionalOptions }
    ]
  },
  {
    id: 'documents', title: '24 - Documents', configs: [
      { name: 'Document Type', options: documentTypeOptions }
    ]
  },
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

interface DropdownOptionProps {
  opt: string;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  editValue?: string;
  onEditChange?: (value: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
}

function DropdownOption({ opt, isSelected, onSelect, onEdit, onDelete, isEditing, editValue, onEditChange, onEditSave, onEditCancel }: DropdownOptionProps) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
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
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={e => onEditChange?.(e.target.value)}
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.key === 'Enter' && onEditSave?.()}
          style={{
            flex: 1,
            marginRight: 8,
            height: '100%',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            padding: '8px 10px',
            fontSize: '0.9rem'
          }}
        />
      ) : (
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{opt}</span>
      )}
      <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={onEditSave}
              style={{ background: '#2563EB', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem' }}
            >Save</button>
            <button
              type="button"
              onClick={onEditCancel}
              style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem' }}
            >Cancel</button>
          </>
        ) : isHovered ? (
          <>
            <button
              type="button"
              aria-label="Edit option"
              onClick={onEdit}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isSelected ? '#BFDBFE' : '#64748B', padding: '4px', borderRadius: '4px' }}
              onMouseOver={e => e.currentTarget.style.color = isSelected ? '#FFFFFF' : '#2563EB'}
              onMouseOut={e => e.currentTarget.style.color = isSelected ? '#BFDBFE' : '#64748B'}
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              aria-label="Delete option"
              onClick={onDelete}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isSelected ? '#FECACA' : '#64748B', padding: '4px', borderRadius: '4px' }}
              onMouseOver={e => e.currentTarget.style.color = isSelected ? '#FFFFFF' : '#EF4444'}
              onMouseOut={e => e.currentTarget.style.color = isSelected ? '#FECACA' : '#64748B'}
            >
              <Trash2 size={14} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

const FIELD_STORAGE_KEYS: Record<string, string> = {
  'Designation / Post': 'designationPostOptions',
  'Department': 'departmentOptions',
  'Nature of Appointment': 'natureOfAppointmentOptions',
  'Reason for Leaving': 'reasonForLeavingOptions'
};

function DropdownConfigList({ config }: { config: any }) {
  const [options, setOptions] = useState<string[]>([...config.options]);
  const [selected, setSelected] = useState(config.options[0] || 'Select an option');
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [newOption, setNewOption] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = [...config.options];
    setOptions(current);
    setSelected(current[0] || 'Select an option');
  }, [config.options]);

  useEffect(() => {
    const handleConfigUpdate = () => {
      const current = [...config.options];
      setOptions(current);
      setSelected(current[0] || 'Select an option');
    };
    window.addEventListener('dropdownOptionsUpdated', handleConfigUpdate);
    return () => window.removeEventListener('dropdownOptionsUpdated', handleConfigUpdate);
  }, [config.options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingIndex(null);
        setShowNewInput(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const persistOptions = (updated: string[]) => {
    config.options.splice(0, config.options.length, ...updated);
    setOptions(updated);
    const storageKey = FIELD_STORAGE_KEYS[config.name];
    if (storageKey) {
      persistDropdownOptions(storageKey, updated);
      saveDropdownOptionsToServer(storageKey, updated);
    }
  };

  const handleSelect = (option: string) => {
    setSelected(option);
    setIsOpen(false);
  };

  const handleAddOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    if (!options.includes(trimmed)) {
      const updated = [...options, trimmed];
      persistOptions(updated);
    }
    setSelected(trimmed);
    setNewOption('');
    setShowNewInput(false);
    setIsOpen(false);
  };

  const handleDeleteOption = (idx: number) => {
    const updated = options.filter((_, i) => i !== idx);
    persistOptions(updated);
    if (selected === options[idx]) {
      setSelected(updated[0] || 'Select an option');
    }
  };

  const handleEditOption = (idx: number) => {
    setEditingIndex(idx);
    setEditingValue(options[idx]);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    const updated = options.map((opt, idx) => idx === editingIndex ? trimmed : opt);
    persistOptions(updated);
    if (selected === options[editingIndex]) {
      setSelected(trimmed);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

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
              {options.map((opt: string, oIdx: number) => {
                const isSelected = selected === opt;
                return (
                  <DropdownOption
                    key={oIdx}
                    opt={opt}
                    isSelected={isSelected}
                    isEditing={editingIndex === oIdx}
                    editValue={editingValue}
                    onSelect={() => handleSelect(opt)}
                    onEdit={() => handleEditOption(oIdx)}
                    onDelete={() => handleDeleteOption(oIdx)}
                    onEditChange={setEditingValue}
                    onEditSave={handleSaveEdit}
                    onEditCancel={() => setEditingIndex(null)}
                  />
                );
              })}
            </div>
            {showNewInput ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <input
                  autoFocus
                  value={newOption}
                  onChange={e => setNewOption(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddOption()}
                  placeholder="Add new option"
                  style={{ flex: 1, height: '40px', padding: '0 12px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '0.95rem' }}
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  style={{ height: '40px', padding: '0 16px', borderRadius: '12px', border: 'none', background: '#2563EB', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Add
                </button>
              </div>
            ) : (
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
              }} onMouseOver={e => e.currentTarget.style.background = '#EFF6FF'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} onClick={() => setShowNewInput(true)}>
                <Plus size={14} /> Add Custom Option
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminProfileSection() {
  const { sectionId } = useParams();
  const currentSection = sectionsData.find(s => s.id === sectionId);

  useEffect(() => {
    loadDropdownOptionsFromServer();
  }, []);

  if (!currentSection) {
    return (
      <div style={{ padding: '48px 24px', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.7 }}>
        Select one of the profile sections from the sidebar to begin editing.
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>{currentSection.title}</h1>
        <p style={{ color: '#64748B', margin: 0 }}>Manage dropdown configurations for this section.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))', gap: '24px' }}>
        {currentSection.configs.map((config) => (
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
