// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // This primary listener updates the UI whenever the auth state changes.
    auth.onAuthStateChanged(updateUserGreeting);
    // Set up all necessary event listeners for the new modal.
    setupAuthEventListeners();
});

function updateUserGreeting(user) { /* ... same as before ... */ }

function setupAuthEventListeners() {
    const loginModal = document.getElementById('login-modal');
    const closeButton = document.querySelector('.modal .close-button');
    const profileLink = document.querySelector('a[href="profile.html"]');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    const showLoginModal = () => loginModal.style.display = 'block';
    const hideLoginModal = () => loginModal.style.display = 'none';

    // Make the profile icon link "smart"
    if (profileLink) {
        profileLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (auth.currentUser) {
                window.location.href = 'profile.html';
            } else {
                showLoginModal();
            }
        });
    }

    if (closeButton) closeButton.onclick = hideLoginModal;

    // Handle switching between Login and Sign Up tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetView = tab.dataset.tab; // "login" or "signup"
            document.querySelector('.auth-tab.active').classList.remove('active');
            tab.classList.add('active');
            
            document.querySelector('.auth-view.active').classList.remove('active');
            document.getElementById(`${targetView}-view`).classList.add('active');
        });
    });

    // --- Handle Login Form Submission ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorP = document.getElementById('auth-error');

        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                console.log("User logged in:", userCredential.user.uid);
                hideLoginModal();
            })
            .catch(error => {
                console.error("Login failed:", error);
                errorP.textContent = "Login failed. Please check your credentials.";
            });
    });

    // --- Handle Sign Up Form Submission ---
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const errorP = document.getElementById('auth-error');

        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                const user = userCredential.user;
                console.log("New user created:", user.uid);

                // Now, create their profile document in Firestore
                return db.collection('users').doc(user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                console.log("User document created in Firestore.");
                hideLoginModal();
            })
            .catch(error => {
                console.error("Sign up failed:", error);
                if (error.code === 'auth/email-already-in-use') {
                    errorP.textContent = "This email is already registered. Please login instead.";
                } else {
                    errorP.textContent = "Sign up failed. Please try again.";
                }
            });
    });
}
