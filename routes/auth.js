const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const JWT_SECRET = `srmnikku`;
const fetchuser = require("../middlewares/fetchuser")
// Route 1: Register a new user
router.post("/register", [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("mobile", "Enter a valid mobile number").isLength({ min: 10 }, { max: 10 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Enter a password").isLength({ min: 6 }),
    body("city", "Enter your city").notEmpty()
], async (req, res) => {
    let success = false;
    // If there is any error return Bad Request and the errors.
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ success, errors: error.array() });
    }
    // Check if the mobile number or email address already exists
    try {
        let user = await User.findOne({ $or: [{ email: req.body.email }, { mobile: req.body.mobile }] });
        if (user) {
            success = false;
            return res.status(400).json({ success, error: "User already exists with this email or mobile." });
        }
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);
        // Creating a new user
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: secPass,
            city: req.body.city
        });
        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authToken });
    }
    catch (error) {
        console.error("Internal error occurring while creating user.", error);
        res.status(500).send("Internal server error occurring while creating user.");
    }
})

// ROUTE 2: Authenticate a user using: POST "/api/auth/login". No Login required
router.post("/login", [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Enter a password').isLength({ min: 6 })
], async (req, res) => {
    let success = false;
    // If there is any error return Bad Request and the errors.
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ success, errors: error.array() });
    }
    // Check if user registered or not?
    try{
        let user = await User.findOne({ email: req.body.email});
        if(!user){
            success = false;
            return res.status(404).json({ success, error: "User not registered with this email."});
        }
        const passwordCompare = await bcrypt.compare(req.body.password, user.password);
        if(!passwordCompare){
            success = false;
            return res.status(400).json({ success, error: "Incorrect password."});
        }
        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authToken });
    } catch(error){
        console.error("Internal error occurring while login.", error);
        res.status(500).send("Internal server error occurring while login.");
    }
})

// ROUTE 3: Get loggedin User Details using: POST "/api/auth/getuser". Login required.
router.get("/user", fetchuser, async (req, res) => {
    let success = false;
    try {
        userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        // Return an error if user is deleted later after creation
        if (!user){
            return res.status(404).json({success, error: "User not found."})
        }
        success = true;
        res.json({success, user});
    } catch (error) {
        console.error("Error while fetching user details.", error);
        res.status(500).send("Internal server Error.");
    }
})
module.exports = router;