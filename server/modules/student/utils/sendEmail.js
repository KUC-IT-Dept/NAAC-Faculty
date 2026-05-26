const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");

// Load env from root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

exports.sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.PASSWORD
            }
        });

        const mailOptions = {
            from: `"Students-Journal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your OTP Code",
            html: `
                <div style="font-family: Arial; text-align: center;">
                    <h2>OTP Verification</h2>
                    <p>Your OTP is:</p>
                    <h1 style="letter-spacing: 5px;">${otp}</h1>
                    <p>This OTP is valid for 5 minutes.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("OTP email sent");
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email could not be sent");
    }
};
