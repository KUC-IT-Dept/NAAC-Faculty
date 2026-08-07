// unified_seed.js - Auto-generated merged file
const fs = require('fs');
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { ROLES } = require("./auth/constants/roles");
const User = require("./auth/models/User.model");
const StudentProfile = require("./modules/student/models/StudentProfile");
const Faculty = require("./modules/faculty/models/Faculty");
const Department = require('./modules/faculty/models/Department');
const DropdownConfig = require('./modules/faculty/models/DropdownConfig');
const SectionConfig = require('./modules/faculty/models/SectionConfig');

const MONGO_URI = process.env.MONGO_URI;

// ==========================================
// INSTITUTIONS
// ==========================================
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(s => s.trim());
}

async function seedInstitutions() {
  try {

    const csvPath = path.resolve(__dirname, '../world-universities.csv');
    const institutionsSet = new Set();

    if (fs.existsSync(csvPath)) {
      console.log('Reading institutions from world-universities.csv...');
      const fileContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = fileContent.split('\n').filter(l => l.trim() !== '');
      for (const line of lines) {
        const parts = parseCSVLine(line);
        if (parts.length >= 2) {
          let name = parts[1];
          if (name) {
            institutionsSet.add(name);
          }
        }
      }
    } else {
      console.warn('⚠️  world-universities.csv not found at:', csvPath);
      console.log('ℹ️  Falling back to default Indian/International universities list...');
      const DEFAULT_INSTITUTIONS = [
        'Indian Institute of Technology, Bombay',
        'Indian Institute of Technology, Delhi',
        'Indian Institute of Technology, Madras',
        'Indian Institute of Technology, Kharagpur',
        'Indian Institute of Technology, Kanpur',
        'Indian Institute of Science, Bangalore',
        'University of Delhi',
        'University of Mumbai',
        'Savitribai Phule Pune University',
        'Anna University',
        'Jawaharlal Nehru University',
        'Banaras Hindu University',
        'University of Kerala',
        'University of Calicut',
        'Mahatma Gandhi University',
        'Cochin University of Science and Technology',
        'National Institute of Technology, Trichy',
        'National Institute of Technology, Calicut'
      ];
      DEFAULT_INSTITUTIONS.forEach(name => institutionsSet.add(name));
    }

    const options = Array.from(institutionsSet).sort();

    await DropdownConfig.findOneAndUpdate(
      { key: 'institutions' },
      { options },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Successfully seeded ${options.length} institutions.`);
    console.log('✅ Institutions seeded');
  } catch (err) {
    console.error('Error seeding institutions:', err);
    throw err;
  }
}


// ==========================================
// SECTION CONFIGS
// ==========================================
const sectionsData = [
  {
    id: 'personal-information', title: '01 - Personal Information', configs: [
      { name: 'Gender', optionsKey: 'genderOptions' },
      { name: 'Blood Group', optionsKey: 'bloodGroupOptions' },
      { name: 'Nationality', optionsKey: 'nationalityOptions' },
      { name: 'Religion', optionsKey: 'religionOptions' },
      { name: 'Category', optionsKey: 'categoryOptions' },
      { name: 'Sub-Category', optionsKey: 'subCategoryOptions' },
      { name: 'Marital Status', optionsKey: 'maritalStatusOptions' },
      { name: 'Disability Status', optionsKey: 'disabilityStatusOptions' },
      { name: 'Disability Type', optionsKey: 'disabilityTypeOptions' },
      { name: 'State', optionsKey: 'stateOptions' },
      { name: 'Country', optionsKey: 'countryOptions' }
    ]
  },
  {
    id: 'qualifications', title: '02 - Qualifications', configs: [
      { name: 'Degree Level', optionsKey: 'degreeLevelOptions' },
      { name: 'Degree / Certificate Name', optionsKey: 'degreeNameOptions' },
      { name: 'Specialization / Subject', optionsKey: 'specializationOptions' },
      { name: 'Division / Class', optionsKey: 'divisionOptions' },
      { name: 'Study Mode', optionsKey: 'studyModeOptions' },
      { name: 'Grade Type', optionsKey: 'gradeTypeOptions' }
    ]
  },
  {
    id: 'eligibility-tests', title: '03 - Eligibility Tests', configs: [
      { name: 'Exam Name', optionsKey: 'examNameOptions' },
      { name: 'Subject / Paper', optionsKey: 'subjectPaperOptions' },
      { name: 'State (for SET/SLET)', optionsKey: 'stateForSetOptions' },
      { name: 'Validity Status', optionsKey: 'validityStatusOptions' }
    ]
  },
  {
    id: 'employment-details', title: '04 - Employment Details', configs: [
      { name: 'Designation', optionsKey: 'designationOptions' },
      { name: 'Department', optionsKey: 'departmentOptions' },
      { name: 'Institution / College Type', optionsKey: 'institutionTypeOptions' },
      { name: 'Affiliated University', optionsKey: 'affiliatedUniversityOptions' },
      { name: 'Nature of Appointment', optionsKey: 'natureOfAppointmentOptions' },
      { name: 'Approval Status', optionsKey: 'approvalStatusOptions' },
      { name: 'Pay Scale / Band', optionsKey: 'payScaleOptions' }
    ]
  },
  {
    id: 'research-publications', title: '05 - Research & Publications', configs: [
      { name: 'Publication Type', optionsKey: 'publicationTypeOptions' },
      { name: 'Publication Level', optionsKey: 'publicationLevelOptions' },
      { name: 'Author Role', optionsKey: 'authorRoleOptions' },
      { name: 'Indexed In', optionsKey: 'indexedInOptions' },
      { name: 'Peer Reviewed Status', optionsKey: 'peerReviewedStatusOptions' },
      { name: 'Journal Category', optionsKey: 'journalCategoryOptions' }
    ]
  },
  {
    id: 'awards-honours', title: '06 - Awards & Honours', configs: [
      { name: 'Award Category', optionsKey: 'awardCategoryOptions' },
      { name: 'Award Level', optionsKey: 'awardLevelOptions' },
      { name: 'Awarding Agency Type', optionsKey: 'awardingAgencyTypeOptions' },
      { name: 'Honour Type', optionsKey: 'honourTypeOptions' },
      { name: 'Recognition Status', optionsKey: 'recognitionStatusOptions' }
    ]
  },
  {
    id: 'research-projects', title: '07 - Research Projects', configs: [
      { name: 'Funding Agency', optionsKey: 'fundingAgencyOptions' },
      { name: 'Project Status', optionsKey: 'projectStatusOptions' },
      { name: 'Role in Project', optionsKey: 'roleInProjectOptions' },
      { name: 'Project Category', optionsKey: 'projectCategoryOptions' },
      { name: 'Funding Type', optionsKey: 'fundingTypeOptions' }
    ]
  },
  {
    id: 'research-supervision', title: '08 - Research Supervision', configs: [
      { name: 'Research Degree', optionsKey: 'researchDegreeOptions' },
      { name: 'Scholar Gender', optionsKey: 'scholarGenderOptions' },
      { name: 'Research Status', optionsKey: 'researchStatusOptions' },
      { name: 'Guidance Type', optionsKey: 'guidanceTypeOptions' },
      { name: 'Patent Status', optionsKey: 'patentStatusOptions' },
      { name: 'Patent Type', optionsKey: 'patentTypeOptions' },
      { name: 'Supervision Category', optionsKey: 'supervisionCategoryOptions' }
    ]
  },
  {
    id: 'academic-responsibilities', title: '09 - Academic Responsibilities', configs: [
      { name: 'Committee Type', optionsKey: 'committeeTypeOptions' },
      { name: 'Responsibility Role', optionsKey: 'responsibilityRoleOptions' },
      { name: 'Course Level', optionsKey: 'courseLevelOptions' },
      { name: 'Semester Type', optionsKey: 'semesterTypeOptions' },
      { name: 'Academic Session Type', optionsKey: 'academicSessionTypeOptions' },
      { name: 'Teaching Category', optionsKey: 'teachingCategoryOptions' },
      { name: 'Responsibility Status', optionsKey: 'responsibilityStatusOptions' },
      { name: 'Course Name', optionsKey: 'courseNameOptions' },
      { name: 'Programme', optionsKey: 'programmeOptions' }
    ]
  },
  {
    id: 'internship-projects', title: '10 - Internship and Projects', configs: [
      { name: 'Organisation / Company', optionsKey: 'organisationOptions' },
      { name: 'Role', optionsKey: 'internRoleOptions' },
      { name: 'Project Type', optionsKey: 'projectTypeOptions' }
    ]
  },
  {
    id: 'memberships', title: '11 - Memberships', configs: [
      { name: 'Professional Body / Society', optionsKey: 'professionalBodyOptions' },
      { name: 'Membership Type', optionsKey: 'membershipTypeOptions' },
      { name: 'Membership Category', optionsKey: 'membershipCategoryOptions' },
      { name: 'Membership Status', optionsKey: 'membershipStatusOptions' },
      { name: 'Membership Level', optionsKey: 'membershipLevelOptions' },
      { name: 'Organization Type', optionsKey: 'organizationTypeOptions' }
    ]
  },
  {
    id: 'fdp-workshops', title: '12 - Attended FDP & Workshops', configs: [
      { name: 'Programme Type', optionsKey: 'programmeTypeOptions' },
      { name: 'Sponsoring / Funding Agency', optionsKey: 'sponsoringAgencyOptions' },
      { name: 'Participation', optionsKey: 'participationOptions' }
    ]
  },
  {
    id: 'online-courses', title: '13 - Online Courses', configs: [
      { name: 'Course Platform / Provider', optionsKey: 'coursePlatformOptions' },
      { name: 'Course Type', optionsKey: 'courseTypeOptions' },
      { name: 'Completion Status', optionsKey: 'completionStatusOptions' },
      { name: 'Certification Type', optionsKey: 'certificationTypeOptions' },
      { name: 'Learning Mode', optionsKey: 'learningModeOptions' }
    ]
  },
  {
    id: 'international-experience', title: '14 - Academic International Experience', configs: [
      { name: 'Visited Country', optionsKey: 'countryVisitOptions' },
      { name: 'Purpose of Visit', optionsKey: 'purposeOfVisitOptions' },
      { name: 'Funding Source', optionsKey: 'fundingSourceOptions' },
      { name: 'Visit Category', optionsKey: 'visitCategoryOptions' },
      { name: 'Collaboration Type', optionsKey: 'collaborationTypeOptions' },
      { name: 'Visit Status', optionsKey: 'visitStatusOptions' }
    ]
  },
  {
    id: 'admin-non-academic', title: '15 - Admin & Non-Academic Responsibilities', configs: [
      { name: 'Administrative Charge', optionsKey: 'adminChargeOptions' }
    ]
  },
  {
    id: 'academic-administration', title: '16 - Academic Administration', configs: [
      { name: 'Administrative Charge', optionsKey: 'academicAdminOptions' }
    ]
  },
  {
    id: 'quality-assurance', title: '17 - Quality Assurance', configs: [
      { name: 'Administrative Charge', optionsKey: 'qualityAssuranceOptions' }
    ]
  },
  {
    id: 'research-innovation', title: '18 - Research and Innovation', configs: [
      { name: 'Administrative Charge', optionsKey: 'researchInnovationOptions' }
    ]
  },
  {
    id: 'examination-evaluation', title: '19 - Examination and Evaluation', configs: [
      { name: 'Administrative Charge', optionsKey: 'examinationEvaluationOptions' }
    ]
  },
  {
    id: 'admin-support', title: '20 - Administrative Support', configs: [
      { name: 'Administrative Charge', optionsKey: 'adminSupportOptions' }
    ]
  },
  {
    id: 'dept-charges', title: '21 - Departmental Charges', configs: [
      { name: 'Administrative charge', optionsKey: 'departmentalChargesOptions' }
    ]
  },
  {
    id: 'special-assignments', title: '22 - Special Assignments', configs: [
      { name: 'Administrative charge', optionsKey: 'specialAssignmentsOptions' }
    ]
  },
  {
    id: 'extra-institutional', title: '23 - Activities - Extra Institutional', configs: [
      { name: 'Administrative charge', optionsKey: 'extraInstitutionalOptions' }
    ]
  },
  {
    id: 'documents', title: '24 - Documents', configs: [
      { name: 'Document Type', optionsKey: 'documentTypeOptions' }
    ]
  },
  { id: 'visibility', title: 'Visibility', configs: [] }
];

async function seedSectionConfigs() {
  try {

    let inserted = 0;
    let updated = 0;

    for (const section of sectionsData) {
      const existing = await SectionConfig.findOne({ sectionId: section.id });
      if (existing) {
        await SectionConfig.findOneAndUpdate({ sectionId: section.id }, section);
        updated++;
      } else {
        await SectionConfig.create({
          sectionId: section.id,
          title: section.title,
          configs: section.configs
        });
        inserted++;
      }
    }

    console.log(`🎉 Done! Inserted: ${inserted}, Updated: ${updated}`);
    console.log('✅ Section configs seeded');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    throw err;
  }
}


// ==========================================
// DEPARTMENTS & HODS
// ==========================================
const ADMIN = { name: 'Super Administrator', username: 'admin', email: 'admin@iqac.edu.in', password: 'Admin@IQAC2024' };
const VC_USER = { name: 'Vice Chancellor', username: 'vc', email: 'vc@iqac.edu.in', password: 'VC@IQAC2024' };

const getDummyProfile = (name, email, dept, designation) => ({
  personalInfo: {
    firstName: name.split(' ')[0],
    lastName: name.split(' ').slice(1).join(' ') || '',
    fullName: name,
    dateOfBirth: '1985-03-14', gender: 'Female', bloodGroup: 'B+',
    nationality: 'Indian', religion: 'Hindu', category: 'General',
    maritalStatus: 'Married',
    mobilePersonal: '9876543210',
    officialEmail: email,
    personalEmail: email.replace('@university.edu.in', '@gmail.com'),
    permanentAddress: '12, Rose Garden Colony', permanentCity: 'Pune', permanentState: 'Maharashtra', permanentPin: '411001',
    currentAddress: '12, Rose Garden Colony', currentCity: 'Pune', currentState: 'Maharashtra', currentPin: '411001',
    photoUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
  },
  qualifications: [
    { degreeLevel: 'UG', degreeName: 'B.Sc.', specialization: 'Science', institution: 'Fergusson College', university: 'SPPU', yearOfPassing: '2006', percentageCGPA: '78%', division: 'First', mode: 'Regular' },
    { degreeLevel: 'PG', degreeName: 'M.Sc.', specialization: 'Science', institution: 'Pune University', university: 'SPPU', yearOfPassing: '2008', percentageCGPA: '82%', division: 'First', mode: 'Regular' },
    { degreeLevel: 'Ph.D', degreeName: 'Ph.D.', specialization: 'Research', institution: 'IIT Pune', university: 'IIT Pune', yearOfPassing: '2013', percentageCGPA: 'Awarded', division: 'First', mode: 'Regular' },
  ],
  eligibilityTests: [
    { examName: 'NET', subject: 'Science', year: '2009', certificateNo: 'NET/2009/12345' },
  ],
  employmentDetails: {
    employeeId: 'EMP-' + Math.floor(Math.random() * 10000), designation: designation, department: dept,
    institution: 'University', affiliatedUniversity: 'University',
    dateOfAppointment: '2014-07-01', natureOfAppointment: 'Regular',
    totalExperienceYears: '10', totalExperienceMonths: '6',
  },
  publications: [
    { type: 'journal', title: 'Research Paper 1', authors: name, authorRole: 'Principal', journal: 'Journal of Science', year: '2022', issn: '1234-5678' },
    { type: 'journal', title: 'Research Paper 2', authors: name, authorRole: 'Principal', journal: 'Journal of Science', year: '2023', issn: '1234-5678' },
  ],
  projects: [
    { title: 'Project 1', fundingAgency: 'DST', amountSanctioned: '2800000', duration: '3 years', status: 'Completed', role: 'PI' },
  ]
});

const DEPARTMENTS = [
  "Department Of Information Technology",
  "Department of Wood Science & Technology",
  "Department of Library and Information Science.",
  "Department of Journalism and Media Studies",
  "Department Of Mathematical Sciences",
  "Department of Statistical Sciences",
  "Department Of Biotechnology & Microbiology",
  "Department of Chemistry",
  "Department of Physics",
  "Department Of Studies In English",
  "Department Of Economics",
  "Department Of Anthropology",
  "Department of History"
];

const HODS = DEPARTMENTS.map(dept => {
  const shortName = dept.replace(/Department |Of |of |& /gi, "").replace(/[^a-zA-Z0-9 ]/g, "").trim().toLowerCase().split(" ").filter(Boolean).join(".");
  return { email: `hod.${shortName}@university.edu.in`, dept, username: `hod.${shortName}` };
});

const FACULTIES = [
  { email: 'dr.priya.sharma@university.edu.in', name: 'Dr. Priya Sharma', dept: DEPARTMENTS[0], designation: 'Associate Professor', username: 'dr.priya.sharma' },
  { email: 'prof.ajay.kumar@university.edu.in', name: 'Prof. Ajay Kumar', dept: DEPARTMENTS[1], designation: 'Professor', username: 'prof.ajay.kumar' },
  { email: 'ms.kavitha.r@university.edu.in', name: 'Ms. Kavitha R.', dept: DEPARTMENTS[2], designation: 'Assistant Professor', username: 'ms.kavitha.r' },
  { email: 'dr.ramesh.patel@university.edu.in', name: 'Dr. Ramesh Patel', dept: DEPARTMENTS[3], designation: 'Assistant Professor', username: 'dr.ramesh.patel' },
  { email: 'dr.anjali.gupta@university.edu.in', name: 'Dr. Anjali Gupta', dept: DEPARTMENTS[4], designation: 'Associate Professor', username: 'dr.anjali.gupta' },
];

async function seedDepartmentsHodsFaculties() {
  try {



    // 2. Admin & VC setup
    for (const adminOrVc of [
      { ...ADMIN, role: 'superadmin' },
      { ...VC_USER, role: 'vc' }
    ]) {
      const exists = await User.findOne({ username: adminOrVc.username });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(adminOrVc.password, 12);
        await User.create({ ...adminOrVc, password: hashedPassword, isFirstLogin: false, isActive: true });
        console.log(`✅ ${adminOrVc.role.toUpperCase()} created`);
      } else {
        console.log(`⚠️  ${adminOrVc.role.toUpperCase()} already exists`);
      }
    }

    const defaultHashedPassword = await bcrypt.hash('password123', 12);

    // 3. Seed HODs
    for (const h of HODS) {
      const user = await User.create({
        name: `HOD ${h.dept}`,
        username: h.username,
        email: h.email,
        password: defaultHashedPassword,
        role: 'hod',
        isFirstLogin: false,
        isActive: true,
      });

      await Department.create({
        name: h.dept,
        hod: user._id
      });

      // No personal name for HOD, just dept name and email
      const hodProfileData = getDummyProfile(h.dept, h.email, h.dept, 'HOD');
      hodProfileData.personalInfo.firstName = h.dept;
      hodProfileData.personalInfo.lastName = '';

      await Faculty.create({
        userId: user._id,
        username: h.username,
        profileComplete: true,
        completionPercentage: 100,
        ...hodProfileData,
      });
      console.log(`✅ HOD created for ${h.dept}`);
    }

    // 4. Seed Faculties
    for (const f of FACULTIES) {
      const user = await User.create({
        name: f.name,
        username: f.username,
        email: f.email,
        password: defaultHashedPassword,
        role: 'faculty',
        isFirstLogin: false,
        isActive: true,
      });

      await Faculty.create({
        userId: user._id,
        username: f.username,
        profileComplete: true,
        completionPercentage: 100,
        ...getDummyProfile(f.name, f.email, f.dept, f.designation),
      });
      console.log(`✅ Faculty created: ${f.name}`);
    }

    // 5. Console Output
    console.log('\n🎉 Seed complete!');
    console.log('   --- Demo Credentials ---');
    console.log('   Admin        → admin / Admin@IQAC2024');
    console.log('   VC           → vc / VC@IQAC2024');
    console.log(`   HOD 1        → ${HODS[0].email} / password123`);
    console.log(`   HOD 2        → ${HODS[1].email} / password123`);
    console.log(`   Faculty 1    → ${FACULTIES[0].email} / password123`);
    console.log(`   Faculty 2    → ${FACULTIES[1].email} / password123`);

    console.log('✅ Departments, HODs, Faculties seeded');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    throw err;
  }
}


// ==========================================
// DETAILED PROFILES
// ==========================================
const seedProfiles = async () => {
  try {

    const username1 = 'dr_john_doe';
    const email1 = 'john.doe@university.edu';

    const username2 = 'dr_jane_smith';
    const email2 = 'jane.smith@university.edu';

    // Cleanup existing mock data
    await User.deleteMany({ username: { $in: [username1, username2] } });
    await Faculty.deleteMany({ username: { $in: [username1, username2] } });

    const hashedPassword = await bcrypt.hash('password123', 12);

    const user1 = await User.create({
      name: 'Dr. John Doe',
      username: username1,
      email: email1,
      password: hashedPassword,
      role: 'faculty',
      isActive: true,
      isFirstLogin: false
    });

    const user2 = await User.create({
      name: 'Dr. Jane Smith',
      username: username2,
      email: email2,
      password: hashedPassword,
      role: 'faculty',
      isActive: true,
      isFirstLogin: false
    });

    const docUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const photoUrl = 'https://randomuser.me/api/portraits/men/32.jpg';
    const photoUrl2 = 'https://randomuser.me/api/portraits/women/44.jpg';

    const getFaculty1Data = (userId) => ({
      userId: userId,
      username: username1,
      profileComplete: true,
      completionPercentage: 100,
      personalInfo: {
        firstName: 'John',
        middleName: 'William',
        lastName: 'Doe',
        fullName: 'Dr. John William Doe',
        dateOfBirth: '1980-05-15',
        gender: 'Male',
        bloodGroup: 'O+',
        nationality: 'Indian',
        permanentAddress: '123 MG Road, Apt 4B',
        permanentState: 'Maharashtra',
        permanentCity: 'Mumbai',
        permanentPin: '400001',
        currentAddress: 'University Campus, Qtr 12',
        currentState: 'Maharashtra',
        currentCity: 'Mumbai',
        currentPin: '400098',
        stateAndCity: 'Maharashtra - Mumbai',
        mobilePersonal: '9876543210',
        alternatePhone: '9876543211',
        officialEmail: email1,
        personalEmail: 'john.personal@gmail.com',
        professionalHeadline: 'Professor of Department Of Information Technology',
        biography: 'Experienced professor with 15+ years in teaching and research in AI.',
        subjects: 'Artificial Intelligence, Machine Learning',
        interests: 'Deep Learning, NLP',
        age: '46',
        community: 'General',
        fatherName: 'Robert Doe',
        motherName: 'Mary Doe',
        communicationAddress: 'University Campus, Qtr 12',
        communicationCity: 'Mumbai',
        communicationState: 'Maharashtra',
        communicationPin: '400098',
        mobileNumber: '9876543210',
        alternateMobileNumber: '9876543211',
        officialEmailId: email1,
        personalEmailId: 'john.personal@gmail.com',
        emergencyContactNumber: '9876543211',
        aadhaarNumber: '123456789012',
        passportNumber: 'Z1234567',
        panNumber: 'ABCDE1234F',
        religion: 'Hinduism',
        category: 'General',
        subCategory: 'None',
        differentlyAbled: 'No',
        disabilityType: '',
        maritalStatus: 'Married',
        spouseName: 'Sarah Doe',
        spouseOccupation: 'Teacher',
        emergencyContactName: 'Sarah Doe',
        emergencyContactMobile: '9876543211',
        photoUrl: photoUrl,
        orcidId: '0000-0002-1825-0097',
        googleScholarId: 'abc123xyz',
        scopusId: '987654321',
        linkedIn: 'https://linkedin.com/in/johndoe',
        website: 'https://johndoe.com'
      },
      qualifications: [{
        degreeLevel: 'Ph.D',
        degreeName: 'Ph.D in Department Of Information Technology',
        specialization: 'Artificial Intelligence',
        institution: 'IIT Bombay',
        university: 'IIT Bombay',
        boardUniversity: 'IIT Bombay',
        yearOfPassing: '2010',
        gradeType: 'CGPA',
        percentageCGPA: '9.2',
        division: 'First',
        mode: 'Regular',
        country: 'India',
        state: 'Maharashtra',
        countryAndState: 'India - Maharashtra',
        phdCertificate: '12345',
        thesisTitle: 'Deep Learning for NLP',
        documentUrl: docUrl
      }, {
        degreeLevel: 'PG',
        degreeName: 'M.Tech',
        specialization: 'Department Of Information Technology',
        institution: 'NIT Trichy',
        university: 'NIT Trichy',
        boardUniversity: 'NIT Trichy',
        yearOfPassing: '2005',
        gradeType: 'CGPA',
        percentageCGPA: '8.8',
        division: 'First',
        mode: 'Regular',
        country: 'India',
        state: 'Tamil Nadu',
        countryAndState: 'India - Tamil Nadu',
        phdCertificate: '',
        thesisTitle: '',
        documentUrl: docUrl
      }],
      eligibilityTests: [{
        examName: 'NET',
        subject: 'Department Of Information Technology',
        year: '2006',
        certificateNo: 'NET12345',
        score: '65',
        state: '',
        fellowshipAgency: 'UGC',
        validityStatus: 'Lifetime',
        documentUrl: docUrl
      }],
      employmentDetails: {
        employeeId: 'EMP001',
        designation: 'Professor',
        department: 'Department Of Information Technology',
        institution: 'University of Mumbai',
        affiliatedUniversity: 'University of Mumbai',
        dateOfAppointment: '2015-08-01',
        natureOfAppointment: 'Regular',
        approvalOfAppointment: 'Yes',
        approvalLetterNo: 'APP/2015/123',
        approvalLetterDate: '2015-07-25',
        scaleOfPay: 'Level 14',
        currentBasicPay: '144200',
        totalExperienceYears: '15',
        totalExperienceMonths: '2',
        dateOfRetirement: '2045-05-15'
      },
      workExperience: [{
        organization: 'TCS Innovation Labs',
        designation: 'Research Scientist',
        from: '2010-06-01',
        to: '2015-07-31',
        nature: 'Research',
        reasonForLeaving: 'To join academics',
        employeeId: 'TCS123',
        department: 'R&D',
        institution: 'TCS',
        affiliatedUniversity: '',
        typeOfInstitution: 'Industry',
        natureOfAppointment: 'Regular',
        documentUrl: docUrl
      }],
      publications: [{
        type: 'Journal Articles',
        title: 'Advances in Deep Learning for NLP',
        authors: 'John Doe, Alice Smith',
        authorRole: 'Principal',
        journal: 'IEEE Transactions on Neural Networks',
        journalCategory: 'Q1',
        year: '2022',
        volume: '33',
        issue: '4',
        issn: '1045-9227',
        isbn: '',
        pages: '1023-1035',
        impactFactor: '10.4',
        indexedIn: 'Scopus',
        peerReviewed: 'Yes',
        doi: '10.1109/TNNLS.2022.1234567',
        level: 'International',
        presentationType: '',
        venue: '',
        conferenceDates: '',
        documentUrl: docUrl,
        editors: '',
        bookType: '',
        organizedBy: '',
        publishedInProceedings: ''
      }],
      awards: [{
        name: 'Best Researcher Award',
        awardingAgency: 'IEEE India',
        dateOfAward: '2021-12-15',
        yearReceived: '2021',
        level: 'National',
        awardCategory: 'Research',
        honourType: 'Award',
        recognitionStatus: 'Recognized'
      }],
      projects: [{
        title: 'AI for Healthcare Diagnostics',
        fundingAgency: 'DST',
        projectCategory: 'Major',
        fundingType: 'Government',
        amountSanctioned: '5000000',
        startDate: '2019-04-01',
        endDate: '2022-03-31',
        status: 'Completed',
        role: 'PI',
        referenceNumber: 'DST/AI/2019/01'
      }],
      patents: [{
        title: 'System and method for intelligent text summarization',
        patentNumber: 'IN123456',
        dateOfFiling: '2020-01-15',
        status: 'Granted',
        patentType: 'Utility'
      }],
      researchGuidance: {
        phdCompleted: '2',
        phdInProgress: '4',
        mphilCompleted: '1',
        mphilInProgress: '0',
        pgProjectsSupervised: '15',
        completedStudentsNames: 'Mark Taylor, Linda Brown',
        studentDetails: [{
          studentName: 'Mark Taylor',
          topic: 'Transformers in NLP',
          year: '2021',
          fellowship: 'JRF',
          degree: 'Ph.D.',
          status: 'Completed',
          scholarGender: 'Male',
          guidanceType: 'Principal Guide',
          supervisionCategory: 'Ph.D.'
        }]
      },
      adminResponsibilities: [{
        committeeName: 'Board of Studies',
        role: 'Chairman',
        from: '2020-08-01',
        to: '2023-07-31'
      }],
      fdpWorkshops: [{
        programTitle: 'Recent Trends in AI',
        type: 'FDP',
        organizingInstitution: 'NIT Warangal',
        duration: '1 Week',
        from: '2022-05-10',
        to: '2022-05-16',
        mode: 'Online',
        certificate: 'Yes',
        year: '2022',
        documentUrl: docUrl
      }],
      onlineCourses: [{
        courseName: 'Machine Learning by Andrew Ng',
        platform: 'Coursera',
        duration: '11 Weeks',
        completionYear: '2018',
        from: '2018-01-01',
        to: '2018-03-15',
        certificateId: 'COURSERA123',
        certificateUrl: docUrl,
        score: '98',
        courseLevel: 'Intermediate'
      }],
      memberships: [{
        professionalBody: 'IEEE',
        membershipType: 'Senior Member',
        membershipId: '98765432',
        yearOfJoining: '2010',
        documentUrl: docUrl
      }],
      internationalExperience: [{
        country: 'USA',
        purpose: 'Visiting Scholar',
        institution: 'MIT',
        duration: '6 Months',
        from: '2017-01-01',
        to: '2017-06-30',
        fundingSource: 'Fulbright'
      }],
      qualityAssurance: [{
        administrativeCharge: 'IQAC Member',
        academicYear: '2022-2023',
        activityTitle: 'NAAC Preparation',
        activityDate: '2023-01-10',
        activityCategory: 'Meeting',
        objective: 'Prepare SSR',
        outcome: 'Draft SSR Completed',
        supportingDocuments: docUrl,
        remarks: 'Excellent progress',
        criteriaNumber: '3',
        criteriaName: 'Research, Innovations and Extension',
        taskDescription: 'Compile research data',
        evidenceAvailable: 'Yes',
        status: 'Completed',
        reportName: 'Criterion 3 Report',
        reportingPeriod: '2022-23',
        preparedBy: 'John Doe',
        criteriaCovered: '3.1 to 3.5',
        reviewDate: '2023-02-15',
        reviewedBy: 'IQAC Coordinator',
        reportStatus: 'Approved',
        departmentName: 'Department Of Information Technology',
        coordinatorName: 'Jane Smith',
        facultyDataSubmitted: 'Yes',
        studentDataSubmitted: 'Yes',
        researchDataSubmitted: 'Yes',
        submissionStatus: 'Submitted',
        reportCycle: '1',
        dataCategory: 'Research',
        verifiedBy: 'Principal',
        verificationDate: '2023-03-01',
        studentStrength: '120',
        facultyStrength: '15',
        publicationCount: '45',
        placementDataSubmitted: 'Yes',
        semester: 'Even',
        feedbackType: 'Student Feedback',
        feedbackSummary: 'Very Good',
        actionPlan: 'Improve lab facilities',
        responsiblePerson: 'HOD',
        implementationStatus: 'In Progress',
        responsibilityTitle: 'IQAC Member',
        startDate: '2021-07-01',
        endDate: '2024-06-30',
        description: 'Coordinate quality initiatives'
      }],
      departmentalCharges: [{
        administrativeCharge: 'HOD',
        institutionName: 'University of Mumbai',
        departmentName: 'Department Of Information Technology',
        committeeName: 'Departmental Committee',
        libraryName: '',
        role: 'Chairman',
        responsibilities: 'Manage department affairs',
        activitiesCoordinated: 'All academic activities',
        mentoringScheme: 'Yes',
        numberOfStudents: '120',
        academicYear: '2023-2024',
        eventTitle: 'Tech Fest',
        eventType: 'Festival',
        organizingDepartment: 'Department Of Information Technology',
        eventDate: '2024-02-10',
        title: 'Head of Department',
        description: 'Overall charge of the department',
        appointmentDate: '2022-07-01',
        tenureStart: '2022-07-01',
        tenureEnd: '2025-06-30',
        remarks: ''
      }],
      specialAssignments: [{
        administrativeCharge: 'NSS Officer',
        organizationName: 'University of Mumbai',
        programName: 'NSS',
        cellName: 'NSS Cell',
        nssUnitNumber: 'Unit 1',
        nccUnitName: '',
        role: 'Program Officer',
        roleDescription: 'Coordinate NSS activities',
        responsibilityArea: 'Community Service',
        activityType: 'Camp',
        activitiesConducted: 'Blood Donation, Cleanliness Drive',
        placementActivities: '',
        platformName: '',
        communityPartner: 'Local NGO',
        title: 'NSS Program Officer',
        description: 'Lead NSS unit of the college',
        appointmentDate: '2021-08-01',
        tenureStart: '2021-08-01',
        tenureEnd: '2024-07-31',
        remarks: ''
      }],
      extraInstitutionalActivities: [{
        administrativeCharge: 'External Examiner',
        institutionName: 'Pune University',
        universityName: 'Pune University',
        organizationName: '',
        department: 'Department Of Information Technology',
        facultyName: 'Science and Technology',
        specialization: 'AI',
        programName: 'M.Sc. CS',
        courseName: 'Machine Learning',
        role: 'Examiner',
        nominationType: 'Academic',
        examinationType: 'Practical',
        title: 'External Practical Examiner',
        description: 'Conducted practical exams for M.Sc.',
        appointmentDate: '2023-11-15',
        tenureStart: '2023-12-01',
        tenureEnd: '2023-12-05',
        remarks: ''
      }],
      adminNonAcademicResponsibilities: [{
        administrativeCharge: 'Warden',
        institutionName: 'University of Mumbai',
        campusName: 'Main Campus',
        universityName: 'University of Mumbai',
        facultyName: 'Science',
        committeeName: 'Hostel Committee',
        title: 'Chief Warden',
        organization: 'University',
        nominationType: 'Administrative',
        reportingAuthority: 'Registrar',
        appointingAuthority: 'Vice Chancellor',
        responsibilities: 'Manage boys hostel',
        activitiesConducted: 'Hostel Day, Sports meet',
        departmentAssigned: 'Student Welfare',
        description: 'Overall supervision of the hostel',
        admissionYear: '2023',
        appointmentDate: '2022-01-01',
        tenureStart: '2022-01-01',
        tenureEnd: '2025-12-31',
        remarks: ''
      }],
      academicAdministration: [{
        administrativeCharge: 'Member BOS',
        programDepartment: 'Department Of Information Technology',
        constitutedBy: 'Vice Chancellor',
        syllabusCourse: 'B.Sc. CS',
        departmentProgram: 'Department Of Information Technology',
        academicSession: '2023-2024',
        focusArea: 'Syllabus Revision',
        examRole: 'Paper Setter',
        examination: 'TY B.Sc.',
        board: 'BOS Department Of Information Technology',
        meetingDate: '2023-09-15',
        councilBody: 'Academic Council',
        department: 'Department Of Information Technology',
        reviewType: 'Annual',
        title: 'Member, Board of Studies',
        departmentUnit: 'Department Of Information Technology',
        description: 'Participated in syllabus design',
        appointmentDate: '2022-06-01',
        from: '2022-06-01',
        to: '2025-05-31',
        remarks: ''
      }],
      researchAndInnovation: [{
        administrativeCharge: 'Research Coordinator',
        departmentSchoolCenter: 'Department Of Information Technology',
        departmentUnit: 'Research Cell',
        organizingDepartmentUnit: 'Research Cell',
        fundingAgencyOrganization: 'UGC',
        typeOfProposal: 'Research Grant',
        typeOfFunding: 'Government',
        projectSchemeName: 'STRIDE',
        roleResponsibility: 'Coordinator',
        areasOfResearchCoordinated: 'AI, ML, Data Science',
        conferenceEventName: 'International Conference on AI',
        keyResponsibilities: 'Organize conference',
        title: 'Research Cell Coordinator',
        description: 'Coordinate all research activities in the department',
        appointmentDate: '2021-07-01',
        from: '2021-07-01',
        to: '2024-06-30',
        remarks: ''
      }],
      examinationAndEvaluation: [{
        administrativeCharge: 'Chief Conductor',
        institutionName: 'University of Mumbai',
        departmentName: 'Exam Cell',
        boardName: 'University Exam Board',
        courseName: 'All UG/PG',
        subjectArea: 'General',
        examinationSession: 'Winter 2023',
        activityType: 'Exam Conduction',
        roleDescription: 'Conduct exams smoothly',
        coursesManaged: 'B.Sc, M.Sc, B.Com, B.A.',
        examinationSessionsHandled: 'Morning and Afternoon',
        responsibilities: 'Overall charge of examination center',
        title: 'Chief Conductor of Examinations',
        description: 'Managed the winter 2023 examinations for the college center',
        contributionDate: '2023-11-20',
        appointmentDate: '2023-10-01',
        tenureStart: '2023-11-15',
        tenureEnd: '2023-12-30',
        remarks: ''
      }],
      administrativeSupport: [{
        administrativeCharge: 'Nodal Officer',
        departmentUnit: 'Scholarship Section',
        roleResponsibility: 'Verify scholarship forms',
        attendanceSystemMethod: 'Biometric',
        workloadType: 'Administrative',
        areaOfResponsibility: 'MahaDBT Portal',
        areaOfEnforcement: 'College level',
        responsibilityTitle: 'Nodal Officer for Scholarships',
        descriptionOfResponsibility: 'Verification of state and national scholarships',
        appointmentDate: '2020-08-01',
        tenureStart: '2020-08-01',
        tenureEnd: '2025-07-31',
        remarks: ''
      }],
      documents: {
        photo: photoUrl,
        signature: docUrl,
        aadhar: docUrl,
        pan: docUrl,
        ssc: docUrl,
        hsc: docUrl,
        ug: docUrl,
        pg: docUrl,
        phd: docUrl,
        mphil: docUrl,
        net: docUrl,
        gate: docUrl,
        apptLetter: docUrl,
        experienceCert: docUrl,
        publications: docUrl,
        noc: docUrl,
        casteCert: docUrl,
        disabilityCert: docUrl,
        dobProof: docUrl,
        nationalId: docUrl
      }
    });

    const getFaculty2Data = (userId) => ({
      userId: userId,
      username: username2,
      profileComplete: true,
      completionPercentage: 100,
      personalInfo: {
        firstName: 'Jane',
        middleName: 'Anne',
        lastName: 'Smith',
        fullName: 'Dr. Jane Anne Smith',
        dateOfBirth: '1985-10-20',
        gender: 'Female',
        bloodGroup: 'A+',
        nationality: 'Indian',
        permanentAddress: '456 MG Road',
        permanentState: 'Delhi',
        permanentCity: 'New Delhi',
        permanentPin: '110001',
        currentAddress: 'University Campus',
        currentState: 'Delhi',
        currentCity: 'New Delhi',
        currentPin: '110021',
        stateAndCity: 'Delhi - New Delhi',
        mobilePersonal: '9876543222',
        alternatePhone: '9876543223',
        officialEmail: email2,
        personalEmail: 'jane.personal@gmail.com',
        professionalHeadline: 'Associate Professor of Physics',
        biography: 'Passionate about quantum mechanics and teaching.',
        subjects: 'Quantum Physics, Mechanics',
        interests: 'Quantum Computing, Astrophysics',
        age: '41',
        community: 'General',
        fatherName: 'Michael Smith',
        motherName: 'Susan Smith',
        communicationAddress: 'University Campus',
        communicationCity: 'New Delhi',
        communicationState: 'Delhi',
        communicationPin: '110021',
        mobileNumber: '9876543222',
        alternateMobileNumber: '9876543223',
        officialEmailId: email2,
        personalEmailId: 'jane.personal@gmail.com',
        emergencyContactNumber: '9876543223',
        aadhaarNumber: '210987654321',
        passportNumber: 'Y1234567',
        panNumber: 'FGHIJ5678K',
        religion: 'Christianity',
        category: 'General',
        subCategory: 'None',
        differentlyAbled: 'No',
        disabilityType: '',
        maritalStatus: 'Single',
        spouseName: '',
        spouseOccupation: '',
        emergencyContactName: 'Michael Smith',
        emergencyContactMobile: '9876543223',
        photoUrl: photoUrl2,
        orcidId: '0000-0003-1234-5678',
        googleScholarId: 'xyz987abc',
        scopusId: '123456789',
        linkedIn: 'https://linkedin.com/in/janesmith',
        website: 'https://janesmith.com'
      },
      qualifications: [{
        degreeLevel: 'Ph.D',
        degreeName: 'Ph.D in Physics',
        specialization: 'Quantum Mechanics',
        institution: 'IISc Bangalore',
        university: 'IISc Bangalore',
        boardUniversity: 'IISc Bangalore',
        yearOfPassing: '2012',
        gradeType: 'CGPA',
        percentageCGPA: '9.5',
        division: 'First',
        mode: 'Regular',
        country: 'India',
        state: 'Karnataka',
        countryAndState: 'India - Karnataka',
        phdCertificate: '54321',
        thesisTitle: 'Quantum Entanglement',
        documentUrl: docUrl
      }],
      eligibilityTests: [{
        examName: 'GATE',
        subject: 'Department of Physics',
        year: '2008',
        certificateNo: 'GATE12345',
        score: '85',
        state: '',
        fellowshipAgency: 'MHRD',
        validityStatus: 'Lifetime',
        documentUrl: docUrl
      }],
      employmentDetails: {
        employeeId: 'EMP002',
        designation: 'Associate Professor',
        department: 'Department of Physics',
        institution: 'University of Delhi',
        affiliatedUniversity: 'University of Delhi',
        dateOfAppointment: '2016-09-01',
        natureOfAppointment: 'Regular',
        approvalOfAppointment: 'Yes',
        approvalLetterNo: 'APP/2016/456',
        approvalLetterDate: '2016-08-20',
        scaleOfPay: 'Level 13A',
        currentBasicPay: '131400',
        totalExperienceYears: '12',
        totalExperienceMonths: '5',
        dateOfRetirement: '2050-10-31'
      },
      workExperience: [],
      publications: [{
        type: 'Journal Articles',
        title: 'Quantum Computing and Cryptography',
        authors: 'Jane Smith, Bob Johnson',
        authorRole: 'Principal',
        journal: 'Physical Review Letters',
        journalCategory: 'Q1',
        year: '2023',
        volume: '130',
        issue: '10',
        issn: '0031-9007',
        isbn: '',
        pages: '102001',
        impactFactor: '8.6',
        indexedIn: 'WoS',
        peerReviewed: 'Yes',
        doi: '10.1103/PhysRevLett.130.102001',
        level: 'International',
        presentationType: '',
        venue: '',
        conferenceDates: '',
        documentUrl: docUrl,
        editors: '',
        bookType: '',
        organizedBy: '',
        publishedInProceedings: ''
      }],
      awards: [{
        name: 'Young Scientist Award',
        awardingAgency: 'DST',
        dateOfAward: '2018-02-28',
        yearReceived: '2018',
        level: 'National',
        awardCategory: 'Research',
        honourType: 'Award',
        recognitionStatus: 'Recognized'
      }],
      projects: [{
        title: 'Quantum Materials',
        fundingAgency: 'CSIR',
        projectCategory: 'Major',
        fundingType: 'Government',
        amountSanctioned: '3000000',
        startDate: '2020-04-01',
        endDate: '2023-03-31',
        status: 'Completed',
        role: 'PI',
        referenceNumber: 'CSIR/QM/2020'
      }],
      patents: [],
      researchGuidance: {
        phdCompleted: '1',
        phdInProgress: '2',
        mphilCompleted: '0',
        mphilInProgress: '0',
        pgProjectsSupervised: '10',
        completedStudentsNames: 'Emily White',
        studentDetails: [{
          studentName: 'Emily White',
          topic: 'Quantum Optics',
          year: '2022',
          fellowship: 'CSIR-JRF',
          degree: 'Ph.D.',
          status: 'Completed',
          scholarGender: 'Female',
          guidanceType: 'Principal Guide',
          supervisionCategory: 'Ph.D.'
        }]
      },
      adminResponsibilities: [],
      fdpWorkshops: [],
      onlineCourses: [],
      memberships: [{
        professionalBody: 'Indian Physics Association',
        membershipType: 'Life Member',
        membershipId: 'IPA123',
        yearOfJoining: '2015',
        documentUrl: docUrl
      }],
      internationalExperience: [],
      qualityAssurance: [],
      departmentalCharges: [],
      specialAssignments: [],
      extraInstitutionalActivities: [],
      adminNonAcademicResponsibilities: [],
      academicAdministration: [],
      researchAndInnovation: [],
      examinationAndEvaluation: [],
      administrativeSupport: [],
      documents: {
        photo: photoUrl2,
        signature: docUrl,
        aadhar: docUrl,
        pan: docUrl,
        ssc: docUrl,
        hsc: docUrl,
        ug: docUrl,
        pg: docUrl,
        phd: docUrl,
        mphil: docUrl,
        net: docUrl,
        gate: docUrl,
        apptLetter: docUrl,
        experienceCert: docUrl,
        publications: docUrl,
        noc: docUrl,
        casteCert: docUrl,
        disabilityCert: docUrl,
        dobProof: docUrl,
        nationalId: docUrl
      }
    });

    await Faculty.create(getFaculty1Data(user1._id));
    await Faculty.create(getFaculty2Data(user2._id));

    console.log('Successfully created 2 mock profiles.');
    console.log('✅ Detailed profiles seeded');
  } catch (error) {
    console.error('Error seeding profiles:', error);
    throw error;
  }
};


// ==========================================
// DEMO USERS
// ==========================================
const DEMO_USERS = [
  {
    name: "Demo Student",
    email: "student@kuc.edu",
    username: "student",
    password: "password123",
    role: ROLES.STUDENT,
    department: "Department Of Information Technology",
  },
  {
    name: "Sahal",
    email: "sahalsahu0000@gmail.com",
    username: "sahal",
    password: "password123",
    role: ROLES.STUDENT,
    department: "Department of Journalism and Media Studies",
    phone: "9037116524",
    tutor: "Dr. Ramesh Patel",
  },
  {
    name: "shad",
    email: "shad@gmail.com",
    username: "shad",
    password: "password123",
    role: ROLES.STUDENT,
    department: "Department Of Information Technology",
    phone: "8714989393",
    tutor: "Dr. Jane Smith",
  },
  {
    name: "Sreedeep",
    email: "sreedeep@gmail.com",
    username: "sreedeep",
    password: "password123",
    role: ROLES.STUDENT,
    department: "Department Of Information Technology",
    phone: "8714985929",
    tutor: "Dr. John William Doe",
  },
  {
    name: "Dr. Jane Smith",
    email: "teacher@profcv.edu",
    username: "teacher",
    password: "password123",
    role: ROLES.FACULTY,
    department: "Department Of Information Technology",
  },
  {
    name: "Head of Department — IT",
    email: "hod_it@profcv.edu",
    username: "hod_it",
    password: "password123",
    role: ROLES.HOD,
    department: "Department Of Information Technology",
  },
  {
    name: "Vice Chancellor",
    email: "vc@profcv.edu",
    username: "vc",
    password: "password123",
    role: ROLES.VC,
    department: null,
  },
  {
    name: "Super Administrator",
    email: "admin@profcv.edu",
    username: "admin",
    password: "password123",
    role: ROLES.SUPERADMIN,
    department: null,
  },
];

async function getAvailableUsername(username, userId = null) {
  const baseUsername = username.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "user";
  let candidate = baseUsername;
  let counter = 1;

  while (true) {
    const existing = await User.findOne({ username: candidate }).select("_id");
    if (!existing || (userId && existing._id.equals(userId))) {
      return candidate;
    }
    candidate = `${baseUsername}${counter++}`;
  }
}

async function seedDemoUsers() {
  try {
    console.log("🌱 Creating demo users and profiles...");
    let created = 0;
    let updated = 0;

    for (const userData of DEMO_USERS) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      let user = await User.findOne({ email: userData.email });

      if (user) {
        user.password = hashedPassword;
        user.role = userData.role;
        user.name = userData.name;
        user.username = user.username || (await getAvailableUsername(userData.username, user._id));
        user.department = userData.department;
        user.isActive = true;
        user.canEdit = true;
        await user.save();
        console.log(`  🔄 Updated User: ${userData.email} [${userData.role}]`);
        updated++;
      } else {
        const username = await getAvailableUsername(userData.username);
        user = await User.create({
          ...userData,
          username,
          password: hashedPassword,
          isActive: true,
          canEdit: true,
        });
        console.log(`  ✅ Created User: ${userData.email} [${userData.role}]`);
        created++;
      }

      // If it's the student, create a base profile
      if (userData.role === ROLES.STUDENT) {
        const studentData = {
          academic_details: {
            admissionApplicationNumber: "KUC-2024-" + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
            universityEnrollmentNumber: "KUC/24/CS/" + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
            rollNumber: "24CS" + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
            programLevel: "UG",
            modeOfStudy: "Full-Time",
            admissionCategory: "Merit",
            department: userData.department
          },
          contact_details: {
            personalEmail: userData.email,
            ...(userData.phone ? { personalMobile: { countryCode: "+91", number: userData.phone } } : {})
          },
          personal_details: {
            fullName: userData.name
          },
          mentor_details: {
            tutorName: userData.tutor
          }
        };

        const existingProfile = await StudentProfile.findOne({ userId: user._id });
        if (!existingProfile) {
          await StudentProfile.create({
            userId: user._id,
            ...studentData
          });
          console.log(`  ✅ Created Student Profile: ${userData.email}`);
        } else {
          // Update profile if it exists to ensure fields are populated
          await StudentProfile.updateOne({ userId: user._id }, { $set: studentData });
          console.log(`  ✨ Student Profile updated for: ${userData.email}`);
        }
      }

      // If it's a faculty or HOD, create a base faculty profile
      if (userData.role === ROLES.FACULTY || userData.role === ROLES.HOD) {
        const existingProfile = await Faculty.findOne({ userId: user._id });
        if (!existingProfile) {
          await Faculty.create({
            userId: user._id,
            username: user.username,
            profileComplete: true,
            completionPercentage: 100,
            personalInfo: {
              fullName: userData.name,
              officialEmail: userData.email,
            },
            employmentDetails: {
              department: userData.department || "Department Of Information Technology",
              designation: userData.role === ROLES.HOD ? "HOD" : "Assistant Professor",
              institution: "KUC",
            }
          });
          console.log(`  ✅ Created Faculty Profile: ${userData.email}`);
        } else {
          console.log(`  ✨ Faculty Profile already exists for: ${userData.email}`);
        }
      }
    }

    console.log(`\n✨ Seeding complete! ${created} created, ${updated} updated.`);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    console.error(err.stack);
  }
}


// ==========================================
// DROPDOWNS
// ==========================================
const defaults = {
  // Personal Information
  gender: ['Male', 'Female', 'Transgender', 'Other'],
  blood_group: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  nationality: ['Indian', 'Other'],
  religion: ['Hindu', 'Muslim', 'Christian', 'Buddhist', 'Sikh', 'Jain', 'Other'],
  category: ['General', 'OBC', 'SC', 'ST', 'EWS'],
  sub_category: ['None', 'Ex-Serviceman', 'Sports'],
  marital_status: ['Single', 'Married', 'Divorced', 'Widowed'],
  disability_status: ['Yes', 'No'],
  disability_type: ['Visual', 'Hearing', 'Locomotor', 'Other'],
  state: ['Kerala', 'Tamil Nadu', 'Karnataka', 'Maharashtra'],
  country: ['India', 'USA', 'UK', 'Australia'],

  // Qualifications
  degree_level: ['10th', '12th', 'UG', 'PG', 'Ph.D', 'M.Phil'],
  degree_name: ['B.A.', 'B.Sc.', 'B.Tech', 'M.A.', 'M.Sc.', 'M.Tech', 'Ph.D'],
  specialization: ['Computer Science', 'Physics', 'Mathematics', 'English'],
  division: ['First', 'Second', 'Third'],
  study_mode: ['Regular', 'Distance'],
  grade_type: ['CGPA', 'Percentage', 'Grade'],

  // Eligibility Tests
  exam_name: ['NET', 'SET / SLET', 'GATE', 'JRF'],
  subject_paper: ['Commerce', 'Computer Science & Applications', 'Economics', 'Education', 'English', 'Geography', 'Hindi', 'History', 'Law', 'Library & Information Science', 'Management', 'Mathematics', 'Philosophy', 'Physics', 'Political Science', 'Psychology', 'Sanskrit', 'Social Work', 'Sociology', 'Tourism Administration & Management'],
  state_for_set: ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'],
  validity_status: ['Lifetime', 'Valid', 'Expired', 'Limited Period'],
  fellowship_agency: ['UGC', 'CSIR', 'University', 'NBHM', 'DAE'],

  // Employment Details
  designation: ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Dean'],
  department: [
    'Department Of Information Technology',
    'Department of Wood Science & Technology',
    'Department of Library and Information Science.',
    'Department of Journalism and Media Studies',
    'Department Of Mathematical Sciences',
    'Department of Statistical Sciences',
    'Department Of Biotechnology & Microbiology',
    'Department of Chemistry',
    'Department of Physics',
    'Department Of Studies In English',
    'Department Of Economics',
    'Department Of Anthropology',
    'Department of History',
  ],
  institution_type: ['State', 'Central', 'Private', 'Deemed'],
  affiliated_university: ['Kannur University', 'University of Delhi', 'Anna University', 'Mumbai University'],
  nature_of_appointment: ['Regular', 'Ad-hoc', 'Contract', 'Guest', 'Visiting', 'Deputation'],
  approval_status: ['Approved', 'Pending', 'Rejected'],
  pay_scale: ['AGP 6000', 'AGP 7000', 'AGP 8000', 'Level 10', 'Level 11'],

  // Work Experience
  designation_post: ['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer', 'HOD'],
  nature_of_work: ['Teaching', 'Research', 'Administration', 'Industry Experience', 'Consultancy'],
  employment_type: ['Full Time', 'Part Time', 'Contract', 'Temporary', 'Visiting Faculty'],
  institution_type_work: ['Government', 'Private', 'Autonomous', 'Deemed University', 'Research Institute'],
  experience_category: ['Academic', 'Industry', 'Research', 'Administrative'],
  reason_for_leaving: ['Better opportunity', 'Promotion', 'Resigned', 'Retired', 'Contract Completed', 'Other'],

  // Research & Publications
  publication_type: ['Journal', 'Conference Paper', 'Book Chapter', 'Patent', 'Thesis', 'Article'],
  publication_level: ['International', 'National', 'State', 'Institutional'],
  author_role: ['First Author', 'Co-Author', 'Corresponding Author', 'Editor'],
  indexed_in: ['Scopus', 'WoS', 'UGC Care', 'SCI', 'Google Scholar'],
  peer_reviewed_status: ['Yes', 'No'],
  journal_category: ['Q1', 'Q2', 'Q3', 'Q4', 'NA'],

  // Awards & Honours
  award_category: ['Research Award', 'Teaching Award', 'Innovation Award', 'Fellowship', 'Excellence Award', 'Young Scientist Award'],
  award_level: ['International', 'National', 'State', 'University', 'Institutional'],
  awarding_agency_type: ['Government', 'University', 'Research Organization', 'Private Institution', 'Professional Body'],
  honour_type: ['Medal', 'Certificate', 'Fellowship', 'Trophy', 'Recognition'],
  recognition_status: ['Active', 'Archived', 'Featured'],

  // Research Projects
  funding_agency: ['DST-SERB', 'UGC', 'AICTE', 'DRDO', 'ISRO', 'ICMR', 'DBT'],
  project_status: ['Ongoing', 'Completed', 'Submitted', 'Approved', 'Pending'],
  role_in_project: ['Principal Investigator', 'Co-Investigator', 'Research Associate', 'Coordinator'],
  project_category: ['Research', 'Development', 'Consultancy', 'Innovation', 'Sponsored Project'],
  funding_type: ['Government', 'Private', 'International', 'Institutional'],

  // Research Supervision
  research_degree: ['Ph.D', 'M.Phil', 'PG Dissertation', 'Post Doctorate'],
  scholar_gender: ['Male', 'Female', 'Transgender', 'Other'],
  research_status: ['Ongoing', 'Completed', 'Submitted', 'Awarded'],
  guidance_type: ['Supervisor', 'Co-Supervisor', 'Mentor', 'Advisor'],
  patent_status: ['Filed', 'Published', 'Granted', 'Pending'],
  patent_type: ['Utility Patent', 'Design Patent', 'Copyright', 'Trademark'],
  supervision_category: ['Academic', 'Research', 'Industrial Research'],

  // Academic Responsibilities
  committee_type: ['IQAC', 'BOS', 'Anti-Ragging', 'Examination Cell', 'NAAC Committee', 'Discipline Committee', 'Placement Cell'],
  responsibility_role: ['Chairman', 'Coordinator', 'Convener', 'Member', 'Head', 'Faculty Incharge'],
  course_level: ['UG', 'PG', 'Ph.D', 'Diploma', 'Certificate'],
  semester_type: ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII'],
  academic_session_type: ['Odd Semester', 'Even Semester', 'Annual', 'Trimester'],
  teaching_category: ['Core Subject', 'Elective', 'Laboratory', 'Project Guidance', 'Seminar'],
  responsibility_status: ['Active', 'Completed', 'Ongoing', 'Inactive'],
  course_name: ['Advanced Algorithms', 'Database Systems', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Data Structures', 'Machine Learning', 'Artificial Intelligence', 'Web Development'],
  programme: ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'Ph.D.', 'B.A.', 'M.A.', 'B.Com', 'M.Com', 'BBA', 'MBA', 'BCA', 'MCA'],

  // Memberships
  professional_body: ['IEEE', 'CSI', 'ACM', 'ISTE', 'IETE', 'IEI', 'IAENG', 'ACM India'],
  membership_type: ['Lifetime', 'Annual', 'Student', 'Professional', 'Institutional'],
  membership_category: ['National', 'International', 'State Level', 'Regional'],
  membership_status: ['Active', 'Expired', 'Pending', 'Suspended'],
  membership_level: ['Member', 'Senior Member', 'Fellow', 'Associate Member', 'Student Member'],
  organization_type: ['Technical Society', 'Research Organization', 'Academic Association', 'Professional Council', 'Scientific Community'],

  // Attended FDP & Workshops
  programme_type: ['FDP', 'Workshop', 'Seminar', 'Conference', 'Short Term Course', 'Refresher Course', 'Orientation Programme', 'Training Programme'],
  sponsoring_agency: ['AICTE', 'UGC', 'TEQIP', 'MHRD', 'DST', 'Self-Funded', 'University Funded', 'Institutional'],
  participation: ['Attended', 'Organized', 'Resource Person', 'Presented', 'Chaired Session'],

  // Online Courses
  course_platform: ['Coursera', 'NPTEL', 'SWAYAM', 'Udemy', 'edX', 'FutureLearn', 'IIT Online', 'Google'],
  course_type: ['Certification', 'Diploma', 'Skill Development', 'Faculty Development', 'Professional Training'],
  completion_status: ['Completed', 'Ongoing', 'In Progress', 'Certified'],
  certification_type: ['Free Certificate', 'Paid Certificate', 'Verified Certificate', 'University Certificate'],
  learning_mode: ['Online', 'Offline', 'Hybrid', 'Self Paced', 'Instructor Led'],

  // Academic International Experience
  country_visit: ['Singapore', 'USA', 'UK', 'Germany', 'Canada', 'Australia', 'Japan', 'France'],
  purpose_of_visit: ['Conference', 'Research Collaboration', 'Faculty Exchange', 'Workshop', 'Seminar', 'Training Program'],
  funding_source: ['DST Travel Grant', 'UGC', 'AICTE', 'Self Funded', 'International Fellowship', 'University Sponsorship'],
  visit_category: ['Academic', 'Research', 'Industry', 'Government', 'International Event'],
  collaboration_type: ['MoU Activity', 'Joint Research', 'Publication', 'Exchange Program', 'Technical Collaboration'],
  visit_status: ['Completed', 'Ongoing', 'Planned', 'Approved'],

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
    const FORCE = process.argv.includes('--force');
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
    console.log('✅ Dropdowns seeded');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    throw err;
  }
}




// ==========================================
// MAIN EXECUTION
// ==========================================
async function runAllSeeds() {
  try {
    console.log("🌱 Starting unified database seeding...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    await seedDropdowns();
    await seedInstitutions();
    await seedSectionConfigs();
    await seedDepartmentsHodsFaculties();
    await seedProfiles();
    await seedDemoUsers();

    console.log("\n✨ All seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Unified seeding failed:", err);
    process.exit(1);
  }
}

runAllSeeds();
