// jwt.util.js
// JWT (JSON Web Token) is used to securely identify a logged-in user.
// When a user logs in, we give them a token. They send it back with each request.
// This file has two helper functions: one to create a token, one to verify it.

const jwt = require("jsonwebtoken");

// Secret key used to sign the token — keep this in your .env file, never hardcode it
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// How long the token stays valid — e.g., "1d" = 1 day, "2h" = 2 hours
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

/**
 * generateToken
 * Creates a signed JWT for a given user.
 * We include the user's id and role inside the token (called the "payload").
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,       // Store user's MongoDB ID in the token
            role: user.role,    // Store user's role so we can check permissions later
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * verifyToken
 * Checks if a given token is valid and not expired.
 * Returns the decoded payload (id, role) if valid.
 * Throws an error if the token is invalid or expired.
 */
const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };