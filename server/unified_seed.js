// unified_seed.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { ROLES } = require("./auth/constants/roles");
const User = require("./auth/models/User.model");
const StudentProfile = require("./modules/student/models/StudentProfile");

const DEMO_USERS = [
  {
    name: "Demo Student",
    email: "student@kuc.edu",
    password: "password123",
    role: ROLES.STUDENT,
    department: "Computer Science",
  },
  {
    name: "Dr. Jane Smith",
    email: "teacher@profcv.edu",
    password: "password123",
    role: ROLES.FACULTY,
    department: "Computer Science",
  },
  {
    name: "Head of Department — CS",
    email: "hod_cs@profcv.edu",
    password: "password123",
    role: ROLES.HOD,
    department: "Computer Science",
  },
  {
    name: "Vice Chancellor",
    email: "vc@profcv.edu",
    password: "password123",
    role: ROLES.VC,
    department: null,
  },
  {
    name: "Super Administrator",
    email: "admin@profcv.edu",
    password: "password123",
    role: ROLES.SUPERADMIN,
    department: null,
  },
];

async function seed() {
  try {
    console.log("🌱 Starting unified database seeding...");
    
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    let created = 0;
    let updated = 0;

    for (const userData of DEMO_USERS) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      let user = await User.findOne({ email: userData.email });
      
      if (user) {
        user.password = hashedPassword;
        user.role = userData.role;
        user.name = userData.name;
        user.department = userData.department;
        user.isActive = true;
        user.canEdit = true;
        await user.save();
        console.log(`  🔄 Updated User: ${userData.email} [${userData.role}]`);
        updated++;
      } else {
        user = await User.create({
          ...userData,
          password: hashedPassword,
          isActive: true,
          canEdit: true,
        });
        console.log(`  ✅ Created User: ${userData.email} [${userData.role}]`);
        created++;
      }

      // If it's the student, create a base profile
      if (userData.role === ROLES.STUDENT) {
        const existingProfile = await StudentProfile.findOne({ userId: user._id });
        if (!existingProfile) {
          await StudentProfile.create({
            userId: user._id,
            academic_details: {
              admissionApplicationNumber: "KUC-2024-001",
              universityEnrollmentNumber: "KUC/24/CS/001",
              rollNumber: "24CS001",
              programLevel: "UG",
              modeOfStudy: "Full-Time",
              admissionCategory: "Merit"
            },
            contact_details: {
              personalEmail: userData.email
            }
          });
          console.log(`  ✅ Created Profile: ${userData.email}`);
        } else {
          // Reset canEdit even if profile exists
          console.log(`  ✨ Profile already exists for: ${userData.email}`);
        }
      }
    }

    console.log(`\n✨ Seeding complete! ${created} created, ${updated} updated.`);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    console.error(err.stack);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();
