const dotenv = require("dotenv");
const {  v2: cloudinary  } = require("cloudinary");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
	timeout: 60000
});

module.exports = cloudinary;
