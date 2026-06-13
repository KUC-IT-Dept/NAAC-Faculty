require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ email: 'psychologyhod@gmail.com' });
    console.log("psychologyhod@gmail.com users:", users);

    const allUsers = await User.find({}, 'username email role isActive');
    console.log("All users:", allUsers);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDb();
