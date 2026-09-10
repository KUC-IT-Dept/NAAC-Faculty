// modules/library/routes/library.routes.js
//
// Every route: authenticate (DB-backed, live req.user - see
// auth/middleware/authenticate.js) then authorizeModule('library', ...).
// No permission or role is ever read from req.body/req.query/headers -
// authorizeModule only ever consults req.user, which is populated
// exclusively from the verified JWT + a fresh database lookup.
//
// Bypass roles: ROLE_GROUPS.ADMIN_ONLY = [SUPERADMIN, IQAC_DIRECTOR] - this
// is the existing, established convention already defined in
// auth/constants/roles.js (also used as the coarse-grained "institutional"
// role group elsewhere), not a new role or group invented for Library.
// Anyone else reaches this module only via modulePermissions: ["library"].
//
// Same authorization requirement is applied uniformly to every method
// (GET/POST/PUT/DELETE) - the access model given for this phase
// (iqac_director / superadmin / permissioned staff / else 403) was
// specified as one uniform model, not tiered by read vs write, so no
// extra tier was invented here.

const express = require('express');
const authenticate = require('../../../auth/middleware/authenticate');
const authorize = require('../../../auth/middleware/authorize');
const { ROLE_GROUPS } = require('../../../auth/constants/roles');
const {
  listLibraryRecords,
  getLibraryRecordByYear,
  createLibraryRecord,
  updateLibraryRecord,
  deleteLibraryRecord
} = require('../controllers/library.controller');

const router = express.Router();

const libraryAccess = authorize.authorizeModule('library', ...ROLE_GROUPS.ADMIN_ONLY);

router.get('/', authenticate, libraryAccess, listLibraryRecords);
router.get('/:academicYear', authenticate, libraryAccess, getLibraryRecordByYear);
router.post('/', authenticate, libraryAccess, createLibraryRecord);
router.put('/:academicYear', authenticate, libraryAccess, updateLibraryRecord);
router.delete('/:academicYear', authenticate, libraryAccess, deleteLibraryRecord);

module.exports = router;
