const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs")
const { body, validationResult } = require('express-validator');

// ROUTE 1: Verify User using email and mobile: POST "/api/users/verify". No Login required.
router.post("/verify", [
    body("email", "Enter a valid email address").isEmail(),
    body("mobile", "Enter a valid 10-digit mobile number").isLength({ min: 10, max: 10 })
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }
    try {
        const { email, mobile } = req.body;
        let user = await User.findOne({ email: email, mobile: mobile });
        if (!user) {
            success = false;
            return res.status(404).json({ success, error: "User Not Found! Either email or mobile does not exist." });
        }
        success = true;
        const id = user.id;
        res.json({ success, message: "User found Successfully.", id });
    } catch (error) {
        console.error("Error while fetching user details.", error);
        res.status(500).send("Internal server Error.");
    }
});

// ROUTE 2: Forgetting User after verifying email and mobile: PUT "/api/users/forgotpassword". No Login required.
router.put("/forgotpassword", [
    body("email", "Enter a valid email address").isEmail(),
    body("mobile", "Enter a valid 10-digit mobile number").isLength({ min: 10, max: 10 }).isNumeric(),
    body("password", "Password must have min 8 characters.").isLength({ min: 8 })
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }
    try {
        const { email, mobile, password } = req.body;
        let user = await User.findOne({ email: email, mobile: mobile });
        if (!user) {
            success = false;
            return res.status(404).json({ success, error: "User Not Found! Either email or mobile does not exist." });
        }
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(password, salt);
        user.password = secPass;
        await user.save();
        success = true;
        res.json({ success, message:"Password Updated Successfully" });
    } catch (error) {
        console.error("Error while forgetting password.", error);
        res.status(500).send("Internal server Error.");
    }
}
)

module.exports = router;
