const express = require('express');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const DropdownConfig = require('../models/DropdownConfig');
const SectionConfig = require('../models/SectionConfig');

const router = express.Router();

const ALLOWED_DROPDOWN_KEYS = [
  'gender', 'blood_group', 'nationality', 'religion', 'category', 'sub_category', 'marital_status', 'disability_status', 'disability_type', 'state', 'country',
  'degree_level', 'degree_name', 'specialization', 'division', 'study_mode', 'grade_type',
  'exam_name', 'subject_paper', 'state_for_set', 'validity_status', 'fellowship_agency',
  'designation', 'department', 'institution_type', 'affiliated_university', 'nature_of_appointment', 'approval_status', 'pay_scale',
  'designation_post', 'nature_of_work', 'employment_type', 'institution_type_work', 'experience_category', 'reason_for_leaving',
  'publication_type', 'publication_level', 'author_role', 'indexed_in', 'peer_reviewed_status', 'journal_category',
  'award_category', 'award_level', 'awarding_agency_type', 'honour_type', 'recognition_status',
  'funding_agency', 'project_status', 'role_in_project', 'project_category', 'funding_type',
  'research_degree', 'scholar_gender', 'research_status', 'guidance_type', 'patent_status', 'patent_type', 'supervision_category',
  'committee_type', 'responsibility_role', 'course_level', 'semester_type', 'academic_session_type', 'teaching_category', 'responsibility_status',
  'admin_charge', 'academic_admin', 'quality_assurance', 'research_innovation', 'examination_evaluation', 'admin_support', 'departmental_charges', 'special_assignments', 'extra_institutional',
  'country_visit', 'purpose_of_visit', 'funding_source', 'visit_category', 'collaboration_type', 'visit_status',
  'document_type', 'institutions'
];

router.get('/sections-config', async (req, res) => {
  try {
    const configs = await SectionConfig.find({}).sort('order');
    res.json(configs);
  } catch (err) {
    console.error('Error fetching section configs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dropdowns', async (req, res) => {
  try {
    const dropdowns = await DropdownConfig.find({ key: { $in: ALLOWED_DROPDOWN_KEYS } });
    const response = {};
    dropdowns.forEach(dl => { response[dl.key] = dl.options; });
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/sections-config', async (req, res) => {
  try {
    const sections = await SectionConfig.find().sort({ sectionId: 1 });
    res.json(sections.map(s => ({
      id: s.sectionId,
      sectionId: s.sectionId,
      title: s.title,
      configs: s.configs,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/profile/:username — public profile (no auth)
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username, role: 'faculty', isActive: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Profile not found' });

    const faculty = await Faculty.findOne({ userId: user._id });
    if (!faculty || !faculty.profileComplete) {
      return res.status(404).json({ message: 'Profile not available' });
    }

    const vis = faculty.visibility;
    const publicProfile = {
      username: user.username,
      personalInfo: vis.personalInfo ? {
        fullName: faculty.personalInfo.fullName,
        firstName: faculty.personalInfo.firstName,
        lastName: faculty.personalInfo.lastName,
        designation: faculty.employmentDetails?.designation,
        department: faculty.employmentDetails?.department,
        institution: faculty.employmentDetails?.institution,
        officialEmail: faculty.personalInfo.officialEmail || faculty.personalInfo.officialEmailId,
        mobilePersonal: faculty.personalInfo.mobilePersonal || faculty.personalInfo.mobileNumber,
        photoUrl: vis.photo ? faculty.personalInfo.photoUrl : null,
        orcidId: faculty.personalInfo.orcidId,
        googleScholarId: faculty.personalInfo.googleScholarId,
        scopusId: faculty.personalInfo.scopusId,
        linkedIn: faculty.personalInfo.linkedIn,
        website: faculty.personalInfo.website,
      } : null,
      employmentDetails: vis.employmentDetails ? faculty.employmentDetails : null,
      qualifications: vis.qualifications ? faculty.qualifications : [],
      eligibilityTests: vis.eligibilityTests ? faculty.eligibilityTests : [],
      workExperience: vis.workExperience ? faculty.workExperience : [],
      publications: vis.publications ? faculty.publications : [],
      projects: vis.projects ? faculty.projects : [],
      awards: vis.awards ? faculty.awards : [],
      patents: vis.patents ? faculty.patents : [],
      researchGuidance: vis.researchGuidance ? faculty.researchGuidance : null,
      adminResponsibilities: vis.adminResponsibilities ? faculty.adminResponsibilities : [],
      fdpWorkshops: vis.fdpWorkshops ? faculty.fdpWorkshops : [],
      memberships: vis.memberships ? faculty.memberships : [],
      internationalExperience: vis.internationalExperience ? faculty.internationalExperience : [],
      adminNonAcademicResponsibilities: vis.adminNonAcademicResponsibilities ? faculty.adminNonAcademicResponsibilities : [],
      academicAdministration: vis.academicAdministration ? faculty.academicAdministration : [],
      qualityAssurance: vis.qualityAssurance ? faculty.qualityAssurance : [],
      researchAndInnovation: vis.researchAndInnovation ? faculty.researchAndInnovation : [],
      examinationAndEvaluation: vis.examinationAndEvaluation ? faculty.examinationAndEvaluation : [],
      administrativeSupport: vis.administrativeSupport ? faculty.administrativeSupport : [],
      departmentalCharges: vis.departmentalCharges ? faculty.departmentalCharges : [],
      specialAssignments: vis.specialAssignments ? faculty.specialAssignments : [],
      extraInstitutionalActivities: vis.extraInstitutionalActivities ? faculty.extraInstitutionalActivities : [],
    };

    res.json(publicProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/profile — list all public profiles (directory)
router.get('/', async (req, res) => {
  try {
    const faculties = await Faculty.find({ profileComplete: true })
      .select('username personalInfo.fullName personalInfo.designation personalInfo.department personalInfo.photoUrl completionPercentage visibility');

    const publicList = faculties
      .filter(f => f.visibility.personalInfo)
      .map(f => ({
        username: f.username,
        fullName: f.personalInfo.fullName,
        designation: f.personalInfo.designation,
        department: f.personalInfo.department,
        photoUrl: f.personalInfo.photoUrl,
        completionPercentage: f.completionPercentage,
      }));

    res.json(publicList);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
