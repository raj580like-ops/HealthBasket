// js/auth.js

/**
 * This script manages the entire authentication user experience:
 * 1. Updates the welcome message on the homepage.
 * 2. Controls the login/signup modal.
 * 3. Handles user creation (Sign Up) with email/password.
 * 4. Handles user login with email/password.
 * 5. Makes the profile link "smart" (login or navigate).
 */

document.addEventListener('DOMContentLoaded', () => {
    // This is the main listener. It runs on page load and whenever a user
    // logs in or out, ensuring the UI is always up-to-date.
    auth.onAuthStateChanged(updateUserGreeting);

    // Attach all click handlers for the modal and its forms.
    setupAuthEventListeners();
});

/**
 * Updates the "Welcome" message on the homepage.
 * It fetches the user's name from their document in the Firestore 'users' collection.
 * @param {firebase.User|null} user The user object from Firebase, or null if logged out.
 */
function updateUserGreeting(user) {
    const greetingElement = document.getElementById('user-greeting');
    if (!greetingElement) return; // Exit if this element isn't on the current page.

    if (user) {
        // A user is logged in.
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().name) {
                // We found the user's document and it has a name.
                greetingElement.innerHTML = `<h2>Welcome back,</h2><h1>${doc.data().name}</h1>`;
            } else {
                // Fallback for new users whose document might not be created yet, or if name is blank.
                greetingElement.innerHTML = `<h2>Welcome,</h2><h1>Friend</h1>`;
            }
        });
    } else {
        // No user is logged in.
        greetingElement.innerHTML = `<h2>Welcome,</h2><h1>Guest</h1>`;
    }
}

/**
 * A central function to set up all event listeners related to authentication.
 */
function setupAuthEventListeners() {
    const loginModal = document.getElementById('login-modal');
    const closeButton = document.querySelector('.modal .close-button');
    const profileLink = document.querySelector('a[href="profile.html"]');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const errorP = document.getElementById('auth-error');

    const showLoginModal = () => { if (loginModal) loginModal.style.display = 'block'; };
    const hideLoginModal = () => { if (loginModal) loginModal.style.display = 'none'; };

    // Make the profile link "smart": go to profile if logged in, otherwise open the login modal.
    if (profileLink) {
        profileLink.addEventListener('click', (event) => {
            event.preventDefault(); // Always stop the link first.
            if (auth.currentUser) {
                window.location.href = 'profile.html'; // Navigate if logged in.
            } else {
                showLoginModal(); // Show modal if logged out.
            }
        });
    }

    // Modal close button.
    if (closeButton) closeButton.onclick = hideLoginModal;

    // Handle switching between "Login" and "Sign Up" tabs.
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetView = tab.dataset.tab;
            document.querySelector('.auth-tab.active').classList.remove('active');
            tab.classList.add('active');
            document.querySelector('.auth-view.active').classList.remove('active');
            document.getElementById(`${targetView}-view`).classList.add('active');
            errorP.textContent = ''; // Clear any previous errors when switching tabs.
        });
    });

    // --- Handle Login Form Submission ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    console.log("User logged in:", userCredential.user.uid);
                    hideLoginModal();
              
