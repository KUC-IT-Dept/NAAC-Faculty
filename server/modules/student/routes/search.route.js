// routes/search.route.js  (original name: search.route.mjs)
const { Router } = require('express');
const { searchUser, searchUserById } = require('../controllers/search.controller');

const searchRouter = Router();

searchRouter.get('/users', searchUser);
searchRouter.get('/users/:id', searchUserById);

module.exports = searchRouter;
