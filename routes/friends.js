const express = require('express');
const User = require('../models/User'); // Adjust the path to your User model
const Connection = require("../models/Connection");
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
// Controller function for fetching mutual friend recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user.id; // User ID from token
    const currentUser = await User.findById(userId); // Fetch current user
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 1: Find all users connected to the current user (direct friends)
    const connections = await Connection.find({
      $or: [
        { user1: userId }, 
        { user2: userId }
      ]
    });

    const connectedUserIds = connections.map(conn => 
      conn.user1.toString() === userId.toString() ? conn.user2 : conn.user1
    );

    // Step 2: Find mutual connections for other users
    const recommendations = [];

    for (let connectedUserId of connectedUserIds) {
      // Get the connections of each friend (user who is connected to the current user)
      const friendConnections = await Connection.find({
        $or: [
          { user1: connectedUserId }, 
          { user2: connectedUserId }
        ]
      });

      for (let friendConnection of friendConnections) {
        const otherUserId = friendConnection.user1.toString() === connectedUserId.toString()
          ? friendConnection.user2
          : friendConnection.user1;

        // Skip if the other user is already connected or the current user
        if (otherUserId.toString() === userId.toString() || connectedUserIds.includes(otherUserId.toString())) {
          continue;
        }

        // Check if the user is already in the recommendations list
        const existingUser = recommendations.find(rec => rec.user._id.toString() === otherUserId.toString());
        if (existingUser) {
          existingUser.mutualConnectionsCount += 1; // Increment mutual connection count
        } else {
          // Add a new user to the recommendations list with initial mutual connection count
          const otherUser = await User.findById(otherUserId).select('name city');
          recommendations.push({
            user: otherUser,
            mutualConnectionsCount: 1
          });
        }
      }
    }

    // Step 3: Sort recommendations by the number of mutual connections (descending)
    recommendations.sort((a, b) => b.mutualConnectionsCount - a.mutualConnectionsCount);

    // Step 4: Return the sorted recommendations with mutual connections count
    res.status(200).json({
      recommendations: recommendations.map(rec => ({
        user: rec.user,
        mutualConnectionsCount: rec.mutualConnectionsCount
      }))
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});


module.exports = router;