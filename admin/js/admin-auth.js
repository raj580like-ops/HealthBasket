// admin/js/admin-auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('admin-login-btn');
    const emailField = document.getElementById('admin-email');
    const passwordField = document.getElementById('admin-password');
    const errorMessage = document.getElementById('admin-error-message');

    loginBtn.addEventListener('click', () => {
        const email = emailField.value;
        const password = passwordField.value;

        if (!email || !password) {
            errorMessage.textContent = 'Please enter both email and password.';
            return;
        }

        errorMessage.textContent = ''; // Clear previous errors

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login successful, redirect to the dashboard
                console.log('Admin login successful');
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                // Handle login errors
                console.error('Admin login failed:', error);
                errorMessage.textContent = 'Login failed. Please check your credentials.';
            });
    });
});
