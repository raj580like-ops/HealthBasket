// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');

    auth.onAuthStateChanged(user => {
        if (user) {
            loadUserProfile(user.uid);
            loadOrderHistory(user.uid);
        } else {
            // If no user is logged in, redirect to homepage
            window.location.href = 'index.html';
        }
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    });

    // Handle address form submission
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
            db.collection('users').doc(user.uid).update({ shippingAddress: address })
                .then(() => alert('Address saved!'))
                .catch(error => console.error('Error saving address:', error));
        }
    });
});

function loadUserProfile(uid) {
    const userInfoDiv = document.getElementById('user-info');
    db.collection('users').doc(uid).get().then(doc => {
        if (doc.exists) {
            const user = doc.data();
            userInfoDiv.innerHTML = `
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Phone:</strong> ${user.phone}</p>
            `;

            // Pre-fill address form
            if (user.shippingAddress) {
                document.getElementById('address-name').value = user.shippingAddress.name;
                document.getElementById('address-line1').value = user.shippingAddress.line1;
                document.getElementById('address-city').value = user.shippingAddress.city;
                document.getElementById('address-pincode').value = user.shippingAddress.pincode;
                document.getElementById('address-phone').value = user.shippingAddress.phone;
            }
        }
    });
}

function loadOrderHistory(uid) {
    const ordersListDiv = document.getElementById('orders-list');
    db.collection('orders').where('userId', '==', uid).orderBy('createdAt', 'desc').get().then(querySnapshot => {
        if (querySnapshot.empty) {
            ordersListDiv.innerHTML = '<p>You have no past orders.</p>';
            return;
        }
        let ordersHtml = '';
        querySnapshot.forEach(doc => {
            const order = doc.data();
            ordersHtml += `
                <div class="order-item">
                    <p><strong>Order ID:</strong> ${doc.id}</p>
                    <p><strong>Date:</strong> ${order.createdAt.toDate().toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ₹${order.totalAmount}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                </div>
            `;
        });
        ordersListDiv.innerHTML = ordersHtml;
    });
}
