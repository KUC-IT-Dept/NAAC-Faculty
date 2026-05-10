const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();

app.use(cors());

const upload = multer({
  dest: 'uploads/',
});

app.post(
  '/upload',
  upload.array('files'),
  (req, res) => {
    res.json({
      success: true,
      files: req.files,
    });
  }
);

app.listen(5000, () => {
  console.log('Server running');
});