const express = require('express');
const Faculty = require('../models/Faculty');
const User = require('../models/User');

const router = express.Router();

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
