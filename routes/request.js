const express = require("express");
const router = express.Router();
const fetchuser = require("../middlewares/fetchuser");
const FriendRequest = require("../models/FriendRequest");
const Connection = require("../models/Connection");
const User = require('../models/User');

router.post('/send', fetchuser, async (req, res) => {
    const { receiverId } = req.body; // receiverId is the id of the user to whom the request is being sent
    try {
        const senderId = req.user.id;

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ error: 'Receiver not found.' });
        }

        // Check if the sender is trying to send a request to themselves
        if (senderId === receiverId) {
            return res.status(400).json({ error: 'You cannot send a request to yourself.' });
        }

        // Check if a request already exists between the sender and receiver
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ error: 'A friend request already exists.' });
        }

        // Create a new friend request
        const newRequest = new FriendRequest({
            sender: senderId,
            receiver: receiverId,
            status: 'Pending'
        });

        await newRequest.save();

        res.json({ success: true, message: `Friend request sent successfully.`, receiverId });

    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post("/handle", fetchuser, async (req, res) => {
    const { requestId, action } = req.body;
    const validActions = ["accept", "reject"];

    if (!validActions.includes(action.toLowerCase())) {
        return res.status(400).json({ error: "Invalid action specified." });
    }
    try {
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest) {
            return res.status(404).json({ error: "Friend request not found." });
        }

        if (friendRequest.status !== "Pending") {
            return res.status(400).json({ error: "Request already processed." })
        }
        if (action.toLowerCase() === "accept") {
            friendRequest.status = "Accepted";
            await friendRequest.save();
            return res.json({ success: true, message: `Request accepted successfully.` })
        } else if (action.toLowerCase() === "reject") {
            await FriendRequest.findByIdAndDelete(requestId);
            return res.json({ success: true, message: `Request rejected and removed successfully.` })
        }
    } catch (error) {
        console.error('Error handling friend request:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/fetchall', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch all sent and received requests for the user
        const sentRequests = await FriendRequest.find({ sender: userId })
            .populate('receiver', 'name city')
            .select('_id sender receiver status'); // Select required fields including status
        const receivedRequests = await FriendRequest.find({ receiver: userId })
            .populate('sender', 'name city')
            .select('_id sender receiver status'); // Select required fields including status

        // Map the necessary data and IDs along with the status
        const processedSentRequests = sentRequests.map(request => ({
            requestId: request._id,
            senderId: request.sender,
            receiverId: request.receiver._id,
            status: request.status // Include the status
        }));

        const processedReceivedRequests = receivedRequests.map(request => ({
            requestId: request._id,
            senderId: request.sender._id,
            receiverId: request.receiver,
            status: request.status // Include the status
        }));

        // Respond with pre-processed data including the status
        res.json({
            success: true,
            sentRequests: processedSentRequests,
            receivedRequests: processedReceivedRequests
        });
    } catch (error) {
        console.error('Error fetching all friend requests:', error);
        res.status(500).send('Internal Server Error');
    }
});



router.get("/:userId", async (req, res) => {
    let success = false;
    try {
        // Extract the 'userId' from the URL parameter
        const { userId } = req.params;

        // Find the user by their userId
        let user = await User.findById(userId);
        if (!user) {
            success = false;
            return res.status(404).json({ success, error: "User not found." });
        }

        // Return the user details (e.g., name and city)
        success = true;
        res.json({
            success,
            name: user.name,  // user name
            city: user.city,  // user city
        });
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).send("Internal server error.");
    }
});

router.delete('/unfriend/:friendId', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id; // Extract current user ID from the token
        const friendId = req.params.friendId; // Correctly extract the friendId from params
        // Update the database to remove the friendship connection
        const result = await FriendRequest.findOneAndDelete({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId },
            ],
        });

        if (!result) {
            return res.status(404).json({ message: 'Friendship not found' });
        }

        res.status(200).json({ message: 'Unfriended successfully.' });
    } catch (error) {
        console.error('Error unfriending user:', error);
        res.status(500).json({ error: 'Failed to unfriend user' });
    }
});



module.exports = router;