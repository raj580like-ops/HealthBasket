// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser;
    if (user) {
        // Use onSnapshot to listen for REAL-TIME updates to the user's profile.
        // This is more advanced and ensures the page always shows the latest data.
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
                renderProfilePage(doc.data());
            } else {
                console.error("User document not found, but user is logged in. This is a critical error.");
            }
        });
        
        loadOrderHistory(user.uid);
        updateCartBadge();
    }
    
    document.getElementById('profile-form').addEventListener('submit', handleProfileSave);
    document.getElementById('logout-btn').addEventListener('click', () => auth.signOut().then(() => window.location.href = 'index.html'));
});

/**
 * This is the main function for displaying the profile page.
 * It decides whether to show the form or the saved details.
 * @param {object} userData The user's data from Firestore.
 */
function renderProfilePage(userData) {
    const formContainer = document.getElementById('profile-form-container');
    const detailsContainer = document.getElementById('profile-details-container');
    
    // Check if the essential address details have been filled out.
    const isProfileComplete = userData.phone && userData.shippingAddress && userData.shippingAddress.village;

    if (isProfileComplete) {
        // --- PROFILE IS COMPLETE: Show the details view ---
        formContainer.style.display = 'none';
        detailsContainer.style.display = 'block';

        const address = userData.shippingAddress;
        detailsContainer.innerHTML = `
            <p><strong>Name:</strong> ${userData.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${userData.email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${userData.phone || 'N/A'}</p>
            <p><strong>Address:</strong> ${address.village || ''}, ${address.postOffice || ''}, ${address.district || ''}, ${address.state || ''} - ${address.pincode || ''}</p>
            <p><strong>Landmark:</strong> ${address.landmark || 'N/A'}</p>
            <button id="edit-profile-btn" class="edit-btn">Edit Details</button>
        `;

        // Add a click listener to the new "Edit" button
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            populateProfileForm(userData); // Pre-fill the form
            formContainer.style.display = 'block';
            detailsContainer.style.display = 'none';
        });

    } else {
        // --- PROFILE IS INCOMPLETE: Show the form view ---
        formContainer.style.display = 'block';
        detailsContainer.style.display = 'none';
        populateProfileForm(userData); // Pre-fill with any data that does exist
    }
}

/**
 * A helper function to populate the form fields with user data.
 * @param {object} userData The user's data from Firestore.
 */
function populateProfileForm(userData) {
    const profileForm = document.getElementById('profile-form');
    const address = userData.shippingAddress || {}; // Use empty object as fallback

    profileForm.elements['profile-name'].value = userData.name || '';
    profileForm.elements['profile-email'].value = userData.email || '';
    profileForm.elements['profile-number'].value = userData.phone || '';
    profileForm.elements['profile-vill'].value = address.village || '';
    profileForm.elements['profile-post'].value = address.postOffice || '';
    profileForm.elements['profile-dist'].value = address.district || '';
    profileForm.elements['profile-pin'].value = address.pincode || '';
    profileForm.elements['profile-state'].value = address.state || '';
    profileForm.elements['profile-landmark'].value = address.landmark || '';
}

/**
 * Saves the complete profile and address to Firestore.
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

        // Use .set with { merge: true } to safely update the user document.
        // This will add or overwrite fields without destroying the whole document.
        db.collection('users').doc(user.uid).set(profileData, { merge: true })
            .then(() => {
                alert('Profile saved successfully!');
                // The onSnapshot listener will automatically re-render the page to show the details view.
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
