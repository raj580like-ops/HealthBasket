// js/profile.js

// This entire script runs under the assumption that auth-guard.js has already
// verified that a user is logged in.

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser;

    if (user) {
        // If the user object exists, load all their data.
        loadUserProfile(user.uid);
        loadOrderHistory(user.uid);
        updateCartBadge(); // This function is in cart.js
    } else {
        // This is a safety net. The auth-guard should prevent this code from ever running.
        console.error("CRITICAL ERROR: profile.js was loaded, but no user was found. The auth-guard may have failed.");
        document.body.innerHTML = "<h1>Access Error</h1><p>Could not verify user session. Please try logging in again from the <a href='index.html'>homepage</a>.</p>";
    }

    // Set up event listeners for the page's interactive elements.
    setupProfileEventListeners();
});

/**
 * Sets up all click handlers for the profile page.
 */
function setupProfileEventListeners() {
    const addressForm = document.getElementById('address-form');
    const logoutBtn = document.getElementById('logout-btn');

    if (addressForm) {
        addressForm.addEventListener('submit', handleAddressSave);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                // After signing out, Firebase's auth state will change, and the
                // auth-guard on the next page load will handle redirection.
                window.location.href = 'index.html';
            });
        });
    }
}

/**
 * Fetches user details from Firestore and populates the page.
 * @param {string} uid The user's unique ID.
 */
function loadUserProfile(uid) {
    const userSection = document.getElementById('user-details-section');
    const addressForm = document.getElementById('address-form');

    db.collection('users').doc(uid).get().then(doc => {
        if (doc.exists) {
            const userData = doc.data();
            const userName = userData.name || 'Valued Customer';
            const userEmail = userData.email || 'No email provided';

            userSection.innerHTML = `
                <h3>My Details</h3>
                <p><strong>Name:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
            `;

            // Pre-fill the address form if the user has saved an address before.
            if (userData.shippingAddress) {
                addressForm.elements['address-name'].value = userData.shippingAddress.name || '';
                addressForm.elements['address-line1'].value = userData.shippingAddress.line1 || '';
                addressForm.elements['address-city'].value = userData.shippingAddress.city || '';
                addressForm.elements['address-pincode'].value = userData.shippingAddress.pincode || '';
                addressForm.elements['address-phone'].value = userData.shippingAddress.phone || '';
            }
        } else {
            console.warn("User document not found in Firestore for UID:", uid);
            userSection.innerHTML = `<h3>My Details</h3><p>Could not load user details.</p>`;
        }
    });
}

/**
 * Fetches a user's order history from Firestore.
 * @param {string} uid The user's unique ID.
 */
function loadOrderHistory(uid) {
    const ordersListDiv = document.getElementById('order-history-list');
    db.collection('orders').where('userId', '==', uid).orderBy('createdAt', 'desc').get().then(querySnapshot => {
        if (querySnapshot.empty) {
            ordersListDiv.innerHTML = '<p>You have no past orders.</p>';
            return;
        }
        let ordersHtml = '';
        querySnapshot.forEach(doc => {
            const order = doc.data();
            const orderDate = order.createdAt.toDate().toLocaleDateString();
            ordersHtml += `
                <div class="order-card">
                    <div class="order-info">
                        <p><strong>Order ID:</strong> #${doc.id.substring(0, 8)}</p>
                        <p><strong>Date:</strong> ${orderDate}</p>
                        <p><strong>Total:</strong> ₹${order.totalAmount}</p>
                    </div>
                    <div class="order-status">${order.status}</div>
                </div>
            `;
        });
        ordersListDiv.innerHTML = ordersHtml;
    });
}

/**
 * Saves the shipping address to the user's document in Firestore.
 * @param {Event} event The form submission event.
 */
function handleAddressSave(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (user) {
        const address = {
            name: document.getElementById('address-name').value,
            line1: document.getElementById('address-line1').value,
            city: document.getElementById('address-city').value,
            pincode: document.getElementById('address-pincode').value,
            phone: document.getElementById('address-phone').value,
        };

        // .set with { merge: true } safely creates or updates the document field.
        db.collection('users').doc(user.uid).set({
            shippingAddress: address
        }, { merge: true })
        .then(() => alert('Address saved successfully!'))
        .catch(error => console.error('Error saving address:', error));
    }
}
