require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const SectionConfig = require('./models/SectionConfig');

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
      { name: 'Responsibility Status', optionsKey: 'responsibilityStatusOptions' }
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

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding SectionConfigs');

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
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
