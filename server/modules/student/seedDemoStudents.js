require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../../core/db/connect");
const StudentProfile = require("./models/StudentProfile");

async function seedDemoStudents() {
    try {

        await connectDB();

        console.log("Deleting existing students...");

        await StudentProfile.deleteMany({});

        const students = [];

        const categories = [
            "SC",
            "ST",
            "OBC",
            "General"
        ];

        const faculties = [
            "Engineering",
            "Science",
            "Commerce",
            "Management"
        ];

        for (let i = 1; i <= 20; i++) {

            students.push({

                userId: new mongoose.Types.ObjectId(),

                academic_details: {
                    faculty:
                        faculties[i % faculties.length],

                    programLevel:
                        i <= 12
                            ? "UG"
                            : i <= 18
                            ? "PG"
                            : "PhD",

                    degreeName:
                        i <= 12
                            ? "B.Tech"
                            : i <= 18
                            ? "M.Tech"
                            : "PhD",

                    currentYear: "1",

                    currentSemester: 1,

                    admissionCategory: "Merit"
                },

                personal_details: {

                    fullName:
                        `Demo Student ${i}`,

                    gender:
                        i % 2 === 0
                            ? "Female"
                            : "Male",

                    nationality:
                        i <= 2
                            ? "International"
                            : "Indian",

                    socialCategory:
                        categories[
                            i % categories.length
                        ]
                },

                health_details: {

                    disabilityStatus:
                        i === 3 ||
                        i === 14,

                    disabilityDetails: {

                        disabilityType:
                            i === 3 ||
                            i === 14
                                ? "Physical"
                                : "",

                        percentage:
                            i === 3 ||
                            i === 14
                                ? 40
                                : 0
                    }
                },

                financial_details: {

                    schType:
                        i <= 6
                            ? "Merit Scholarship"
                            : "",

                    educationLoan:
                        i <= 4
                            ? {
                                  bankName: "SBI",
                                  branch: "Main Branch",
                                  amount: 100000
                              }
                            : {}
                },

                professional_details: {

                    publications:
                        i <= 5
                            ? [
                                  {
                                      journal:
                                          "IEEE Journal"
                                  }
                              ]
                            : [],

                    conferences:
                        i <= 3
                            ? [
                                  {
                                      title:
                                          "AI Conference"
                                  }
                              ]
                            : [],

                    patents:
                        i <= 2
                            ? [
                                  {
                                      title:
                                          "Patent Demo",
                                      status:
                                          "Filed"
                                  }
                              ]
                            : []
                },

                contact_details: {

                    personalEmail:
                        `student${i}@gmail.com`
                }
            });
        }

        await StudentProfile.insertMany(
            students
        );

        console.log(
            `${students.length} demo students inserted successfully`
        );

        process.exit(0);

    } catch (error) {

        console.error(
            "Seeding failed:",
            error
        );

        process.exit(1);
    }
}

seedDemoStudents();