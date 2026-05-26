const {  login, register, ResetPassword  } = require("../controllers/auth.controller.js");
const {  Router  } = require("express");
const authMiddleware = require("../../../auth/middleware/authenticate.js");
const validatePassword = require("../../../auth/middleware/validatePassword.js");
const {  verifyOTP  } = require("../utils/verifyOTP.js");


const authRouter = Router()
authRouter.post("/register",validatePassword, register);
authRouter.post("/login", login)
authRouter.post("/reset-password", authMiddleware, validatePassword,ResetPassword);
authRouter.post("/verify-otp", verifyOTP);


module.exports = authRouter;
