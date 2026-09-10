// modules/student/routes/notification.routes.js
// Mounted flat at /api/notifications in index.js (NOT nested under
// /api/student) to match the exact paths the Student frontend already
// calls:
//   fetchNotifications()        -> GET    ${SERVER}/api/notifications
//   deleteMyNotifications()     -> DELETE ${SERVER}/api/notifications
// (Old backend's DELETE is a bulk delete-all-for-this-student at "/" - there
// is no "/:id" single-delete route in the old contract or in current
// frontend usage, so none is added here.)

const express = require('express');
const authMiddleware = require('../middlewares/middlewares.auth');
const { getMyNotifications, deleteMyNotifications } = require('../controllers/notification.controller');

const router = express.Router();

router.get('/', authMiddleware, getMyNotifications);
router.delete('/', authMiddleware, deleteMyNotifications);

module.exports = router;
