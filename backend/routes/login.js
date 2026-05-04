/**
 * routes/login.js — POST /api/login
 *
 * Logic Flow Position: Step 2 (REQUEST) → Step 3 (PROCESSING) → Step 4 (RESPONSE)
 *   - Step 2: Receives the POST /api/login request from the client
 *   - Step 3: Looks up the user by email, verifies password with bcrypt, signs a JWT
 *   - Step 4: Returns 200 + token on success, or 401 on failure
 *
 * Sequence: Client → server.js → [THIS FILE] → auth_user.json → [THIS FILE] → Client
 */

const express = require('express');         // Import the Express framework
const bcrypt  = require('bcrypt');          // Import bcrypt for password comparison
const jwt     = require('jsonwebtoken');    // Import jsonwebtoken to sign the JWT
const fs      = require('fs').promises;    // Import fs with promise-based API for async file reads
const path    = require('path');            // Import path to build cross-platform file paths

const router = express.Router(); // Create a new Express Router instance

// Path to the flat-file user database
const DB_PATH = path.join(__dirname, '..', 'data', 'auth_user.json');

// Secret key used to sign the JWT — in production this must come from an environment variable
const SECRET_KEY = process.env.JWT_SECRET || 'stroyka_secret_key_2025';

/**
 * POST /api/login
 * Authenticates a user and returns a signed JWT token.
 *
 * @param {string} req.body.email    - The user's registered email address
 * @param {string} req.body.password - The user's plain-text password (will be compared to hash)
 *
 * @returns {200} { token }                          — login successful
 * @returns {401} { message: "Invalid email or password" } — user not found or wrong password
 * @returns {400} { message: "Email and password are required" } — missing fields
 * @returns {500} { message: "Internal server error" }   — unexpected server failure
 */
router.post('/login', async (req, res) => { // Define the POST /login handler as async
    try {
        // Step 3a: Extract email and password from the request body
        const { email, password } = req.body; // Destructure the two fields from req.body

        // Step 3b: Ensure both fields were provided by the client
        if (!email || !password) { // Check if either field is missing or empty
            // Return 400 Bad Request if either field is absent
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Step 3c: Read the user database file from disk
        const fileContent = await fs.readFile(DB_PATH, 'utf8'); // Read auth_user.json as a UTF-8 string
        const users = JSON.parse(fileContent); // Parse the JSON string into a JavaScript array

        // Step 3d: Search the users array for a record whose email matches the input
        const user = users.find(u => u.email === email); // find() returns the first match or undefined

        // Step 3e: If no user was found with that email, respond with 401 Unauthorized
        if (!user) { // user is undefined when no match was found
            // Use a generic message — never reveal whether the email or password was wrong
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Step 3f: Compare the plain-text input password against the stored bcrypt hash
        const passwordMatch = await bcrypt.compare(password, user.password); // Returns true or false

        // Step 3g: If the passwords do not match, respond with 401 Unauthorized
        if (!passwordMatch) { // passwordMatch is false when the password is wrong
            // Again use the same generic message to prevent user-enumeration attacks
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Step 3h: Build the JWT payload — only include non-sensitive fields
        const payload = { // The payload is embedded in the token (visible, not encrypted)
            id:    user.id,   // Include the user's unique ID
            email: user.email // Include the user's email address
        };

        // Step 3i: Sign the JWT with the secret key and set it to expire in 1 hour
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' }); // Returns a signed token string

        // Step 4: Return 200 OK with the token so the client can store and use it
        return res.status(200).json({ token }); // Send the token in the response body

    } catch (error) {
        // Step 4 (error path): Log the unexpected error server-side for debugging
        console.error('[Login] Unexpected error:', error.message); // Print the error to the server console
        // Return 500 Internal Server Error — something went wrong that we did not anticipate
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; // Export the router so it can be mounted in server.js
