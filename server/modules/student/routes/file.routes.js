// routes/file.routes.js  (original name: file.routes.mjs)
const { Router } = require('express');
const authMiddleware = require('../middlewares/middlewares.auth');
const compressUpload = require('../configs/compressMulter');
const { compressPdf } = require('../controllers/file.controller');

const router = Router();

router.post('/compress', authMiddleware, compressUpload.single('pdf'), compressPdf);

module.exports = router;
