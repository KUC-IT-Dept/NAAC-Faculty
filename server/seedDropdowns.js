/**
 * seedDropdowns.js
 * Seeds the default dropdown options into MongoDB.
 * Safe to re-run — uses { upsert: true } so it won't overwrite
 * admin-customized values that already exist in the DB.
 *
 * Usage:
 *   node server/seedDropdowns.js           ← only inserts missing keys
 *   node server/seedDropdowns.js --force   ← overwrites ALL keys with defaults
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const DropdownConfig = require('./models/DropdownConfig');

const FORCE = process.argv.includes('--force');

// ─── All default dropdown values (mirrored from src/shared/dropdownOptions.js) ─

const defaults = {
  // Personal Information
  gender:             ['Male', 'Female', 'Transgender', 'Other'],
  blood_group:        ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  nationality:        ['Indian', 'Other'],
  religion:           ['Hindu', 'Muslim', 'Christian', 'Buddhist', 'Sikh', 'Jain', 'Other'],
  category:           ['General', 'OBC', 'SC', 'ST', 'EWS'],
  sub_category:       ['None', 'Ex-Serviceman', 'Sports'],
  marital_status:     ['Single', 'Married', 'Divorced', 'Widowed'],
  disability_status:  ['Yes', 'No'],
  disability_type:    ['Visual', 'Hearing', 'Locomotor', 'Other'],
  state:              ['Kerala', 'Tamil Nadu', 'Karnataka', 'Maharashtra'],
  country:            ['India', 'USA', 'UK', 'Australia'],

  // Qualifications
  degree_level:       ['10th', '12th', 'UG', 'PG', 'Ph.D', 'M.Phil'],
  degree_name:        ['B.A.', 'B.Sc.', 'B.Tech', 'M.A.', 'M.Sc.', 'M.Tech', 'Ph.D'],
  specialization:     ['Computer Science', 'Physics', 'Mathematics', 'English'],
  division:           ['First', 'Second', 'Third'],
  study_mode:         ['Regular', 'Distance'],
  grade_type:         ['CGPA', 'Percentage', 'Grade'],

  // Eligibility Tests
  exam_name:          ['NET', 'SET / SLET', 'GATE', 'JRF'],
  subject_paper:      ['Commerce', 'Computer Science & Applications', 'Economics', 'Education', 'English', 'Geography', 'Hindi', 'History', 'Law', 'Library & Information Science', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Psychology', 'Sanskrit', 'Social Work', 'Sociology', 'Tourism Administration & Management'],
  state_for_set:      ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'],
  validity_status:    ['Lifetime', 'Valid', 'Expired', 'Limited Period'],
  fellowship_agency:  ['UGC', 'CSIR', 'University', 'NBHM', 'DAE'],

  // Employment Details
  designation:        ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Dean'],
  department:         ['Computer Science', 'Physics', 'Mathematics', 'Commerce', 'English'],
  institution_type:   ['State', 'Central', 'Private', 'Deemed'],
  affiliated_university: ['University of Delhi', 'Anna University', 'Mumbai University'],
  nature_of_appointment: ['Regular', 'Ad-hoc', 'Contract', 'Guest', 'Visiting', 'Deputation'],
  approval_status:    ['Approved', 'Pending', 'Rejected'],
  pay_scale:          ['AGP 6000', 'AGP 7000', 'AGP 8000', 'Level 10', 'Level 11'],

  // Work Experience
  designation_post:       ['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer', 'HOD'],
  nature_of_work:         ['Teaching', 'Research', 'Administration', 'Industry Experience', 'Consultancy'],
  employment_type:        ['Full Time', 'Part Time', 'Contract', 'Temporary', 'Visiting Faculty'],
  institution_type_work:  ['Government', 'Private', 'Autonomous', 'Deemed University', 'Research Institute'],
  experience_category:    ['Academic', 'Industry', 'Research', 'Administrative'],
  reason_for_leaving:     ['Better opportunity', 'Promotion', 'Resigned', 'Retired', 'Contract Completed', 'Other'],

  // Research & Publications
  publication_type:       ['Journal', 'Conference Paper', 'Book Chapter', 'Patent', 'Thesis', 'Article'],
  publication_level:      ['International', 'National', 'State', 'Institutional'],
  author_role:            ['First Author', 'Co-Author', 'Corresponding Author', 'Editor'],
  indexed_in:             ['Scopus', 'WoS', 'UGC Care', 'SCI', 'Google Scholar'],
  peer_reviewed_status:   ['Yes', 'No'],
  journal_category:       ['Q1', 'Q2', 'Q3', 'Q4', 'NA'],

  // Awards & Honours
  award_category:         ['Research Award', 'Teaching Award', 'Innovation Award', 'Fellowship', 'Excellence Award', 'Young Scientist Award'],
  award_level:            ['International', 'National', 'State', 'University', 'Institutional'],
  awarding_agency_type:   ['Government', 'University', 'Research Organization', 'Private Institution', 'Professional Body'],
  honour_type:            ['Medal', 'Certificate', 'Fellowship', 'Trophy', 'Recognition'],
  recognition_status:     ['Active', 'Archived', 'Featured'],

  // Research Projects
  funding_agency:     ['DST-SERB', 'UGC', 'AICTE', 'DRDO', 'ISRO', 'ICMR', 'DBT'],
  project_status:     ['Ongoing', 'Completed', 'Submitted', 'Approved', 'Pending'],
  role_in_project:    ['Principal Investigator', 'Co-Investigator', 'Research Associate', 'Coordinator'],
  project_category:   ['Research', 'Development', 'Consultancy', 'Innovation', 'Sponsored Project'],
  funding_type:       ['Government', 'Private', 'International', 'Institutional'],

  // Research Supervision
  research_degree:        ['Ph.D', 'M.Phil', 'PG Dissertation', 'Post Doctorate'],
  scholar_gender:         ['Male', 'Female', 'Transgender', 'Other'],
  research_status:        ['Ongoing', 'Completed', 'Submitted', 'Awarded'],
  guidance_type:          ['Supervisor', 'Co-Supervisor', 'Mentor', 'Advisor'],
  patent_status:          ['Filed', 'Published', 'Granted', 'Pending'],
  patent_type:            ['Utility Patent', 'Design Patent', 'Copyright', 'Trademark'],
  supervision_category:   ['Academic', 'Research', 'Industrial Research'],

  // Academic Responsibilities
  committee_type:           ['IQAC', 'BOS', 'Anti-Ragging', 'Examination Cell', 'NAAC Committee', 'Discipline Committee', 'Placement Cell'],
  responsibility_role:      ['Chairman', 'Coordinator', 'Convener', 'Member', 'Head', 'Faculty Incharge'],
  course_level:             ['UG', 'PG', 'Ph.D', 'Diploma', 'Certificate'],
  semester_type:            ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII'],
  academic_session_type:    ['Odd Semester', 'Even Semester', 'Annual', 'Trimester'],
  teaching_category:        ['Core Subject', 'Elective', 'Laboratory', 'Project Guidance', 'Seminar'],
  responsibility_status:    ['Active', 'Completed', 'Ongoing', 'Inactive'],

  // Memberships
  professional_body:        ['IEEE', 'CSI', 'ACM', 'ISTE', 'IETE', 'IEI', 'IAENG', 'ACM India'],
  membership_type:          ['Lifetime', 'Annual', 'Student', 'Professional', 'Institutional'],
  membership_category:      ['National', 'International', 'State Level', 'Regional'],
  membership_status:        ['Active', 'Expired', 'Pending', 'Suspended'],
  membership_level:         ['Member', 'Senior Member', 'Fellow', 'Associate Member', 'Student Member'],
  organization_type:        ['Technical Society', 'Research Organization', 'Academic Association', 'Professional Council', 'Scientific Community'],

  // FDP & Workshops
  programme_type:       ['FDP', 'Workshop', 'Seminar', 'Conference', 'Short Term Course', 'Refresher Course', 'Orientation Programme', 'Training Programme'],
  sponsoring_agency:    ['AICTE', 'UGC', 'TEQIP', 'MHRD', 'DST', 'Self-Funded', 'University Funded', 'Institutional'],
  participation:        ['Attended', 'Organized', 'Resource Person', 'Presented', 'Chaired Session'],

  // Online Courses
  course_platform:      ['Coursera', 'NPTEL', 'SWAYAM', 'Udemy', 'edX', 'FutureLearn', 'IIT Online', 'Google'],
  course_type:          ['Certification', 'Diploma', 'Skill Development', 'Faculty Development', 'Professional Training'],
  completion_status:    ['Completed', 'Ongoing', 'In Progress', 'Certified'],
  certification_type:   ['Free Certificate', 'Paid Certificate', 'Verified Certificate', 'University Certificate'],
  learning_mode:        ['Online', 'Hybrid', 'Self Paced', 'Instructor Led'],

  // International Experience
  country_visit:        ['Singapore', 'USA', 'UK', 'Germany', 'Canada', 'Australia', 'Japan', 'France'],
  purpose_of_visit:     ['Conference', 'Research Collaboration', 'Faculty Exchange', 'Workshop', 'Seminar', 'Training Program'],
  funding_source:       ['DST Travel Grant', 'UGC', 'AICTE', 'Self Funded', 'International Fellowship', 'University Sponsorship'],
  visit_category:       ['Academic', 'Research', 'Industry', 'Government', 'International Event'],
  collaboration_type:   ['MoU Activity', 'Joint Research', 'Publication', 'Exchange Program', 'Technical Collaboration'],
  visit_status:         ['Completed', 'Ongoing', 'Planned', 'Approved'],

  // Administrative Responsibilities
  admin_charge: ['Principal', 'Campus Director', 'Registrar', 'Vice Principal', 'Convener of Women Cell', 'Admission Director', 'Senate Member', 'Syndicate Member', 'Dean', 'Other'],
  academic_admin: [
    'Chairman - PG Board of studies', 'Chairman - UG Board of studies',
    'Member - PG board of studies', 'Member - UG board of studies',
    'Chairman - Designing PG syllabi', 'Chairman - Designing UG syllabi',
    'Scheduling classes', 'Monitoring teaching quality',
    'Serving as examiner, invigilator, paper setter, evaluator under the Controller of Examinations',
    'Participating in Board of Studies meeting', 'Participating in academic councils',
    'Participating in departmental reviews', 'Other',
  ],
  quality_assurance: [
    'Director IQAC', 'Convener NAAC criteria', 'Preparing reports for accreditation NAAC',
    'NAAC department coordinator', 'Preparing reports for NIRF ranking', 'NIRF Department coordinator',
    'Coordinating student/teacher feedback and action plans', 'Other',
  ],
  research_innovation: [
    'Research Director', 'Assisting in research proposals', 'Assisting in funding applications',
    'Assisting in project accounts', 'Coordinating departmental research output',
    'Coordinating conferences', 'Other',
  ],
  examination_evaluation: [
    'Controller of Examination',
    'Assisting the Controller of Examinations in scheduling, seating, and logistics',
    'Helping with tabulation, moderation, and publication of results',
    'Serving on disciplinary boards during exams', 'Contributing questions for question bank',
    'Managing Question bank', 'Other',
  ],
  admin_support: [
    'Maintaining student records', 'Maintaining student attendance', 'Maintaining faculty workload',
    'Supporting admission processes, counseling, and documentation',
    'Enforcing institutional rules and regulations', 'Other',
  ],
  departmental_charges: [
    'Head of the Department', 'Co-ordinator Cultural activities', 'Serving as Librarian',
    'Serving on library committees', 'Serving on sports committees', 'Serving on cultural committees',
    'Serving on grievance redressal committees', 'Guiding students academically and personally',
    'Coordinating seminars, workshops', 'Other',
  ],
  special_assignments: [
    'Coordinating community service', 'Coordinating NSS', 'Coordinating NCC',
    'Coordinating industry linkages, cultural activities', 'Managing LMS, digital classrooms, and ICT initiatives',
    'PRO', 'Coordinator job recruitment cell', 'Member Job recruitment cell', 'Other',
  ],
  extra_institutional: [
    'Syndicate member', 'Board of studies', 'Visiting professor', 'Examiner',
    'Syllabus committee', 'Dean', 'Other',
  ],

  // Documents
  document_type: ['Aadhar', 'PAN', 'Passport'],
};

async function seedDropdowns() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    console.log(FORCE ? '⚠️  --force flag detected: ALL keys will be overwritten' : 'ℹ️  Safe mode: only inserting missing keys');
    console.log('');

    let inserted = 0;
    let skipped = 0;
    let updated = 0;

    for (const [key, options] of Object.entries(defaults)) {
      const existing = await DropdownConfig.findOne({ key });

      if (existing && !FORCE) {
        console.log(`  ⏭  Skipped  ${key} (already exists, use --force to overwrite)`);
        skipped++;
      } else if (existing && FORCE) {
        await DropdownConfig.findOneAndUpdate({ key }, { options });
        console.log(`  ✏️  Updated  ${key} (${options.length} options)`);
        updated++;
      } else {
        await DropdownConfig.create({ key, options });
        console.log(`  ✅ Inserted ${key} (${options.length} options)`);
        inserted++;
      }
    }

    console.log('');
    console.log(`🎉 Done! Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seedDropdowns();
