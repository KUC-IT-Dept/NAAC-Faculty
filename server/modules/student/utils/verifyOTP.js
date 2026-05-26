const Users = require("../../../auth/models/User.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await Users.findOne({ email }).select("+otp +otpExpiry");
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }
        if (!user.otpExpiry || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: "OTP expired" });
        }
        const isValidOTP = await bcrypt.compare(otp, user.otp);
        if (!isValidOTP) {
            return res.status(400).json({ message: "Invalid OTP" });
        }
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        const token = jwt.sign(
            { _id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                canEdit: user.canEdit
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
