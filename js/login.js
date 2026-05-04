// login.js — Handles the login form submission on account.html
// Sends email + password to POST /api/login and shows the result

document.addEventListener('DOMContentLoaded', function () {

    // Get the login form element by its ID
    var form = document.getElementById('login-form');

    // If the form doesn't exist on this page, do nothing
    if (!form) return;

    // Listen for the form submit event
    form.addEventListener('submit', async function (e) {

        // Prevent the default browser form submission (page reload)
        e.preventDefault();

        // Read the email and password values the user typed
        var email    = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value;

        // Get the message div where we will show success or error
        var msgDiv = document.getElementById('login-message');

        // Clear any previous message
        msgDiv.innerHTML = '';

        // Basic check — make sure both fields are filled
        if (!email || !password) {
            msgDiv.innerHTML = '<div class="alert alert-danger">Please enter your email and password.</div>';
            return;
        }

        try {
            // Send POST request to the backend login API
            var response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });

            // Parse the JSON response body
            var data = await response.json();

            if (response.ok) {
                // Login succeeded — save the token in localStorage for later use
                localStorage.setItem('token', data.token);

                // Show a success message to the user
                msgDiv.innerHTML = '<div class="alert alert-success">Login successful! Welcome back.</div>';

                // Optionally redirect to the homepage after 1.5 seconds
                setTimeout(function () {
                    window.location.href = 'index.html';
                }, 1500);

            } else {
                // Login failed — show the error message from the API (e.g. "Invalid email or password")
                msgDiv.innerHTML = '<div class="alert alert-danger">' + (data.message || 'Login failed.') + '</div>';
            }

        } catch (err) {
            // Network error — the backend might not be running
            msgDiv.innerHTML = '<div class="alert alert-danger">Cannot connect to server. Make sure the backend is running on port 3001.</div>';
        }
    });
});
