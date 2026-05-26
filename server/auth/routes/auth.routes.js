// auth/routes/auth.routes.js
// Centralized auth routes for the unified backend.
// Exposes: /register, /login, /verify-otp, /reset-password, /me

const { Router } = require("express");
const { register, login, getMe } = require("../controllers/auth.controller");
const authenticate = require("../middleware/authenticate");
const validatePassword = require("../middleware/validatePassword");

const authRouter = Router();

// POST /api/auth/register
// Open route — creates a new user account
authRouter.post("/register", validatePassword, register);

// POST /api/auth/login
// Open route — returns a JWT on success (naac flow triggers OTP; future modules can extend)
authRouter.post("/login", login);

// GET /api/auth/me
// Protected — returns the currently authenticated user's info
authRouter.get("/me", authenticate, getMe);

// POST /api/auth/reset-password
// Protected — allows logged-in user to change their password
authRouter.post("/reset-password", authenticate, validatePassword, (req, res) => {
  // Placeholder: full reset-password logic to be added in Phase 2
  // when auth.service.js is extended with a resetPassword() function
  res.status(501).json({ message: "Reset password endpoint: implementation pending Phase 2." });
});

module.exports = authRouter;
