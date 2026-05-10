import { useState, useEffect } from 'react';
import { fg, inp, ta, dateInp } from './sectionUtils';
import ProfilePictureUpload from '../ProfilePictureUpload';

export default function PersonalInfo({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  // Ensure data is an object
  const safeData = data || {};
  const s = (k: string, v: string) => onChange({ ...safeData, [k]: v });

  // Single edit state for entire form
  const [isEditing, setIsEditing] = useState(false);

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
    const handleClick = (e: any) => {
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

  // Simple select without custom option
  const SimpleSelect = ({ value, onChange, options, placeholder = "— Select —" }: { value: any, onChange: (val: string) => void, options: any[], placeholder?: string }) => {
    return (
      <select
        className="form-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  };

  // Preview display helper
  const renderPreview = (label: string, value: any) => (
    <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
      <strong>{label}:</strong> {value || 'Not specified'}
    </div>
  );

  // Get full name for display
  const fullName = `${safeData.firstName || ''} ${safeData.middleName || ''} ${safeData.lastName || ''}`.trim();
  return (
    <div className="personal-info-container">
      {!isEditing && (
        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-outline"
          >
            Edit
          </button>
        </div>
      )}

      {/* Profile Box */}
      <div className="info-box profile-box">
        <div className="profile-header">
          <ProfilePictureUpload
            currentPicture={safeData.profilePicture}
            onPictureChange={(url) => s('profilePicture', url)}
            isEditing={isEditing}
          />
          <div className="profile-info">
            {isEditing ? (
              <>
                <div className="form-row form-row-3">
                  {fg('First Name *', inp(safeData.firstName, v => s('firstName', v), 'First'))}
                  {fg('Middle Name', inp(safeData.middleName, v => s('middleName', v)))}
                  {fg('Last Name *', inp(safeData.lastName, v => s('lastName', v), 'Last'))}
                </div>
                {fg('Professional Headline', inp(safeData.professionalHeadline, v => s('professionalHeadline', v), 'e.g., Assistant Professor of Computer Science'))}
              </>
            ) : (
              <>
                <h2 className="profile-name">{fullName || 'Your Name'}</h2>
                <p className="profile-headline">{safeData.professionalHeadline || 'Professional Headline'}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="info-grid">
        {/* Biography Box */}
        <div className="info-box biography-box">
          <h3>Biography</h3>
          {isEditing ? (
            fg('', ta(safeData.biography, v => s('biography', v), 'Tell us about yourself...'))
          ) : (
            <p className="biography-content">{safeData.biography || 'No biography added yet.'}</p>
          )}
        </div>

        {/* Subjects & Interests Box */}
        <div className="info-box subjects-interests-box">
          <h3>Subjects & Interests</h3>
          <div className="subjects-interests-content">
            <div className="subject-section">
              <h4>Subjects</h4>
              {isEditing ? (
                fg('', ta(safeData.subjects, v => s('subjects', v), 'List your subjects of expertise...'))
              ) : (
                <p className="subjects-content">{safeData.subjects || 'No subjects added yet.'}</p>
              )}
            </div>
            <div className="interest-section">
              <h4>Interests</h4>
              {isEditing ? (
                fg('', ta(safeData.interests, v => s('interests', v), 'List your academic and research interests...'))
              ) : (
                <p className="interests-content">{safeData.interests || 'No interests added yet.'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Details Scrollable Box */}
      <div className="info-box personal-details-box">
        <h3>Personal Details</h3>
        <div className="scrollable-content">
          <div className="form-section">
            <h4>Family Information</h4>
            {isEditing ? (
              fg("Father's Name", inp(data.fatherName, v => s('fatherName', v)))
            ) : (
              renderPreview("Father's Name", safeData.fatherName)
            )}
            {isEditing ? (
              fg("Mother's Name", inp(data.motherName, v => s('motherName', v)))
            ) : (
              renderPreview("Mother's Name", safeData.motherName)
            )}
            {isEditing ? (
              fg("Spouse's Name", inp(data.spouseName, v => s('spouseName', v)))
            ) : (
              renderPreview("Spouse's Name", safeData.spouseName)
            )}
          </div>

          <div className="form-section">
            <h4>Personal Information</h4>
            {isEditing ? (
              fg('Date of Birth', dateInp(data.dateOfBirth, v => s('dateOfBirth', v)))
            ) : (
              renderPreview('Date of Birth', safeData.dateOfBirth)
            )}
            {isEditing ? (
              fg('Age', inp(data.age, v => s('age', v)))
            ) : (
              renderPreview('Age', safeData.age)
            )}
            {isEditing ? (
              fg('Place of Birth', inp(data.placeOfBirth, v => s('placeOfBirth', v)))
            ) : (
              renderPreview('Place of Birth', safeData.placeOfBirth)
            )}
            {isEditing ? (
              fg('Gender', <SimpleSelect value={data.gender} onChange={v => s('gender', v)} options={['Male', 'Female', 'Transgender', 'Other']} />)
            ) : (
              renderPreview('Gender', safeData.gender)
            )}
            {isEditing ? (
              fg('Blood Group', <SimpleSelect value={data.bloodGroup} onChange={v => s('bloodGroup', v)} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />)
            ) : (
              renderPreview('Blood Group', safeData.bloodGroup)
            )}
            {isEditing ? (
              fg('Nationality', <SimpleSelect value={data.nationality} onChange={v => s('nationality', v)} options={['Indian', 'NRI', 'Foreign']} />)
            ) : (
              renderPreview('Nationality', safeData.nationality)
            )}
            {isEditing ? (
              fg('Marital Status', <SimpleSelect value={data.maritalStatus} onChange={v => s('maritalStatus', v)} options={['Single', 'Married', 'Divorced', 'Widowed']} />)
            ) : (
              renderPreview('Marital Status', safeData.maritalStatus)
            )}
            {isEditing ? (
              fg('Differently Abled', <SimpleSelect value={data.differentlyAbled} onChange={v => s('differentlyAbled', v)} options={['No', 'Yes']} />)
            ) : (
              renderPreview('Differently Abled', safeData.differentlyAbled)
            )}
            {isEditing ? (
              fg('Religion', <SimpleSelect value={data.religion} onChange={v => s('religion', v)} options={['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other']} />)
            ) : (
              renderPreview('Religion', safeData.religion)
            )}
            {isEditing ? (
              fg('Community', inp(data.community, v => s('community', v)))
            ) : (
              renderPreview('Community', safeData.community)
            )}
          </div>

          <div className="form-section">
            <h4>Address Information</h4>
            <div className="address-section">
              <h5>Address for Communication</h5>
              {isEditing ? (
                <>
                  {fg('Street / Locality / Colony', ta(data.communicationAddress, v => s('communicationAddress', v), '12, Example Street'))}
                  {fg('City', inp(data.communicationCity, v => s('communicationCity', v)))}
                  {fg('State', inp(data.communicationState, v => s('communicationState', v)))}
                  {fg('PIN Code', inp(data.communicationPin, v => s('communicationPin', v)))}
                </>
              ) : (
                <>
                  {renderPreview('Street / Locality / Colony', safeData.communicationAddress)}
                  {renderPreview('City', safeData.communicationCity)}
                  {renderPreview('State', safeData.communicationState)}
                  {renderPreview('PIN Code', safeData.communicationPin)}
                </>
              )}
            </div>

            <div className="address-section">
              <h5>Permanent Address</h5>
              {isEditing ? (
                <>
                  {fg('Street / Locality / Colony', ta(data.permanentAddress, v => s('permanentAddress', v), '12, Example Street'))}
                  {fg('City', inp(data.permanentCity, v => s('permanentCity', v)))}
                  {fg('State', inp(data.permanentState, v => s('permanentState', v)))}
                  {fg('PIN Code', inp(data.permanentPin, v => s('permanentPin', v)))}
                </>
              ) : (
                <>
                  {renderPreview('Street / Locality / Colony', safeData.permanentAddress)}
                  {renderPreview('City', safeData.permanentCity)}
                  {renderPreview('State', safeData.permanentState)}
                  {renderPreview('PIN Code', safeData.permanentPin)}
                </>
              )}
            </div>
          </div>

          <div className="form-section">
            <h4>Contact Information</h4>
            {isEditing ? (
              fg('Mobile Number', inp(data.mobileNumber, v => s('mobileNumber', v), '+91 XXXXX XXXXX'))
            ) : (
              renderPreview('Mobile Number', safeData.mobileNumber)
            )}
            {isEditing ? (
              fg('Email ID', inp(data.emailId, v => s('emailId', v), 'you@example.com'))
            ) : (
              renderPreview('Email ID', safeData.emailId)
            )}
          </div>

          <div className="form-section">
            <h4>Identity Documents</h4>
            {isEditing ? (
              fg('Aadhaar Number', inp(data.aadhaarNumber, v => s('aadhaarNumber', v), 'XXXX XXXX XXXX'))
            ) : (
              renderPreview('Aadhaar Number', safeData.aadhaarNumber)
            )}
            {isEditing ? (
              fg('PAN Number', inp(data.panNumber, v => s('panNumber', v), 'AAAAA0000A'))
            ) : (
              renderPreview('PAN Number', safeData.panNumber)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
