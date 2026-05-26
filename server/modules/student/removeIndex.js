const mongoose = require("mongoose");

const run = async () => {
  await mongoose.connect("mongodb+srv://amithajith7025_db_user:x1dUK4RT1FRsZ0bb@data.9pp26lw.mongodb.net/kuc_details?retryWrites=true&w=majority");

  const collection = mongoose.connection.collection("studentprofiles");

  console.log("Connected to DB");

  const indexes = await collection.indexes();
  console.log("Existing Indexes:", indexes);

  // ❌ Remove OLD WRONG indexes
  try {
    await collection.dropIndex("admissionApplicationNumber_1");
    console.log("Removed admissionApplicationNumber_1");
  } catch (e) {
    console.log("Index not found: admissionApplicationNumber_1");
  }

  try {
    await collection.dropIndex("universityEnrollmentNumber_1");
    console.log("Removed universityEnrollmentNumber_1");
  } catch (e) {
    console.log("Index not found: universityEnrollmentNumber_1");
  }

  try {
    await collection.dropIndex("rollNumber_1");
    console.log("Removed rollNumber_1");
  } catch (e) {
    console.log("Index not found: rollNumber_1");
  }

    try {
    await StudentProfile.collection.dropIndexes();
console.log("All indexes removed");
  } catch (e) {
    console.log("Index not found: rollNumber_1");
  }

  console.log("Cleanup done ✅");
  process.exit();
};

run();
