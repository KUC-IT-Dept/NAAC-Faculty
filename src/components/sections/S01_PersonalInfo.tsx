import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel, ta, dateInp, Sub, Note } from './sectionUtils';

export default function PersonalInfo({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div>
      <Sub>Name</Sub>
      <div className="form-row form-row-3">
        {fg('First Name *', inp(data.firstName, v => s('firstName', v), 'First'))}
        {fg('Middle Name', inp(data.middleName, v => s('middleName', v)))}
        {fg('Last Name *', inp(data.lastName, v => s('lastName', v), 'Last'))}
      </div>

      <Sub>Basic Details</Sub>
      <div className="form-row form-row-4">
        {fg('Date of Birth', dateInp(data.dateOfBirth, v => s('dateOfBirth', v)))}
        {fg('Gender', sel(data.gender, v => s('gender', v), ['Male', 'Female', 'Transgender', 'Other']))}
        {fg('Blood Group', sel(data.bloodGroup, v => s('bloodGroup', v), ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']))}
        {fg('Nationality', inp(data.nationality, v => s('nationality', v), 'Indian'))}
      </div>
      <div className="form-row form-row-3">
        {fg('Religion', inp(data.religion, v => s('religion', v)))}
        {fg('Category', sel(data.category, v => s('category', v), ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other']))}
        {fg('Sub-Category', inp(data.subCategory, v => s('subCategory', v)))}
      </div>
      <div className="form-row form-row-3">
        {fg('Marital Status', sel(data.maritalStatus, v => s('maritalStatus', v), ['Single', 'Married', 'Divorced', 'Widowed']))}
        {fg('Spouse Name', inp(data.spouseName, v => s('spouseName', v)))}
        {fg('Spouse Occupation', inp(data.spouseOccupation, v => s('spouseOccupation', v)))}
      </div>
      <div className="form-row form-row-2">
        {fg('Differently Abled', sel(data.differentlyAbled, v => s('differentlyAbled', v), ['No', 'Yes']))}
        {fg('Disability Type (if Yes)', inp(data.disabilityType, v => s('disabilityType', v)))}
      </div>

      <Sub>Permanent Address</Sub>
      {fg('Street / Locality / Colony', ta(data.permanentAddress, v => s('permanentAddress', v), '12, Example Street'))}
      <div className="form-row form-row-3">
        {fg('City', inp(data.permanentCity, v => s('permanentCity', v)))}
        {fg('State', inp(data.permanentState, v => s('permanentState', v)))}
        {fg('PIN Code', inp(data.permanentPin, v => s('permanentPin', v)))}
      </div>

      <Sub>Current / Correspondence Address</Sub>
      {fg('Street / Locality / Colony', ta(data.currentAddress, v => s('currentAddress', v), 'Same as permanent or different'))}
      <div className="form-row form-row-3">
        {fg('City', inp(data.currentCity, v => s('currentCity', v)))}
        {fg('State', inp(data.currentState, v => s('currentState', v)))}
        {fg('PIN Code', inp(data.currentPin, v => s('currentPin', v)))}
      </div>

      <Sub>Contact Details</Sub>
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

      <Sub>Identity Documents</Sub>
      <div className="form-row form-row-3">
        {fg('Aadhaar Number', inp(data.aadhaarNumber, v => s('aadhaarNumber', v), 'XXXX XXXX XXXX'))}
        {fg('PAN Number', inp(data.panNumber, v => s('panNumber', v), 'AAAAA0000A'))}
        {fg('Passport Number', inp(data.passportNumber, v => s('passportNumber', v)))}
      </div>

      <Sub>Profile Photo & Online Profiles</Sub>
      {fg('Profile Photo URL', <>
        <input className="form-input" value={data.photoUrl || ''} onChange={e => s('photoUrl', e.target.value)} placeholder="https://..." />
        <p className="form-hint">Paste a public URL to a hosted photo. (File upload coming soon)</p>
      </>)}
      <div className="form-row form-row-2">
        {fg('ORCID iD', inp(data.orcidId, v => s('orcidId', v), '0000-0000-0000-0000'))}
        {fg('Google Scholar ID', inp(data.googleScholarId, v => s('googleScholarId', v)))}
        {fg('Scopus Author ID', inp(data.scopusId, v => s('scopusId', v)))}
        {fg('LinkedIn Profile URL', inp(data.linkedIn, v => s('linkedIn', v), 'https://linkedin.com/in/...'))}
      </div>
      {fg('Personal Website / Portfolio', inp(data.website, v => s('website', v), 'https://...'))}
    </div>
  );
}
