const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.info('[middleware.auth] Verifying token', {
    path: req.originalUrl,
    method: req.method,
    hasAuthorizationHeader: Boolean(authHeader),
    hasToken: Boolean(token),
  });

  if (!token) {
    console.warn('[middleware.auth] Missing token');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.decode(token) || jwt.verify(token, process.env.JWT_SECRET);
    console.info('[middleware.auth] Token decoded', { userId: decoded?.id || null, role: decoded?.role || null });
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[middleware.auth] Token invalid or expired', { message: err.message });
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = verifyToken;
