// modules/mmttc/routes/mmttc.routes.js
//
// Same authorization shape as modules/library/routes/library.routes.js:
// authenticate (DB-backed) -> authorizeModule('mmttc', ...ROLE_GROUPS.ADMIN_ONLY)
// on every endpoint, applied uniformly (no read/write tiering), using only
// the existing trusted auth stack. No permission is ever read from
// req.body/req.query/headers.
//
// ROLE_GROUPS.ADMIN_ONLY = [SUPERADMIN, IQAC_DIRECTOR] - the same
// pre-existing group used for Library, not a new one.
//
// Course sub-routes exist because the source requirements document
// explicitly describes courses as a repeating, individually-added record
// within a year ("repeat for each course - so facility to add"), so
// courses are managed as their own sub-resource rather than requiring the
// whole yearly record (and its entire courses array) to be replaced via
// PUT for every single course change.

const express = require('express');
const authenticate = require('../../../auth/middleware/authenticate');
const authorize = require('../../../auth/middleware/authorize');
const { ROLE_GROUPS } = require('../../../auth/constants/roles');
const {
  listMMTTCRecords,
  getMMTTCRecordByYear,
  createMMTTCRecord,
  updateMMTTCRecord,
  deleteMMTTCRecord,
  addCourse,
  updateCourse,
  removeCourse
} = require('../controllers/mmttc.controller');

const router = express.Router();

const mmttcAccess = authorize.authorizeModule('mmttc', ...ROLE_GROUPS.ADMIN_ONLY);

router.get('/', authenticate, mmttcAccess, listMMTTCRecords);
router.get('/:academicYear', authenticate, mmttcAccess, getMMTTCRecordByYear);
router.post('/', authenticate, mmttcAccess, createMMTTCRecord);
router.put('/:academicYear', authenticate, mmttcAccess, updateMMTTCRecord);
router.delete('/:academicYear', authenticate, mmttcAccess, deleteMMTTCRecord);

router.post('/:academicYear/courses', authenticate, mmttcAccess, addCourse);
router.put('/:academicYear/courses/:courseId', authenticate, mmttcAccess, updateCourse);
router.delete('/:academicYear/courses/:courseId', authenticate, mmttcAccess, removeCourse);

module.exports = router;
