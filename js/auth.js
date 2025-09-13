// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // This primary listener updates the UI whenever the auth state changes.
    auth.onAuthStateChanged(updateUserGreeting);

    // Set up all necessary event listeners for the login modal and protected links.
    setupAuthEventListeners();

    // Check if the user is returning from an email sign-in link.
    handleSignInLink();
});

/**
 * Updates the "Welcome" message on the homepage based on login state.
 * @param {firebase.User|null} user The user object from Firebase, or null.
 */
function updateUserGreeting(user) {
    const greetingElement = document.getElementById('user-greeting');
    if (!greetingElement) return; // Exit if the element isn't on the current page.

    if (user) {
        // User is logged in, so we fetch their name from our 'users' collection.
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                greetingElement.innerHTML = `<h2>Welcome back,</h2><h1>${doc.data().name}</h1>`;
            } else {
                // Fallback if the user document hasn't been created yet.
                greetingElement.innerHTML = `<h2>Welcome,</h2><h1>Friend</h1>`;
            }
        });
    } else {
        // User is logged out.
        greetingElement.innerHTML = `<h2>Welcome,</h2><h1>Guest</h1>`;
    }
}

/**
 * Sets up all click handlers related to authentication.
 */
function setupAuthEventListeners() {
    const loginModal = document.getElementById('login-modal');
    const closeButton = document.querySelector('.modal .close-button');
    const sendEmailLinkBtn = document.getElementById('send-email-link-btn');
    const profileLink = document.querySelector('a[href="profile.html"]');

    // Logic to show the login modal
    const showLoginModal = () => {
        if (loginModal) loginModal.style.display = 'block';
    };

    // Logic to hide the login modal
    const hideLoginModal = () => {
        if (loginModal) loginModal.style.display = 'none';
    };

    // Make the profile icon link "smart"
    if (profileLink) {
        profileLink.addEventListener('click', (event) => {
            event.preventDefault(); // Stop the link from navigating immediately.
            if (auth.currentUser) {
                // If user is already logged in, proceed to the profile page.
                window.location.href = 'profile.html';
            } else {
                // If user is logged out, show the login modal instead.
                showLoginModal();
            }
        });
    }

    // Modal close button
    if (closeButton) closeButton.onclick = hideLoginModal;

    // Send email link button
    if (sendEmailLinkBtn) {
        sendEmailLinkBtn.addEventListener('click', () => {
            const name = document.getElementById('login-name').value;
            const email = document.getElementById('login-email').value;

            if (!email) {
                alert('Please enter your email address.');
                return;
            }

            const actionCodeSettings = {
                url: window.location.origin, // Redirect back to the main page.
                handleCodeInApp: true,
            };

            auth.sendSignInLinkToEmail(email, actionCodeSettings)
                .then(() => {
                    // Save the user's details in the browser so we can use them when they return.
                    window.localStorage.setItem('emailForSignIn', email);
                    if (name) {
                        window.localStorage.setItem('userNameForSignUp', name);
                    }
                    alert('A login link has been sent to your email.');
                    hideLoginModal();
                })
                .catch(error => console.error("Error sending login link:", error));
        });
    }
}

/**
 * Checks if the current URL is a sign-in link and completes the process.
 */
function handleSignInLink() {
    if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('Please provide your email for confirmation');
        }

        auth.signInWithEmailLink(email, window.location.href)
            .then(result => {
                // The user is now officially logged in.
                
                // If this is the very first time they've logged in, create their user profile.
                if (result.additionalUserInfo.isNewUser) {
                    const name = window.localStorage.getItem('userNameForSignUp');
                    if (name) {
                        db.collection('users').doc(result.user.uid).set({
                            name: name,
                            email: result.user.email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        }).catch(err => console.error("Error creating user document:", err));
                    }
                }
                
                // Clean up the stored information.
                window.localStorage.removeItem('emailForSignIn');
                window.localStorage.removeItem('userNameForSignUp');
            })
            .catch(error => console.error("Error signing in with email link:", error));
    }
}
