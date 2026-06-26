/**
 * roleGuard(...roles) — returns middleware that allows only users whose
 * role is in the provided list. Must be used AFTER verifyToken.
 */
const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(', ')}.`,
      });
    }
    next();
  };
};

module.exports = roleGuard;
