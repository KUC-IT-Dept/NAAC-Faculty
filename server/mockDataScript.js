const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/.env' });

const User = require('./auth/models/User.model');
const Faculty = require('./modules/faculty/models/Faculty');
const StudentProfile = require('./modules/student/models/StudentProfile');

let createdUserIds = [];

const createMockData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        console.log('⏳ Generating mock data...');

        // Create Faculty
        for (let i = 1; i <= 5; i++) {
            const timestamp = Date.now();
            const hashedPassword = await bcrypt.hash('password123', 12);
            const facUser = new User({
                name: `Dr. Mock Faculty ${i}`,
                username: `mock_faculty_${i}_${timestamp}`,
                email: `mock_faculty_${i}_${timestamp}@university.edu.in`,
                password: hashedPassword,
                role: 'faculty',
                isActive: true,
                isFirstLogin: false
            });
            await facUser.save();
            createdUserIds.push(facUser._id);

            const facProfile = new Faculty({
                userId: facUser._id,
                username: facUser.username,
                profileComplete: true,
                completionPercentage: Math.floor(Math.random() * 50) + 50, // 50-100%
                personalInfo: {
                    fullName: `Dr. Mock Faculty ${i}`,
                    gender: i % 2 === 0 ? 'Female' : 'Male',
                    officialEmail: facUser.email
                },
                employmentDetails: {
                    department: 'Department Of Information Technology',
                    designation: i % 2 === 0 ? 'Assistant Professor' : 'Associate Professor',
                    institution: 'KUC'
                }
            });
            await facProfile.save();
        }

        // Create Students
        for (let i = 1; i <= 10; i++) {
            const timestamp = Date.now();
            const hashedPassword = await bcrypt.hash('password123', 12);
            const stuUser = new User({
                name: `Mock Student ${i}`,
                username: `mock_student_${i}_${timestamp}`,
                email: `mock_student_${i}_${timestamp}@university.edu.in`,
                password: hashedPassword,
                role: 'student',
                isActive: true,
                isFirstLogin: false
            });
            await stuUser.save();
            createdUserIds.push(stuUser._id);

            const stuProfile = new StudentProfile({
                userId: stuUser._id,
                academic_details: {
                    department: 'Department Of Information Technology',
                    programLevel: i % 3 === 0 ? 'PG' : 'UG',
                    currentSemester: (i % 8) + 1
                },
                personal_details: {
                    fullName: `Mock Student ${i}`,
                    gender: i % 2 === 0 ? 'Female' : 'Male'
                },
                contact_details: {
                    personalEmail: stuUser.email,
                    personalMobile: { number: `98000000${i.toString().padStart(2, '0')}` }
                }
            });
            await stuProfile.save();
        }

        console.log(`✅ Successfully created ${createdUserIds.length} mock accounts.`);
        console.log('\n🚀 Mock data is live! The script is running.');
        console.log('🛑 Press Ctrl+C to stop the script and delete the mock data.');

        // Keep process alive to wait for SIGINT
        setInterval(() => { }, 1000 * 60 * 60);

    } catch (err) {
        console.error('❌ Error creating mock data:', err);
        await cleanup();
    }
};

let isCleaningUp = false;

const cleanup = async () => {
    if (isCleaningUp) return;
    isCleaningUp = true;
    console.log('\n\n🧹 Cleaning up mock data...');
    try {
        if (createdUserIds.length > 0) {
            const resUser = await User.deleteMany({ _id: { $in: createdUserIds } });
            const resFac = await Faculty.deleteMany({ userId: { $in: createdUserIds } });
            const resStu = await StudentProfile.deleteMany({ userId: { $in: createdUserIds } });
            console.log(`✅ Deleted ${resUser.deletedCount} Users, ${resFac.deletedCount} Faculty Profiles, ${resStu.deletedCount} Student Profiles.`);
        } else {
            console.log('ℹ️ No mock data to delete.');
        }
    } catch (err) {
        console.error('❌ Error during cleanup:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB. Exiting.');
        process.exit(0);
    }
};

// Catch termination signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

createMockData();
