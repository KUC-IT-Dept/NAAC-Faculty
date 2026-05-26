// auth/middleware/authorize.js
// Shared role-based authorization middleware for the unified backend.
//
// Used by: naac-backend-main, ProfCV-main (faculty module), and any future module.
// Replaces:
//   - naac-backend-main/middlewares/middlewares.role.mjs
//   - ProfCV-main/server/middleware/roleGuard.js
//
// MUST be used AFTER authenticate middleware.
//
// Usage examples:
//   router.get('/admin', authenticate, authorize(ROLES.SUPERADMIN, ROLES.IQAC_DIRECTOR), handler);
//   router.get('/faculty', authenticate, authorize(...ROLE_GROUPS.FACULTY_AND_ABOVE), handler);

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // authenticate() must run first — if req.user is missing, something is wired wrong
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated. Run authenticate() before authorize()." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Your role '${req.user.role}' is not permitted. Required: ${allowedRoles.join(", ")}.`,
      });
    }

    next();
  };
};

module.exports = authorize;
