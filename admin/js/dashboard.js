// admin/js/dashboard.js

// IMPORTANT: Paste your ImgBB API Key here.
const IMGBB_API_KEY = 'e4ac63ce8f34d7f4b55b316d642b432d';


/**
 * Main function that runs when the dashboard page is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    // This is a protected page. We must check if an admin is logged in.
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in. Load all necessary data for the dashboard.
            console.log("Admin user is logged in. Loading dashboard data...");
            loadCategoriesForDropdown();
            loadCategoriesForList();
            loadOrders();
        } else {
            // No user is signed in. Redirect them to the admin login page.
            console.log("No user found. Redirecting to admin login.");
            window.location.href = 'index.html';
        }
    });

    // Attach all the event listeners for the dashboard controls.
    setupEventListeners();
});

/**
 * A helper function to organize all event listeners in one place.
 */
function setupEventListeners() {
    // Logout Button
    document.getElementById('admin-logout-btn').addEventListener('click', () => {
        auth.signOut(); // Firebase handles the redirection via the onAuthStateChanged listener.
    });

    // Banner Management Button
    document.getElementById('update-banner-btn').addEventListener('click', handleBannerUpdate);

    // Category Management Button
    document.getElementById('add-category-btn').addEventListener('click', handleAddCategory);

    // Product Management Form Submission
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
}


// --- Core Management Handlers ---

async function handleBannerUpdate() {
    const title = document.getElementById('banner-title').value;
    const subtitle = document.getElementById('banner-subtitle').value;
    const imageFile = document.getElementById('banner-image').files[0];

    try {
        if (imageFile) {
            console.log("Uploading new banner image...");
            const imageUrl = await uploadImageToImgBB(imageFile);
            console.log("Banner image uploaded:", imageUrl);
            await db.collection('settings').doc('banner').set({ title, subtitle, imageUrl: imageUrl });
            alert('Banner updated successfully with new image!');
        } else {
            // If no new image, just update the text fields.
            await db.collection('settings').doc('banner').update({ title, subtitle });
            alert('Banner text updated!');
        }
    } catch (error) {
        console.error("Error updating banner:", error);
        alert("Failed to update banner. Check console for details.");
    }
}

async function handleAddCategory() {
    const categoryNameInput = document.getElementById('category-name');
    const name = categoryNameInput.value.trim();
    if (name) {
        try {
            await db.collection('categories').add({ name: name });
            alert('Category added successfully!');
            categoryNameInput.value = ''; // Clear the input field
            // No need to call load functions here, onSnapshot will do it automatically.
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category.");
        }
    }
}

async function handleAddProduct(event) {
    event.preventDefault(); // Stop the form from causing a page reload.
    const addButton = document.getElementById('add-product-btn');
    addButton.textContent = 'Uploading...';
    addButton.disabled = true;

    try {
        const imageFile = document.getElementById('product-image').files[0];
        const imageUrl = await uploadImageToImgBB(imageFile);

        const product = {
            name: document.getElementById('product-name').value,
            mrp: parseFloat(document.getElementById('product-mrp').value),
            sellingPrice: parseFloat(document.getElementById('product-sp').value),
            category: document.getElementById('product-category').value,
            badge: document.getElementById('product-badge').value,
            isNewArrival: document.getElementById('product-new-arrival').checked,
            imageUrl: imageUrl
        };

        await db.collection('products').add(product);
        alert('Product added successfully!');
        document.getElementById('add-product-form').reset();
    } catch (error) {
        console.error("Error adding product:", error);
        alert("Failed to add product. Check console for details.");
    } finally {
        // Ensure the button is re-enabled, even if the upload fails.
        addButton.textContent = 'Add Product';
        addButton.disabled = false;
    }
}


// --- Data Loading and Display Functions ---

function loadCategoriesForDropdown() {
    const select = document.getElementById('product-category');
    // Use onSnapshot to listen for real-time updates.
    db.collection('categories').onSnapshot(snapshot => {
        select.innerHTML = ''; // Clear existing options
        snapshot.forEach(doc => {
            select.innerHTML += `<option value="${doc.id}">${doc.data().name}</option>`;
        });
    });
}

function loadCategoriesForList() {
    const list = document.getElementById('category-list');
    // Use onSnapshot to listen for real-time updates.
    db.collection('categories').onSnapshot(snapshot => {
        list.innerHTML = ''; // Clear existing list
        snapshot.forEach(doc => {
            list.innerHTML += `<p>${doc.data().name} <button class="delete-btn" onclick="deleteCategory('${doc.id}')">Delete</button></p>`;
        });
    });
}

function loadOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    // Use onSnapshot to listen for real-time updates, ordered by most recent.
    db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        tbody.innerHTML = ''; // Clear existing orders
        snapshot.forEach(doc => {
            const order = doc.data();
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
            tbody.innerHTML += `
                <tr>
                    <td>#${doc.id.substring(0, 6)}</td>
                    <td>${order.customerDetails ? order.customerDetails.name : 'N/A'}</td>
                    <td>₹${order.totalAmount}</td>
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


// --- Action Functions (called from HTML) ---

function deleteCategory(id) {
    if (confirm('Are you sure you want to delete this category? This cannot be undone.')) {
        db.collection('categories').doc(id).delete()
            .then(() => console.log("Category deleted"))
            .catch(error => console.error("Error deleting category:", error));
    }
}

function updateOrderStatus(id, status) {
    db.collection('orders').doc(id).update({ status: status })
        .then(() => console.log(`Order ${id} status updated to ${status}`))
        .catch(error => console.error("Error updating status:", error));
}


// --- Helper Utility for Image Upload ---

/**
 * Uploads an image file to ImgBB and returns the display URL.
 * @param {File} imageFile The image file from an <input type="file">.
 * @returns {Promise<string>} The direct URL of the uploaded image.
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
        // Return the URL that is best for display (usually .display_url)
        return result.data.display_url;
    } else {
        // If the upload fails, throw an error to be caught by the calling function.
        throw new Error(result.error.message || 'ImgBB upload failed.');
    }
}
