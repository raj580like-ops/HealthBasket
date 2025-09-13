// js/auth-guard.js

/**
 * A Promise-based function that waits for Firebase to determine the initial,
 * stable authentication state after checking persistent storage.
 * @returns {Promise<firebase.User|null>} A promise that resolves with the user object or null.
 */
function getInitialAuthState() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe(); // Stop listening after the first, definitive result.
            resolve(user);
        }, reject);
    });
}

/**
 * The main async gatekeeper function. It will pause execution until the promise resolves.
 */
async function authGuard() {
    const content = document.getElementById('protected-content');
    const spinner = document.getElementById('loading-spinner');

    if (!content || !spinner) {
        console.error("Auth Guard Error: Missing #protected-content or #loading-spinner element.");
        return;
    }

    spinner.style.display = 'flex';
    content.style.display = 'none';

    try {
        console.log("Auth Guard: Awaiting initial auth state...");
        const user = await getInitialAuthState();

        spinner.style.display = 'none';

        if (user) {
            console.log("Auth Guard: Access GRANTED. User:", user.uid);
            content.style.display = 'block';
        } else {
            console.log("Auth Guard: Access DENIED. No user session found. Redirecting...");
            window.location.replace('index.html');
        }
    } catch (error) {
        console.error("Auth Guard failed:", error);
        spinner.innerHTML = `<p>Error verifying access.</p>`;
    }
}

// Run the gatekeeper immediately.
authGuard();
