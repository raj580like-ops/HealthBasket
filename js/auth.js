// js/auth.js

const loginModal = document.getElementById('login-modal');
const closeButton = document.querySelector('.modal .close-button');

document.addEventListener('DOMContentLoaded', () => {
    // Check auth state
    auth.onAuthStateChanged(user => {
        const greetingElement = document.getElementById('user-greeting');
        if (user) {
            console.log('User is logged in:', user);
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    greetingElement.textContent = `Welcome ${doc.data().name}!`;
                }
            });
            loginModal.style.display = 'none';
        } else {
            console.log('User is logged out.');
            greetingElement.textContent = 'Welcome Guest!';
        }
    });

    // Event listeners
    const profileLink = document.querySelector('a[href="profile.html"]');
    if(profileLink) {
        profileLink.addEventListener('click', (e) => {
            if (!auth.currentUser) {
                e.preventDefault();
                loginModal.style.display = 'block';
            }
        });
    }

    if(closeButton) {
        closeButton.onclick = () => loginModal.style.display = 'none';
    }

    window.onclick = (event) => {
        if (event.target == loginModal) {
            loginModal.style.display = 'none';
        }
    };
    
    // Email link login
    const sendEmailLinkBtn = document.getElementById('send-email-link-btn');
    if(sendEmailLinkBtn) {
        sendEmailLinkBtn.addEventListener('click', () => {
            const name = document.getElementById('login-name').value;
            const email = document.getElementById('login-email').value;
            const phone = document.getElementById('login-phone').value;

            if (!name || !email || !phone) {
                alert('Please fill in all fields.');
                return;
            }

            const actionCodeSettings = {
                url: window.location.origin, // URL to redirect back to
                handleCodeInApp: true,
            };

            auth.sendSignInLinkToEmail(email, actionCodeSettings)
                .then(() => {
                    // Save user details temporarily
                    window.localStorage.setItem('emailForSignIn', email);
                    window.localStorage.setItem('userDetailsForSignUp', JSON.stringify({ name, phone }));
                    alert('A login link has been sent to your email.');
                    loginModal.style.display = 'none';
                })
                .catch(error => {
                    console.error(error);
                    alert(error.message);
                });
        });
    }

    // Handle the sign-in link
    if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('Please provide your email for confirmation');
        }
        auth.signInWithEmailLink(email, window.location.href)
            .then(result => {
                window.localStorage.removeItem('emailForSignIn');
                const userDetails = JSON.parse(window.localStorage.getItem('userDetailsForSignUp'));
                if (result.additionalUserInfo.isNewUser && userDetails) {
                    // Save new user details to Firestore
                    db.collection('users').doc(result.user.uid).set({
                        name: userDetails.name,
                        email: result.user.email,
                        phone: userDetails.phone,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    window.localStorage.removeItem('userDetailsForSignUp');
                }
            })
            .catch(error => console.error(error));
    }
});
