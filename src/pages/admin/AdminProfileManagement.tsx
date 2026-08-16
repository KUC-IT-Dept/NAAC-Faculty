import { useState, useRef, useEffect } from 'react';
import { Outlet, useParams, Navigate, useOutletContext } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import { useConfirmSave } from '../../components/useConfirmSave';
import { useConfirmDelete } from '../../components/useConfirmDelete';


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
  committeeTypeOptions, responsibilityRoleOptions, courseLevelOptions, semesterTypeOptions, academicSessionTypeOptions, teachingCategoryOptions, responsibilityStatusOptions, courseNameOptions, programmeOptions,
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
  optionArrays,
} from '../../shared/dropdownOptions';

export const fallbackSectionsData = [
  {
    id: 'personal-information', title: '01 - Personal Information', configs: [
      { name: 'Gender', optionsKey: 'genderOptions' },
      { name: 'Blood Group', optionsKey: 'bloodGroupOptions' },
      { name: 'Nationality', optionsKey: 'nationalityOptions' },
      { name: 'Religion', optionsKey: 'religionOptions' }
    ]
  }
];


export function EditProfileLayout() {
  const [sectionsData, setSectionsData] = useState<any[]>(fallbackSectionsData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/sections-config')
      .then(res => setSectionsData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="Profile Management">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div className="spinner" style={{ width: 30, height: 30 }} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile Management">
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '32px' }}>
        <Outlet context={{ sectionsData }} />
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
  'Gender': 'genderOptions',
  'Blood Group': 'bloodGroupOptions',
  'Nationality': 'nationalityOptions',
  'Religion': 'religionOptions',
  'Category': 'categoryOptions',
  'Sub-Category': 'subCategoryOptions',
  'Marital Status': 'maritalStatusOptions',
  'Disability Status': 'disabilityStatusOptions',
  'Disability Type': 'disabilityTypeOptions',
  'State': 'stateOptions',
  'Country': 'countryOptions',
  'Degree Level': 'degreeLevelOptions',
  'Degree / Certificate Name': 'degreeNameOptions',
  'Specialization / Subject': 'specializationOptions',
  'Division / Class': 'divisionOptions',
  'Study Mode': 'studyModeOptions',
  'Grade Type': 'gradeTypeOptions',
  'Exam Name': 'examNameOptions',
  'Subject / Paper': 'subjectPaperOptions',
  'State (for SET/SLET)': 'stateForSetOptions',
  'Validity Status': 'validityStatusOptions',
  'Designation': 'designationOptions',
  'Designation / Post': 'designationPostOptions',
  'Department': 'departmentOptions',
  'Institution / College Type': 'institutionTypeOptions',
  'Affiliated University': 'affiliatedUniversityOptions',
  'Nature of Appointment': 'natureOfAppointmentOptions',
  'Approval Status': 'approvalStatusOptions',
  'Pay Scale / Band': 'payScaleOptions',
  'Publication Type': 'publicationTypeOptions',
  'Publication Level': 'publicationLevelOptions',
  'Author Role': 'authorRoleOptions',
  'Indexed In': 'indexedInOptions',
  'Peer Reviewed Status': 'peerReviewedStatusOptions',
  'Journal Category': 'journalCategoryOptions',
  'Award Category': 'awardCategoryOptions',
  'Award Level': 'awardLevelOptions',
  'Awarding Agency Type': 'awardingAgencyTypeOptions',
  'Honour Type': 'honourTypeOptions',
  'Recognition Status': 'recognitionStatusOptions',
  'Funding Agency': 'fundingAgencyOptions',
  'Project Status': 'projectStatusOptions',
  'Role in Project': 'roleInProjectOptions',
  'Project Category': 'projectCategoryOptions',
  'Funding Type': 'fundingTypeOptions',
  'Research Degree': 'researchDegreeOptions',
  'Scholar Gender': 'scholarGenderOptions',
  'Research Status': 'researchStatusOptions',
  'Guidance Type': 'guidanceTypeOptions',
  'Patent Status': 'patentStatusOptions',
  'Patent Type': 'patentTypeOptions',
  'Jurisdiction Type': 'jurisdictionTypeOptions',
  'Licensing Status': 'licensingStatusOptions',
  'Supervision Category': 'supervisionCategoryOptions',
  'Committee Type': 'committeeTypeOptions',
  'Responsibility Role': 'responsibilityRoleOptions',
  'Course Level': 'courseLevelOptions',
  'Semester Type': 'semesterTypeOptions',
  'Academic Session Type': 'academicSessionTypeOptions',
  'Teaching Category': 'teachingCategoryOptions',
  'Responsibility Status': 'responsibilityStatusOptions',
  'Course Name': 'courseNameOptions',
  'Programme': 'programmeOptions',
  'admin-non-academic::Administrative Charge': 'adminChargeOptions',
  'academic-administration::Administrative Charge': 'academicAdminOptions',
  'quality-assurance::Administrative Charge': 'qualityAssuranceOptions',
  'research-innovation::Administrative Charge': 'researchInnovationOptions',
  'examination-evaluation::Administrative Charge': 'examinationEvaluationOptions',
  'admin-support::Administrative Charge': 'adminSupportOptions',
  'dept-charges::Administrative charge': 'departmentalChargesOptions',
  'special-assignments::Administrative charge': 'specialAssignmentsOptions',
  'extra-institutional::Administrative charge': 'extraInstitutionalOptions',
  'international-experience::Visited Country': 'countryVisitOptions',
  'Reason for Leaving': 'reasonForLeavingOptions'
};

function DropdownConfigList({ config, sectionId }: { config: any; sectionId: string }) {
  const { confirmSave, ConfirmDialog } = useConfirmSave();
  const { confirmDelete, ConfirmDialog: ConfirmDeleteDialog } = useConfirmDelete();
  const getOptionsRef = () => (config.optionsKey && optionArrays[config.optionsKey as keyof typeof optionArrays]) || config.options || [];

  const [options, setOptions] = useState<string[]>([...getOptionsRef()]);
  const [selected, setSelected] = useState(getOptionsRef()[0] || 'Select an option');
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [newOption, setNewOption] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = [...getOptionsRef()];
    setOptions(current);
    setSelected(current[0] || 'Select an option');
  }, [config.optionsKey, config.options]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const persistOptions = async (newOptions: string[]) => {
    setOptions(newOptions);

    if (config.optionsKey) {
      const arr = optionArrays[config.optionsKey as keyof typeof optionArrays];
      if (arr) {
        arr.length = 0;
        arr.push(...newOptions);
      }
    }

    try {
      await api.post('/admin/options', {
        sectionId,
        label: config.label,
        optionsKey: config.optionsKey || '',
        options: newOptions
      });
    } catch {
      // Background sync, suppress error toast
    }
  };

  const handleSelect = (option: string) => {
    setSelected(option);
    setIsOpen(false);
  };

  const handleAddOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed || options.includes(trimmed)) return;

    confirmSave(() => {
      const updated = [...options, trimmed];
      persistOptions(updated);
      setSelected(trimmed);
      setNewOption('');
      setShowNewInput(false);
      setIsOpen(false);
    });
  };

  const handleDeleteOption = (idx: number) => {
    confirmDelete(() => {
      const updated = options.filter((_, i) => i !== idx);
      persistOptions(updated);
      if (selected === options[idx]) {
        setSelected(updated[0] || 'Select an option');
      }
    });
  };

  const handleEditOption = (idx: number) => {
    setEditingIndex(idx);
    setEditingValue(options[idx]);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    confirmSave(() => {
      const updated = options.map((opt, idx) => idx === editingIndex ? trimmed : opt);
      persistOptions(updated);
      if (selected === options[editingIndex]) {
        setSelected(trimmed);
      }
      setEditingIndex(null);
      setEditingValue('');
    });
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
      <ConfirmDialog />
      <ConfirmDeleteDialog />
    </div>
  );
}

export function AdminProfileSection() {
  const { sectionId } = useParams();
  const { sectionsData } = useOutletContext<{ sectionsData: any[] }>();
  const currentSection = sectionsData.find(s => s.sectionId === sectionId || s.id === sectionId);

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
        {currentSection.configs.map((config: any) => (
          <DropdownConfigList key={`${currentSection.id}-${config.name}`} config={config} sectionId={currentSection.id} />
        ))}

        {(!currentSection.configs || currentSection.configs.length === 0) && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748B', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #D1D5DB' }}>
            No dropdown configurations available for this section.
          </div>
        )}
      </div>
    </>
  );
}
