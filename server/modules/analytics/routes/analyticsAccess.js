/**
 * analyticsAccess.js
 *
 * Route: GET /api/faculty/analytics/my-access
 *
 * Returns the list of analytics endpoint keys accessible to the
 * authenticated user's role, along with the scope level for each.
 *
 * The frontend calls this once on page load to build its navigation
 * and avoid firing requests it knows will be rejected.
 *
 * Example response for an HOD:
 * {
 *   "role": "hod",
 *   "scopeLevel": "department",
 *   "department": "Computer Science",
 *   "accessibleEndpoints": [
 *     { "key": "metrics",               "scopeLevel": "department" },
 *     { "key": "coverage",              "scopeLevel": "department" },
 *     ...
 *   ]
 * }
 */

const express = require('express');
const { auth } = require('../../faculty/middleware/auth');
const { ANALYTICS_SCOPES } = require('../permissions/analyticsScopes');

const router = express.Router();

/**
 * GET /my-access
 *
 * Requires authentication. Returns accessible analytics endpoints for
 * the caller's role. Does not touch any database beyond what `auth` does.
 */
router.get('/my-access', auth, (req, res) => {
  const role        = req.user.role;
  const department  = req.user.department || null;
  const roleScopes  = ANALYTICS_SCOPES[role];

  if (!roleScopes || Object.keys(roleScopes).length === 0) {
    // Role has no analytics access at all.
    return res.json({
      role,
      scopeLevel: null,
      department: null,
      accessibleEndpoints: [],
    });
  }

  const accessibleEndpoints = Object.entries(roleScopes).map(
    ([key, scopeLevel]) => ({ key, scopeLevel })
  );

  // Derive the broadest scope level this role holds (for UI hints).
  const scopeOrder  = ['self', 'department', 'university', 'institution', 'full'];
  const scopeLevels = accessibleEndpoints.map(e => e.scopeLevel);
  const topScope    = scopeOrder
    .slice()
    .reverse()
    .find(level => scopeLevels.includes(level)) || scopeLevels[0] || null;

  return res.json({
    role,
    scopeLevel:          topScope,
    department:          topScope === 'department' ? department : null,
    accessibleEndpoints,
  });
});

module.exports = router;
