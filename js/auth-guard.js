// js/auth-guard.js

/**
 * This is the "Patient Gatekeeper". Its only job is to wait for Firebase
 * to determine the initial, stable login state, and then grant access or redirect.
 * It unsubscribes itself after the first check to prevent any conflicts.
 */
function authGuard() {
    const contentElement = document.getElementById('protected-content');
    const loadingElement = document.getElementById('loading-spinner');

    // Show the loading spinner immediately and hide the page content.
    if (loadingElement) loadingElement.style.display = 'flex';
    if (contentElement) contentElement.style.display = 'none';

    // ================================================================
    // THE DEFINITIVE FIX IS HERE:
    // We create a listener that automatically unsubscribes itself.
    // This ensures it only runs ONCE, after Firebase has had time
    // to check for a saved session in the browser's memory.
    // ================================================================
    const unsubscribe = auth.onAuthStateChanged(user => {
        // Unsubscribe the listener immediately. We only care about the first result.
        unsubscribe(); 

        // Hide the spinner now that we have a definitive answer.
        if (loadingElement) loadingElement.style.display = 'none';

        if (user) {
            // SUCCESS: A user session was found. Show the page.
            console.log("Auth Guard: Access granted.");
            if (contentElement) contentElement.style.display = 'block';
        } else {
            // FAILURE: No user session was found. Redirect to home.
            console.log("Auth Guard: Access DENIED. Redirecting to home.");
            // Use .replace() to prevent the user from clicking "back" to the broken page.
            window.location.replace('index.html');
        }
    });
}

// Run the gatekeeper as soon as the DOM is ready.
document.addEventListener('DOMContentLoaded', authGuard);
