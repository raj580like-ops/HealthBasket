// js/auth-guard.js

/**
 * A Promise-based function that waits for Firebase to determine the initial,
 * stable authentication state. It only resolves once.
 * @returns {Promise<firebase.User|null>} A promise that resolves with the user object or null.
 */
function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe(); // Stop listening after we get the first, stable result.
            resolve(user); // Resolve the promise with the user object (or null).
        }, reject); // Reject the promise if there's an error.
    });
}

/**
 * This is the main "gatekeeper" function. It is now asynchronous.
 * It will pause and wait for getCurrentUser() to finish before doing anything.
 */
async function authGuard() {
    const contentElements = document.querySelectorAll('.requires-auth');
    const loadingElement = document.getElementById('loading-spinner');

    // Show loading spinner immediately
    if (loadingElement) loadingElement.style.display = 'flex';
    contentElements.forEach(el => el.style.display = 'none');

    try {
        // ================================================================
        // THE DEFINITIVE FIX:
        // We 'await' our promise. The code will NOT continue past this
        // line until Firebase has a definitive answer about the login state.
        // ================================================================
        const user = await getCurrentUser();

        // Hide the spinner now that we have our answer.
        if (loadingElement) loadingElement.style.display = 'none';

        if (user) {
            // SUCCESS: A user was found. Show the protected content.
            console.log("Auth Guard: Access GRANTED.");
            contentElements.forEach(el => el.style.display = 'block'); // Use 'block' or 'flex' as needed
        } else {
            // FAILURE: No user was found. Redirect.
            console.log("Auth Guard: Access DENIED. Redirecting to home.");
            window.location.replace('index.html');
        }
    } catch (error) {
        console.error("Authentication error in Auth Guard:", error);
        // Handle potential errors during auth check
        if (loadingElement) loadingElement.textContent = 'Error verifying access.';
    }
}

// Run the gatekeeper.
authGuard();
