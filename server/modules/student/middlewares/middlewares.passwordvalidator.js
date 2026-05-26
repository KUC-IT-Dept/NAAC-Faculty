const validatePassword = (req, res, next) = exports.validatePassword = (req, res, next) => {
  const password = req.body.newPassword || req.body.password;

  if (!password) {
    return res.status(400).json({
      message: "Password is required"
    });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters long and include uppercase, lowercase, and a number"
    });
  }

  next();
};
