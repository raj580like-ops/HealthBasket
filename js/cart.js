// js/cart.js

/**
 * This function is called from the cart page (`cart.html`) when it loads.
 * It checks for the existence of cart page elements before manipulating them.
 */
document.addEventListener('DOMContentLoaded', () => {
    // This is the key: Only run loadCartItems if we are on the cart page.
    // We can detect this by checking if the 'cart-items' div exists.
    const cartPageContainer = document.getElementById('cart-items');
    if (cartPageContainer) {
        loadCartItems();
    }
});

/**
 * Populates the cart.html page with items from Local Storage.
 */
function loadCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    
    // The check for existence is now implicitly handled by the DOMContentLoaded listener.
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
        cartTotalSpan.textContent = '₹0.00';
        return;
    }

    let itemsHtml = '';
    let total = 0;
    cart.forEach((item, index) => {
        itemsHtml += `
            <div class="cart-item">
                <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">₹${item.price}</p>
                    <div class="cart-item-actions">
                        <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
                        <button onclick="removeFromCart(${index})">Remove</button>
                    </div>
                </div>
            </div>
        `;
        total += item.price * item.quantity;
    });

    cartItemsDiv.innerHTML = itemsHtml;
    cartTotalSpan.textContent = `₹${total.toFixed(2)}`;
}

/**
 * ----- GLOBAL CART FUNCTIONS (Can be called from any page) -----
 */

/**
 * Adds an item to the cart in Local Storage. This is called from index.html.
 */
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
    // Optional: Add a subtle confirmation animation or message.
    alert(`${name} was added to your cart!`);
}

/**
 * Updates the little red number on the cart icon in the navigation bar.
 * This can be called from any page.
 */
function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) { // Check if the badge element exists
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        cartBadge.textContent = totalItems;
        if (totalItems > 0) {
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
    }
}

/**
 * Updates the quantity of an item in the cart. Called from cart.html.
 */
function updateQuantity(index, quantity) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    cart[index].quantity = parseInt(quantity);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems(); // Reload the cart display
    updateCartBadge(); // Update the badge as well
}

/**
 * Removes an item from the cart. Called from cart.html.
 */
function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems(); // Reload the cart display
    updateCartBadge(); // Update the badge as well
}
