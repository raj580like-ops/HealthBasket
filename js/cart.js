// js/cart.js

document.addEventListener('DOMContentLoaded', () => {
    loadCartItems();

    document.getElementById('checkout-btn').addEventListener('click', () => {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to proceed to checkout.');
            // This is a simplified flow. In a real app, you'd show the login modal.
            window.location.href = 'index.html'; 
            return;
        }
        processCheckout(user);
    });
});

function loadCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalSpan.textContent = '₹0.00';
        return;
    }

    let itemsHtml = '';
    let total = 0;
    cart.forEach((item, index) => {
        itemsHtml += `
            <div class="cart-item">
                <img src="${item.imageUrl}" alt="${item.name}">
                <div class="item-details">
                    <p>${item.name}</p>
                    <p>₹${item.price}</p>
                    <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
                    <button onclick="removeFromCart(${index})">Remove</button>
                </div>
            </div>
        `;
        total += item.price * item.quantity;
    });

    cartItemsDiv.innerHTML = itemsHtml;
    cartTotalSpan.textContent = `₹${total.toFixed(2)}`;
}

function updateQuantity(index, quantity) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    cart[index].quantity = parseInt(quantity);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
}

function processCheckout(user) {
    const cart = JSON.parse(localStorage.getItem('cart'));
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Get user details for payment gateway
    db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists && doc.data().shippingAddress) {
            const userData = doc.data();
            const options = {
                "key": "YOUR_RAZORPAY_KEY_ID", // Enter the Key ID generated from the Dashboard
                "amount": totalAmount * 100, // Amount is in currency subunits. Default currency is INR.
                "currency": "INR",
                "name": "ClinicStore",
                "description": "Test Transaction",
                "handler": function (response){
                    // This function is called after successful payment
                    saveOrder(user, cart, totalAmount, response.razorpay_payment_id);
                },
                "prefill": {
                    "name": userData.shippingAddress.name,
                    "email": userData.email,
                    "contact": userData.shippingAddress.phone
                },
                "theme": {
                    "color": "#007bff"
                }
            };
            const rzp1 = new Razorpay(options);
            rzp1.open();
        } else {
            alert('Please add a shipping address to your profile before checking out.');
            window.location.href = 'profile.html';
        }
    });
}

function saveOrder(user, cart, totalAmount, paymentId) {
    db.collection('orders').add({
        userId: user.uid,
        items: cart,
        totalAmount: totalAmount,
        status: 'Placed',
        paymentId: paymentId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then((docRef) => {
        // Clear cart and redirect to success page
        localStorage.removeItem('cart');
        window.location.href = `success.html?orderId=${docRef.id}`;
    }).catch(error => console.error("Error adding document: ", error));
}
