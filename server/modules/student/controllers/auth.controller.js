const Users = require("../../../auth/models/User.model.js");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const { sendOTP } = require("../utils/sendEmail.js");

// register controller
exports.register = async (req, res) => {
    try {
        console.log(req.body);
        const data = req.body;
        const existingUser = await Users.findOne({
            $or: [{ email: req.body.email }, { phone: req.body.phone }]
        });
        if (existingUser) {
            return res.status(400).json({ "message": "User already exists" });
        }
        const hashedPassword = await bcrypt.hashSync(data.password, 10);
        const user = await Users.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role,
            phone: data.phone
        });
        res.status(201).json({
            message: "User registration complete",
            user: { _id: user._id, name: data.name, email: data.email, role: data.role, phone: data.phone }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Login Mechanism
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Users.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({ "message": "User does not exist" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ "message": "Wrong password" });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOTP = bcrypt.hashSync(otp, 10);
        user.otp = hashedOTP;
        user.otpExpiry = Date.now() + 5 * 60 * 1000;
        await user.save();
        sendOTP(email, otp).catch(err => { console.error("OTP send failed:", err); });
        res.status(201).json({"message": "otp sent successfully"});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.ResetPassword = async (req, res) => {
    try {
        const user = await Users.findById(req.user._id).select("+password");
        if (!user) {
            return res.status(400).json({ "message": "sorry user does not exist" });
        }
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ "message": "Missing fields" });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ "message": "Wrong current password" });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ "message": "Password mismatch" });
        }
        const hashedPassword = await bcrypt.hashSync(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({ "message": "success" });
    } catch (error) {
        return res.status(500).json({ "message": "Internel server error" });
    }
}
