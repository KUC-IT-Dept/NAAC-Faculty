// controllers/file.controller.js
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const gsPath = 'C:\\Program Files (x86)\\gs\\gs10.07.1\\bin\\gswin32c.exe';

const compressPdfFile = (inputFile, outputFile, mode = 'medium') => {
  return new Promise((resolve, reject) => {
    const args = ['-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4', '-dNOPAUSE', '-dBATCH', `-sOutputFile=${outputFile}`];
    if (mode === 'medium') args.push('-dPDFSETTINGS=/ebook');
    else if (mode === 'mediumStrong') {
      args.push('-dPDFSETTINGS=/screen', '-dColorImageResolution=72', '-dGrayImageResolution=72', '-dMonoImageResolution=72',
        '-dDownsampleColorImages=true', '-dDownsampleGrayImages=true', '-dDownsampleMonoImages=true');
    }
    args.push(inputFile);
    execFile(gsPath, args, (error) => { if (error) return reject(error); resolve(); });
  });
};

const compressPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No PDF uploaded' });
    const TARGET_MIN = 100 * 1024;
    const TARGET_MAX = 250 * 1024;
    const originalFile = path.resolve(req.file.path);
    const originalSize = fs.statSync(originalFile).size;
    const originalKB = (originalSize / 1024).toFixed(2);
    if (originalSize <= TARGET_MAX) {
      return res.json({ success: true, originalSize: originalKB, compressedSize: originalKB, file: { path: req.file.path.replace(/\\/g, '/'), name: req.file.originalname } });
    }
    let compressedFile = path.resolve(req.file.path.replace('.pdf', '_compressed.pdf'));
    await compressPdfFile(originalFile, compressedFile, 'medium');
    let compressedSize = fs.statSync(compressedFile).size;
    if (compressedSize >= originalSize) { compressedFile = originalFile; compressedSize = originalSize; }
    else if (compressedSize > TARGET_MAX) {
      const secondFile = compressedFile.replace('.pdf', '_final.pdf');
      await compressPdfFile(compressedFile, secondFile, 'mediumStrong');
      const secondSize = fs.statSync(secondFile).size;
      if (secondSize < compressedSize && secondSize > TARGET_MIN) { compressedFile = secondFile; compressedSize = secondSize; }
    }
    try { if (fs.existsSync(originalFile) && compressedFile !== originalFile) fs.unlinkSync(originalFile); } catch (err) { console.log('Delete original failed:', err.message); }
    return res.json({ success: true, originalSize: (originalSize / 1024).toFixed(2), compressedSize: (compressedSize / 1024).toFixed(2), file: { path: `uploads/temp/${path.basename(compressedFile)}`, name: req.file.originalname } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { compressPdf };
