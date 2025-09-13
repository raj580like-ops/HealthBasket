// js/auth-guard.js

/**
 * This script acts as a "gatekeeper" for protected pages like profile.html.
 * It ensures that we wait for Firebase to confirm the user's login status
 * before showing the page content or redirecting.
 */
function authGuard() {
    const contentElement = document.getElementById('protected-content');
    const loadingElement = document.getElementById('loading-spinner');

    // Show the loading spinner immediately
    loadingElement.style.display = 'flex';
    contentElement.style.display = 'none';

    auth.onAuthStateChanged(user => {
        // This function can take a moment to run as it checks the session.
        
        // Hide the spinner now that we have an answer from Firebase.
        loadingElement.style.display = 'none';

        if (user) {
            // SUCCESS: A user is logged in.
            // Show the main content of the page.
            console.log("Auth Guard: User is logged in. Access granted.");
            contentElement.style.display = 'block';
        } else {
            // FAILURE: No user is logged in.
            // Redirect to the homepage.
            console.log("Auth Guard: No user found. Redirecting to home.");
            window.location.replace('index.html'); // Use replace to prevent "back" button issues.
        }
    });
}

// Run the gatekeeper function as soon as the DOM is ready.
document.addEventListener('DOMContentLoaded', authGuard);
