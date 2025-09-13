// js/auth-guard.js

/**
 * A Promise-based function that waits for Firebase to determine the initial,
 * stable authentication state. It only resolves once.
 * @returns {Promise<firebase.User|null>} A promise that resolves with the user object or null.
 */
function getInitialAuthState() {
    return new Promise((resolve, reject) => {
        // onAuthStateChanged is the most reliable way to get the current user.
        // We create a listener that unsubscribes itself after the first result.
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe(); // Stop listening. We only need the initial state.
            resolve(user);
        }, reject); // If there's an error during initialization, reject the promise.
    });
}

/**
 * The main async gatekeeper. It will pause everything until it gets a final
 * answer from Firebase about the user's session.
 */
async function authGuard() {
    const content = document.getElementById('protected-content');
    const spinner = document.getElementById('loading-spinner');

    if (!content || !spinner) {
        console.error("Auth Guard FATAL ERROR: Cannot find required elements #protected-content or #loading-spinner.");
        return;
    }

    spinner.style.display = 'flex';
    content.style.display = 'none';

    try {
        console.log("Auth Guard: Awaiting definitive auth state...");
        const user = await getInitialAuthState();

        spinner.style.display = 'none';

        if (user) {
            console.log("Auth Guard: Access GRANTED for user:", user.uid);
            content.style.display = 'block';
        } else {
            console.log("Auth Guard: Access DENIED. No valid session found. Redirecting to home.");
            // Use .replace() to prevent the user from using the "back" button to return to a broken state.
            window.location.replace('index.html');
        }
    } catch (error) {
        console.error("Auth Guard failed with an error:", error);
        spinner.innerHTML = `<p>Error verifying your session. Please try again.</p>`;
    }
}

// Run the gatekeeper as soon as the file is loaded.
authGuard();
