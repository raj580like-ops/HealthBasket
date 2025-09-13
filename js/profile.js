// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    // This is a protected page, so we check for authentication immediately.
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in. Let's load their data.
            loadUserProfile(user.uid);
            loadOrderHistory(user.uid);
            updateCartBadge();
        } else {
            // No user is signed in. Redirect them to the homepage.
            // In a real app, you might show a message first.
            console.log("No user found, redirecting to home.");
            window.location.href = 'index.html';
        }
    });

    // Handle Address Form Submission
    document.getElementById('address-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user) {
            const address = {
                name: document.getElementById('address-name').value,
                line1: document.getElementById('address-line1').value,
                city: document.getElementById('address-city').value,
                pincode: document.getElementById('address-pincode').value,
                phone: document.getElementById('address-phone').value,
            };

            // Use .set with { merge: true } to create or update the address
            db.collection('users').doc(user.uid).set({ 
                shippingAddress: address 
            }, { merge: true })
            .then(() => alert('Address saved successfully!'))
            .catch(error => console.error('Error saving address:', error));
        }
    });

    // Handle Logout
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
            const user = doc.data();
            // Display user's name and email
            userSection.innerHTML = `
                <h3>My Details</h3>
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
            `;

            // Pre-fill the address form if an address exists
            if (user.shippingAddress) {
                addressForm.elements['address-name'].value = user.shippingAddress.name || '';
                addressForm.elements['address-line1'].value = user.shippingAddress.line1 || '';
                addressForm.elements['address-city'].value = user.shippingAddress.city || '';
                addressForm.elements['address-pincode'].value = user.shippingAddress.pincode || '';
                addressForm.elements['address-phone'].value = user.shippingAddress.phone || '';
            }
        }
    });
}

function loadOrderHistory(uid) {
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
