// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    loadBanner();
    loadCategories();
    loadNewArrivals();
    updateCartBadge();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('Service Worker registered!', registration))
            .catch(error => console.log('Service Worker registration failed:', error));
    }
});

// Load Promotional Banner
function loadBanner() {
    const bannerSection = document.getElementById('promo-banner');
    db.collection('settings').doc('banner').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            bannerSection.style.backgroundImage = `url(${data.imageUrl})`;
            bannerSection.innerHTML = `
                <h2>${data.title}</h2>
                <p>${data.subtitle}</p>
            `;
        }
    });
}

// Load Categories
function loadCategories() {
    const categoryTabs = document.getElementById('category-tabs');
    db.collection('categories').get().then(querySnapshot => {
        let tabsHtml = '<div class="category-tab active" data-id="all">All</div>';
        querySnapshot.forEach(doc => {
            tabsHtml += `<div class="category-tab" data-id="${doc.id}">${doc.data().name}</div>`;
        });
        categoryTabs.innerHTML = tabsHtml;

        // Add event listeners to tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                filterProductsByCategory(e.target.dataset.id);
                document.querySelector('.category-tab.active').classList.remove('active');
                e.target.classList.add('active');
            });
        });
    });
}

// Load New Arrival Products
function loadNewArrivals() {
    loadProducts(db.collection('products').where('isNewArrival', '==', true));
}

// Filter products by category
function filterProductsByCategory(categoryId) {
    if (categoryId === 'all') {
        loadProducts(db.collection('products'));
    } else {
        loadProducts(db.collection('products').where('category', '==', categoryId));
    }
}

// Generic function to load products
function loadProducts(query) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = 'Loading...';

    query.get().then(querySnapshot => {
        let productsHtml = '';
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const id = doc.id;
            productsHtml += `
                <div class="product-card">
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">
                            <span class="selling-price">₹${product.sellingPrice}</span>
                            <span class="mrp">₹${product.mrp}</span>
                        </div>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart('${id}', '${product.name}', ${product.sellingPrice}, '${product.imageUrl}')">Add to Cart</button>
                </div>
            `;
        });
        productGrid.innerHTML = productsHtml;
    });
}

// Add to Cart
function addToCart(id, name, price, imageUrl) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, imageUrl, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    alert(`${name} added to cart!`);
}

// Update Cart Badge
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-badge').textContent = totalItems;
}
