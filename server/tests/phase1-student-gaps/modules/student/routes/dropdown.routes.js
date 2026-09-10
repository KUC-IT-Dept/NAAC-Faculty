// modules/student/routes/dropdown.routes.js
// Ported from kuc-backend-main/routes/dropdownRoutes.mjs (ESM -> CommonJS).
// Mounted flat at /api/dropdowns in index.js (NOT nested under /api/student)
// to match the exact path the Student frontend already calls
// (src/store.js fetchDropdowns() -> GET ${SERVER}/api/dropdowns).
//
// NOTE: the original backend left these routes unauthenticated, including
// the write operations (POST/DELETE/init). That is carried over unchanged
// here to preserve the existing contract exactly, per Phase 1 scope. This
// is a pre-existing gap (not introduced by this change) worth revisiting
// under Phase 2's modulePermissions work, not fixed silently here.

const express = require('express');
const {
  getDropdowns,
  addDropdownValues,
  deleteDropdownValues,
  initializeDropdowns
} = require('../controllers/dropdownController');

const router = express.Router();

router.post('/init', initializeDropdowns);
router.get('/', getDropdowns);
router.post('/', addDropdownValues);
router.delete('/', deleteDropdownValues);

module.exports = router;
