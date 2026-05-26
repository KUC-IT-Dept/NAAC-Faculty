const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {  v4: uuidv4  } = require("uuid");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user._id;

    if (!userId) {
      return cb(new Error("Please Login"), null);
    }

    // Centralized root uploads path
    const rootUploads = path.resolve(process.cwd(), "uploads", "student");
    const userFolder = path.join(rootUploads, userId.toString());

    fs.mkdirSync(userFolder, { recursive: true });

    cb(null, userFolder);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const uniqueId = uuidv4(); // 🔥 unique id

    const fileName = `${uniqueId}${ext}`;

    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, PDF allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = upload;
