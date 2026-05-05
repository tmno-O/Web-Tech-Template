// register.js — Handles the registration form on account.html
// Validates password rules on the frontend, then calls POST /api/register

document.addEventListener('DOMContentLoaded', function () {

    // Get the register form element by its ID
    var form = document.getElementById('register-form');

    // If the form doesn't exist on this page, do nothing
    if (!form) return;

    // Listen for the form submit event
    form.addEventListener('submit', async function (e) {

        // Prevent the default browser form submission (page reload)
        e.preventDefault();

        // Read the values the user typed into each field
        var name     = document.getElementById('register-name').value.trim();
        var email    = document.getElementById('register-email').value.trim();
        var password = document.getElementById('register-password').value;
        var confirm  = document.getElementById('register-confirm-password').value;

        // Get the message div where we will show success or error feedback
        var msgDiv = document.getElementById('register-message');

        // Clear any previous message before running new validation
        msgDiv.innerHTML = '';

        // --- FRONTEND VALIDATION (Layer 1: check before sending to server) ---

        // Check that all fields are filled in
        if (!name || !email || !password || !confirm) {
            msgDiv.innerHTML = '<div class="alert alert-danger">All fields are required.</div>';
            return;
        }

        // Validate email format — must contain '@' and '.'
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            msgDiv.innerHTML = '<div class="alert alert-danger">Please enter a valid email address.</div>';
            return;
        }

        // Validate password minimum length (at least 8 characters)
        if (password.length < 8) {
            msgDiv.innerHTML = '<div class="alert alert-danger">Password must be at least 8 characters long.</div>';
            return;
        }

        // Validate that the password has at least one uppercase letter (A–Z)
        if (!/[A-Z]/.test(password)) {
            msgDiv.innerHTML = '<div class="alert alert-danger">Password must include at least one uppercase letter (A–Z).</div>';
            return;
        }

        // Validate that the password has at least one special character
        if (!/[!@#$%^&*]/.test(password)) {
            msgDiv.innerHTML = '<div class="alert alert-danger">Password must include at least one special character: ! @ # $ % ^ & *</div>';
            return;
        }

        // Check that the two password fields match
        if (password !== confirm) {
            msgDiv.innerHTML = '<div class="alert alert-danger">Passwords do not match.</div>';
            return;
        }

        // --- API CALL (send validated data to the backend) ---

        try {
            // Send POST request to the backend register API
            var response = await fetch('http://localhost:3001/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send name, email, and password; backend will hash the password
                body: JSON.stringify({ name: name, email: email, password: password })
            });

            // Parse the JSON response body from the server
            var data = await response.json();

            if (response.ok) {
                // Registration succeeded (HTTP 201)
                // Clear the form fields so the user sees it was processed
                form.reset();

                // Show a success message
                msgDiv.innerHTML = '<div class="alert alert-success">Account created successfully! You can now log in.</div>';

            } else {
                // Registration failed — show the server error message
                // e.g., "Email already registered" or validation error from backend
                msgDiv.innerHTML = '<div class="alert alert-danger">' + (data.error || 'Registration failed. Please try again.') + '</div>';
            }

        } catch (err) {
            // Network error — backend is probably not running
            msgDiv.innerHTML = '<div class="alert alert-danger">Cannot connect to server. Make sure the backend is running on port 3001.</div>';
        }
    });
});
