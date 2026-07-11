/**
 * requireAnalyticsScope.js
 *
 * Express middleware factory for analytics access control.
 *
 * Usage (in a route file):
 *   const requireAnalyticsScope = require('../../analytics/middleware/requireAnalyticsScope');
 *
 *   router.get('/dashboard', auth, requireAnalyticsScope('dashboard'), handler);
 *
 * Responsibilities:
 *   1. Confirm req.user is present (auth middleware must run first).
 *   2. Look up req.user.role + endpointKey in analyticsScopes.js.
 *   3a. If not permitted → respond 403, stop the chain.
 *   3b. If permitted   → attach req.analyticsScope and call next().
 *
 * req.analyticsScope shape:
 *   {
 *     level:      string,          // 'self' | 'department' | 'university' | 'institution' | 'full'
 *     department: string | null,   // populated only when level === 'department'
 *     userId:     ObjectId | null, // populated only when level === 'self'
 *   }
 *
 * This middleware knows about ROLES and scope levels.
 * It knows NOTHING about Mongo queries, metrics, or formula types.
 */

const { getScopeLevel } = require('../permissions/analyticsScopes');

/**
 * Factory function — returns a configured middleware for the given endpoint key.
 *
 * @param {string} endpointKey - Must match a key in analyticsScopes.js
 * @returns {Function} Express middleware (req, res, next)
 */
function requireAnalyticsScope(endpointKey) {
  return function analyticsScope(req, res, next) {
    // Guard: auth middleware must have run before this one.
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const role       = req.user.role;
    const scopeLevel = getScopeLevel(role, endpointKey);

    // Role is not permitted to access this endpoint.
    if (!scopeLevel) {
      return res.status(403).json({
        message: 'You do not have permission to access this analytics view',
      });
    }

    // Build the scope object that route handlers will use.
    const scope = {
      level:      scopeLevel,
      department: null,
      userId:     null,
    };

    if (scopeLevel === 'department') {
      // HOD's department comes from their User record (set at account creation).
      scope.department = req.user.department || null;
    }

    if (scopeLevel === 'self') {
      scope.userId = req.user._id || req.user.id || null;
    }

    req.analyticsScope = scope;
    next();
  };
}

module.exports = requireAnalyticsScope;
