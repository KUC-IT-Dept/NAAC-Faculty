import api from '../lib/api';

// Shared dropdown options for Admin and Faculty panels
const DROPDOWN_STORAGE_KEY = 'dynamicDropdownOptions';

const loadStoredDropdownOptions = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DROPDOWN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const storedOptions = loadStoredDropdownOptions();

const hydrate = (key, fallback) => Array.isArray(storedOptions[key]) ? storedOptions[key] : fallback;

const dropdownUpdateEvent = new Event('dropdownOptionsUpdated');

export function persistDropdownOptions(key, value) {
  if (typeof window === 'undefined') return;
  try {
    const stored = loadStoredDropdownOptions();
    stored[key] = value;
    window.localStorage.setItem(DROPDOWN_STORAGE_KEY, JSON.stringify(stored));
    window.dispatchEvent(dropdownUpdateEvent);
  } catch {
    // ignore storage failures
  }
}

const applyDropdownData = (data) => {
  if (data.designation_post && Array.isArray(data.designation_post)) {
    designationPostOptions.splice(0, designationPostOptions.length, ...data.designation_post);
  }
  if (data.department && Array.isArray(data.department)) {
    departmentOptions.splice(0, departmentOptions.length, ...data.department);
  }
  if (data.nature_of_appointment && Array.isArray(data.nature_of_appointment)) {
    natureOfAppointmentOptions.splice(0, natureOfAppointmentOptions.length, ...data.nature_of_appointment);
  }
  if (data.reason_for_leaving && Array.isArray(data.reason_for_leaving)) {
    reasonForLeavingOptions.splice(0, reasonForLeavingOptions.length, ...data.reason_for_leaving);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(dropdownUpdateEvent);
  }
};

export async function loadDropdownOptionsFromServer() {
  if (typeof window === 'undefined') return;
  try {
    const response = await api.get('/profile/dropdowns');
    if (response?.data) {
      applyDropdownData(response.data);
    }
  } catch {
    // ignore API failures, keep local defaults
  }
}

const SERVER_KEY_MAP = {
  designationPostOptions: 'designation_post',
  departmentOptions: 'department',
  natureOfAppointmentOptions: 'nature_of_appointment',
  reasonForLeavingOptions: 'reason_for_leaving'
};

export async function saveDropdownOptionsToServer(key, value) {
  if (typeof window === 'undefined') return;
  const serverKey = SERVER_KEY_MAP[key];
  if (!serverKey) return;
  try {
    await api.patch(`/admin/dropdowns/${serverKey}`, { options: value });
  } catch {
    // ignore API failures during update
  }
}

// Personal Information
export const genderOptions = hydrate('genderOptions', ['Male', 'Female', 'Transgender', 'Other']);
export const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const nationalityOptions = ['Indian', 'Other'];
export const religionOptions = ['Hindu', 'Muslim', 'Christian', 'Buddhist', 'Sikh', 'Jain', 'Other'];
export const categoryOptions = ['General', 'OBC', 'SC', 'ST', 'EWS'];
export const subCategoryOptions = ['None', 'Ex-Serviceman', 'Sports'];
export const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
export const disabilityStatusOptions = ['Yes', 'No'];
export const disabilityTypeOptions = ['Visual', 'Hearing', 'Locomotor', 'Other'];
export const stateOptions = ['Kerala', 'Tamil Nadu', 'Karnataka', 'Maharashtra'];
export const countryOptions = ['India', 'USA', 'UK', 'Australia'];

// Qualifications
export const degreeLevelOptions = ['UG', 'PG', 'Ph.D', 'Diploma', 'Certificate'];
export const degreeNameOptions = ['B.A.', 'B.Sc.', 'B.Tech', 'M.A.', 'M.Sc.', 'M.Tech', 'Ph.D'];
export const specializationOptions = ['Computer Science', 'Physics', 'Mathematics', 'English'];
export const divisionOptions = ['First Class with Distinction', 'First Class', 'Second Class', 'Pass'];
export const studyModeOptions = ['Regular', 'Distance', 'Online', 'Part Time'];
export const gradeTypeOptions = ['CGPA', 'Percentage', 'Grade'];

// Eligibility Tests
export const examNameOptions = ['NET', 'JRF', 'SET', 'SLET', 'GATE', 'UGC-NET', 'CSIR-NET'];
export const subjectPaperOptions = ['Computer Science', 'Computer Science & Applications', 'Physics', 'Chemistry', 'Mathematics', 'Commerce', 'English'];
export const stateForSetOptions = ['Kerala', 'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Gujarat'];
export const validityStatusOptions = ['Lifetime', 'Valid', 'Expired', 'Limited Period'];
export const fellowshipAgencyOptions = ['UGC', 'CSIR', 'University', 'NBHM', 'DAE'];

// Employment Details
export const designationOptions = hydrate('designationOptions', ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Dean']);
export const departmentOptions = hydrate('departmentOptions', ['Computer Science', 'Physics', 'Mathematics', 'Commerce', 'English']);
export const institutionTypeOptions = hydrate('institutionTypeOptions', ['State', 'Central', 'Private', 'Deemed']);
export const affiliatedUniversityOptions = hydrate('affiliatedUniversityOptions', ['University of Delhi', 'Anna University', 'Mumbai University']);
export const natureOfAppointmentOptions = hydrate('natureOfAppointmentOptions', ['Regular', 'Temporary', 'Guest', 'Contract']);
export const approvalStatusOptions = hydrate('approvalStatusOptions', ['Approved', 'Pending', 'Rejected']);
export const payScaleOptions = hydrate('payScaleOptions', ['AGP 6000', 'AGP 7000', 'AGP 8000', 'Level 10', 'Level 11']);

// Work Experience
export const designationPostOptions = hydrate('designationPostOptions', ['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer', 'HOD']);
export const natureOfWorkOptions = hydrate('natureOfWorkOptions', ['Teaching', 'Research', 'Administration', 'Industry Experience', 'Consultancy']);
export const reasonForLeavingOptions = hydrate('reasonForLeavingOptions', ['Career Growth', 'Higher Studies', 'Relocation', 'Contract Completed']);
export const employmentTypeOptions = hydrate('employmentTypeOptions', ['Full Time', 'Part Time', 'Contract', 'Temporary', 'Visiting Faculty']);
export const institutionTypeWorkOptions = hydrate('institutionTypeWorkOptions', ['Government', 'Private', 'Autonomous', 'Deemed University', 'Research Institute']);
export const experienceCategoryOptions = hydrate('experienceCategoryOptions', ['Academic', 'Industry', 'Research', 'Administrative']);

// Research & Publications
export const publicationTypeOptions = ['Journal', 'Conference Paper', 'Book Chapter', 'Patent', 'Thesis', 'Article'];
export const publicationLevelOptions = ['International', 'National', 'State', 'Institutional'];
export const authorRoleOptions = ['First Author', 'Co-Author', 'Corresponding Author', 'Editor'];
export const indexedInOptions = ['Scopus', 'WoS', 'UGC Care', 'SCI', 'Google Scholar'];
export const peerReviewedStatusOptions = ['Yes', 'No'];
export const journalCategoryOptions = ['Q1', 'Q2', 'Q3', 'Q4', 'NA'];

// Awards & Honours
export const awardCategoryOptions = ['Research Award', 'Teaching Award', 'Innovation Award', 'Fellowship', 'Excellence Award', 'Young Scientist Award'];
export const awardLevelOptions = ['International', 'National', 'State', 'University', 'Institutional'];
export const awardingAgencyTypeOptions = ['Government', 'University', 'Research Organization', 'Private Institution', 'Professional Body'];
export const honourTypeOptions = ['Medal', 'Certificate', 'Fellowship', 'Trophy', 'Recognition'];
export const recognitionStatusOptions = ['Active', 'Archived', 'Featured'];

// Research Projects
export const fundingAgencyOptions = ['DST-SERB', 'UGC', 'AICTE', 'DRDO', 'ISRO', 'ICMR', 'DBT'];
export const projectStatusOptions = ['Ongoing', 'Completed', 'Submitted', 'Approved', 'Pending'];
export const roleInProjectOptions = ['Principal Investigator', 'Co-Investigator', 'Research Associate', 'Coordinator'];
export const projectCategoryOptions = ['Research', 'Development', 'Consultancy', 'Innovation', 'Sponsored Project'];
export const fundingTypeOptions = ['Government', 'Private', 'International', 'Institutional'];

// Research Supervision
export const researchDegreeOptions = ['Ph.D', 'M.Phil', 'PG Dissertation', 'Post Doctorate'];
export const scholarGenderOptions = ['Male', 'Female', 'Transgender', 'Other'];
export const researchStatusOptions = ['Ongoing', 'Completed', 'Submitted', 'Awarded'];
export const guidanceTypeOptions = ['Supervisor', 'Co-Supervisor', 'Mentor', 'Advisor'];
export const patentStatusOptions = ['Filed', 'Published', 'Granted', 'Pending'];
export const patentTypeOptions = ['Utility Patent', 'Design Patent', 'Copyright', 'Trademark'];
export const supervisionCategoryOptions = ['Academic', 'Research', 'Industrial Research'];

// Academic Responsibilities
export const committeeTypeOptions = ['IQAC', 'BOS', 'Anti-Ragging', 'Examination Cell', 'NAAC Committee', 'Discipline Committee', 'Placement Cell'];
export const responsibilityRoleOptions = ['Chairman', 'Coordinator', 'Convener', 'Member', 'Head', 'Faculty Incharge'];
export const courseLevelOptions = ['UG', 'PG', 'Ph.D', 'Diploma', 'Certificate'];
export const semesterTypeOptions = ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII'];
export const academicSessionTypeOptions = ['Odd Semester', 'Even Semester', 'Annual', 'Trimester'];
export const teachingCategoryOptions = ['Core Subject', 'Elective', 'Laboratory', 'Project Guidance', 'Seminar'];
export const responsibilityStatusOptions = ['Active', 'Completed', 'Ongoing', 'Inactive'];

// Memberships
export const professionalBodyOptions = ['IEEE', 'CSI', 'ACM', 'ISTE', 'IETE', 'IEI', 'IAENG', 'ACM India'];
export const membershipTypeOptions = ['Lifetime', 'Annual', 'Student', 'Professional', 'Institutional'];
export const membershipCategoryOptions = ['National', 'International', 'State Level', 'Regional'];
export const membershipStatusOptions = ['Active', 'Expired', 'Pending', 'Suspended'];
export const membershipLevelOptions = ['Member', 'Senior Member', 'Fellow', 'Associate Member', 'Student Member'];
export const organizationTypeOptions = ['Technical Society', 'Research Organization', 'Academic Association', 'Professional Council', 'Scientific Community'];

// FDP & Workshops
export const programmeTypeOptions = ['FDP', 'Workshop', 'Seminar', 'Conference', 'Short Term Course', 'Refresher Course', 'Orientation Programme', 'Training Programme'];
export const sponsoringAgencyOptions = ['AICTE', 'UGC', 'TEQIP', 'MHRD', 'DST', 'Self-Funded', 'University Funded', 'Institutional'];
export const participationOptions = ['Attended', 'Organized', 'Resource Person', 'Presented', 'Chaired Session'];

// Online Courses
export const coursePlatformOptions = ['Coursera', 'NPTEL', 'SWAYAM', 'Udemy', 'edX', 'FutureLearn', 'IIT Online', 'Google'];
export const courseTypeOptions = ['Certification', 'Diploma', 'Skill Development', 'Faculty Development', 'Professional Training'];
export const completionStatusOptions = ['Completed', 'Ongoing', 'In Progress', 'Certified'];
export const certificationTypeOptions = ['Free Certificate', 'Paid Certificate', 'Verified Certificate', 'University Certificate'];
export const learningModeOptions = ['Online', 'Hybrid', 'Self Paced', 'Instructor Led'];

// International Experience
export const countryVisitOptions = ['Singapore', 'USA', 'UK', 'Germany', 'Canada', 'Australia', 'Japan', 'France'];
export const purposeOfVisitOptions = ['Conference', 'Research Collaboration', 'Faculty Exchange', 'Workshop', 'Seminar', 'Training Program'];
export const fundingSourceOptions = ['DST Travel Grant', 'UGC', 'AICTE', 'Self Funded', 'International Fellowship', 'University Sponsorship'];
export const visitCategoryOptions = ['Academic', 'Research', 'Industry', 'Government', 'International Event'];
export const collaborationTypeOptions = ['MoU Activity', 'Joint Research', 'Publication', 'Exchange Program', 'Technical Collaboration'];
export const visitStatusOptions = ['Completed', 'Ongoing', 'Planned', 'Approved'];

// Documents
export const documentTypeOptions = ['Aadhar', 'PAN', 'Passport'];