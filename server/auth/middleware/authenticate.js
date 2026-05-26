// auth/middleware/authenticate.js
// Shared JWT authentication middleware for the unified backend.
//
// Used by: naac-backend-main, ProfCV-main (faculty module), and any future module.
// Replaces:
//   - naac-backend-main/middlewares/middlewares.auth.mjs
//   - ProfCV-main/server/middleware/auth.js
//
// Attaches decoded token payload to req.user on success.
// The token payload shape is: { id, role, iat, exp }

const { verifyToken } = require("../utils/jwt.util");

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No authorization header." });
  }

  // Expect "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Access denied. Malformed authorization header. Expected: Bearer <token>" });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    // decoded shape from generateToken(): { id, role, iat, exp }
    // decoded shape from verifyOTP (legacy): { _id, role, iat, exp }
    //
    // Normalise: always expose BOTH req.user.id AND req.user._id so that:
    //   - naac multer.mjs (reads req.user._id) keeps working
    //   - naac verifyOTP tokens (signed with _id) keep working
    //   - new code can safely use req.user.id
    req.user = decoded;
    req.user.id  = decoded.id  || decoded._id;   // prefer id, fall back to _id
    req.user._id = decoded._id || decoded.id;     // prefer _id, fall back to id
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = authenticate;
