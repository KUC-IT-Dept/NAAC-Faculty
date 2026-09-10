// auth/middleware/authenticate.js
// Shared JWT authentication middleware for the unified backend.
//
// Used by: naac-backend-main, ProfCV-main (faculty module), and any future module.
// Replaces:
//   - naac-backend-main/middlewares/middlewares.auth.mjs
//   - ProfCV-main/server/middleware/auth.js
//
// Verifies the JWT, then re-fetches the user from the database and attaches
// that live document to req.user (Phase 2 follow-up). This mirrors the
// pattern already used by modules/faculty/middleware/auth.js's `auth`
// middleware.
//
// Why a DB lookup instead of trusting the JWT payload alone: fields like
// modulePermissions (see auth/models/User.model.js) and isActive can change
// after a token has already been issued. A JWT-only approach would freeze
// those at login time until the token expires - a revoked permission or a
// deactivated account would still work for up to the token's lifetime. A
// DB lookup on every request makes such changes take effect immediately,
// at the cost of one extra query per request (the same cost the faculty
// middleware already pays).
//
// The JWT itself is still fully verified first (signature + expiry) exactly
// as before - this only changes what happens with the payload afterward.

const { verifyToken } = require("../utils/jwt.util");
const User = require("../models/User.model");

const authenticate = async (req, res, next) => {
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
    const userId = decoded.id || decoded._id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated." });
    }

    // req.user is now the live Mongoose document, not the frozen JWT
    // payload - modulePermissions, role, isActive etc. all reflect current
    // DB state. Mongoose documents already expose both `_id` and a virtual
    // `id` getter, so the old manual req.user.id/req.user._id normalisation
    // is no longer needed - both are present naturally.
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = authenticate;
