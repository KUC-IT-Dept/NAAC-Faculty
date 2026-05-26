const express = require('express');
const router = express.Router();
const authenticate = require('../../../../auth/middleware/authenticate');
const authorize = require('../../../../auth/middleware/authorize');
const {
  getDirectory,
  getDirectoryTree,
  exportDirectory,
  addFaculty,
  swapHod,
} = require('../controllers/directoryController');

router.use(authenticate);

router.get('/', getDirectory);
router.get('/tree', getDirectoryTree);
router.get('/export', exportDirectory);
router.post('/faculty', authorize('HOD', 'VC', 'SUPERADMIN'), addFaculty);
router.put('/swap-hod', authorize('VC', 'SUPERADMIN'), swapHod);

module.exports = router;
