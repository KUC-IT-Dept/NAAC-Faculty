// auth/middleware/validatePassword.js
// Shared password validation middleware for the unified backend.
//
// Previously existed only in naac-backend-main/middlewares/middlewares.passwordvalidator.mjs
// Now available globally to all modules.
//
// Checks req.body.password OR req.body.newPassword (covers register + reset-password flows).

const validatePassword = (req, res, next) => {
  const password = req.body.newPassword || req.body.password;

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  // At least 6 chars, 1 uppercase, 1 lowercase, 1 digit
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters and include uppercase, lowercase, and a number.",
    });
  }

  next();
};

module.exports = validatePassword;
