// admin/js/dashboard.js
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

    // Banner Management
    const updateBannerBtn = document.getElementById('update-banner-btn');
    updateBannerBtn.addEventListener('click', () => {
        const title = document.getElementById('banner-title').value;
        const subtitle = document.getElementById('banner-subtitle').value;
        const imageFile = document.getElementById('banner-image').files[0];
        
        if (imageFile) {
            const uploadTask = storage.ref(`banners/${imageFile.name}`).put(imageFile);
            uploadTask.on('state_changed', 
                (snapshot) => {}, 
                (error) => console.error(error), 
                () => {
                    storage.ref('banners').child(imageFile.name).getDownloadURL().then(url => {
                        db.collection('settings').doc('banner').set({ title, subtitle, imageUrl: url });
                    });
                }
            );
        } else {
            db.collection('settings').doc('banner').update({ title, subtitle });
        }
        alert('Banner updated!');
    });

    // Category Management
    document.getElementById('add-category-btn').addEventListener('click', () => {
        const name = document.getElementById('category-name').value;
        if (name) {
            db.collection('categories').add({ name }).then(() => {
                loadCategoriesForDropdown();
                loadCategoriesForList();
            });
        }
    });

    // Product Management
    document.getElementById('add-product-btn').addEventListener('click', () => {
        const imageFile = document.getElementById('product-image').files[0];
        if (!imageFile) { alert('Please upload a product image.'); return; }

        const uploadTask = storage.ref(`products/${imageFile.name}`).put(imageFile);
        uploadTask.on('state_changed', null, null, () => {
            storage.ref('products').child(imageFile.name).getDownloadURL().then(url => {
                const product = {
                    name: document.getElementById('product-name').value,
                    mrp: parseFloat(document.getElementById('product-mrp').value),
                    sellingPrice: parseFloat(document.getElementById('product-sp').value),
                    category: document.getElementById('product-category').value,
                    badge: document.getElementById('product-badge').value,
                    isNewArrival: document.getElementById('product-new-arrival').checked,
                    imageUrl: url
                };
                db.collection('products').add(product).then(() => alert('Product added!'));
            });
        });
    });
});

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
    db.collection('categories').doc(id).delete().then(() => {
        loadCategoriesForList();
        loadCategoriesForDropdown();
    });
}

function loadOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    db.collection('orders').onSnapshot(snapshot => {
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const order = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>${doc.id}</td>
                    <td>${order.userId.substring(0, 8)}...</td>
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

function updateOrderStatus(id, status) {
    db.collection('orders').doc(id).update({ status: status });
}
