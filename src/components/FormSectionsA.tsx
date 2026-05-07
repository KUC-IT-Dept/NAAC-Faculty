import { Plus, Trash2 } from 'lucide-react';

const fg = (label: string, children: React.ReactNode) => (
  <div className="form-group"><label className="form-label">{label}</label>{children}</div>
);
const inp = (val: string, onChange: (v: string) => void, placeholder = '') => (
  <input className="form-input" value={val || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
);
const sel = (val: string, onChange: (v: string) => void, opts: string[]) => (
  <select className="form-select" value={val || ''} onChange={e => onChange(e.target.value)}>
    <option value="">Select</option>
    {opts.map(o => <option key={o}>{o}</option>)}
  </select>
);
const ta = (val: string, onChange: (v: string) => void, placeholder = '', rows = 2) => (
  <textarea className="form-textarea" rows={rows} value={val || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
);

// ── Section 1: Personal Info ───────────────────────────────────
export function PersonalInfoForm({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div>
      <p className="subsection-title">Name & Basic Details</p>
      <div className="form-row form-row-3">
        {fg('First Name *', inp(data.firstName, v => s('firstName', v), 'First'))}
        {fg('Middle Name', inp(data.middleName, v => s('middleName', v)))}
        {fg('Last Name *', inp(data.lastName, v => s('lastName', v), 'Last'))}
      </div>
      <div className="form-row form-row-4">
        {fg('Date of Birth', <input className="form-input" type="date" value={data.dateOfBirth||''} onChange={e=>s('dateOfBirth',e.target.value)} />)}
        {fg('Gender', sel(data.gender, v=>s('gender',v), ['Male','Female','Transgender','Other']))}
        {fg('Blood Group', sel(data.bloodGroup, v=>s('bloodGroup',v), ['A+','A-','B+','B-','AB+','AB-','O+','O-']))}
        {fg('Nationality', inp(data.nationality, v=>s('nationality',v), 'Indian'))}
      </div>
      <div className="form-row form-row-3">
        {fg('Religion', inp(data.religion, v=>s('religion',v)))}
        {fg('Category', sel(data.category, v=>s('category',v), ['General','OBC','SC','ST','EWS','Other']))}
        {fg('Sub-Category', inp(data.subCategory, v=>s('subCategory',v)))}
      </div>
      <div className="form-row form-row-3">
        {fg('Marital Status', sel(data.maritalStatus, v=>s('maritalStatus',v), ['Single','Married','Divorced','Widowed']))}
        {fg('Spouse Name', inp(data.spouseName, v=>s('spouseName',v)))}
        {fg('Spouse Occupation', inp(data.spouseOccupation, v=>s('spouseOccupation',v)))}
      </div>
      <div className="form-row form-row-2">
        {fg('Differently Abled', sel(data.differentlyAbled, v=>s('differentlyAbled',v), ['No','Yes']))}
        {fg('Disability Type (if yes)', inp(data.disabilityType, v=>s('disabilityType',v)))}
      </div>

      <p className="subsection-title">Permanent Address</p>
      <div className="form-group">{fg('Address', ta(data.permanentAddress, v=>s('permanentAddress',v), 'Street / Locality'))}</div>
      <div className="form-row form-row-4">
        {fg('City', inp(data.permanentCity, v=>s('permanentCity',v)))}
        {fg('State', inp(data.permanentState, v=>s('permanentState',v)))}
        {fg('PIN Code', inp(data.permanentPin, v=>s('permanentPin',v)))}
      </div>

      <p className="subsection-title">Current Address</p>
      <div className="form-group">{fg('Address', ta(data.currentAddress, v=>s('currentAddress',v), 'Same as permanent or different'))}</div>
      <div className="form-row form-row-3">
        {fg('City', inp(data.currentCity, v=>s('currentCity',v)))}
        {fg('State', inp(data.currentState, v=>s('currentState',v)))}
        {fg('PIN Code', inp(data.currentPin, v=>s('currentPin',v)))}
      </div>

      <p className="subsection-title">Contact Details</p>
      <div className="form-row form-row-2">
        {fg('Mobile (Personal) *', inp(data.mobilePersonal, v=>s('mobilePersonal',v), '+91 XXXXX XXXXX'))}
        {fg('Alternate Phone', inp(data.alternatePhone, v=>s('alternatePhone',v)))}
      </div>
      <div className="form-row form-row-2">
        {fg('Official Email', inp(data.officialEmail, v=>s('officialEmail',v), 'you@institution.edu.in'))}
        {fg('Personal Email', inp(data.personalEmail, v=>s('personalEmail',v)))}
      </div>
      <div className="form-row form-row-2">
        {fg('Emergency Contact Name', inp(data.emergencyContactName, v=>s('emergencyContactName',v)))}
        {fg('Emergency Contact Mobile', inp(data.emergencyContactMobile, v=>s('emergencyContactMobile',v)))}
      </div>

      <p className="subsection-title">Identity Documents</p>
      <div className="form-row form-row-3">
        {fg('Aadhaar Number', inp(data.aadhaarNumber, v=>s('aadhaarNumber',v), 'XXXX XXXX XXXX'))}
        {fg('PAN Number', inp(data.panNumber, v=>s('panNumber',v), 'AAAAA0000A'))}
        {fg('Passport Number', inp(data.passportNumber, v=>s('passportNumber',v)))}
      </div>

      <p className="subsection-title">Photo & Online Presence</p>
      <div className="form-group">{fg('Profile Photo URL', <><input className="form-input" value={data.photoUrl||''} onChange={e=>s('photoUrl',e.target.value)} placeholder="https://..." /><p className="form-hint">Paste a direct link to a hosted photo.</p></>)}</div>
      <div className="form-row form-row-2">
        {fg('ORCID iD', inp(data.orcidId, v=>s('orcidId',v), '0000-0000-0000-0000'))}
        {fg('Google Scholar ID', inp(data.googleScholarId, v=>s('googleScholarId',v)))}
        {fg('Scopus Author ID', inp(data.scopusId, v=>s('scopusId',v)))}
        {fg('LinkedIn URL', inp(data.linkedIn, v=>s('linkedIn',v), 'https://linkedin.com/in/...'))}
      </div>
      {fg('Personal Website', inp(data.website, v=>s('website',v), 'https://...'))}
    </div>
  );
}

// ── Section 2: Qualifications ──────────────────────────────────
const EQ = { degreeLevel:'', degreeName:'', specialization:'', institution:'', university:'', boardUniversity:'', yearOfPassing:'', percentageCGPA:'', division:'', mode:'' };
export function QualificationsForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((q, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          <div className="form-row form-row-3">
            {fg('Degree Level', sel(q.degreeLevel, v=>u(i,'degreeLevel',v), ['10th','12th','UG','PG','M.Phil','Ph.D','Post-Doc','Other']))}
            {fg('Degree / Certificate Name', inp(q.degreeName, v=>u(i,'degreeName',v), 'B.Sc / M.Tech / Ph.D'))}
            {fg('Specialization / Subject', inp(q.specialization, v=>u(i,'specialization',v)))}
          </div>
          <div className="form-row form-row-2">
            {fg('College / Institution', inp(q.institution, v=>u(i,'institution',v)))}
            {fg('University / Board', inp(q.university, v=>u(i,'university',v)))}
          </div>
          <div className="form-row form-row-4">
            {fg('Year of Passing', inp(q.yearOfPassing, v=>u(i,'yearOfPassing',v), '2015'))}
            {fg('% / CGPA', inp(q.percentageCGPA, v=>u(i,'percentageCGPA',v), '85% / 8.5'))}
            {fg('Division / Class', sel(q.division, v=>u(i,'division',v), ['First','Second','Third','Pass','Distinction']))}
            {fg('Mode', sel(q.mode, v=>u(i,'mode',v), ['Regular','Distance','Part-Time']))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...EQ}])}><Plus size={15}/>Add Qualification</button>
    </div>
  );
}

// ── Section 3: Eligibility Tests ───────────────────────────────
const ET = { examName:'', subject:'', year:'', certificateNo:'', score:'', state:'' };
export function EligibilityTestsForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((e, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          <div className="form-row form-row-3">
            {fg('Exam Name', sel(e.examName, v=>u(i,'examName',v), ['NET','SET/SLET','GATE','JRF','Other']))}
            {fg('Subject / Paper', inp(e.subject, v=>u(i,'subject',v), 'Computer Science'))}
            {fg('Year', inp(e.year, v=>u(i,'year',v), '2020'))}
          </div>
          <div className="form-row form-row-3">
            {fg('Certificate / Roll No.', inp(e.certificateNo, v=>u(i,'certificateNo',v)))}
            {fg('Score / Percentile', inp(e.score, v=>u(i,'score',v)))}
            {fg('State (for SET/SLET)', inp(e.state, v=>u(i,'state',v)))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...ET}])}><Plus size={15}/>Add Eligibility Test</button>
    </div>
  );
}

// ── Section 4: Employment Details ─────────────────────────────
export function EmploymentDetailsForm({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div>
      <div className="form-row form-row-2">
        {fg('Employee ID', inp(data.employeeId, v=>s('employeeId',v)))}
        {fg('Designation *', inp(data.designation, v=>s('designation',v), 'Associate Professor'))}
        {fg('Department *', inp(data.department, v=>s('department',v), 'Computer Science'))}
        {fg('Institution *', inp(data.institution, v=>s('institution',v)))}
      </div>
      {fg('Affiliated University', inp(data.affiliatedUniversity, v=>s('affiliatedUniversity',v)))}
      <div className="form-row form-row-2">
        {fg('Date of Appointment', <input className="form-input" type="date" value={data.dateOfAppointment||''} onChange={e=>s('dateOfAppointment',e.target.value)}/>)}
        {fg('Nature of Appointment', sel(data.natureOfAppointment, v=>s('natureOfAppointment',v), ['Regular','Ad-hoc','Contract','Guest','Visiting','Deputation']))}
      </div>
      <div className="form-row form-row-3">
        {fg('Approval of Appointment', sel(data.approvalOfAppointment, v=>s('approvalOfAppointment',v), ['Yes','No','Pending']))}
        {fg('Approval Letter No.', inp(data.approvalLetterNo, v=>s('approvalLetterNo',v)))}
        {fg('Approval Letter Date', <input className="form-input" type="date" value={data.approvalLetterDate||''} onChange={e=>s('approvalLetterDate',e.target.value)}/>)}
      </div>
      <div className="form-row form-row-3">
        {fg('Scale of Pay / Pay Band', inp(data.scaleOfPay, v=>s('scaleOfPay',v), 'AGP 8000 / Level-11'))}
        {fg('Current Basic Pay (₹)', inp(data.currentBasicPay, v=>s('currentBasicPay',v)))}
        {fg('Date of Retirement', <input className="form-input" type="date" value={data.dateOfRetirement||''} onChange={e=>s('dateOfRetirement',e.target.value)}/>)}
      </div>
      <div className="form-row form-row-2">
        {fg('Total Experience (Years)', inp(data.totalExperienceYears, v=>s('totalExperienceYears',v), '10'))}
        {fg('Total Experience (Months)', inp(data.totalExperienceMonths, v=>s('totalExperienceMonths',v), '6'))}
      </div>
    </div>
  );
}

// ── Section 5: Work Experience ────────────────────────────────
const WE = { organization:'', designation:'', from:'', to:'', nature:'', reasonForLeaving:'' };
export function WorkExperienceForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((e, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          <div className="form-row form-row-2">
            {fg('Organization / Institution', inp(e.organization, v=>u(i,'organization',v)))}
            {fg('Designation', inp(e.designation, v=>u(i,'designation',v)))}
          </div>
          <div className="form-row form-row-3">
            {fg('From', inp(e.from, v=>u(i,'from',v), 'Aug 2015'))}
            {fg('To', inp(e.to, v=>u(i,'to',v), 'Jun 2020 / Present'))}
            {fg('Nature', sel(e.nature, v=>u(i,'nature',v), ['Teaching','Research','Industry','Administrative','Other']))}
          </div>
          {fg('Reason for Leaving', inp(e.reasonForLeaving, v=>u(i,'reasonForLeaving',v)))}
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...WE}])}><Plus size={15}/>Add Work Experience</button>
    </div>
  );
}
