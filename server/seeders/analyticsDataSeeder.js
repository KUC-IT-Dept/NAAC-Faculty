/**
 * analyticsDataSeeder.js
 *
 * Seeds realistic Faculty + User records with publications, patents,
 * projects, FDPs, awards etc. across the last five academic years.
 *
 * Department performance is deliberately stratified:
 *   Computer Science (CS)         → Above Benchmark  (high publications, funding)
 *   Electronics & Communication   → Near  Benchmark  (moderate across all metrics)
 *   Business Administration (MBA) → Below Benchmark  (low research output)
 *
 * This ensures Benchmark, Trends, Reports, and Recommendations all display
 * meaningful differentiated results.
 *
 * Idempotent: deletes seeded faculty/users identified by the seeder marker
 * email pattern (@naacseeder.edu) before inserting fresh data. Existing
 * production users with other email patterns are never touched.
 *
 * Run: node server/seeders/analyticsDataSeeder.js
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const User      = require('../auth/models/User.model');
const Faculty   = require('../modules/faculty/models/Faculty');

// ── Academic year helpers ─────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - 4 + i));
// e.g. ['2021', '2022', '2023', '2024', '2025']

function randYear() { return YEARS[Math.floor(Math.random() * YEARS.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function isoDate(year, month = 6, day = 15) {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

// ── Publication generator ─────────────────────────────────────────────────────

function makePubs(count, opts = {}) {
  const types   = ['Journal Articles', 'Book Chapters', 'Conference Papers'];
  const cats    = ['Scopus', 'WoS', 'UGC Care', 'PubMed'];
  const levels  = ['International', 'National'];
  const indexed = ['Scopus', 'WoS', 'UGC Care'];
  const pubs = [];
  for (let i = 0; i < count; i++) {
    const yr = opts.yearBias
      ? (Math.random() < 0.6 ? pick(YEARS.slice(-3)) : randYear())
      : randYear();
    pubs.push({
      type:           pick(types),
      title:          `Research Study ${i + 1} on ${opts.area || 'Applied Sciences'}`,
      authors:        `Author A, Author B`,
      authorRole:     pick(['Principal', 'Co-Author']),
      journal:        `International Journal of ${opts.area || 'Science'} Vol.${randInt(1,30)}`,
      journalCategory: pick(cats),
      year:           yr,
      indexedIn:      pick(indexed),
      impactFactor:   String((Math.random() * 8 + 0.5).toFixed(2)),
      level:          pick(levels),
      doi:            `10.${randInt(1000,9999)}/${randInt(10000,99999)}`,
    });
  }
  return pubs;
}

// ── Project generator ─────────────────────────────────────────────────────────

function makeProjects(count, opts = {}) {
  const agencies   = ['SERB', 'DST', 'UGC', 'AICTE', 'ICMR', 'DBT', 'Industry'];
  const categories = ['Major', 'Minor', 'Industry Sponsored', 'International'];
  const projects = [];
  for (let i = 0; i < count; i++) {
    const startYr = parseInt(randYear(), 10);
    const amt     = opts.highFunding
      ? randInt(2000000, 8000000)
      : (opts.lowFunding ? randInt(100000, 500000) : randInt(500000, 3000000));
    projects.push({
      title:            `Project ${i + 1}: ${pick(['AI','IoT','Green','Bio','Nano'])} Research`,
      fundingAgency:    pick(agencies),
      projectCategory:  pick(categories),
      fundingType:      pick(['Government', 'Non-Government', 'Industry']),
      amountSanctioned: String(amt),
      startDate:        isoDate(startYr, randInt(1,12), 1),
      endDate:          isoDate(startYr + randInt(1,3), randInt(1,12), 28),
      status:           pick(['Completed', 'Ongoing']),
      role:             pick(['PI', 'Co-PI']),
    });
  }
  return projects;
}

// ── Patent generator ──────────────────────────────────────────────────────────

function makePatents(count) {
  const statuses = ['Granted', 'Published', 'Filed'];
  const patents  = [];
  for (let i = 0; i < count; i++) {
    const yr = parseInt(randYear(), 10);
    patents.push({
      title:         `Patent ${i + 1}: Novel Method in ${pick(['Energy','Computing','Materials','Bio'])}`,
      patentNumber:  `IN${randInt(200000, 400000)}B`,
      dateOfFiling:  isoDate(yr, randInt(1,12), randInt(1,28)),
      status:        pick(statuses),
      patentType:    pick(['Utility', 'Design', 'Process']),
    });
  }
  return patents;
}

// ── FDP / Workshop generator ──────────────────────────────────────────────────

function makeFDPs(count) {
  const types = ['FDP', 'Workshop', 'Orientation', 'Refresher Course', 'STTP'];
  const fdps  = [];
  for (let i = 0; i < count; i++) {
    const yr = randYear();
    fdps.push({
      programTitle:         `FDP on ${pick(['Machine Learning','Data Science','IoT','Research Methods'])} ${i+1}`,
      type:                 pick(types),
      organizingInstitution:`IIT / NIT / ISTE`,
      duration:             `${randInt(3,10)} days`,
      from:                 isoDate(parseInt(yr,10), randInt(1,11), 1),
      to:                   isoDate(parseInt(yr,10), randInt(1,11), randInt(5,28)),
      mode:                 pick(['Online', 'Offline', 'Hybrid']),
      year:                 yr,
    });
  }
  return fdps;
}

// ── Award generator ───────────────────────────────────────────────────────────

function makeAwards(count) {
  const awards = [];
  for (let i = 0; i < count; i++) {
    awards.push({
      name:             `Best Researcher Award ${i + 1}`,
      awardingAgency:   pick(['DST', 'SERB', 'University', 'ISTE', 'IEEE']),
      dateOfAward:      isoDate(parseInt(randYear(),10), randInt(1,12), randInt(1,28)),
      yearReceived:     randYear(),
      level:            pick(['National', 'International', 'State']),
      awardCategory:    pick(['Research', 'Teaching', 'Innovation']),
    });
  }
  return awards;
}

// ── Department profiles ───────────────────────────────────────────────────────
// Each profile drives how many publications/projects/patents each faculty member
// in that department gets, creating the Above/Near/Below benchmark split.

const DEPT_PROFILES = [
  {
    dept:        'Computer Science',
    count:       18,          // number of faculty to seed
    tier:        'above',     // benchmark tier
    pubsPerFaculty:   [10, 15],  // [min, max] publications per person
    projectsPerFaculty:[2, 4],
    patentsPerFaculty: [1, 3],
    fdpsPerFaculty:    [3, 6],
    awardsPerFaculty:  [1, 2],
    highFunding: true,
    area:        'Computer Science',
  },
  {
    dept:        'Electronics & Communication',
    count:       15,
    tier:        'near',
    pubsPerFaculty:   [5, 9],
    projectsPerFaculty:[1, 2],
    patentsPerFaculty: [0, 1],
    fdpsPerFaculty:    [2, 4],
    awardsPerFaculty:  [0, 1],
    highFunding: false,
    area:        'Electronics',
  },
  {
    dept:        'Business Administration',
    count:       12,
    tier:        'below',
    pubsPerFaculty:   [1, 4],
    projectsPerFaculty:[0, 1],
    patentsPerFaculty: [0, 0],
    fdpsPerFaculty:    [1, 2],
    awardsPerFaculty:  [0, 0],
    lowFunding:  true,
    area:        'Management',
  },
  {
    dept:        'Mechanical Engineering',
    count:       14,
    tier:        'near',
    pubsPerFaculty:   [4, 8],
    projectsPerFaculty:[1, 3],
    patentsPerFaculty: [0, 2],
    fdpsPerFaculty:    [2, 4],
    awardsPerFaculty:  [0, 1],
    area:        'Mechanical Engineering',
  },
  {
    dept:        'Civil Engineering',
    count:       10,
    tier:        'below',
    pubsPerFaculty:   [1, 3],
    projectsPerFaculty:[0, 1],
    patentsPerFaculty: [0, 0],
    fdpsPerFaculty:    [1, 2],
    awardsPerFaculty:  [0, 0],
    lowFunding:  true,
    area:        'Civil Engineering',
  },
];

const DESIGNATIONS = ['Assistant Professor', 'Associate Professor', 'Professor'];
const SEED_EMAIL_DOMAIN = '@naacseeder.edu';

// ── Core seed function ────────────────────────────────────────────────────────

async function seed(dryRun = false) {
  const hashedPassword = await bcrypt.hash('Seeder@123', 10);
  let totalUsers = 0, totalFaculty = 0;

  // ── Step 1: Remove all previously seeded records (idempotent) ──────────────
  if (!dryRun) {
    const existingUsers = await User.find({ email: { $regex: SEED_EMAIL_DOMAIN } }).select('_id').lean();
    const existingUserIds = existingUsers.map(u => u._id);
    if (existingUserIds.length > 0) {
      await Faculty.deleteMany({ userId: { $in: existingUserIds } });
      await User.deleteMany({ _id: { $in: existingUserIds } });
      console.log(`  🗑  Removed ${existingUserIds.length} previously seeded users/faculty.`);
    }
  }

  // ── Step 2: Insert fresh faculty per department profile ────────────────────
  for (const profile of DEPT_PROFILES) {
    const deptTag = profile.dept.replace(/\s+/g, '_').toLowerCase();
    console.log(`\n  🏫 Seeding department: ${profile.dept} (${profile.tier}, ${profile.count} faculty)`);

    for (let i = 0; i < profile.count; i++) {
      const idx         = i + 1;
      const username    = `seed_${deptTag}_${idx}`;
      const email       = `${username}${SEED_EMAIL_DOMAIN}`;
      const fullName    = `Seed Faculty ${profile.dept} ${idx}`;
      const designation = DESIGNATIONS[Math.min(Math.floor(i / 4), 2)];

      // Build publication, project, patent arrays
      const pubCount     = randInt(...profile.pubsPerFaculty);
      const projCount    = randInt(...profile.projectsPerFaculty);
      const patentCount  = randInt(...profile.patentsPerFaculty);
      const fdpCount     = randInt(...profile.fdpsPerFaculty);
      const awardCount   = randInt(...profile.awardsPerFaculty);

      const publications = makePubs(pubCount, {
        area: profile.area,
        yearBias: true,
        ...(profile.highFunding && { highFunding: true }),
      });
      const projects  = makeProjects(projCount, {
        highFunding: !!profile.highFunding,
        lowFunding:  !!profile.lowFunding,
      });
      const patents   = makePatents(patentCount);
      const fdps      = makeFDPs(fdpCount);
      const awards    = makeAwards(awardCount);

      const experienceYears = randInt(
        profile.tier === 'above' ? 10 : (profile.tier === 'near' ? 6 : 2),
        profile.tier === 'above' ? 25 : (profile.tier === 'near' ? 18 : 12)
      );

      if (dryRun) {
        console.log(`    [DRY] ${username} | pubs:${pubCount} proj:${projCount} pat:${patentCount}`);
        continue;
      }

      // Create User
      const user = await User.create({
        name:       fullName,
        email,
        username,
        password:   hashedPassword,
        role:       'faculty',
        department: profile.dept,
        isActive:   true,
        isFirstLogin: false,
      });
      totalUsers++;

      // Compute a realistic completionPercentage
      const completionBase  = profile.tier === 'above' ? 75 : (profile.tier === 'near' ? 55 : 35);
      const completionPct   = Math.min(100, completionBase + randInt(0, 20));

      // Create Faculty profile
      await Faculty.create({
        userId:   user._id,
        username,
        profileComplete:      completionPct >= 70,
        completionPercentage: completionPct,
        personalInfo: {
          fullName,
          firstName:  `Seed`,
          lastName:   `${profile.dept} ${idx}`,
          gender:     pick(['Male', 'Female']),
          nationality: 'Indian',
          officialEmail: email,
        },
        employmentDetails: {
          designation,
          department:           profile.dept,
          institution:          'Seed University',
          affiliatedUniversity: 'Seed University',
          dateOfAppointment:    isoDate(CURRENT_YEAR - experienceYears, randInt(1,12), 1),
          natureOfAppointment:  'Regular',
          totalExperienceYears: String(experienceYears),
        },
        publications,
        projects,
        patents,
        fdpWorkshops: fdps,
        awards,
      });
      totalFaculty++;
    }
  }

  if (!dryRun) {
    console.log(`\n✅ Analytics data seeder complete:`);
    console.log(`   Users created  : ${totalUsers}`);
    console.log(`   Faculty created: ${totalFaculty}`);
    console.log(`\n   Department breakdown:`);
    DEPT_PROFILES.forEach(p =>
      console.log(`   • ${p.dept.padEnd(32)} ${p.tier.toUpperCase().padEnd(8)} (${p.count} faculty)`)
    );
  } else {
    console.log('\n✅ Dry run complete — nothing written to DB.');
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

const isDryRun = process.argv.includes('--dry-run');

if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iqac';
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log('✅ MongoDB connected');
      await seed(isDryRun);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = { seed };
