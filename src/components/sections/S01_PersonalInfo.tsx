import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { fg, inp, sel, ta, dateInp, Sub, Note } from './sectionUtils';

export default function PersonalInfo({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  
  // Single edit state for entire form
  const [isEditing, setIsEditing] = useState(false);
  const previousDataRef = useRef(data);

  // Auto-return to preview mode after save
  useEffect(() => {
    if (!isEditing) return;

    // Listen for page navigation or reload (save often triggers these)
    const handleBeforeUnload = () => {
      setTimeout(() => {
        setIsEditing(false);
      }, 100);
    };

    // Listen for any click that might be a save button
    const handleClick = (e) => {
      const target = e.target;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        const buttonText = button.textContent?.toLowerCase() || '';
        const buttonTitle = button.title?.toLowerCase() || '';
        
        // Check if this looks like a save button (but NOT the edit button)
        if ((buttonText.includes('save') || buttonTitle.includes('save') || 
            button.type === 'submit' || button.className.includes('save')) && 
            !buttonText.includes('edit')) {
          setTimeout(() => {
            setIsEditing(false);
          }, 1500); // Wait for save to complete
        }
      }
    };

    // Fallback: Check for save completion every 2 seconds
    const checkInterval = setInterval(() => {
      // If there are no loading indicators and we're still editing, assume save completed
      const loadingElements = document.querySelectorAll('.loading, .spinner, [aria-busy="true"]');
      if (loadingElements.length === 0) {
        // Check if URL changed (save might redirect)
        if (window.location.href !== window.location.href) {
          setIsEditing(false);
        }
      }
    }, 2000);

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick);
      clearInterval(checkInterval);
    };
  }, [isEditing]);
  
  // Custom select with add option
  const CustomSelect = ({ value, onChange, options, placeholder = "— Select —" }) => {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customValue, setCustomValue] = useState('');

    const handleSelectChange = (newValue) => {
      if (newValue === '__ADD_CUSTOM__') {
        setShowCustomInput(true);
      } else {
        onChange(newValue);
      }
    };

    const handleCustomAdd = () => {
      if (customValue.trim()) {
        onChange(customValue.trim());
        setCustomValue('');
        setShowCustomInput(false);
      }
    };

    return (
      <div>
        {showCustomInput ? (
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              className="form-input"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="Enter custom value"
              autoFocus
            />
            <button 
              type="button"
              onClick={handleCustomAdd}
              style={{ padding: '0 8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              Add
            </button>
            <button 
              type="button"
              onClick={() => setShowCustomInput(false)}
              style={{ padding: '0 8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              X
            </button>
          </div>
        ) : (
          <select 
            className="form-select" 
            value={value || ''} 
            onChange={(e) => handleSelectChange(e.target.value)}
          >
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="__ADD_CUSTOM__">+ Add Custom Option</option>
          </select>
        )}
      </div>
    );
  };
  
  // Preview display helper
  const renderPreview = (label, value) => (
    <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
      <strong>{label}:</strong> {value || 'Not specified'}
    </div>
  );
  return (
    <div>
      {!isEditing && (
        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
          <button 
            onClick={() => setIsEditing(true)}
            style={{
              padding: '8px 16px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Edit
          </button>
        </div>
      )}
      <Sub>Name</Sub>
      {isEditing ? (
        <div className="form-row form-row-3">
          {fg('First Name *', inp(data.firstName, v => s('firstName', v), 'First'))}
          {fg('Middle Name', inp(data.middleName, v => s('middleName', v)))}
          {fg('Last Name *', inp(data.lastName, v => s('lastName', v), 'Last'))}
        </div>
      ) : (
        <div className="form-row form-row-3">
          {renderPreview('First Name', data.firstName)}
          {renderPreview('Middle Name', data.middleName)}
          {renderPreview('Last Name', data.lastName)}
        </div>
      )}

      <Sub>Basic Details</Sub>
      {isEditing ? (
        <>
          <div className="form-row form-row-4">
            {fg('Date of Birth', dateInp(data.dateOfBirth, v => s('dateOfBirth', v)))}
            {fg('Gender', <CustomSelect value={data.gender} onChange={v => s('gender', v)} options={['Male', 'Female', 'Transgender', 'Other']} />)}
            {fg('Blood Group', <CustomSelect value={data.bloodGroup} onChange={v => s('bloodGroup', v)} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />)}
            {fg('Nationality', <CustomSelect value={data.nationality} onChange={v => s('nationality', v)} options={['Indian', 'NRI', 'Foreign']} />)}
          </div>
          <div className="form-row form-row-3">
            {fg('Religion', <CustomSelect value={data.religion} onChange={v => s('religion', v)} options={['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other']} />)}
            {fg('Category', <CustomSelect value={data.category} onChange={v => s('category', v)} options={['General', 'OBC', 'SC', 'ST', 'EWS', 'Other']} />)}
            {fg('Sub-Category', inp(data.subCategory, v => s('subCategory', v)))}
          </div>
          <div className="form-row form-row-3">
            {fg('Marital Status', <CustomSelect value={data.maritalStatus} onChange={v => s('maritalStatus', v)} options={['Single', 'Married', 'Divorced', 'Widowed']} />)}
            {fg('Spouse Name', inp(data.spouseName, v => s('spouseName', v)))}
            {fg('Spouse Occupation', inp(data.spouseOccupation, v => s('spouseOccupation', v)))}
          </div>
          <div className="form-row form-row-2">
            {fg('Differently Abled', <CustomSelect value={data.differentlyAbled} onChange={v => s('differentlyAbled', v)} options={['No', 'Yes']} />)}
            {fg('Disability Type (if Yes)', inp(data.disabilityType, v => s('disabilityType', v)))}
          </div>
        </>
      ) : (
        <>
          <div className="form-row form-row-4">
            {renderPreview('Date of Birth', data.dateOfBirth)}
            {renderPreview('Gender', data.gender)}
            {renderPreview('Blood Group', data.bloodGroup)}
            {renderPreview('Nationality', data.nationality)}
          </div>
          <div className="form-row form-row-3">
            {renderPreview('Religion', data.religion)}
            {renderPreview('Category', data.category)}
            {renderPreview('Sub-Category', data.subCategory)}
          </div>
          <div className="form-row form-row-3">
            {renderPreview('Marital Status', data.maritalStatus)}
            {renderPreview('Spouse Name', data.spouseName)}
            {renderPreview('Spouse Occupation', data.spouseOccupation)}
          </div>
          <div className="form-row form-row-2">
            {renderPreview('Differently Abled', data.differentlyAbled)}
            {renderPreview('Disability Type', data.disabilityType)}
          </div>
        </>
      )}

      <Sub>Permanent Address</Sub>
      {isEditing ? (
        <>
          {fg('Street / Locality / Colony', ta(data.permanentAddress, v => s('permanentAddress', v), '12, Example Street'))}
          <div className="form-row form-row-3">
            {fg('City', inp(data.permanentCity, v => s('permanentCity', v)))}
            {fg('State', inp(data.permanentState, v => s('permanentState', v)))}
            {fg('PIN Code', inp(data.permanentPin, v => s('permanentPin', v)))}
          </div>
        </>
      ) : (
        <>
          {renderPreview('Street / Locality / Colony', data.permanentAddress)}
          <div className="form-row form-row-3">
            {renderPreview('City', data.permanentCity)}
            {renderPreview('State', data.permanentState)}
            {renderPreview('PIN Code', data.permanentPin)}
          </div>
        </>
      )}

      <Sub>Current / Correspondence Address</Sub>
      {isEditing ? (
        <>
          {fg('Street / Locality / Colony', ta(data.currentAddress, v => s('currentAddress', v), 'Same as permanent or different'))}
          <div className="form-row form-row-3">
            {fg('City', inp(data.currentCity, v => s('currentCity', v)))}
            {fg('State', inp(data.currentState, v => s('currentState', v)))}
            {fg('PIN Code', inp(data.currentPin, v => s('currentPin', v)))}
          </div>
        </>
      ) : (
        <>
          {renderPreview('Street / Locality / Colony', data.currentAddress)}
          <div className="form-row form-row-3">
            {renderPreview('City', data.currentCity)}
            {renderPreview('State', data.currentState)}
            {renderPreview('PIN Code', data.currentPin)}
          </div>
        </>
      )}

      <Sub>Contact Details</Sub>
      {isEditing ? (
        <>
          <div className="form-row form-row-2">
            {fg('Mobile (Personal) *', inp(data.mobilePersonal, v => s('mobilePersonal', v), '+91 XXXXX XXXXX'))}
            {fg('Alternate Phone', inp(data.alternatePhone, v => s('alternatePhone', v)))}
          </div>
          <div className="form-row form-row-2">
            {fg('Official Email *', inp(data.officialEmail, v => s('officialEmail', v), 'you@institution.edu.in'))}
            {fg('Personal Email', inp(data.personalEmail, v => s('personalEmail', v)))}
          </div>
          <div className="form-row form-row-2">
            {fg('Emergency Contact Name', inp(data.emergencyContactName, v => s('emergencyContactName', v)))}
            {fg('Emergency Contact Mobile', inp(data.emergencyContactMobile, v => s('emergencyContactMobile', v)))}
          </div>
        </>
      ) : (
        <>
          <div className="form-row form-row-2">
            {renderPreview('Mobile (Personal)', data.mobilePersonal)}
            {renderPreview('Alternate Phone', data.alternatePhone)}
          </div>
          <div className="form-row form-row-2">
            {renderPreview('Official Email', data.officialEmail)}
            {renderPreview('Personal Email', data.personalEmail)}
          </div>
          <div className="form-row form-row-2">
            {renderPreview('Emergency Contact Name', data.emergencyContactName)}
            {renderPreview('Emergency Contact Mobile', data.emergencyContactMobile)}
          </div>
        </>
      )}

      <Sub>Identity Documents</Sub>
      {isEditing ? (
        <div className="form-row form-row-3">
          {fg('Aadhaar Number', inp(data.aadhaarNumber, v => s('aadhaarNumber', v), 'XXXX XXXX XXXX'))}
          {fg('PAN Number', inp(data.panNumber, v => s('panNumber', v), 'AAAAA0000A'))}
          {fg('Passport Number', inp(data.passportNumber, v => s('passportNumber', v)))}
        </div>
      ) : (
        <div className="form-row form-row-3">
          {renderPreview('Aadhaar Number', data.aadhaarNumber)}
          {renderPreview('PAN Number', data.panNumber)}
          {renderPreview('Passport Number', data.passportNumber)}
        </div>
      )}

      <Sub>Profile Photo & Online Profiles</Sub>
      {isEditing ? (
        <>
          {fg('Profile Photo URL', (
            <>
              <input className="form-input" value={data.photoUrl || ''} onChange={e => s('photoUrl', e.target.value)} placeholder="https://..." />
              <p className="form-hint">Paste a public URL to a hosted photo. (File upload coming soon)</p>
            </>
          ))}
          <div className="form-row form-row-2">
            {fg('ORCID iD', inp(data.orcidId, v => s('orcidId', v), '0000-0000-0000-0000'))}
            {fg('Google Scholar ID', inp(data.googleScholarId, v => s('googleScholarId', v)))}
            {fg('Scopus Author ID', inp(data.scopusId, v => s('scopusId', v)))}
            {fg('LinkedIn Profile URL', inp(data.linkedIn, v => s('linkedIn', v), 'https://linkedin.com/in/...'))}
          </div>
          {fg('Personal Website / Portfolio', inp(data.website, v => s('website', v), 'https://...'))}
        </>
      ) : (
        <>
          {renderPreview('Profile Photo URL', data.photoUrl)}
          <div className="form-row form-row-2">
            {renderPreview('ORCID iD', data.orcidId)}
            {renderPreview('Google Scholar ID', data.googleScholarId)}
            {renderPreview('Scopus Author ID', data.scopusId)}
            {renderPreview('LinkedIn Profile URL', data.linkedIn)}
          </div>
          {renderPreview('Personal Website / Portfolio', data.website)}
        </>
      )}
    </div>
  );
}
