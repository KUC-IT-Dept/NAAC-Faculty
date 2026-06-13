require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Department = require('./models/Department');

const ADMIN = { username: 'admin', email: 'admin@iqac.edu.in', password: 'Admin@IQAC2024' };
const VC_USER = { username: 'vc', email: 'vc@iqac.edu.in', password: 'VC@IQAC2024' };

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

const HODS = [
  { email: 'hod.cs@university.edu.in', dept: 'Computer Science', username: 'hod.cs' },
  { email: 'psychologyhod@gmail.com', dept: 'Psychology', username: 'psychologyhod' },
  { email: 'hod.maths@university.edu.in', dept: 'Mathematics', username: 'hod.maths' },
];

const FACULTIES = [
  { email: 'dr.priya.sharma@university.edu.in', name: 'Dr. Priya Sharma', dept: 'Computer Science', designation: 'Associate Professor', username: 'dr.priya.sharma' },
  { email: 'prof.ajay.kumar@university.edu.in', name: 'Prof. Ajay Kumar', dept: 'Computer Science', designation: 'Professor', username: 'prof.ajay.kumar' },
  { email: 'ms.kavitha.r@university.edu.in', name: 'Ms. Kavitha R.', dept: 'Computer Science', designation: 'Assistant Professor', username: 'ms.kavitha.r' },
  { email: 'dr.ramesh.patel@university.edu.in', name: 'Dr. Ramesh Patel', dept: 'Computer Science', designation: 'Assistant Professor', username: 'dr.ramesh.patel' },
  { email: 'dr.anjali.gupta@university.edu.in', name: 'Dr. Anjali Gupta', dept: 'Computer Science', designation: 'Associate Professor', username: 'dr.anjali.gupta' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Flush Database
    console.log('🗑️  Flushing old faculty, HODs, and departments...');
    await User.deleteMany({ role: { $nin: ['admin', 'vc'] } });
    await Faculty.deleteMany({});
    await Department.deleteMany({});
    console.log('✅ Old data flushed');

    // 2. Admin & VC setup
    for (const adminOrVc of [
      { ...ADMIN, role: 'admin' },
      { ...VC_USER, role: 'vc' }
    ]) {
      const exists = await User.findOne({ username: adminOrVc.username });
      if (!exists) {
        await User.create({ ...adminOrVc, isFirstLogin: false, isActive: true });
        console.log(`✅ ${adminOrVc.role.toUpperCase()} created`);
      } else {
        console.log(`⚠️  ${adminOrVc.role.toUpperCase()} already exists`);
      }
    }

    // 3. Seed HODs
    for (const h of HODS) {
      const user = await User.create({
        username: h.username,
        email: h.email,
        password: 'password123',
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
        username: f.username,
        email: f.email,
        password: 'password123',
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

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
