const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Faculty = require('./models/Faculty');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  let faculty = await Faculty.findOne();
  if (!faculty) {
    console.log('No faculty found');
    process.exit(1);
  }

  console.log('Before update:', JSON.stringify(faculty.academicResponsibilities, null, 2));

  Object.assign(faculty, {
    academicResponsibilities: {
      courses: [],
      otherResponsibilities: [
        {
          classesHandled: "UG",
          administrativeRoles: "HOD",
          committeeMemberships: "",
          fromYear: "2020",
          toYear: "2024"
        }
      ]
    }
  });

  await faculty.save();
  console.log('Saved');

  const updated = await Faculty.findById(faculty._id);
  console.log('After update:', JSON.stringify(updated.academicResponsibilities, null, 2));
  
  process.exit(0);
}
run();
