import { useState, useEffect } from 'react';
import { fg, inp, ta } from './sectionUtils';
import ProfilePictureUpload from '../ProfilePictureUpload';

// Styles object for the component
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px'
  },
  profileBox: {
    background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
    color: 'white',
    borderRadius: '16px',
    padding: '30px',
    marginBottom: '20px',
    boxShadow: '0 8px 32px rgba(30, 58, 138, 0.3)'
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px'
  },
  profileName: {
    color: 'white',
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 8px 0'
  },
  profileHeadline: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '16px',
    margin: '0'
  },
  infoBox: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  personalInfoBox: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px 24px 16px 24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  infoBoxHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
  },
  title: {
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 8px 0'
  },
  titleLine: {
    border: 'none',
    height: '2px',
    background: 'linear-gradient(90deg, #3b82f6, #1e40af)',
    margin: '0 0 20px 0',
    borderRadius: '1px'
  },
  sectionHeading: {
    color: '#374151',
    fontSize: '14px',
    fontWeight: '600',
    margin: '20px 0 12px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  subjectsInterestsSection: {
    marginBottom: '20px'
  },
  subjectsInterestsHeading: {
    color: '#1f2937',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    textTransform: 'none' as const,
    letterSpacing: 'normal'
  },
  content: {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0'
  },
  scrollableContent: {
    maxHeight: '460px',
    overflowY: 'auto' as const,
    paddingRight: '10px',
    height: '100%'
  },
  formSection: {
    marginBottom: '32px',
    paddingBottom: '20px',
    borderBottom: '1px solid #e5e7eb'
  },
  lastFormSection: {
    marginBottom: '0',
    paddingBottom: '5px',
    borderBottom: 'none'
  },
  formSectionHeading: {
    color: '#1f2937',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    paddingBottom: '12px',
    borderBottom: '2px solid #e5e7eb'
  },
  addressSection: {
    marginBottom: '20px'
  },
  addressHeading: {
    color: '#374151',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0'
  },
  previewItem: {
    marginBottom: '8px',
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: '6px',
    borderLeft: '3px solid #3b82f6'
  },
  previewLabel: {
    color: '#1f2937',
    fontWeight: '600'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px',
    display: 'block'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    outline: 'none'
  },
  inputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  buttonOutline: {
    background: 'white',
    color: '#3b82f6',
    border: '1px solid #3b82f6'
  },
  buttonOutlineHover: {
    background: '#3b82f6',
    color: 'white'
  },
  formRow: {
    display: 'grid',
    gap: '16px',
    marginBottom: '16px'
  },
  formRow3: {
    gridTemplateColumns: '1fr 1fr 1fr'
  },
  mediaQuery: '@media (max-width: 768px)'
};

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
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = (target.tagName === 'BUTTON' ? target : target.closest('button')) as HTMLButtonElement | null;
        if (!button) return;
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
  const SimpleSelect = ({ value, onChange, options, placeholder = '— Select —' }: { value?: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) => (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: 'white',
        minHeight: '44px'
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  
  // Get full name for display
  const fullName = `${safeData.firstName || ''} ${safeData.middleName || ''} ${safeData.lastName || ''}`.trim();

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  
  // Check if spouse field should be shown (married, widowed, divorced - not single)
  const shouldShowSpouseField = ['Married', 'Divorced', 'Widowed'].includes(safeData.maritalStatus || '');
  return (
    <div style={styles.container}>
      {!isEditing && (
        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
          <button
            onClick={() => setIsEditing(true)}
            style={{ ...styles.button, ...styles.buttonOutline }}
          >
            Edit
          </button>
        </div>
      )}

      {/* Profile Photo with Name and Professional Headline Box */}
      <div style={styles.profileBox}>
        <div style={styles.profileHeader}>
          <ProfilePictureUpload
            currentPicture={safeData.profilePicture}
            onPictureChange={(url) => s('profilePicture', url)}
            isEditing={isEditing}
          />
          <div>
            {isEditing ? (
              <>
                <div style={{ ...styles.formRow, ...styles.formRow3 }}>
                  {fg('First Name *', inp(safeData.firstName, v => s('firstName', v), 'First'))}
                  {fg('Middle Name', inp(safeData.middleName, v => s('middleName', v)))}
                  {fg('Last Name *', inp(safeData.lastName, v => s('lastName', v), 'Last'))}
                </div>
                {fg('Professional Headline', inp(safeData.professionalHeadline, v => s('professionalHeadline', v), 'e.g., Assistant Professor of Computer Science'))}
              </>
            ) : (
              <>
                <h2 style={styles.profileName}>{fullName || 'Your Name'}</h2>
                <p style={styles.profileHeadline}>{safeData.professionalHeadline || 'Professional Headline'}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={styles.infoGrid}>
        {/* Biography Box */}
        <div style={styles.infoBox}>
          <h3 style={styles.title}>Biography</h3>
          <hr style={styles.titleLine} />
          {isEditing ? (
            fg('', ta(safeData.biography, v => s('biography', v), 'Tell us about yourself...'))
          ) : (
            <p style={styles.content}>{safeData.biography || 'No biography added yet.'}</p>
          )}
        </div>

        {/* Subjects & Interests Box */}
        <div style={styles.infoBox}>
          <h3 style={styles.title}>Subjects & Interests</h3>
          <hr style={styles.titleLine} />
          <div style={styles.subjectsInterestsSection}>
            <h4 style={styles.subjectsInterestsHeading}>SUBJECTS</h4>
            {isEditing ? (
              fg('', ta(safeData.subjects, v => s('subjects', v), 'List your subjects of expertise...'))
            ) : (
              <p style={styles.content}>{safeData.subjects || 'No subjects added yet.'}</p>
            )}
          </div>
          <div style={styles.subjectsInterestsSection}>
            <h4 style={styles.subjectsInterestsHeading}>INTERESTS</h4>
            {isEditing ? (
              fg('', ta(safeData.interests, v => s('interests', v), 'List your academic and research interests...'))
            ) : (
              <p style={styles.content}>{safeData.interests || 'No interests added yet.'}</p>
            )}
          </div>
        </div>
      </div>

      <div style={styles.infoGrid}>
        {/* Personal Information Box */}
        <div style={styles.personalInfoBox}>
          <h3 style={styles.title}>Personal Information</h3>
          <hr style={styles.titleLine} />
          {isEditing ? (
            <>
              {fg('Full Name', inp(fullName, v => {
                const names = v.split(' ');
                s('firstName', names[0] || '');
                s('middleName', names[1] || '');
                s('lastName', names[2] || '');
              }, 'Full Name'))}
              {fg('Date of Birth', <input
                type="date"
                value={safeData.dateOfBirth}
                onChange={(e) => {
                  const v = e.target.value;
                  s('dateOfBirth', v);
                  // Auto-calculate age when date of birth changes
                  if (v) {
                    s('age', calculateAge(v));
                  } else {
                    s('age', '');
                  }
                }}
                style={{
                  ...styles.input,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />)}
              {fg('Gender', <SimpleSelect value={safeData.gender} onChange={v => s('gender', v)} options={['Male', 'Female', 'Transgender', 'Other']} />)}
              {fg('Blood Group', <SimpleSelect value={safeData.bloodGroup} onChange={v => s('bloodGroup', v)} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />)}
              {fg('Country', inp(safeData.country, v => s('country', v), 'Enter country'))}
              {fg('Nationality', <SimpleSelect value={safeData.nationality} onChange={v => s('nationality', v)} options={['Indian', 'NRI', 'Foreign']} />)}
            </>
          ) : (
            <>
              <div style={styles.previewItem}>
                <span style={styles.previewLabel}>Full Name:</span> {fullName || 'Not specified'}
              </div>
              <div style={styles.previewItem}>
                <span style={styles.previewLabel}>Date of Birth:</span> {safeData.dateOfBirth ? new Date(safeData.dateOfBirth).toISOString().split('T')[0] : 'Not specified'}
              </div>
              <div style={styles.previewItem}>
                <span style={styles.previewLabel}>Age:</span> {safeData.age || calculateAge(safeData.dateOfBirth) || 'Not specified'}
              </div>
              <div style={styles.previewItem}>
                <span style={styles.previewLabel}>Gender:</span> {safeData.gender || 'Not specified'}
              </div>
              <div style={styles.previewItem}>
                <span style={styles.previewLabel}>Gender:</span> {safeData.gender || 'Not specified'}
              </div>
              <div style={styles.previewItem}>
                <span style={styles.previewLabel}>Blood Group:</span> {safeData.bloodGroup || 'Not specified'}
              </div>
              <div style={styles.previewItem}>
                <span style={styles.previewLabel}>Country:</span> {safeData.country || 'Not specified'}
              </div>
              <div style={styles.previewItem}>
                <span style={styles.previewLabel}>Nationality:</span> {safeData.nationality || 'Not specified'}
              </div>
            </>
          )}
        </div>

        {/* Other Details Box */}
        <div style={styles.infoBox}>
          <h3 style={styles.title}>Other Details</h3>
          <hr style={styles.titleLine} />
          <div style={styles.scrollableContent}>
            <div style={styles.formSection}>
              <h4 style={styles.formSectionHeading}>Additional Personal Information</h4>
                            {isEditing ? (
                fg('Category', <SimpleSelect value={safeData.category} onChange={v => s('category', v)} options={['General', 'OBC', 'SC', 'ST', 'EWS', 'OEC', 'Other']} />)
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Category:</span> {safeData.category || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Sub-category', inp(safeData.subCategory, v => s('subCategory', v), 'Enter sub-category (if applicable)'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Sub-category:</span> {safeData.subCategory || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Differently Abled', <SimpleSelect value={safeData.differentlyAbled} onChange={v => s('differentlyAbled', v)} options={['No', 'Yes']} />)
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Differently Abled:</span> {safeData.differentlyAbled || 'Not specified'}
                </div>
              )}
              {safeData.differentlyAbled === 'Yes' && (
                isEditing ? (
                  fg('Type of Disability', inp(safeData.typeOfDisability, v => s('typeOfDisability', v), 'Specify type of disability'))
                ) : (
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>Type of Disability:</span> {safeData.typeOfDisability || 'Not specified'}
                  </div>
                )
              )}
              {isEditing ? (
                fg('Spouse Name & Occupation', inp(safeData.spouseNameOccupation, v => s('spouseNameOccupation', v), 'Enter spouse name and occupation'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Spouse Name & Occupation:</span> {safeData.spouseNameOccupation || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Emergency Contact Name & Number', inp(safeData.emergencyContact, v => s('emergencyContact', v), 'Name: +91 XXXXX XXXXX'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Emergency Contact:</span> {safeData.emergencyContact || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Place of Birth', inp(safeData.placeOfBirth, v => s('placeOfBirth', v)))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Place of Birth:</span> {safeData.placeOfBirth || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Marital Status', <SimpleSelect value={safeData.maritalStatus} onChange={v => s('maritalStatus', v)} options={['Single', 'Married', 'Divorced', 'Widowed']} />)
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Marital Status:</span> {safeData.maritalStatus || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Religion', <SimpleSelect value={safeData.religion} onChange={v => s('religion', v)} options={['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other']} />)
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Religion:</span> {safeData.religion || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Community', inp(safeData.community, v => s('community', v)))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Community:</span> {safeData.community || 'Not specified'}
                </div>
              )}
            </div>

            <div style={styles.formSection}>
              <h4 style={styles.formSectionHeading}>Family Information</h4>
              {isEditing ? (
                fg("Father's Name", inp(safeData.fatherName, v => s('fatherName', v)))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Father's Name:</span> {safeData.fatherName || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg("Mother's Name", inp(safeData.motherName, v => s('motherName', v)))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Mother's Name:</span> {safeData.motherName || 'Not specified'}
                </div>
              )}
              {shouldShowSpouseField && (
                isEditing ? (
                  fg("Spouse Name", inp(safeData.spouseName, v => s('spouseName', v)))
                ) : (
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>Spouse Name:</span> {safeData.spouseName || 'Not specified'}
                  </div>
                )
              )}
            </div>

            <div style={styles.formSection}>
              <h4 style={styles.formSectionHeading}>Contact Information</h4>
              {isEditing ? (
                fg('Personal Mobile Number', inp(safeData.personalMobileNumber, v => s('personalMobileNumber', v), '+91 XXXXX XXXXX'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Personal Mobile Number:</span> {safeData.personalMobileNumber || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Alternate Mobile Number', inp(safeData.alternateMobileNumber, v => s('alternateMobileNumber', v), '+91 XXXXX XXXXX (Optional)'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Alternate Mobile Number:</span> {safeData.alternateMobileNumber || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Personal Email ID', inp(safeData.personalEmailId, v => s('personalEmailId', v), 'personal@example.com'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Personal Email ID:</span> {safeData.personalEmailId || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Official Email ID', inp(safeData.officialEmailId, v => s('officialEmailId', v), 'official@institution.edu'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Official Email ID:</span> {safeData.officialEmailId || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Emergency Contact Name', inp(safeData.emergencyContactName, v => s('emergencyContactName', v), 'Enter emergency contact name'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Emergency Contact Name:</span> {safeData.emergencyContactName || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Emergency Contact Number', inp(safeData.emergencyContactNumber, v => s('emergencyContactNumber', v), '+91 XXXXX XXXXX'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Emergency Contact Number:</span> {safeData.emergencyContactNumber || 'Not specified'}
                </div>
              )}
            </div>

            <div style={styles.formSection}>
              <h4 style={styles.formSectionHeading}>Communication Address</h4>
              {isEditing ? (
                fg('Street/Locality/Colony', inp(safeData.communicationStreet, v => s('communicationStreet', v), 'Enter street/locality/colony'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Street/Locality/Colony:</span> {safeData.communicationStreet || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('City', inp(safeData.communicationCity, v => s('communicationCity', v), 'Enter city'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>City:</span> {safeData.communicationCity || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('State', inp(safeData.communicationState, v => s('communicationState', v), 'Enter state'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>State:</span> {safeData.communicationState || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Pin Code', inp(safeData.communicationPinCode, v => s('communicationPinCode', v), 'Enter pin code'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Pin Code:</span> {safeData.communicationPinCode || 'Not specified'}
                </div>
              )}
            </div>

            <div style={styles.formSection}>
              <h4 style={styles.formSectionHeading}>Permanent Address</h4>
              {isEditing ? (
                fg('Street/Locality/Colony', inp(safeData.permanentStreet, v => s('permanentStreet', v), 'Enter street/locality/colony'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Street/Locality/Colony:</span> {safeData.permanentStreet || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('City', inp(safeData.permanentCity, v => s('permanentCity', v), 'Enter city'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>City:</span> {safeData.permanentCity || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('State', inp(safeData.permanentState, v => s('permanentState', v), 'Enter state'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>State:</span> {safeData.permanentState || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Pin Code', inp(safeData.permanentPinCode, v => s('permanentPinCode', v), 'Enter pin code'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Pin Code:</span> {safeData.permanentPinCode || 'Not specified'}
                </div>
              )}
            </div>

            <div style={styles.lastFormSection}>
              <h4 style={styles.formSectionHeading}>Identity Documents</h4>
              {isEditing ? (
                fg('Aadhaar Number', inp(safeData.aadhaarNumber, v => s('aadhaarNumber', v), 'XXXX XXXX XXXX'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Aadhaar Number:</span> {safeData.aadhaarNumber || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('Passport Number', inp(safeData.passportNumber, v => s('passportNumber', v), 'Enter passport number (if any)'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>Passport Number:</span> {safeData.passportNumber || 'Not specified'}
                </div>
              )}
              {isEditing ? (
                fg('PAN Number', inp(safeData.panNumber, v => s('panNumber', v), 'AAAAA0000A'))
              ) : (
                <div style={styles.previewItem}>
                  <span style={styles.previewLabel}>PAN Number:</span> {safeData.panNumber || 'Not specified'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
