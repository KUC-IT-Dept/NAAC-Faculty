/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const */
import { Plus, Trash2, Edit2, GraduationCap, ChevronDown, ChevronUp, X, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { fg, inp, FileInp, sel, DocumentPreviewLink } from './sectionUtils';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import { useConfirmSave } from '../useConfirmSave';
import { useConfirmDelete } from '../useConfirmDelete';


import { degreeLevelOptions, divisionOptions, studyModeOptions, countryOptions, stateOptions, degreeNameOptions, specializationOptions, gradeTypeOptions, institutionsOptions } from '../../shared/dropdownOptions';
import SearchableSelect from '../SearchableSelect';

const EMPTY = {
  degreeLevel: '',
  degreeName: '',
  specialization: '',
  institution: '',
  university: '',
  yearOfPassing: '',
  percentageCGPA: '',
  gradeType: '',
  division: '',
  mode: '',
  country: '',
  state: '',
  countryAndState: '',
  phdCertificate: '',
  thesisTitle: '',
  documentUrl: '',
};

const QUALIFICATION_LEVELS = ['10th', '12th', 'UG', 'PG', 'Ph.D', 'M.Phil'];
const SPECIALIZATION_LEVELS = ['UG', 'PG', 'Ph.D', 'M.Phil'];
const YEAR_OPTIONS = Array.from({ length: new Date().getFullYear() - 1959 }, (_, i) => String(new Date().getFullYear() - i));
const DIVISION_OPTIONS = ['First', 'Second', 'Third'];
const MODE_OPTIONS = ['Regular', 'Distance'];
const PHD_MODE_OPTIONS = ['Full time', 'Part time'];
const PHD_SUBJECT_OPTIONS = [
  'Agricultural Science',
  'Anthropology',
  'Architecture',
  'Arts',
  'Biochemistry',
  'Biology',
  'Biotechnology',
  'Botany',
  'Business Administration',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Commerce',
  'Computer Applications',
  'Computer Science',
  'Data Science',
  'Econometrics',
  'Economics',
  'Education',
  'Electrical Engineering',
  'Electronics Engineering',
  'Energy Studies',
  'Environmental Engineering',
  'Environmental Science',
  'Fine Arts',
  'Forensic Science',
  'Food Science',
  'Geography',
  'Geology',
  'Genetics',
  'History',
  'Humanities',
  'Information Technology',
  'Journalism',
  'Law',
  'Linguistics',
  'Management',
  'Materials Science',
  'Mathematics',
  'Mechanical Engineering',
  'Music',
  'Nursing',
  'Pharmacy',
  'Philosophy',
  'Physics',
  'Public Administration',
  'Science',
  'Social Work',
  'Sociology',
  'Statistics',
  'Urban Planning',
  'Veterinary Science',
  'Visual Arts',
  'Zoology',
  'Other'
];
const COUNTRY_OPTIONS = ['India', 'USA', 'UK', 'Australia', 'Other'];
const STATE_OPTIONS_INDIA = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Other'
];
const STATE_OPTIONS_OTHER = ['Other'];
const BOARD_OPTIONS_10TH = ['vhse', 'cbse', 'icse', 'kerala board of higher education', 'other'];
const BOARD_OPTIONS_12TH = ['vhse', 'cbse', 'icse', 'kerala board of higher secondary education', 'other'];
const UNIVERSITY_OPTIONS_HIGHER = ['kannur university', 'calicut university', 'kerala university', 'mg university', 'central university', 'open university', 'foreign university', 'other'];

const SCHOOL_OPTIONS_10TH = [
  'Government High School',
  'Government Upper Primary School',
  'Government Model High School',
  'Aided High School',
  'Aided Upper Primary School',
  'Kendriya Vidyalaya',
  'Navodaya Vidyalaya',
  'Sainik School',
  'CBSE Affiliated Private School',
  'ICSE Affiliated Private School',
  'State Board Private School',
  'Anglo-Indian School',
  'Missionary School',
  'Matriculation School',
  'Municipal Corporation School',
  'Tribal Welfare School',
  'Social Welfare School',
];

const SCHOOL_OPTIONS_12TH = [
  'Government Higher Secondary School',
  'Government Model Higher Secondary School',
  'Aided Higher Secondary School',
  'Kendriya Vidyalaya (Senior Secondary)',
  'Navodaya Vidyalaya (Senior Secondary)',
  'Sainik School (Senior Secondary)',
  'CBSE Affiliated Private School',
  'ICSE / ISC Affiliated Private School',
  'State Board Private Higher Secondary School',
  'Vocational Higher Secondary School (VHSE)',
  'Anglo-Indian Higher Secondary School',
  'Missionary Higher Secondary School',
  'Matriculation Higher Secondary School',
  'Municipal Corporation Higher Secondary School',
  'Tribal Welfare Higher Secondary School',
  'Social Welfare Higher Secondary School',
];

const saveBtnStyle: React.CSSProperties = {
  padding: '7px 20px', fontSize: '14px', cursor: 'pointer',
  backgroundColor: '#16a34a', color: 'white', border: 'none',
  borderRadius: '8px', fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  marginLeft: '8px',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '7px 20px', fontSize: '14px', cursor: 'pointer',
  backgroundColor: '#fff1f2', color: '#9f1239',
  border: '1px solid #fecdd3', borderRadius: '8px', fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: '6px',
};

const deleteBtnStyle: React.CSSProperties = {
  marginLeft: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
  backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
  borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px',
};

const isPhDLevel = (level: string) => level === 'Ph.D';
const showSpecialization = (level: string) => SPECIALIZATION_LEVELS.includes(level) && !isPhDLevel(level);
const showDegreeName = (level: string) => SPECIALIZATION_LEVELS.includes(level) && !isPhDLevel(level);
const getBoardUniversityOptions = (level: string) => {
  if (level === '10th') return BOARD_OPTIONS_10TH;
  if (level === '12th') return BOARD_OPTIONS_12TH;
  if (['UG', 'PG', 'Ph.D', 'M.Phil'].includes(level)) return UNIVERSITY_OPTIONS_HIGHER;
  return [];
};

const normalizeQualificationName = (level: string, name: string) => {
  if (name?.trim()) return name;
  if (level === '10th') return '10th Certificate';
  if (level === '12th') return '12th Certificate';
  if (level === 'UG') return 'UG Degree';
  if (level === 'PG') return 'PG Degree';
  if (level === 'Ph.D') return 'Ph.D Degree';
  if (level === 'M.Phil') return 'M.Phil Degree';
  return '';
};

const parseCountryState = (countryAndState: string) => {
  const parts = (countryAndState || '').split(',').map((p) => p.trim()).filter(Boolean);
  return {
    country: parts[0] || '',
    state: parts.slice(1).join(', ') || ''
  };
};

export default function Qualifications({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const { confirmSave, ConfirmDialog } = useConfirmSave();
  const { confirmDelete, ConfirmDialog: ConfirmDeleteDialog } = useConfirmDelete();
  const dynamicDegreeLevelOptions = useDropdownOptions(degreeLevelOptions);
  const dynamicDivisionOptions = useDropdownOptions(divisionOptions);
  const dynamicStudyModeOptions = useDropdownOptions(studyModeOptions);
  const dynamicCountryOptions = useDropdownOptions(countryOptions);
  const dynamicStateOptions = useDropdownOptions(stateOptions);
  const dynamicDegreeNameOptions = useDropdownOptions(degreeNameOptions);
  const dynamicSpecializationOptions = useDropdownOptions(specializationOptions);
  const dynamicGradeTypeOptions = useDropdownOptions(gradeTypeOptions);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<any>(EMPTY);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const institutionsOpts = useDropdownOptions(institutionsOptions);

  // Sort data by yearOfPassing descending (latest year at the top)
  const sortedData = [...data].sort((a, b) => {
    const yearA = parseInt(a.yearOfPassing) || 0;
    const yearB = parseInt(b.yearOfPassing) || 0;
    return yearB - yearA;
  });



  const CustomSelect = ({ value, onChange, options, placeholder = "— Select —" }: any) => sel(value, onChange, options, placeholder);

  const startEdit = (index: number) => {
    const item = sortedData[index] || {};
    const originalIndex = data.indexOf(item);
    if (originalIndex === -1) return;
    const parsed = parseCountryState(item.countryAndState || '');
    setEditingIndex(originalIndex);
    setEditingData({
      ...item,
      country: item.country || parsed.country,
      state: item.state || parsed.state
    });
  };

  const saveEdit = () => {
    // Check if editingData has any meaningful content
    const hasContent = Object.values(editingData).some((v: any) => v && typeof v === 'string' && v.trim() !== '');
    
    if (!hasContent) {
      // If no content, just cancel without adding
      setEditingIndex(null);
      setEditingData(EMPTY);
      return;
    }

    const level = editingData.degreeLevel || '';
    const isPhD = isPhDLevel(level);
    const sanitizedData = { ...editingData };
    const normalizedData = isPhD
      ? {
          degreeLevel: level,
          degreeName: normalizeQualificationName(level, sanitizedData.degreeName),
          specialization: sanitizedData.specialization || '',
          institution: sanitizedData.institution || '',
          yearOfPassing: sanitizedData.yearOfPassing || '',
          thesisTitle: sanitizedData.thesisTitle || '',
          mode: sanitizedData.mode || '',
          phdCertificate: sanitizedData.phdCertificate || sanitizedData.documentUrl || '',
          documentUrl: sanitizedData.documentUrl || sanitizedData.phdCertificate || '',
          country: sanitizedData.country || '',
          state: sanitizedData.state || '',
          countryAndState: sanitizedData.country && sanitizedData.state
            ? `${sanitizedData.country}, ${sanitizedData.state}`
            : sanitizedData.country || '',
          university: '',
          percentageCGPA: '',
          gradeType: '',
          division: '',
        }
      : {
          ...sanitizedData,
          degreeName: normalizeQualificationName(level, sanitizedData.degreeName),
          specialization: showSpecialization(level) ? sanitizedData.specialization : '',
          thesisTitle: '',
          phdCertificate: '',
          documentUrl: sanitizedData.documentUrl || '',
          countryAndState: sanitizedData.country && sanitizedData.state
            ? `${sanitizedData.country}, ${sanitizedData.state}`
            : sanitizedData.countryAndState || `${sanitizedData.country || ''}${sanitizedData.state ? `, ${sanitizedData.state}` : ''}`,
        };

    let newData = [...data];
    
    if (editingIndex === -1) {
      // Adding new qualification
      newData.unshift(normalizedData);
    } else if (editingIndex !== null && editingIndex >= 0) {
      // Editing existing qualification
      newData[editingIndex] = normalizedData;
    }

    // Sort the array by yearOfPassing descending (latest year at the top)
    newData.sort((a, b) => {
      const yearA = parseInt(a.yearOfPassing) || 0;
      const yearB = parseInt(b.yearOfPassing) || 0;
      return yearB - yearA;
    });

    onChange(newData);
    setEditingIndex(null);
    setEditingData(EMPTY);
    setIsDirty(false);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingData(EMPTY);
    setIsDirty(false);
  };

  const addNewQualification = () => {
    // Don't add empty qualification - just open edit mode with empty data
    setEditingIndex(-1);
    setEditingData({ ...EMPTY });
    setIsDirty(false);
  };

  const removeQualification = (index: number) => {
    const item = sortedData[index];
    const originalIndex = data.indexOf(item);
    if (originalIndex === -1) return;
    onChange(data.filter((_, j) => j !== originalIndex));
  };

  const updateEditingData = (key: string, value: string) => {
    setIsDirty(true);
    setEditingData((prev: any) => ({ ...prev, [key]: value }));
  };

  const renderQualificationFormFields = () => {
    const level = editingData.degreeLevel || '';
    const showSpec = showSpecialization(level);
    const showName = showDegreeName(level);
    const isPhD = isPhDLevel(level);

    if (isPhD) {
      return (
        <>
          <div className="form-row form-row-1">
            {fg('Qualification Level *', <CustomSelect
              value={editingData.degreeLevel}
              onChange={(v: string) => updateEditingData('degreeLevel', v)}
              options={dynamicDegreeLevelOptions}
            />)}
          </div>

          <div className="form-row form-row-2">
            {fg('Institution / University Name', <SearchableSelect value={editingData.institution || ''} onChange={(v: string) => updateEditingData('institution', v)} options={institutionsOpts} placeholder="Search or Enter Institution" />)}
            {fg('Year of Completion', <CustomSelect
              value={editingData.yearOfPassing}
              onChange={(v: string) => updateEditingData('yearOfPassing', v)}
              options={YEAR_OPTIONS}
              placeholder="Select Year"
            />)}
          </div>

          <div className="form-row form-row-2">
            {fg('Subject', <CustomSelect
              value={editingData.specialization}
              onChange={(v: string) => updateEditingData('specialization', v)}
              options={PHD_SUBJECT_OPTIONS}
              placeholder="Select Subject"
            />)}
            {fg('Title of the thesis', inp(editingData.thesisTitle, v => updateEditingData('thesisTitle', v), 'Thesis title'))}
          </div>

          <div className="form-row form-row-1">
            {fg('Full time / Part time', <CustomSelect
              value={editingData.mode}
              onChange={(v: string) => updateEditingData('mode', v)}
              options={PHD_MODE_OPTIONS}
              placeholder="Select mode"
            />)}
          </div>

          <div className="form-row form-row-2">
            {fg('Country & State of Institution', <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <CustomSelect
                  value={editingData.country}
                  onChange={(v: string) => updateEditingData('country', v)}
                  options={dynamicCountryOptions}
                  placeholder="Select Country"
                />
                <CustomSelect
                  value={editingData.state}
                  onChange={(v: string) => updateEditingData('state', v)}
                  options={editingData.country && editingData.country !== 'India' ? STATE_OPTIONS_OTHER : STATE_OPTIONS_INDIA}
                  placeholder="Select State"
                />
              </div>
            </>)}
          </div>

          <div className="form-row form-row-1" style={{ marginTop: '15px' }}>
            {fg('PhD Certificate', (
              <FileInp
                v={editingData.documentUrl || editingData.phdCertificate || ''}
                fn={v => {
                  updateEditingData('documentUrl', v);
                  updateEditingData('phdCertificate', v);
                }}
                label="Upload PhD Certificate (PDF / Image)"
                accept=".pdf,image/*"
                section="qualifications"
              />
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <div className={showName ? 'form-row form-row-3' : 'form-row form-row-1'}>
          {fg('Qualification Level *', <CustomSelect
            value={editingData.degreeLevel}
            onChange={(v: string) => updateEditingData('degreeLevel', v)}
            options={dynamicDegreeLevelOptions}
          />)}
          {showName && fg('Degree / Qualification Name', <CustomSelect
            value={editingData.degreeName}
            onChange={(v: string) => updateEditingData('degreeName', v)}
            options={dynamicDegreeNameOptions}
            placeholder="Select Degree Name"
          />)}
          {showSpec && fg('Specialization / Subject', <CustomSelect
            value={editingData.specialization}
            onChange={(v: string) => updateEditingData('specialization', v)}
            options={dynamicSpecializationOptions}
            placeholder="Select Specialization"
          />)}
        </div>

        <div className="form-row form-row-2">
          {fg('Institution Name',
            (level === '10th' || level === '12th')
              ? <SearchableSelect
                  value={editingData.institution || ''}
                  onChange={(v: string) => updateEditingData('institution', v)}
                  options={level === '10th' ? SCHOOL_OPTIONS_10TH : SCHOOL_OPTIONS_12TH}
                  placeholder="Search or Enter Institution"
                />
              : <SearchableSelect value={editingData.institution || ''} onChange={(v: string) => updateEditingData('institution', v)} options={institutionsOpts} placeholder="Search or Enter Institution" />
          )}
          {fg(
            (level === '10th' || level === '12th') ? 'Board' : 'Board / University',
            (level === '10th' || level === '12th')
              ? <SearchableSelect
                  value={editingData.university || ''}
                  onChange={(v: string) => updateEditingData('university', v)}
                  options={level === '10th' ? BOARD_OPTIONS_10TH : BOARD_OPTIONS_12TH}
                  placeholder="Search or Enter Board"
                />
              : <CustomSelect
                  value={editingData.university}
                  onChange={(v: string) => updateEditingData('university', v)}
                  options={getBoardUniversityOptions(level)}
                  placeholder="Select Board / University"
                />
          )}
        </div>

        <div className="form-row form-row-4">
          {fg('Year of Passing', <CustomSelect
            value={editingData.yearOfPassing}
            onChange={(v: string) => updateEditingData('yearOfPassing', v)}
            options={YEAR_OPTIONS}
            placeholder="Select Year"
          />)}
          {fg('Grade Type', <CustomSelect
            value={editingData.gradeType}
            onChange={(v: string) => updateEditingData('gradeType', v)}
            options={dynamicGradeTypeOptions}
            placeholder="Select Grade Type"
          />)}
          {fg('Score (Percentage or CGPA)', inp(editingData.percentageCGPA, v => updateEditingData('percentageCGPA', v), '85 or 8.5'))}
          {fg('Division', <CustomSelect
            value={editingData.division}
            onChange={(v: string) => updateEditingData('division', v)}
            options={dynamicDivisionOptions}
          />)}
          {fg('Mode', <CustomSelect
            value={editingData.mode}
            onChange={(v: string) => updateEditingData('mode', v)}
            options={dynamicStudyModeOptions}
          />)}
        </div>

        <div className="form-row form-row-2">
          {fg('Country', <CustomSelect
            value={editingData.country}
            onChange={(v: string) => updateEditingData('country', v)}
            options={dynamicCountryOptions}
            placeholder="Select Country"
          />)}
          {fg('State', <CustomSelect
            value={editingData.state}
            onChange={(v: string) => updateEditingData('state', v)}
            options={editingData.country && editingData.country !== 'India' ? STATE_OPTIONS_OTHER : STATE_OPTIONS_INDIA}
            placeholder="Select State"
          />)}
        </div>

        {editingData.degreeLevel && (
          <div className="form-row form-row-1" style={{ marginTop: '15px' }}>
            {fg('Certificate / Document', (
              <FileInp
                v={editingData.documentUrl || ''}
                fn={v => updateEditingData('documentUrl', v)}
                label="Upload Certificate (PDF / Image)"
                accept=".pdf,image/*"
                section="qualifications"
              />
            ))}
          </div>
        )}
      </>
    );
  };

  const renderQualificationPreview = (q: any) => {
    if (isPhDLevel(q.degreeLevel)) {
      const countryState = q.countryAndState || [q.country, q.state].filter(Boolean).join(', ');
      return (
        <>
          {renderPreview('Qualification Level', q.degreeLevel)}
          {(q.phdCertificate || q.documentUrl) && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#7c8b9d', fontWeight: 600, fontSize: '14px', width: '250px', flexShrink: 0 }}>PhD Certificate</span>
              <DocumentPreviewLink url={q.phdCertificate || q.documentUrl} label="View Certificate" />
            </div>
          )}
          {renderPreview('Institution / University Name', q.institution)}
          {renderPreview('Year of Completion', q.yearOfPassing)}
          {renderPreview('Subject', q.specialization)}
          {renderPreview('Title of the thesis', q.thesisTitle)}
          {renderPreview('Full time / Part time', q.mode)}
          {renderPreview('Country & State of Institution', countryState)}
        </>
      );
    }

    return (
      <>
        {renderPreview('Qualification Level', q.degreeLevel)}
        {renderPreview('Degree / Qualification Name', q.degreeName)}
        {renderPreview('Specialization / Subject', q.specialization)}
        {renderPreview('Institution Name', q.institution)}
        {renderPreview((q.degreeLevel === '10th' || q.degreeLevel === '12th') ? 'Board' : 'Board / University', q.university)}
        {renderPreview('Year of Passing', q.yearOfPassing)}
        {renderPreview('Grade Type', q.gradeType)}
        {renderPreview('Score (Percentage or CGPA)', q.percentageCGPA)}
        {renderPreview('Division', q.division)}
        {renderPreview('Mode', q.mode)}
        {renderPreview('Country', q.country)}
        {renderPreview('State', q.state)}
        {q.documentUrl && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#7c8b9d', fontWeight: 600, fontSize: '14px', width: '250px', flexShrink: 0 }}>Certificate / Document</span>
            <DocumentPreviewLink url={q.documentUrl} label="View Certificate" />
          </div>
        )}
      </>
    );
  };

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const renderPreview = (label: string, value: any) => (
    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#7c8b9d', fontWeight: 600, fontSize: '14px', width: '250px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#1f2937', fontSize: '14px', fontWeight: 500 }}>{value || '-'}</span>
    </div>
  );

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={addNewQualification}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600
          }}
        >
          <Plus size={16} /> Add Qualification
        </button>
      </div>

      {editingIndex === -1 ? (
        <div key="new" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={20} color="#4f46e5" /> Add New Qualification
              </h3>
              <div>
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={cancelBtnStyle}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmSave(saveEdit)}
                  style={saveBtnStyle}
                >
                  <Check size={14} /> Save
                </button>
              </div>
            </div>

            {renderQualificationFormFields()}
            {isDirty && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={cancelBtnStyle}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmSave(saveEdit)}
                  style={saveBtnStyle}
                >
                  <Check size={14} /> Save
                </button>
              </div>
            )}
          </>
        </div>
      ) : (
        sortedData.map((q, i) => {
          const originalIndex = data.indexOf(q);
          return (
            <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {editingIndex === originalIndex ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={20} color="#111827" /> Edit Qualification
                  </h3>
                  <div>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={cancelBtnStyle}
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmSave(saveEdit)}
                      style={saveBtnStyle}
                    >
                      <Check size={14} /> Save
                    </button>
                  </div>
                </div>

                {renderQualificationFormFields()}
                {isDirty && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={cancelBtnStyle}
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmSave(saveEdit)}
                      style={saveBtnStyle}
                    >
                      <Check size={14} /> Save
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedCards.has(i) ? '16px' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }} onClick={() => toggleCard(i)}>
                    {/* Year badge (blue box) */}
                    <div style={{ minWidth: 52, textAlign: 'center', padding: '6px 4px', borderRadius: '8px', background: '#2563eb', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                        {q.yearOfPassing || '—'}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year</div>
                    </div>
                    {/* Title details */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 700 }}>
                        {q.degreeName || q.degreeLevel || `Qualification ${i + 1}`}
                      </h3>
                      {(q.degreeLevel && q.degreeName && q.degreeLevel !== q.degreeName) && (
                        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                          Level: {q.degreeLevel}
                        </div>
                      )}
                      {q.specialization && (
                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600, marginTop: '2px' }}>
                          {isPhDLevel(q.degreeLevel) ? 'Subject' : 'Specialization'}: {q.specialization}
                        </div>
                      )}
                      {isPhDLevel(q.degreeLevel) && q.thesisTitle && (
                        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                          Thesis: {q.thesisTitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => toggleCard(i)}
                      style={{
                        padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                        backgroundColor: expandedCards.has(i) ? '#f8fafc' : '#f1f5f9',
                        color: expandedCards.has(i) ? '#000000' : '#475569',
                        border: expandedCards.has(i) ? '1px solid #cbd5e1' : '1px solid #cbd5e1',
                        borderRadius: '6px', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {expandedCards.has(i) ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> View</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(i)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(() => removeQualification(i))}
                      style={deleteBtnStyle}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>

                {expandedCards.has(i) && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {renderQualificationPreview(q)}
                  </div>
                )}
              </>
              )}
            </div>
          );
        })
      )}
      <ConfirmDialog />
      <ConfirmDeleteDialog />
    </div>
  );
}
