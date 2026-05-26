// auth.service.js
// Services contain the core business logic.
// Controllers call services — this keeps controllers thin and logic reusable.

const User = require("../models/User.model");
const { generateToken } = require("../utils/jwt.util");
const bcrypt = require("bcryptjs");

/**
 * registerUser
 * Creates a new user after hashing their password.
 * Returns the created user (without password) and a JWT token.
 */
const registerUser = async ({ name, email, password, role }) => {
    // Step 1: Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("Email is already registered");
    }

    // Step 2: Hash the password before saving (never store plain text passwords)
    const hashedPassword = await bcrypt.hash(password, 12);
    // "12" is the salt rounds — higher = more secure but slower

    // Step 3: Create and save the new user in the database
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
    });

    // Step 4: Generate a JWT token for this user
    const token = generateToken(user);

    // Step 5: Return user info (excluding password) and token
    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

/**
 * loginUser
 * Verifies email and password, then returns a token if valid.
 */
const loginUser = async ({ email, password }) => {
    // Step 1: Find the user by email — include password field (it's hidden by default)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new Error("Invalid email or password"); // Vague on purpose for security
    }

    // Step 2: Check if the account is active
    if (!user.isActive) {
        throw new Error("Your account has been deactivated. Contact admin.");
    }

    // Step 3: Compare provided password with stored hashed password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password");
    }

    // Step 4: Generate token and return user info
    const token = generateToken(user);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

module.exports = { registerUser, loginUser };