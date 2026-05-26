/**
 * seed.js — Run once to populate the 4 hardcoded test users in MongoDB.
 * Usage: node server/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const SEED_USERS = [
  {
    name: 'Super Administrator',
    email: 'admin@profcv.edu',
    password: 'password123',
    role: 'SUPERADMIN',
    department: null,
  },
  {
    name: 'Vice Chancellor',
    email: 'vc@profcv.edu',
    password: 'password123',
    role: 'VC',
    department: null,
  },
  {
    name: 'Head of Department — CS',
    email: 'hod_cs@profcv.edu',
    password: 'password123',
    role: 'HOD',
    department: 'Computer Science',
  },
  {
    name: 'Dr. Jane Smith',
    email: 'teacher@profcv.edu',
    password: 'password123',
    role: 'TEACHER',
    department: 'Computer Science',
  },
  // Extra faculty for richer directory/graph views
  {
    name: 'Prof. Alan Turing',
    email: 'turing@profcv.edu',
    password: 'password123',
    role: 'TEACHER',
    department: 'Computer Science',
  },
  {
    name: 'Dr. Marie Curie',
    email: 'curie@profcv.edu',
    password: 'password123',
    role: 'TEACHER',
    department: 'Physics',
  },
  {
    name: 'Head of Department — Physics',
    email: 'hod_phy@profcv.edu',
    password: 'password123',
    role: 'HOD',
    department: 'Physics',
  },
  {
    name: 'Prof. Isaac Newton',
    email: 'newton@profcv.edu',
    password: 'password123',
    role: 'TEACHER',
    department: 'Physics',
  },
];

const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const userData of SEED_USERS) {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        console.log(`  ↳ Skipped (already exists): ${userData.email}`);
        skipped++;
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await User.create({
          ...userData,
          password: hashedPassword
        });
        console.log(`  ✅ Created: ${userData.email} [${userData.role}]`);
        created++;
      }
    }

    console.log(`\n🌱 Seed complete — ${created} created, ${skipped} skipped.`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
