/**
 * auth-ui.js — Reads login state from localStorage and updates the UI on every page.
 *
 * Problems it fixes:
 *  1. Topbar "My Account" always shows Login/Register even when logged in
 *  2. Checkout page shows "Returning customer? Click here to login" when already logged in
 *  3. Checkout form is not pre-filled with the logged-in user's data
 */

document.addEventListener('DOMContentLoaded', function () {

    // Read the stored token and user info from localStorage
    var token    = localStorage.getItem('token');
    var userName = localStorage.getItem('userName') || 'My Account';
    var userEmail = localStorage.getItem('userEmail') || '';

    // Run all UI update functions
    updateTopbarAccountMenu(token, userName);
    hideReturningCustomerBanner(token);
    autoFillCheckoutForm(token, userName, userEmail);
});


/**
 * updateTopbarAccountMenu
 * If the user is logged in  → show their name + Logout in the topbar dropdown
 * If the user is logged out → show Login + Register (default state)
 */
function updateTopbarAccountMenu(token, userName) {

    // Find every topbar dropdown button on the page
    var topbarButtons = document.querySelectorAll('.topbar-dropdown__btn');

    topbarButtons.forEach(function (btn) {

        // Only target the "My Account" dropdown (not Currency / Language)
        if (btn.textContent.trim().indexOf('My Account') === -1) return;

        var dropdown = btn.closest('.topbar-dropdown');
        if (!dropdown) return;

        var menuList = dropdown.querySelector('.menu--layout--topbar');
        if (!menuList) return;

        if (token) {
            // ── LOGGED IN STATE ──────────────────────────────────────────
            // Update the button label to show the user's name
            btn.childNodes[0].textContent = userName + ' ';

            // Replace menu items with account options + logout
            menuList.innerHTML =
                '<li><a href="account.html">👤 ' + userName + '</a></li>' +
                '<li><a href="#">Orders</a></li>' +
                '<li><a href="#">Addresses</a></li>' +
                '<li><a href="#" class="auth-logout-btn" style="color:#e52727;font-weight:600;">Logout</a></li>';

            // Wire up the logout button
            var logoutBtn = menuList.querySelector('.auth-logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userEmail');
                    window.location.reload();
                });
            }

        } else {
            // ── LOGGED OUT STATE (default) ───────────────────────────────
            btn.childNodes[0].textContent = 'My Account ';

            menuList.innerHTML =
                '<li><a href="account.html">Login</a></li>' +
                '<li><a href="account.html">Register</a></li>' +
                '<li><a href="#">Orders</a></li>' +
                '<li><a href="#">Addresses</a></li>';
        }
    });
}


/**
 * hideReturningCustomerBanner
 * Hides the "Returning customer? Click here to login" alert on checkout.html
 * if the user is already logged in — no point showing it twice.
 */
function hideReturningCustomerBanner(token) {
    var alerts = document.querySelectorAll('.alert-primary');

    alerts.forEach(function (alert) {
        if (alert.textContent.indexOf('Returning customer') !== -1) {
            if (token) {
                alert.style.display = 'none'; // Hide it — user is already logged in
            } else {
                alert.style.display = '';     // Show it — user needs to log in
            }
        }
    });
}


/**
 * autoFillCheckoutForm
 * Pre-fills the checkout form email and name fields with the logged-in user's data.
 */
function autoFillCheckoutForm(token, userName, userEmail) {
    if (!token) return; // Only run if logged in

    // Pre-fill email field
    var emailField = document.getElementById('checkout-email');
    if (emailField && userEmail) {
        emailField.value = userEmail;
    }

    // Pre-fill first and last name fields
    if (userName && userName !== 'My Account') {
        var nameParts   = userName.trim().split(' ');
        var firstField  = document.getElementById('checkout-first-name');
        var lastField   = document.getElementById('checkout-last-name');

        if (firstField && nameParts[0]) {
            firstField.value = nameParts[0];
        }
        if (lastField && nameParts.length > 1) {
            lastField.value = nameParts.slice(1).join(' ');
        }
    }
}
