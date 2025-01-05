const express = require('express');
const User = require('../models/User'); // Adjust the path to your User model
const authenticateToken = require('../middlewares/authenticateToken'); // Make sure this path is correct
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const reqUser = req.user;
    const searchQuery = req.query.search || ''; // Get search query from request

    const users = await User.find({ 
      _id: { $ne: reqUser.user.id },
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { city: { $regex: searchQuery, $options: 'i' } },
      ]
    })
      .sort({ mutualConnections: -1 }) // Sort by mutual connections descending
      .select('name city _id'); // Select only name and city

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching friend recommendations' });
  }
});


module.exports = router;
