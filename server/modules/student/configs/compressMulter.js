// configs/compressMulter.js  (original name: compressMulter.mjs)
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempFolder = path.join('uploads', 'temp');
    fs.mkdirSync(tempFolder, { recursive: true });
    cb(null, tempFolder);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}.pdf`);
  }
});

const compressUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

module.exports = compressUpload;
