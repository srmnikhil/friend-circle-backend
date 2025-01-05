const express = require("express");
const router = express.Router();
const fetchuser = require("../middlewares/fetchuser");
const FriendRequest = require("../models/FriendRequest");
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

        res.json({ success: true, message: `Friend request sent successfully.` });

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
        if(action.toLowerCase() === "accept"){
            friendRequest.status = "Accepted";
            await friendRequest.save();
            return res.json({ success: true, message: `Request accepted successfully.` })
        } else if(action.toLowerCase() === "reject"){
            await FriendRequest.findByIdAndDelete(requestId);
            return res.json({ success: true, message: `Request rejected and removed successfully.` })
        }
    } catch (error) {
        console.error('Error handling friend request:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;