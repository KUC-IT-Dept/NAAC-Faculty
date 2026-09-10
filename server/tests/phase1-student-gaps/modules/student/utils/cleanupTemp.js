// utils/cleanupTemp.js
const fs = require('fs');
const path = require('path');

const cleanupTemp = () => {
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  if (!fs.existsSync(tempDir)) return;
  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  files.forEach((file) => {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
      fs.unlinkSync(filePath);
      console.log('Deleted temp file:', file);
    }
  });
};

module.exports = { cleanupTemp };
