// admin/js/dashboard.js

// IMPORTANT: Paste your ImgBB API Key here
const IMGBB_API_KEY = 'e4ac63ce8f34d7f4b55b316d642b432d';

document.addEventListener('DOMContentLoaded', () => {
    // Check if admin is logged in
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            // Load all dashboard data
            loadCategoriesForDropdown();
            loadCategoriesForList();
            loadOrders();
        }
    });

    // Logout
    document.getElementById('admin-logout-btn').addEventListener('click', () => auth.signOut());

    // --- Banner Management with ImgBB ---
    document.getElementById('update-banner-btn').addEventListener('click', async () => {
        const title = document.getElementById('banner-title').value;
        const subtitle = document.getElementById('banner-subtitle').value;
        const imageFile = document.getElementById('banner-image').files[0];

        try {
            if (imageFile) {
                // 1. Upload image to ImgBB
                const imageUrl = await uploadImageToImgBB(imageFile);
                // 2. Save the URL from ImgBB to Firestore
                await db.collection('settings').doc('banner').set({ title, subtitle, imageUrl: imageUrl });
                alert('Banner updated successfully with new image!');
            } else {
                // If no new image, just update the text
                await db.collection('settings').doc('banner').update({ title, subtitle });
                alert('Banner text updated!');
            }
        } catch (error) {
            console.error("Error updating banner:", error);
            alert("Failed to update banner. Check the console for errors.");
        }
    });

    // --- Category Management (No change) ---
    document.getElementById('add-category-btn').addEventListener('click', () => {
        const name = document.getElementById('category-name').value;
        if (name) {
            db.collection('categories').add({ name }).then(() => {
                loadCategoriesForDropdown();
                loadCategoriesForList();
                document.getElementById('category-name').value = ''; // Clear input
            });
        }
    });

    // --- Product Management with ImgBB ---
    document.getElementById('add-product-btn').addEventListener('click', async () => {
        const imageFile = document.getElementById('product-image').files[0];
        if (!imageFile) {
            alert('Please select a product image to upload.');
            return;
        }

        try {
            // 1. Upload image to ImgBB
            const imageUrl = await uploadImageToImgBB(imageFile);

            // 2. Prepare product data with the URL from ImgBB
            const product = {
                name: document.getElementById('product-name').value,
                mrp: parseFloat(document.getElementById('product-mrp').value),
                sellingPrice: parseFloat(document.getElementById('product-sp').value),
                category: document.getElementById('product-category').value,
                badge: document.getElementById('product-badge').value,
                isNewArrival: document.getElementById('product-new-arrival').checked,
                imageUrl: imageUrl // Use the URL from ImgBB
            };

            // 3. Save the complete product data to Firestore
            await db.collection('products').add(product);
            alert('Product added successfully!');
            // Optional: clear the form
            document.getElementById('add-product-form').reset();

        } catch (error) {
            console.error("Error adding product:", error);
            alert("Failed to add product. Check the console for errors.");
        }
    });
});

/**
 * A helper function to upload an image file to ImgBB and return the image URL.
 * @param {File} imageFile The image file to upload.
 * @returns {Promise<string>} A promise that resolves with the display URL of the uploaded image.
 */
async function uploadImageToImgBB(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();

    if (result.success) {
        return result.data.display_url;
    } else {
        throw new Error(result.error.message || 'Image upload failed.');
    }
}


// --- Functions to load data into the dashboard (No changes needed here) ---
function loadCategoriesForDropdown() {
    const select = document.getElementById('product-category');
    db.collection('categories').get().then(snapshot => {
        select.innerHTML = '';
        snapshot.forEach(doc => {
            select.innerHTML += `<option value="${doc.id}">${doc.data().name}</option>`;
        });
    });
}

function loadCategoriesForList() {
    const list = document.getElementById('category-list');
    db.collection('categories').get().then(snapshot => {
        list.innerHTML = '';
        snapshot.forEach(doc => {
            list.innerHTML += `<p>${doc.data().name} <button onclick="deleteCategory('${doc.id}')">Delete</button></p>`;
        });
    });
}

function deleteCategory(id) {
    if (confirm('Are you sure you want to delete this category?')) {
        db.collection('categories').doc(id).delete().then(() => {
            loadCategoriesForList();
            loadCategoriesForDropdown();
        });
    }
}

function loadOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const order = doc.data();
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
            tbody.innerHTML += `
                <tr>
                    <td>${doc.id.substring(0, 8)}...</td>
                    <td>${order.userId.substring(0, 8)}...</td>
                    <td>₹${order.totalAmount}</td>
                    <td>${orderDate}</td>
                    <td>${order.status}</td>
                    <td>
                        <select onchange="updateOrderStatus('${doc.id}', this.value)">
                            <option value="Placed" ${order.status === 'Placed' ? 'selected' : ''}>Placed</option>
                            <option value="Dispatched" ${order.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                    </td>
                </tr>
            `;
        });
    });
}

function updateOrderStatus(id, status) {
    db.collection('orders').doc(id).update({ status: status });
}
