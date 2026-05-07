require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');

const ADMIN = { username: 'admin', email: 'admin@iqac.edu.in', password: 'Admin@IQAC2024' };

const DEMO_FACULTY = [
  {
    email: 'dr.priya.sharma@university.edu.in',
    fullName: 'Dr. Priya Sharma',
    profileData: {
      personalInfo: {
        firstName: 'Priya', middleName: '', lastName: 'Sharma',
        fullName: 'Dr. Priya Sharma',
        dateOfBirth: '1985-03-14', gender: 'Female', bloodGroup: 'B+',
        nationality: 'Indian', religion: 'Hindu', category: 'General',
        maritalStatus: 'Married', spouseName: 'Rahul Sharma', spouseOccupation: 'Engineer',
        mobilePersonal: '9876543210', alternatePhone: '9876543211',
        officialEmail: 'dr.priya.sharma@university.edu.in',
        personalEmail: 'priya.sharma@gmail.com',
        permanentAddress: '12, Rose Garden Colony', permanentCity: 'Pune', permanentState: 'Maharashtra', permanentPin: '411001',
        currentAddress: '12, Rose Garden Colony', currentCity: 'Pune', currentState: 'Maharashtra', currentPin: '411001',
        emergencyContactName: 'Rahul Sharma', emergencyContactMobile: '9898989898',
        photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        orcidId: '0000-0002-1234-5678', googleScholarId: 'AbCdEfGhIjK', scopusId: '57210123456',
        linkedIn: 'https://linkedin.com/in/drpriyasharma',
      },
      qualifications: [
        { degreeLevel: 'UG', degreeName: 'B.Sc.', specialization: 'Computer Science', institution: 'Fergusson College, Pune', university: 'Savitribai Phule Pune University', yearOfPassing: '2006', percentageCGPA: '78%', division: 'First', mode: 'Regular' },
        { degreeLevel: 'PG', degreeName: 'M.Sc.', specialization: 'Computer Science', institution: 'Pune University', university: 'Savitribai Phule Pune University', yearOfPassing: '2008', percentageCGPA: '82%', division: 'First', mode: 'Regular' },
        { degreeLevel: 'Ph.D', degreeName: 'Ph.D.', specialization: 'Machine Learning', institution: 'IIT Pune', university: 'IIT Pune', yearOfPassing: '2013', percentageCGPA: 'Awarded', division: 'First', mode: 'Regular' },
      ],
      eligibilityTests: [
        { examName: 'NET', subject: 'Computer Science & Applications', year: '2009', certificateNo: 'NET/2009/CS/12345' },
        { examName: 'JRF', subject: 'Computer Science', year: '2009', certificateNo: 'JRF/2009/12345' },
      ],
      employmentDetails: {
        employeeId: 'EMP-2014-CS-001', designation: 'Associate Professor', department: 'Computer Science',
        institution: 'Modern Institute of Technology', affiliatedUniversity: 'Savitribai Phule Pune University',
        dateOfAppointment: '2014-07-01', natureOfAppointment: 'Regular',
        approvalOfAppointment: 'Yes', approvalLetterNo: 'APT/2014/CS/001', approvalLetterDate: '2014-06-15',
        scaleOfPay: 'AGP 7000', currentBasicPay: '68900',
        totalExperienceYears: '10', totalExperienceMonths: '6', dateOfRetirement: '2045-03-31',
      },
      workExperience: [
        { organization: 'Symbiosis Institute of Technology', designation: 'Assistant Professor', from: '2013-08-01', to: '2014-06-30', nature: 'Teaching', reasonForLeaving: 'Better opportunity' },
      ],
      publications: [
        { type: 'journal', title: 'Deep Learning Approaches for Medical Image Segmentation', authors: 'Sharma, P., Kulkarni, R., Joshi, M.', authorRole: 'Principal', journal: 'Journal of Medical Imaging', year: '2022', volume: '9', issue: '3', issn: '2329-4302', impactFactor: '4.2', indexedIn: 'Scopus, WoS', peerReviewed: 'Yes', doi: 'https://doi.org/10.1117/1.JMI.9.3.034001' },
        { type: 'journal', title: 'Federated Learning for Privacy-Preserving Healthcare Analytics', authors: 'Sharma, P., Mehta, S.', authorRole: 'Principal', journal: 'IEEE Transactions on Neural Networks', year: '2023', volume: '34', issue: '1', issn: '2162-237X', impactFactor: '10.4', indexedIn: 'Scopus, WoS, SCIE', peerReviewed: 'Yes', doi: 'https://doi.org/10.1109/TNNLS.2023.1234' },
        { type: 'conference', title: 'Explainable AI in Clinical Decision Support', authors: 'Sharma, P., Verma, A.', journal: 'International Conference on AI in Healthcare, Singapore', year: '2023', level: 'International', presentationType: 'Oral' },
        { type: 'book', title: 'Introduction to Machine Learning with Python', authors: 'Sharma, P., Kulkarni, R.', journal: 'Oxford University Press', year: '2021', isbn: '978-0-19-886231-4', level: 'International' },
      ],
      projects: [
        { title: 'AI-Driven Diagnostic System for Early Detection of Diabetic Retinopathy', fundingAgency: 'DST-SERB', amountSanctioned: '28,00,000', duration: '3 years (2021-2024)', status: 'Completed', role: 'PI' },
        { title: 'Federated Learning Framework for Multi-Hospital Data Analysis', fundingAgency: 'ICMR', amountSanctioned: '15,00,000', duration: '2 years (2023-2025)', status: 'Ongoing', role: 'PI' },
      ],
      awards: [
        { name: 'Best Research Paper Award', awardingAgency: 'IEEE Pune Section', dateOfAward: '2022-12-10', level: 'National' },
        { name: 'Young Scientist Award', awardingAgency: 'DST, Govt. of India', dateOfAward: '2020-02-28', level: 'National' },
      ],
      patents: [
        { title: 'Method and System for Automated Retinal Disease Detection using CNN', patentNumber: 'IN202021012345', dateOfFiling: '2020-03-15', status: 'Published' },
      ],
      researchGuidance: { phdCompleted: '2', phdInProgress: '3', mphilCompleted: '4', mphilInProgress: '0', pgProjectsSupervised: '18' },
      adminResponsibilities: [
        { committeeName: 'IQAC', role: 'Member', from: '2020-06-01', to: 'Present' },
        { committeeName: 'Board of Studies — CS', role: 'Coordinator', from: '2019-06-01', to: 'Present' },
      ],
      fdpWorkshops: [
        { programTitle: 'Advanced Deep Learning Techniques', type: 'FDP', duration: '5 days', organizingInstitution: 'IIT Bombay', role: 'Attended' },
        { programTitle: 'Research Methodology and Ethics', type: 'Workshop', duration: '2 days', organizingInstitution: 'UGC-HRDC, Pune University', role: 'Resource Person' },
      ],
      memberships: [
        { professionalBody: 'Computer Society of India (CSI)', membershipType: 'Life', membershipId: 'LM-28472' },
        { professionalBody: 'IEEE', membershipType: 'Annual', membershipId: 'IEEE-94728123' },
      ],
      internationalExperience: [
        { country: 'Singapore', purpose: 'Conference', institution: 'National University of Singapore', duration: '1 week', fundingSource: 'DST Travel Grant' },
      ],
    },
  },
  {
    email: 'prof.ajay.kumar@university.edu.in',
    fullName: 'Prof. Ajay Kumar',
    profileData: {
      personalInfo: {
        firstName: 'Ajay', middleName: 'Ramesh', lastName: 'Kumar',
        fullName: 'Prof. Ajay Kumar',
        dateOfBirth: '1978-11-22', gender: 'Male', bloodGroup: 'O+',
        nationality: 'Indian', religion: 'Hindu', category: 'OBC',
        maritalStatus: 'Married', mobilePersonal: '9823456780',
        officialEmail: 'prof.ajay.kumar@university.edu.in',
        personalEmail: 'ajay.kumar@gmail.com',
        permanentAddress: '45, Shivaji Nagar', permanentCity: 'Nashik', permanentState: 'Maharashtra', permanentPin: '422001',
        currentAddress: '45, Shivaji Nagar', currentCity: 'Nashik', currentState: 'Maharashtra', currentPin: '422001',
        photoUrl: 'https://randomuser.me/api/portraits/men/36.jpg',
        googleScholarId: 'XyZ12345abcD',
      },
      qualifications: [
        { degreeLevel: 'UG', degreeName: 'B.E.', specialization: 'Electronics & Telecom', institution: 'PVPIT Nashik', university: 'SPPU', yearOfPassing: '2000', percentageCGPA: '72%', division: 'First', mode: 'Regular' },
        { degreeLevel: 'PG', degreeName: 'M.E.', specialization: 'VLSI Design', institution: 'VJTI Mumbai', university: 'Mumbai University', yearOfPassing: '2003', percentageCGPA: '79%', division: 'First', mode: 'Regular' },
        { degreeLevel: 'Ph.D', degreeName: 'Ph.D.', specialization: 'Embedded Systems', institution: 'VNIT Nagpur', university: 'VNIT', yearOfPassing: '2010', division: 'First', mode: 'Regular' },
      ],
      eligibilityTests: [
        { examName: 'GATE', subject: 'Electronics & Communication', year: '2001', score: '782/1000' },
      ],
      employmentDetails: {
        employeeId: 'EMP-2011-EC-007', designation: 'Professor', department: 'Electronics & Telecommunication',
        institution: 'Modern Institute of Technology', affiliatedUniversity: 'Savitribai Phule Pune University',
        dateOfAppointment: '2011-07-15', natureOfAppointment: 'Regular',
        totalExperienceYears: '13', totalExperienceMonths: '0',
      },
      workExperience: [
        { organization: 'Infosys Technologies', designation: 'Systems Engineer', from: '2003-06-01', to: '2007-05-31', nature: 'Industry', reasonForLeaving: 'Moved to academia' },
        { organization: 'SVIT Nashik', designation: 'Assistant Professor', from: '2007-07-01', to: '2011-06-30', nature: 'Teaching', reasonForLeaving: 'Promotion' },
      ],
      publications: [
        { type: 'journal', title: 'Low-Power VLSI Design Techniques for IoT Devices', authors: 'Kumar, A., Patil, S.', authorRole: 'Principal', journal: 'IEEE Transactions on VLSI Systems', year: '2021', issn: '1063-8210', impactFactor: '3.8', indexedIn: 'Scopus, SCIE', peerReviewed: 'Yes' },
        { type: 'conference', title: 'FPGA Implementation of Neural Network Accelerator', authors: 'Kumar, A., Mehta, R., Singh, P.', journal: 'International Symposium on VLSI Design, Bangalore', year: '2022', level: 'National', presentationType: 'Oral' },
      ],
      projects: [
        { title: 'Smart Agriculture Monitoring using IoT and Edge Computing', fundingAgency: 'AICTE-RPS', amountSanctioned: '12,50,000', duration: '2 years (2022-2024)', status: 'Ongoing', role: 'PI' },
      ],
      awards: [
        { name: 'Best Teacher Award', awardingAgency: 'Modern Institute of Technology', dateOfAward: '2019-01-15', level: 'University' },
      ],
      researchGuidance: { phdCompleted: '1', phdInProgress: '2', mphilCompleted: '0', pgProjectsSupervised: '12' },
      memberships: [
        { professionalBody: 'IETE', membershipType: 'Life', membershipId: 'LM-56784' },
      ],
    },
  },
  {
    email: 'ms.kavitha.r@university.edu.in',
    fullName: 'Ms. Kavitha R.',
    profileData: {
      personalInfo: {
        firstName: 'Kavitha', lastName: 'R.',
        fullName: 'Ms. Kavitha R.',
        dateOfBirth: '1992-07-05', gender: 'Female', bloodGroup: 'A+',
        nationality: 'Indian', category: 'General',
        mobilePersonal: '9745678901',
        officialEmail: 'ms.kavitha.r@university.edu.in',
        permanentCity: 'Chennai', permanentState: 'Tamil Nadu',
        photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
      },
      qualifications: [
        { degreeLevel: 'UG', degreeName: 'B.Com.', specialization: 'Commerce', institution: 'Stella Maris College, Chennai', university: 'University of Madras', yearOfPassing: '2013', percentageCGPA: '85%', division: 'First', mode: 'Regular' },
        { degreeLevel: 'PG', degreeName: 'M.Com.', specialization: 'Accounting & Finance', institution: 'Presidency College, Chennai', university: 'University of Madras', yearOfPassing: '2015', percentageCGPA: '80%', division: 'First', mode: 'Regular' },
        { degreeLevel: 'PG', degreeName: 'MBA', specialization: 'Finance', institution: 'Anna University', university: 'Anna University', yearOfPassing: '2017', percentageCGPA: '8.2 CGPA', division: 'First', mode: 'Regular' },
      ],
      eligibilityTests: [
        { examName: 'SET', subject: 'Commerce', year: '2016', state: 'Tamil Nadu' },
        { examName: 'NET', subject: 'Commerce', year: '2017', certificateNo: 'NET/2017/COM/78901' },
      ],
      employmentDetails: {
        employeeId: 'EMP-2019-COM-012', designation: 'Assistant Professor', department: 'Commerce & Management',
        institution: 'Modern Institute of Technology', affiliatedUniversity: 'Savitribai Phule Pune University',
        dateOfAppointment: '2019-08-01', natureOfAppointment: 'Regular',
        totalExperienceYears: '5', totalExperienceMonths: '8',
      },
    },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Admin
    const existingAdmin = await User.findOne({ username: ADMIN.username });
    if (!existingAdmin) {
      await User.create({ ...ADMIN, role: 'admin', isFirstLogin: false, isActive: true });
      console.log('✅ Admin created:', ADMIN.username, '/', ADMIN.password);
    } else {
      console.log('⚠️  Admin already exists');
    }

    // Demo faculty
    for (const f of DEMO_FACULTY) {
      const existing = await User.findOne({ email: f.email });
      if (existing) { console.log(`⚠️  Faculty ${f.email} already exists — skipping`); continue; }

      const baseUsername = f.email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
      let username = baseUsername;
      let c = 1;
      while (await User.findOne({ username })) username = `${baseUsername}${c++}`;

      const user = await User.create({
        username, email: f.email, password: 'password123',
        role: 'faculty', isFirstLogin: false, isActive: true,
      });

      const completion = f.profileData.publications ? 80 : f.profileData.qualifications?.length > 1 ? 50 : 30;

      await Faculty.create({
        userId: user._id, username,
        profileComplete: completion >= 20,
        completionPercentage: completion,
        ...f.profileData,
        personalInfo: {
          ...(f.profileData.personalInfo || {}),
          fullName: f.fullName,
        },
      });

      console.log(`✅ Faculty created: ${f.fullName} (${username}) — completion: ${completion}%`);
    }

    console.log('\n🎉 Seed complete!');
    console.log('   Admin     → admin / Admin@IQAC2024');
    console.log('   Faculty   → any seeded email / password123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
