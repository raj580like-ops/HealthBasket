// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    // This script runs only after auth-guard.js has granted access.
    const user = auth.currentUser;
    if (user) {
        // Use onSnapshot for real-time updates. If the user's data changes,
        // the page will re-render automatically.
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
                renderProfilePage(doc.data());
            } else {
                console.error("CRITICAL: User is logged in, but their Firestore document is missing!");
            }
        });
        loadOrderHistory(user.uid);
        updateCartBadge();
    }
    
    document.getElementById('profile-form').addEventListener('submit', handleProfileSave);
    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = 'index.html');
    });
});

/**
 * The main rendering function. It decides whether to show the saved details or the edit form.
 * @param {object} userData The user's data from Firestore.
 */
function renderProfilePage(userData) {
    const detailsView = document.getElementById('profile-details-view');
    const formView = document.getElementById('profile-form-view');
    
    // Define "complete" as having a phone number and a village.
    const isProfileComplete = userData.phone && userData.shippingAddress?.village;

    if (isProfileComplete) {
        // --- PROFILE IS COMPLETE: Show the read-only details ---
        detailsView.style.display = 'block';
        formView.style.display = 'none';

        const addr = userData.shippingAddress;
        detailsView.innerHTML = `
            <div class="profile-details">
                <p><strong>Name:</strong> ${userData.name || 'N/A'}</p>
                <p><strong>Email:</strong> ${userData.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${userData.phone || 'N/A'}</p>
                <p><strong>Address:</strong> ${addr.village || ''}, ${addr.postOffice || ''}, ${addr.district || ''}, ${addr.state || ''} - ${addr.pincode || ''}</p>
                <p><strong>Landmark:</strong> ${addr.landmark || 'N/A'}</p>
            </div>
            <button id="edit-profile-btn" class="edit-btn">Edit Details</button>
        `;

        // IMPORTANT: Add an event listener to the newly created "Edit" button.
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            populateProfileForm(userData); // Fill the form with current data
            detailsView.style.display = 'none';
            formView.style.display = 'block'; // Show the form
        });
    } else {
        // --- PROFILE IS INCOMPLETE: Show the form to be filled out ---
        detailsView.style.display = 'none';
        formView.style.display = 'block';
        populateProfileForm(userData);
    }
}

/**
 * A helper function to fill the form fields with data from Firestore.
 * @param {object} userData The user's data.
 */
function populateProfileForm(userData) {
    const form = document.getElementById('profile-form');
    const addr = userData.shippingAddress || {}; // Use empty object as a safe fallback

    form.elements['profile-name'].value = userData.name || '';
    form.elements['profile-email'].value = userData.email || '';
    form.elements['profile-number'].value = userData.phone || '';
    form.elements['profile-vill'].value = addr.village || '';
    form.elements['profile-post'].value = addr.postOffice || '';
    form.elements['profile-dist'].value = addr.district || '';
    form.elements['profile-pin'].value = addr.pincode || '';
    form.elements['profile-state'].value = addr.state || '';
    form.elements['profile-landmark'].value = addr.landmark || '';
}

/**
 * Saves all profile form data to Firestore.
 */
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

        // .set with { merge: true } safely updates the user document.
        db.collection('users').doc(user.uid).set(profileData, { merge: true })
            .then(() => {
                alert('Profile saved successfully!');
                // The onSnapshot listener will automatically switch back to the details view.
            })
            .catch(error => console.error('Error saving profile:', error));
    }
}

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
