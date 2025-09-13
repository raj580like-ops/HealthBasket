// admin/js/admin-auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('admin-login-btn');
    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-password').value;
        auth.signInWithEmailAndPassword(email, pass)
            .then(userCredential => {
                // IMPORTANT: Add logic here to check if the user is a designated admin
                window.location.href = 'dashboard.html';
            })
            .catch(error => alert(error.message));
    });
});
