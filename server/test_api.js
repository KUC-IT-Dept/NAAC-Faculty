const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Faculty = require('./models/Faculty');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const faculty = await Faculty.findOne();
  if (!faculty) {
    console.log('No faculty found');
    process.exit(1);
  }
  const user = await User.findById(faculty.userId);
  
  const token = require('jsonwebtoken').sign({ id: user._id }, process.env.JWT_SECRET);
  
  const postData = JSON.stringify({
    academicResponsibilities: {
      courses: [],
      otherResponsibilities: [{
        classesHandled: "Test",
        administrativeRoles: "Dean",
        committeeMemberships: "",
        fromYear: "2021",
        toYear: "2023"
      }]
    }
  });

  const req = http.request({
    hostname: 'localhost',
    port: process.env.PORT,
    path: '/api/faculty/me',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Cookie': `token=${token}`
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', async () => {
      console.log('Response:', res.statusCode);
      
      const updated = await Faculty.findById(faculty._id);
      console.log('DB Data:', JSON.stringify(updated.academicResponsibilities, null, 2));
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}
run();
