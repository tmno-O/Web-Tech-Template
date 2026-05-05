/**
 * routes/register.js — POST /api/register
 *
 * Logic Flow Position: Step 2 (REQUEST) → Step 3 (PROCESSING) → Step 4 (RESPONSE)
 *   - Step 2: Receives the POST /api/register request from the client
 *   - Step 3: Validates input, checks for duplicate email, hashes password, saves user
 *   - Step 4: Returns 201 Created, 400 Bad Request, 409 Conflict, or 500 Server Error
 *
 * Sequence: Client → server.js → [THIS FILE] → auth_user.json → [THIS FILE] → Client
 */

const express  = require('express');  // Import the Express framework
const bcrypt   = require('bcrypt');   // Import bcrypt for password hashing
const fs       = require('fs').promises; // Import the fs module with promise-based API
const path     = require('path');     // Import path for building file system paths
const crypto   = require('crypto');   // Import built-in crypto for UUID generation

const router = express.Router(); // Create a new Express Router instance

// Path to the flat-file user database (relative to this file)
const DB_PATH = path.join(__dirname, '..', 'data', 'auth_user.json');

// Number of bcrypt salt rounds — higher = more secure but slower (10 is the standard)
const SALT_ROUNDS = 10;

/**
 * POST /api/register
 * Registers a new user account.
 *
 * @param {Object} req.body.name     - The user's display name (required)
 * @param {Object} req.body.email    - The user's email address (required, must be unique)
 * @param {Object} req.body.password - The user's plain-text password (required, see rules)
 *
 * Password rules: min 8 chars, at least 1 uppercase letter, at least 1 special char (!@#$%^&*)
 *
 * @returns {201} { message, user: { id, name, email, registrationDate } }
 * @returns {400} { error } — missing fields or invalid input
 * @returns {409} { error } — email already registered
 * @returns {500} { error } — unexpected server error
 */
router.post('/', async (req, res) => {
    try {
        // Step 3a: Extract the three required fields from the request body
        const { name, email, password } = req.body;

        // Step 3b: Check that all three fields were provided by the client
        if (!name || !email || !password) {
            // Return 400 Bad Request if any field is missing
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Step 3c: Validate email format — must contain an '@' and at least one '.'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email pattern
        if (!emailRegex.test(email)) {
            // Return 400 if the email does not look like a valid address
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Step 3d: Validate password length — must be at least 8 characters
        if (password.length < 8) {
            // Return 400 if the password is too short
            return res.status(400).json({
                error: 'Password must be at least 8 characters, include 1 uppercase letter and 1 special character (!@#$%^&*)'
            });
        }

        // Step 3e: Validate that the password contains at least one uppercase letter (A–Z)
        if (!/[A-Z]/.test(password)) {
            // Return 400 if no uppercase letter is found
            return res.status(400).json({
                error: 'Password must be at least 8 characters, include 1 uppercase letter and 1 special character (!@#$%^&*)'
            });
        }

        // Step 3f: Validate that the password contains at least one special character
        if (!/[!@#$%^&*]/.test(password)) {
            // Return 400 if no allowed special character is found
            return res.status(400).json({
                error: 'Password must be at least 8 characters, include 1 uppercase letter and 1 special character (!@#$%^&*)'
            });
        }

        // Step 3g: Read the current user database from auth_user.json
        const fileContent = await fs.readFile(DB_PATH, 'utf8'); // Read file as UTF-8 text
        const users = JSON.parse(fileContent); // Parse the JSON string into a JS array

        // Step 3h: Check if the email already exists in the user database
        const existingUser = users.find(u => u.email === email); // Search for a matching email
        if (existingUser) {
            // Return 409 Conflict if a user with this email is already registered
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Step 3i: Hash the plain-text password using bcrypt with 10 salt rounds
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); // Never store plain text

        // Step 3j: Generate a universally unique identifier (UUID v4) for the new user
        const newId = crypto.randomUUID(); // Built-in Node.js crypto — no extra dependency needed

        // Step 3k: Build the new user object with all required fields
        const newUser = {
            id: newId,                            // Unique user identifier
            name: name,                           // Display name from request
            email: email,                         // Email address from request
            password: hashedPassword,             // bcrypt hash — NOT the plain-text password
            registrationDate: new Date().toISOString() // ISO 8601 timestamp of registration
        };

        // Step 3l: Add the new user to the in-memory array
        users.push(newUser); // Append to the existing users array

        // Step 3m: Write the updated array back to auth_user.json
        await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2), 'utf8'); // Pretty-print JSON

        // Step 4: Return 201 Created with the new user's public details (no password hash)
        return res.status(201).json({
            message: 'User registered successfully', // Success message for the client
            user: {
                id: newUser.id,                       // Return the generated ID
                name: newUser.name,                   // Return the display name
                email: newUser.email,                 // Return the email address
                registrationDate: newUser.registrationDate // Return the registration timestamp
            }
        });

    } catch (error) {
        // Step 4 (error path): Log the unexpected error on the server side
        console.error('[Register] Unexpected error:', error.message); // Log for debugging
        // Return 500 Internal Server Error to the client
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; // Export the router so server.js can mount it
