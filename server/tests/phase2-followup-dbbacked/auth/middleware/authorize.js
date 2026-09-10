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

// ── Module-level permission check (Phase 2) ───────────────────────────────────
// Separate, additive capability alongside authorize() above - does not
// change authorize()'s existing signature or behavior for any current or
// future caller that only needs role checks.
//
// Grants access if EITHER:
//   - req.user.role is one of the given bypassRoles (e.g. iqac_director,
//     superadmin should always be able to reach an institutional module), OR
//   - req.user.modulePermissions (see auth/models/User.model.js) includes
//     the given moduleKey (e.g. a "staff" user specifically granted
//     ["library"]).
//
// This is an OR check, not an AND - that's intentional: role-based access
// and permission-based access are two independent ways in to the same
// module, matching the "existing roles + simple module permissions, not a
// new role per module" design decision.
//
// MUST be used AFTER authenticate middleware, same as authorize().
//
// Usage example (future phase, once wired into a route):
//   router.get('/library', authenticate,
//     authorizeModule('library', ROLES.IQAC_DIRECTOR, ROLES.SUPERADMIN),
//     handler);
//
// KNOWN LIMITATION (documented, not fixed in this phase): none of the
// current login flows (modules/faculty/routes/auth.js,
// modules/student/controllers/auth.controller.js) include
// modulePermissions in the JWT payload, and authenticate()/the per-module
// authMiddleware.js files only decode the JWT - they do not re-fetch the
// user from the database. Until a later phase updates JWT generation (or
// switches the relevant routes to a DB-backed auth check),
// req.user.modulePermissions will be undefined on every real request, so
// the modulePermissions branch below cannot yet grant access in practice -
// only the bypassRoles branch is live today. This function is being added
// now purely as the shared mechanism for later phases to wire up; no route
// uses it yet (Phase 3 scope).
const authorizeModule = (moduleKey, ...bypassRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated. Run authenticate() before authorizeModule()." });
    }

    const hasBypassRole = bypassRoles.includes(req.user.role);
    const hasModulePermission =
      Array.isArray(req.user.modulePermissions) && req.user.modulePermissions.includes(moduleKey);

    if (!hasBypassRole && !hasModulePermission) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user.role}' is not permitted and does not have the '${moduleKey}' module permission.`,
      });
    }

    next();
  };
};

// authorizeModule is attached as a property of authorize (not a separate
// module.exports shape) so every existing or future call site written as
// `const authorize = require('.../authorize')` keeps working completely
// unchanged, while `const { authorizeModule } = require('.../authorize')`
// also works via destructuring off the same function object.
authorize.authorizeModule = authorizeModule;

module.exports = authorize;
