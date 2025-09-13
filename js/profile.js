// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser;
    if (user) {
        loadUserProfile(user.uid);
        // ... rest of your loading functions
    }
    document.getElementById('profile-form').addEventListener('submit', handleProfileSave);
    document.getElementById('logout-btn').addEventListener('click', () => auth.signOut().then(() => window.location.href = 'index.html'));
});

function loadUserProfile(uid) {
    const profileForm = document.getElementById('profile-form');
    db.collection('users').doc(uid).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            // Populate the form with data from Firestore
            profileForm.elements['profile-name'].value = data.name || '';
            profileForm.elements['profile-email'].value = data.email || '';
            profileForm.elements['profile-number'].value = data.phone || '';
            if (data.shippingAddress) {
                profileForm.elements['profile-vill'].value = data.shippingAddress.village || '';
                profileForm.elements['profile-post'].value = data.shippingAddress.postOffice || '';
                profileForm.elements['profile-dist'].value = data.shippingAddress.district || '';
                profileForm.elements['profile-pin'].value = data.shippingAddress.pincode || '';
                profileForm.elements['profile-state'].value = data.shippingAddress.state || '';
                profileForm.elements['profile-landmark'].value = data.shippingAddress.landmark || '';
            }
        }
    });
}

function handleProfileSave(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (user) {
        const profileData = {
            name: document.getElementById('profile-name').value,
            phone: document.getElementById('profile-number').value,
            shippingAddress: {
                village: document.getElementById('profile-vill').value,
                postOffice: document.getElementById('profile-post').value,
                district: document.getElementById('profile-dist').value,
                pincode: document.getElementById('profile-pin').value,
                state: document.getElementById('profile-state').value,
                landmark: document.getElementById('profile-landmark').value,
            }
        };

        // Use .set with { merge: true } to safely update the user document
        db.collection('users').doc(user.uid).set(profileData, { merge: true })
            .then(() => alert('Profile saved successfully!'))
            .catch(error => console.error('Error saving profile:', error));
    }
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
