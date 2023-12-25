const express = require('express');
const jwt = require('jsonwebtoken'); // Import JWT library
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token.replace('Bearer ', ''), 'harvey', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = decoded;
    next();
  });
};

// Protected route that requires authentication
router.get('/user', verifyToken, (req, res) => {
  // At this point, the user is authenticated
  // You can fetch the user's data from the database and send it as a response
  // Example:
  const userData = {
    id: req.user.id, // You should customize this based on your JWT payload
    email: req.user.email, // You should customize this based on your JWT payload
    name: req.user.name, // You should customize this based on your JWT payload
  };

  res.status(200).json(userData);
});

module.exports = router;
