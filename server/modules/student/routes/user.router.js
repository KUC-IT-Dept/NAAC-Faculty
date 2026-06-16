// routes/user.router.js  (original name: user.router.mjs)
const { Router } = require('express');
const { getCanEdit } = require('../controllers/users.controller');
const authMiddleware = require('../middlewares/middlewares.auth');

const userRouter = Router();

userRouter.get('/can-edit', authMiddleware, getCanEdit);

module.exports = userRouter;
