const {  Router  } = require("express");
const {  searchUser, searchUserById  } = require("../controllers/search.controller.js");


const searchRouter = Router();

searchRouter.get("/users", searchUser)
searchRouter.get("/users/:id", searchUserById)

module.exports = searchRouter;
