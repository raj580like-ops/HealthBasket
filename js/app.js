// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // These functions run as soon as the page is loaded.
    loadPromoBanners();
    loadCategories();
    loadNewArrivals();
    updateCartBadge(); // This function is in cart.js
});

// In your js/app.js file, find the loadPromoBanners function and replace it with this one.

function loadPromoBanners() {
    const bannerContainer = document.getElementById('promo-banners');
    bannerContainer.innerHTML = ''; // Clear any default content

    db.collection('settings').doc('banner').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();

            // ================================================================
            // THE FIX IS HERE:
            // We create a style string that includes BOTH a semi-transparent
            // color overlay AND the imageUrl from Firestore.
            // This ensures the text is always readable over the image.
            // ================================================================
            const bannerStyle = `
                background-image: 
                    linear-gradient(to right, rgba(16, 185, 129, 0.8), rgba(16, 185, 129, 0.6)), 
                    url('${data.imageUrl}');
            `;

            bannerContainer.innerHTML = `
                <div class="promo-card" style="${bannerStyle}">
                    <div class="brand">Promotion</div>
                    <div class="title">${data.title}</div>
                    <div class="desc">${data.subtitle}</div>
                </div>
                <!-- You can add more static or dynamic banners here if needed -->
            `;
        } else {
            console.log("No banner data found in Firestore.");
            bannerContainer.style.display = 'none';
        }
    }).catch(error => {
        console.error("Error getting banner:", error);
    });
}

function loadCategories() {
    const categoryTabs = document.getElementById('category-tabs');
    categoryTabs.innerHTML = ''; // Clear any default content

    db.collection('categories').get().then(querySnapshot => {
        if (querySnapshot.empty) {
            console.log("No categories found in Firestore.");
            return;
        }
        // Add an "All" tab first, and make it active by default.
        let tabsHtml = '<div class="category-tab active" data-id="all">All</div>';
        querySnapshot.forEach(doc => {
            tabsHtml += `<div class="category-tab" data-id="${doc.id}">${doc.data().name}</div>`;
        });
        categoryTabs.innerHTML = tabsHtml;

        // Add event listeners to all tabs to handle filtering.
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                filterProductsByCategory(e.target.dataset.id);
                // Update the 'active' class for styling
                document.querySelector('.category-tab.active').classList.remove('active');
                e.target.classList.add('active');
            });
        });
    });
}

function loadNewArrivals() {
    // This query specifically looks for products marked as "New Arrival" in the admin panel.
    const query = db.collection('products').where('isNewArrival', '==', true);
    loadProducts(query);
}

function filterProductsByCategory(categoryId) {
    let query;
    if (categoryId === 'all') {
        // If "All" is clicked, fetch all products.
        query = db.collection('products');
    } else {
        // Otherwise, fetch only products matching the category ID.
        query = db.collection('products').where('category', '==', categoryId);
    }
    loadProducts(query);
}

function loadProducts(query) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = '<p>Loading products...</p>'; // Show a loading message

    query.get().then(querySnapshot => {
        if (querySnapshot.empty) {
            productGrid.innerHTML = '<p>No products found. Please check back later!</p>';
            return;
        }
        let productsHtml = '';
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const id = doc.id;
            productsHtml += `
                <div class="product-card">
                    <div class="product-card-header">
                        ${product.badge ? `<div class="product-badge">${product.badge.toUpperCase()}</div>` : '<div></div>'}
                        <div class="wishlist-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </div>
                    </div>
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-card-image">
                    <p class="name">${product.name}</p>
                    <div class="product-card-footer">
                        <span class="price">₹${product.sellingPrice}</span>
                        <button class="add-to-cart-btn" onclick="addToCart('${id}', '${product.name}', ${product.sellingPrice}, '${product.imageUrl}')">+</button>
                    </div>
                </div>
            `;
        });
        productGrid.innerHTML = productsHtml;
    });
}
