const {  Router  } = require("express");
const {  requestAccess, approveEdit  } = require("../controllers/RequestAccess.controller.js");
const authMiddleware = require("../../../auth/middleware/authenticate.js");


const requestAccessRouter = Router();

requestAccessRouter.post("/request-access", authMiddleware,requestAccess)
requestAccessRouter.post("/approve-request", authMiddleware, approveEdit)


module.exports = requestAccessRouter;
