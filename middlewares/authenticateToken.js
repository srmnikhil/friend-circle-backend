const jwt = require('jsonwebtoken');
const JWT_SECRET = `srmnikku`;
const authenticateToken = (req, res, next) => {
  const authToken = req.headers(['authorization']?.split(' ')[1]); // Extract token from Authorization header

  if (!authToken) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  jwt.verify(authToken, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid Token' });
    }
    req.user = user; // Attach user information to request
    next();
  });
};

module.exports = authenticateToken;
