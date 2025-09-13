// js/profile.js

// We can now assume the user is logged in because the auth-guard has already checked.
const user = auth.currentUser;

document.addEventListener('DOMContentLoaded', () => {
    if (user) {
        // If a user exists, load their data.
        loadUserProfile(user.uid);
        loadOrderHistory(user.uid);
        updateCartBadge();
    } else {
        // This is a fallback, but the guard should prevent this from being seen.
        console.error("Profile.js loaded, but no user was found. This shouldn't happen.");
    }

    // Event listeners
    document.getElementById('address-form').addEventListener('submit', handleAddressSave);
    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('User signed out');
            window.location.href = 'index.html';
        });
    });
});

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

            if (userData.shippingAddress) {
                // Pre-fill form
            }
        } else {
            console.log("User document not found.");
            userSection.innerHTML = `<h3>My Details</h3><p>Could not load user details.</p>`;
        }
    });
}

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

        db.collection('users').doc(user.uid).set({ 
            shippingAddress: address 
        }, { merge: true })
        .then(() => alert('Address saved successfully!'))
        .catch(error => console.error('Error saving address:', error));
    }
}

function loadOrderHistory(uid) {
    // This function remains the same as before.
    const ordersListDiv = document.getElementById('order-history-list');
    db.collection('orders')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get()
      .then(querySnapshot => {
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
