// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    loadPromoBanners();
    loadCategories();
    loadNewArrivals();
    updateCartBadge(); // from cart.js
});

function loadPromoBanners() {
    const bannerContainer = document.getElementById('promo-banners');
    // In a real app, you'd fetch this from Firestore
    // For now, let's hardcode one to match the design
    bannerContainer.innerHTML = `
        <div class="promo-card" style="background-image: linear-gradient(to right, #6ee7b7, #34d399);">
            <div class="brand">Murad</div>
            <div class="title">Retinol Youth Renewal</div>
            <div class="desc">Helps fight the appearance of lines & deep wrinkles.</div>
            <div class="buy-button">20% OFF | BUY NOW</div>
        </div>
        <div class="promo-card" style="background-image: linear-gradient(to right, #fca5a5, #ef4444);">
            <div class="brand">The Ordinary</div>
            <div class="title">Glycolic Acid 7%</div>
            <div class="desc">Offers mild exfoliation for improved skin radiance.</div>
            <div class="buy-button">10% OFF | BUY NOW</div>
        </div>
    `;
}

function loadCategories() {
    // This function can remain the same, fetching from Firestore
}

function loadNewArrivals() {
    // This function can remain the same, fetching from Firestore
}

function loadProducts(query) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = 'Loading...';
    // This should fetch from your 'products' collection in Firestore
    query.get().then(querySnapshot => {
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
