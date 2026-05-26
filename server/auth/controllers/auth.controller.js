// auth.controller.js
// Controllers handle HTTP requests and responses.
// They validate input, call the right service, and send back a response.
// Keep controllers clean — no business logic here.

const { registerUser, loginUser } = require("../services/auth.service");

/**
 * register
 * Handles POST /auth/register
 */
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const result = await registerUser({ name, email, password, role });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * login
 * Handles POST /auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await loginUser({ email, password });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * getMe
 * Handles GET /auth/me
 * Returns the currently logged-in user's info.
 * req.user is attached by the authenticate middleware.
 */
const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user, // Set by authenticate.js middleware
    });
};

module.exports = { register, login, getMe };