// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('login-modal');
    const closeButton = document.querySelector('.modal .close-button');
    
    // Check the user's authentication state when the page loads.
    auth.onAuthStateChanged(user => {
        updateUserGreeting(user); // Call our new, robust function.
        if (user) {
            loginModal.style.display = 'none'; // Close modal if user is logged in.
        }
    });

    // --- Login Modal Logic ---
    if (closeButton) {
        closeButton.onclick = () => loginModal.style.display = 'none';
    }
    window.onclick = (event) => {
        if (event.target == loginModal) {
            loginModal.style.display = 'none';
        }
    };
    
    // --- Email Link Login Logic ---
    const sendEmailLinkBtn = document.getElementById('send-email-link-btn');
    if (sendEmailLinkBtn) {
        sendEmailLinkBtn.addEventListener('click', () => {
            const name = document.getElementById('login-name').value;
            const email = document.getElementById('login-email').value;

            if (!email) {
                alert('Please enter your email address.');
                return;
            }

            const actionCodeSettings = {
                url: window.location.origin, // URL to redirect back to
                handleCodeInApp: true,
            };

            auth.sendSignInLinkToEmail(email, actionCodeSettings)
                .then(() => {
                    // Save email and name for when the user returns
                    window.localStorage.setItem('emailForSignIn', email);
                    if (name) {
                        window.localStorage.setItem('userNameForSignUp', name);
                    }
                    alert('A login link has been sent to your email.');
                    loginModal.style.display = 'none';
                })
                .catch(error => {
                    console.error("Error sending login link:", error);
                    alert(error.message);
                });
        });
    }

    // --- Handle the returning user from the email link ---
    if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('Please provide your email for confirmation');
        }
        auth.signInWithEmailLink(email, window.location.href)
            .then(result => {
                // Clear the stored email
                window.localStorage.removeItem('emailForSignIn');
                
                // If this is a new user, create their document in Firestore
                if (result.additionalUserInfo.isNewUser) {
                    const name = window.localStorage.getItem('userNameForSignUp');
                    if (name) {
                        db.collection('users').doc(result.user.uid).set({
                            name: name,
                            email: result.user.email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        window.localStorage.removeItem('userNameForSignUp');
                    }
                }
            })
            .catch(error => console.error("Error signing in with email link:", error));
    }
});

/**
 * A robust function to update the user greeting on the homepage.
 * @param {object|null} user The user object from Firebase Auth, or null if logged out.
 */
function updateUserGreeting(user) {
    const greetingElement = document.getElementById('user-greeting');
    if (!greetingElement) return; // Exit if the element doesn't exist on the page.

    if (user) {
        // 1. User is logged in, now fetch their name from Firestore.
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const userName = doc.data().name;
                // THIS IS THE FIX: We use the fetched name.
                greetingElement.innerHTML = `
                    <h2>Welcome back,</h2>
                    <h1>${userName}</h1>
                `;
            } else {
                // This can happen if the user document wasn't created properly.
                // We'll use a fallback.
                greetingElement.innerHTML = `
                    <h2>Welcome,</h2>
                    <h1>Friend</h1>
                `;
            }
        });
    } else {
        // 2. User is logged out.
        greetingElement.innerHTML = `
            <h2>Welcome,</h2>
            <h1>Guest</h1>
        `;
    }
}
