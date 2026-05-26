/**
 * seedProfiles.js
 *
 * Seeds form-aligned profile data for all users in the database.
 * - Safe to re-run (upserts by user id)
 * - Creates reusable placeholder upload assets (PDF + PNG)
 *
 * Usage:
 *   node seedProfiles.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');
const Profile = require('./models/Profile');

const UPLOAD_SUBDIR = 'seed';
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', UPLOAD_SUBDIR);

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8Bf8cAAAAASUVORK5CYII=';

const TINY_PDF_TEXT = [
  '%PDF-1.1',
  '1 0 obj',
  '<< /Type /Catalog /Pages 2 0 R >>',
  'endobj',
  '2 0 obj',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  'endobj',
  '3 0 obj',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << >> >>',
  'endobj',
  '4 0 obj',
  '<< /Length 44 >>',
  'stream',
  'BT /F1 12 Tf 72 100 Td (ProfCV Seed Asset) Tj ET',
  'endstream',
  'endobj',
  'xref',
  '0 5',
  '0000000000 65535 f ',
  '0000000010 00000 n ',
  '0000000060 00000 n ',
  '0000000117 00000 n ',
  '0000000228 00000 n ',
  'trailer',
  '<< /Root 1 0 R /Size 5 >>',
  'startxref',
  '320',
  '%%EOF',
].join('\n');

const SUBJECTS_BY_DEPARTMENT = {
  'Computer Science': [
    'Data Structures',
    'Operating Systems',
    'Cloud Computing',
    'Machine Learning',
    'Compiler Design',
    'Distributed Systems',
    'DBMS',
    'Computer Networks',
  ],
  Physics: [
    'Quantum Mechanics',
    'Electromagnetism',
    'Statistical Mechanics',
    'Condensed Matter Physics',
    'Computational Physics',
    'Astrophysics',
  ],
  default: [
    'Research Methodology',
    'Academic Writing',
    'Professional Ethics',
    'Interdisciplinary Studies',
    'Data Interpretation',
  ],
};

const INTEREST_POOL = [
  'AI',
  'ML',
  'IoT',
  'Data Visualization',
  'STEM Outreach',
  'Open Source',
  'Academic Leadership',
  'Policy Research',
  'Sustainable Computing',
  'Quantum Materials',
  'Science Communication',
  'EdTech',
];

const INDIAN_STATES = [
  'Karnataka',
  'Tamil Nadu',
  'Maharashtra',
  'Delhi',
  'Telangana',
  'Kerala',
  'Gujarat',
  'Rajasthan',
];

const INSTITUTIONS = [
  'ProfCV University',
  'National Institute of Technology',
  'Indian Institute of Science',
  'Institute of Advanced Studies',
  'Center for Applied Research',
  'Global University of Science',
];

const UNIVERSITIES = [
  'Anna University',
  'IIT Bombay',
  'IIT Madras',
  'University of Delhi',
  'JNTU Hyderabad',
  'Savitribai Phule Pune University',
  'Calcutta University',
  'Osmania University',
];

const JOURNALS = [
  'IEEE Transactions on Education',
  'ACM Transactions on Computing Education',
  'Journal of Applied Research in Higher Education',
  'Computers and Education',
  'International Journal of Advanced Research',
  'Springer Nature Scientific Reports',
];

const ORGANISATIONS = ['IEEE', 'ACM', 'Springer', 'Elsevier', 'Taylor & Francis', 'Wiley'];

const FUNDING_AGENCIES = ['DST', 'UGC', 'AICTE', 'ICSSR', 'CSIR', 'NBHM'];

const MEMBERSHIP_BODIES = [
  'IEEE',
  'ACM',
  'Indian Society for Technical Education',
  'Computer Society of India',
  'Indian Physics Association',
  'Royal Society of Chemistry',
];

const YOUTUBE_LINKS = [
  'https://www.youtube.com/watch?v=aircAruvnKk',
  'https://www.youtube.com/watch?v=WiTgn5QH_HU',
  'https://www.youtube.com/watch?v=IMdPTUf6AnI',
  'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  'https://www.youtube.com/watch?v=5MgBikgcWnY',
  'https://www.youtube.com/watch?v=6Jfk8ic3KVk',
];

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function pick(list, seed, offset = 0) {
  return list[(seed + offset) % list.length];
}

function sample(list, count, seed) {
  const selected = [];
  for (let i = 0; i < count; i += 1) {
    selected.push(pick(list, seed, i * 3));
  }
  return [...new Set(selected)].slice(0, count);
}

function writeAsset(filename, type) {
  const absolutePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(absolutePath)) {
    if (type === 'png') {
      fs.writeFileSync(absolutePath, Buffer.from(TINY_PNG_BASE64, 'base64'));
    } else {
      fs.writeFileSync(absolutePath, TINY_PDF_TEXT, 'utf8');
    }
  }
  return `/uploads/${UPLOAD_SUBDIR}/${filename}`;
}

function buildAssets(slug) {
  return {
    photo: writeAsset(`${slug}-photo.png`, 'png'),
    signature: writeAsset(`${slug}-signature.png`, 'png'),
    passportPhoto: writeAsset(`${slug}-passport-photo.png`, 'png'),
    dobProof: writeAsset(`${slug}-dob-proof.pdf`, 'pdf'),
    categoryCertificate: writeAsset(`${slug}-category-certificate.pdf`, 'pdf'),
    degreeCertificates: writeAsset(`${slug}-degree-certificates.pdf`, 'pdf'),
    netSetJrfCertificate: writeAsset(`${slug}-net-set-jrf-certificate.pdf`, 'pdf'),
    experienceCertificates: writeAsset(`${slug}-experience-certificates.pdf`, 'pdf'),
    appointmentOrders: writeAsset(`${slug}-appointment-orders.pdf`, 'pdf'),
    awardCertificates: writeAsset(`${slug}-award-certificates.pdf`, 'pdf'),
    publicationProofs: writeAsset(`${slug}-publication-proofs.pdf`, 'pdf'),
    aadhaarCard: writeAsset(`${slug}-aadhaar-card.pdf`, 'pdf'),
    panCard: writeAsset(`${slug}-pan-card.pdf`, 'pdf'),
    cv: writeAsset(`${slug}-cv.pdf`, 'pdf'),
    researchStatement: writeAsset(`${slug}-research-statement.pdf`, 'pdf'),
    teachingPortfolio: writeAsset(`${slug}-teaching-portfolio.pdf`, 'pdf'),
    profileImage: writeAsset(`${slug}-profile-image.png`, 'png'),
  };
}

function roleSummary(role) {
  if (role === 'SUPERADMIN') return 'Platform Administration and Institutional Data Governance';
  if (role === 'VC') return 'Higher Education Leadership and Strategic Research Governance';
  if (role === 'HOD') return 'Academic Administration, Faculty Development, and Curriculum Planning';
  return 'Teaching, Research, Mentoring, and Academic Service';
}

function buildQualifications(seed, assets, department) {
  const state = pick(INDIAN_STATES, seed);
  const ugYear = 2008 + (seed % 8);
  const pgYear = ugYear + 2;
  const phdYear = pgYear + 4;

  return [
    {
      educationlevel: 'Undergraduate',
      degree: `B.Tech in ${department || 'Engineering'}`,
      specialisation: `${department || 'General Studies'}`,
      institution: pick(INSTITUTIONS, seed, 1),
      university: pick(UNIVERSITIES, seed, 1),
      yearofpassing: String(ugYear),
      year: String(ugYear),
      cgpa: `${8 + (seed % 2)}.${(seed % 9) + 1}/10`,
      grade: 'First Class with Distinction',
      division: 'First',
      mode: 'regular',
      country: 'India',
      state,
      tenthcertificate: assets.degreeCertificates,
      twelfthcertificate: assets.degreeCertificates,
      ugcertificate: assets.degreeCertificates,
      pgcertificate: '',
      mphilcertificate: '',
      phdcertificate: '',
    },
    {
      educationlevel: 'Postgraduate',
      degree: `M.Tech in ${department || 'Applied Sciences'}`,
      specialisation: `${department || 'Research Studies'}`,
      institution: pick(INSTITUTIONS, seed, 2),
      university: pick(UNIVERSITIES, seed, 2),
      yearofpassing: String(pgYear),
      year: String(pgYear),
      cgpa: `${8 + ((seed + 1) % 2)}.${((seed + 3) % 9) + 1}/10`,
      grade: 'Distinction',
      division: 'First',
      mode: 'regular',
      country: 'India',
      state,
      tenthcertificate: assets.degreeCertificates,
      twelfthcertificate: assets.degreeCertificates,
      ugcertificate: assets.degreeCertificates,
      pgcertificate: assets.degreeCertificates,
      mphilcertificate: '',
      phdcertificate: '',
    },
    {
      educationlevel: 'Ph.D.',
      degree: `Ph.D. in ${department || 'Interdisciplinary Studies'}`,
      specialisation: `${department || 'Advanced Research'}`,
      institution: pick(INSTITUTIONS, seed, 3),
      university: pick(UNIVERSITIES, seed, 3),
      yearofpassing: String(phdYear),
      year: String(phdYear),
      cgpa: 'Awarded',
      grade: 'Awarded',
      division: 'First',
      mode: 'regular',
      country: 'India',
      state,
      tenthcertificate: assets.degreeCertificates,
      twelfthcertificate: assets.degreeCertificates,
      ugcertificate: assets.degreeCertificates,
      pgcertificate: assets.degreeCertificates,
      mphilcertificate: assets.degreeCertificates,
      phdcertificate: assets.degreeCertificates,
    },
  ];
}

function buildWorkExperiences(seed, department) {
  return [
    {
      institutionName: pick(INSTITUTIONS, seed, 0),
      designation: 'Assistant Professor',
      department: department || 'Interdisciplinary Studies',
      fromDate: `201${seed % 6}-07-01`,
      toDate: `201${(seed % 6) + 2}-06-30`,
      totalDuration: '2 years',
      natureOfAppointment: 'Regular',
      reasonForLeaving: 'Career progression',
    },
    {
      institutionName: 'ProfCV University',
      designation: 'Associate Professor',
      department: department || 'Interdisciplinary Studies',
      fromDate: `201${(seed % 5) + 3}-07-01`,
      toDate: '',
      totalDuration: 'Present',
      natureOfAppointment: 'Regular',
      reasonForLeaving: '',
    },
  ];
}

function buildPublications(seed, slug, role) {
  const count = role === 'TEACHER' ? 4 : role === 'HOD' ? 3 : 2;
  const publicationTypes = [
    'Journal Articles',
    'Conference Papers',
    'Book Chapters',
    'Books Authored / Edited',
  ];

  return Array.from({ length: count }, (_, idx) => {
    const year = 2025 - idx;
    return {
      publicationType: pick(publicationTypes, seed, idx),
      title: `Form-Aligned Research Study ${idx + 1} by ${slug.replace(/-/g, ' ')}`,
      authors: `${slug.replace(/-/g, ' ')} et al.`,
      journal: pick(JOURNALS, seed, idx),
      organisation: pick(ORGANISATIONS, seed, idx),
      volume: `${10 + idx}`,
      issue: `${(idx % 4) + 1}`,
      month: pick(['January', 'March', 'June', 'September'], seed, idx),
      year: String(year),
      pages: `${100 + idx * 12}-${108 + idx * 12}`,
      doi: `10.${1200 + (seed % 700)}/${slug}.paper.${idx + 1}`,
      url: `https://example.org/publications/${slug}-${idx + 1}`,
      issn: `2345-67${(idx + 1) % 10}${(idx + 4) % 10}`,
      indexedIn: 'Scopus',
      impactFactor: `${(2.1 + idx * 0.3).toFixed(2)}`,
      conferenceName: idx % 2 === 0 ? 'International Academic Research Conference' : '',
      nationalInternational: idx % 2 === 0 ? 'International' : 'National',
      venueDate: idx % 2 === 0 ? `Bengaluru, ${year}` : '',
      organizedBy: idx % 2 === 0 ? pick(ORGANISATIONS, seed, idx + 1) : '',
      publishedInProceedings: idx % 2 === 0 ? 'Yes' : 'No',
    };
  });
}

function buildProjects(seed, slug, role) {
  const count = role === 'TEACHER' ? 3 : 2;
  return Array.from({ length: count }, (_, idx) => {
    const fromYear = 2020 + idx;
    const toYear = fromYear + 2;
    const status = idx % 2 === 0 ? 'Ongoing' : 'Completed';
    const amount = `INR ${(8 + idx * 2).toFixed(1)} Lakhs`;

    return {
      title: `Academic Project ${idx + 1} - ${slug}`,
      description:
        'A seeded project entry aligned to the Profile Builder form, including funding, role, duration, and project metadata.',
      year: `${fromYear}-${toYear}`,
      url: `https://example.org/projects/${slug}-${idx + 1}`,
      fundingAgency: pick(FUNDING_AGENCIES, seed, idx),
      role: idx % 2 === 0 ? 'Principal Investigator' : 'Co-PI',
      amount,
      sanctionedAmount: amount,
      duration: `${fromYear} to ${toYear}`,
      durationFrom: `${fromYear}-04-01`,
      durationTo: `${toYear}-03-31`,
      status,
      referenceNumber: `PCV-${slug.toUpperCase()}-${fromYear}-${idx + 1}`,
    };
  });
}

function buildProfessionalDetails(seed, department) {
  const joinYear = 2010 + (seed % 8);
  return {
    employeeId: `PCV-${9000 + (seed % 999)}`,
    designation: pick(['Assistant Professor', 'Associate Professor', 'Professor'], seed),
    department: department || 'Interdisciplinary Studies',
    institutionName: 'ProfCV University',
    affiliatedUniversity: pick(UNIVERSITIES, seed),
    institutionType: pick(['Government', 'Aided', 'Private', 'Deemed', 'Central University'], seed),
    natureOfAppointment: 'Regular',
    dateOfJoining: `${joinYear}-07-01`,
    dateOfConfirmation: `${joinYear + 2}-07-01`,
    payBand: `PB-${3 + (seed % 2)} / AGP ${(7000 + (seed % 4) * 1000)}`,
    bankAccountDetails: `A/C XXXX${(1000 + (seed % 9000)).toString()}`,
    pfNumber: `PF-${100000 + (seed % 900000)}`,
    serviceBookNumber: `SB-${20000 + (seed % 80000)}`,
    dateOfFirstPromotion: `${joinYear + 4}-07-01`,
    natureOfFirstAppointment: 'Regular',
    firstPayBand: 'PB-3 / AGP 8000',
    dateOfSecondPromotion: `${joinYear + 8}-07-01`,
    natureOfSecondAppointment: 'Regular',
    secondPayBand: 'PB-4 / AGP 9000',
    dateOfThirdPromotion: `${joinYear + 12}-07-01`,
    natureOfThirdAppointment: 'Regular',
    thirdPayBand: 'PB-4 / AGP 10000',

    // Additional keys currently used by UI section component.
    collegeName: 'ProfCV University',
    universityAffiliation: pick(UNIVERSITIES, seed, 1),
    appointmentNature: 'Regular',
    payScale: `Level-${10 + (seed % 4)}`,
    accountNumber: `12345678${1000 + (seed % 9000)}`,
    ifscCode: `PROF000${100 + (seed % 900)}`,
    bankName: 'State Bank of India',
    branchName: pick(['City Branch', 'Main Campus Branch', 'University Branch'], seed),
    promotions: [
      { date: `${joinYear + 4}-07-01`, nature: 'Associate Professor', payScale: 'Level-13A' },
      { date: `${joinYear + 8}-07-01`, nature: 'Professor', payScale: 'Level-14' },
    ],
  };
}

function buildProfileForUser(user) {
  const slug = slugify(user.email.split('@')[0]);
  const seed = hashString(user.email);
  const department = user.department || 'General';
  const assets = buildAssets(slug);
  const roleText = roleSummary(user.role);

  const subjects = sample(
    SUBJECTS_BY_DEPARTMENT[department] || SUBJECTS_BY_DEPARTMENT.default,
    user.role === 'TEACHER' ? 5 : 3,
    seed
  );

  const interests = sample(INTEREST_POOL, 5, seed + 3);

  return {
    bio: `${user.name} works in ${department} and focuses on ${roleText}. This profile is seeded with realistic sample data to match the Profile Builder form sections for demos and QA.`,
    headline: `${user.role} | ${department} | ${roleText}`,
    photo: assets.photo,

    // Personal information section
    dob: `${1976 + (seed % 15)}-0${(seed % 8) + 1}-1${seed % 9}`,
    gender: pick(['Male', 'Female', 'Other'], seed),
    phoneNumber: `+91-98${100000 + (seed % 899999)}`,
    address: `${10 + (seed % 50)}, Knowledge Park Road, ${pick(['Bengaluru', 'Chennai', 'Hyderabad', 'Pune'], seed)}`,
    mobileNumber: `+91-99${100000 + ((seed + 31) % 899999)}`,
    alternatePhone: `+91-97${100000 + ((seed + 73) % 899999)}`,
    officialEmail: user.email,
    personalEmail: `${slug}@mailinator.example`,
    aadhaar: `XXXX-XXXX-${1000 + (seed % 9000)}`,
    passport: `P${1000000 + (seed % 9000000)}`,
    nationality: 'Indian',
    stateCity: `${pick(INDIAN_STATES, seed)} / ${pick(['Bengaluru', 'Chennai', 'Pune', 'Delhi'], seed, 2)}`,
    permanentAddress: `${pick(INDIAN_STATES, seed, 1)} - Permanent Residence`,
    currentAddress: `${pick(['Faculty Quarters', 'University Township', 'Research Park'], seed)} Block ${1 + (seed % 9)}`,
    religion: pick(['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain'], seed),
    category: pick(['General', 'OBC', 'SC', 'ST'], seed),
    subCategory: pick(['N/A', 'Women', 'PwD', 'EWS'], seed),
    differentlyAbled: pick(['No', 'Yes'], seed),
    maritalStatus: pick(['Married', 'Single'], seed),
    spouse: pick(['Not Applicable', 'Working Professional', 'Academic'], seed),
    emergencyContact: `+91-96${100000 + ((seed + 11) % 899999)}`,
    panNumber: `ABCDE${1000 + (seed % 9000)}F`,
    bloodGroup: pick(['A+', 'B+', 'AB+', 'O+', 'A-', 'O-'], seed),

    subjects,
    interests,
    qualifications: buildQualifications(seed, assets, department),
    workExperiences: buildWorkExperiences(seed, department),
    publications: buildPublications(seed, slug, user.role),
    projects: buildProjects(seed, slug, user.role),

    internationalExperiences: [
      {
        countryVisited: pick(['Germany', 'USA', 'UK', 'Japan', 'France'], seed),
        purpose: 'Conference',
        institutionName: pick(INSTITUTIONS, seed, 4),
        duration: '2 weeks',
        fundingSource: pick(['University Grant', 'DST', 'Self'], seed),
      },
      {
        countryVisited: pick(['Singapore', 'Canada', 'Australia', 'Netherlands'], seed, 3),
        purpose: 'Research',
        institutionName: pick(INSTITUTIONS, seed, 5),
        duration: '1 month',
        fundingSource: pick(['SERB Grant', 'Host Institution', 'Institutional Fund'], seed, 2),
      },
    ],

    professionalMemberships: [
      {
        bodyName: pick(MEMBERSHIP_BODIES, seed),
        membershipType: 'Life',
        membershipId: `MEM-${10000 + (seed % 90000)}`,
        yearOfJoining: String(2014 + (seed % 8)),
      },
      {
        bodyName: pick(MEMBERSHIP_BODIES, seed, 2),
        membershipType: 'Annual',
        membershipId: `MEM-${20000 + (seed % 70000)}`,
        yearOfJoining: String(2018 + (seed % 5)),
      },
    ],

    trainings: [
      {
        programName: 'Outcome Based Education FDP',
        type: 'FDP',
        organizedBy: 'IQAC and Academic Staff College',
        durationDates: 'Jan 15-20, 2025',
        mode: 'Online',
        certificate: 'Yes',
      },
      {
        programName: 'Research Methodology Workshop',
        type: 'Workshop',
        organizedBy: 'Research and Development Cell',
        durationDates: 'Aug 05-08, 2024',
        mode: 'Offline',
        certificate: 'Yes',
      },
    ],

    customDetails: [
      {
        sectionTitle: 'Awards and Recognition',
        content: 'Best Faculty Mentor Award (2024), Department Excellence Award (2023), and invited keynote sessions at national conferences.',
        isVisible: true,
      },
      {
        sectionTitle: 'Administrative Contributions',
        content: 'Member of Board of Studies, NAAC criteria committee contributor, and mentor for institutional innovation projects.',
        isVisible: true,
      },
    ],

    professionalDetails: buildProfessionalDetails(seed, department),

    entranceTests: {
      net: { subject: department, year: String(2008 + (seed % 8)), certificateNo: `NET-${1000 + (seed % 9000)}` },
      set: { subject: department, year: String(2007 + (seed % 8)), state: pick(INDIAN_STATES, seed, 2) },
      gate: { score: `${500 + (seed % 300)}`, year: String(2006 + (seed % 10)) },
      jrf: { agency: pick(['UGC', 'CSIR', 'DBT'], seed), year: String(2009 + (seed % 7)) },
      other: 'Completed institutional pedagogical certification and research ethics training.',
    },

    academicResponsibilities: {
      courses: [
        { course: subjects[0] || 'Core Subject', year: '2024', programme: 'UG', subject: department },
        { course: subjects[1] || 'Elective Subject', year: '2025', programme: 'PG', subject: department },
      ],
      classesHandled: 'UG and PG classes, including project supervision and lab mentoring.',
      administrativeRoles: user.role === 'HOD' ? 'Head of Department, Timetable Coordinator' : 'Class Coordinator, Program Committee Member',
      committeeMemberships: 'Board of Studies, Examination Committee, Research Advisory Committee',
    },

    awards: [
      {
        name: 'Excellence in Teaching Award',
        awardingBody: 'ProfCV University',
        level: 'Institution',
        year: '2024',
        description: 'Recognized for high student feedback and innovative course delivery.',
      },
      {
        name: 'Best Research Paper Presenter',
        awardingBody: 'National Academic Forum',
        level: 'National',
        year: '2023',
        description: 'Awarded for impactful presentation in annual research symposium.',
      },
    ],

    researchSupervision: {
      phdAwardedCount: String(1 + (seed % 4)),
      phdOngoingCount: String(2 + (seed % 5)),
      mphilGuidedCount: String(seed % 3),
      completedStudentsNames: 'A. Kumar, P. Nair, R. Singh',
      studentDetails: 'Topics include applied AI, cloud systems, and educational analytics.',
    },

    documents: {
      passportPhoto: assets.passportPhoto,
      signature: assets.signature,
      dobProof: assets.dobProof,
      categoryCertificate: assets.categoryCertificate,
      degreeCertificates: assets.degreeCertificates,
      netSetJrfCertificate: assets.netSetJrfCertificate,
      experienceCertificates: assets.experienceCertificates,
      appointmentOrders: assets.appointmentOrders,
      awardCertificates: assets.awardCertificates,
      publicationProofs: assets.publicationProofs,
      aadhaarCard: assets.aadhaarCard,
      panCard: assets.panCard,
    },

    media: {
      attachments: [
        { name: `${slug}-cv.pdf`, url: assets.cv, fileType: 'application/pdf', sizeKB: 220 },
        { name: `${slug}-research-statement.pdf`, url: assets.researchStatement, fileType: 'application/pdf', sizeKB: 180 },
        { name: `${slug}-teaching-portfolio.pdf`, url: assets.teachingPortfolio, fileType: 'application/pdf', sizeKB: 260 },
        { name: `${slug}-profile-image.png`, url: assets.profileImage, fileType: 'image/png', sizeKB: 95 },
      ],
      videoEmbeds: [pick(YOUTUBE_LINKS, seed), pick(YOUTUBE_LINKS, seed, 2)],
    },

    visibility: {
      bio: true,
      professionalDetails: true,
      entranceTests: true,
      workExperiences: true,
      qualifications: true,
      professionalMemberships: true,
      publications: true,
      awards: true,
      projects: true,
      researchSupervision: true,
      subjects: true,
      customDetails: true,
      media: true,
      documents: false,
      interests: true,
      photo: true,
      phoneNumber: false,
      address: false,
      dob: false,
      gender: false,
    },
  };
}

async function seedProfiles() {
  await mongoose.connect(process.env.MONGO_URI);
  ensureUploadDir();

  console.log('Connected to MongoDB');
  const users = await User.find({}).lean();

  if (users.length === 0) {
    console.error('No users found. Run seed.js first.');
    process.exit(1);
  }

  let created = 0;
  let updated = 0;

  for (const user of users) {
    const profileData = buildProfileForUser(user);
    const existing = await Profile.findOne({ user: user._id });

    if (existing) {
      await Profile.findOneAndUpdate(
        { user: user._id },
        { $set: profileData },
        { runValidators: true }
      );
      updated += 1;
      console.log(`Updated profile: ${user.email}`);
    } else {
      await Profile.create({ user: user._id, ...profileData });
      created += 1;
      console.log(`Created profile: ${user.email}`);
    }

    // Keep user avatar in sync with seeded profile photo.
    await User.findByIdAndUpdate(user._id, { photo: profileData.photo });
  }

  console.log(`Seeded profiles complete. Created: ${created}, Updated: ${updated}`);
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seedProfiles().catch(async (err) => {
  console.error('Profile seed failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch (disconnectErr) {
    // No-op.
  }
  process.exit(1);
});
