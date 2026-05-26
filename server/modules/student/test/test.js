// testCloudinary.js
const cloudinary = require("../configs/cloudinary.js");

const test = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log(result); // should return { status: "ok" }
  } catch (err) {
    console.error(err);
  }
};

test();
