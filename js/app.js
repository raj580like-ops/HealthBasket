// js/app.js - The New Checkout Flow Logic

document.addEventListener('DOMContentLoaded', () => {
    loadBanner();
    loadCategories();
    loadNewArrivals();

    // Modal close button functionality
    const modal = document.getElementById('checkout-modal');
    const closeButton = document.querySelector('.modal .close-button');
    closeButton.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
});

// Load Promotional Banner
function loadBanner() {
    // ... (This function remains the same as before)
    const bannerSection = document.getElementById('promo-banner');
    db.collection('settings').doc('banner').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            bannerSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${data.imageUrl})`;
            bannerSection.innerHTML = `<h2>${data.title}</h2><p>${data.subtitle}</p>`;
        }
    });
}

// Load Categories
function loadCategories() {
    // ... (This function remains the same as before)
    const categoryTabs = document.getElementById('category-tabs');
    db.collection('categories').get().then(querySnapshot => {
        let tabsHtml = '<div class="category-tab active" data-id="all">All</div>';
        querySnapshot.forEach(doc => {
            tabsHtml += `<div class="category-tab" data-id="${doc.id}">${doc.data().name}</div>`;
        });
        categoryTabs.innerHTML = tabsHtml;
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                filterProductsByCategory(e.target.dataset.id);
                document.querySelector('.category-tab.active').classList.remove('active');
                e.target.classList.add('active');
            });
        });
    });
}

// Load Products
function loadProducts(query) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = 'Loading products...';
    query.get().then(querySnapshot => {
        let productsHtml = '';
        if (querySnapshot.empty) {
            productGrid.innerHTML = '<p>No products found in this category.</p>';
            return;
        }
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const id = doc.id;
            const productData = JSON.stringify({ ...product, id });
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
                    <button class="buy-now-btn" onclick='openCheckout(${productData})'>Buy Now</button>
                </div>
            `;
        });
        productGrid.innerHTML = productsHtml;
    });
}

function loadNewArrivals() { loadProducts(db.collection('products').where('isNewArrival', '==', true)); }
function filterProductsByCategory(categoryId) {
    if (categoryId === 'all') {
        loadProducts(db.collection('products'));
    } else {
        loadProducts(db.collection('products').where('category', '==', categoryId));
    }
}

// --- NEW CHECKOUT MODAL LOGIC ---

function openCheckout(product) {
    const modal = document.getElementById('checkout-modal');
    const summaryDiv = document.getElementById('modal-product-summary');

    // 1. Populate the modal with the selected product's details
    summaryDiv.innerHTML = `
        <div class="summary-item">
            <img src="${product.imageUrl}" alt="${product.name}" class="summary-img">
            <div>
                <p><strong>${product.name}</strong></p>
                <p>Price: ₹${product.sellingPrice}</p>
            </div>
        </div>
        <hr>
        <p class="summary-total"><strong>Total to Pay: ₹${product.sellingPrice}</strong></p>
    `;

    // 2. Attach the order submission logic to the form
    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.onsubmit = (e) => {
        e.preventDefault();
        processOrder(product);
    };

    // 3. Display the modal
    modal.style.display = 'block';
}

function processOrder(product) {
    // 1. Collect all customer details from the form
    const customerDetails = {
        name: document.getElementById('cust-name').value,
        phone: document.getElementById('cust-phone').value,
        email: document.getElementById('cust-email').value,
        address: {
            village: document.getElementById('cust-vil').value,
            postOffice: document.getElementById('cust-po').value,
            district: document.getElementById('cust-dist').value,
            pincode: document.getElementById('cust-pin').value,
            state: document.getElementById('cust-state').value,
        }
    };

    // 2. Open Razorpay Payment Gateway
    const options = {
        "key": "YOUR_RAZORPAY_KEY_ID", // IMPORTANT: Enter your Razorpay Key ID
        "amount": product.sellingPrice * 100,
        "currency": "INR",
        "name": "ClinicStore",
        "description": `Payment for ${product.name}`,
        "handler": function (response) {
            // This function is called after a successful payment
            saveOrderToFirebase(product, customerDetails, response.razorpay_payment_id);
        },
        "prefill": {
            "name": customerDetails.name,
            "email": customerDetails.email,
            "contact": customerDetails.phone
        },
        "theme": { "color": "#007bff" }
    };
    const rzp1 = new Razorpay(options);
    rzp1.open();
}

function saveOrderToFirebase(product, customerDetails, paymentId) {
    // Save the complete order details to Firestore
    db.collection('orders').add({
        productDetails: {
            id: product.id,
            name: product.name,
            price: product.sellingPrice,
            imageUrl: product.imageUrl,
        },
        customerDetails: customerDetails,
        totalAmount: product.sellingPrice,
        paymentId: paymentId,
        status: 'Placed', // Default status for a new order
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then((docRef) => {
        // Redirect to a success page
        window.location.href = `success.html?orderId=${docRef.id}`;
    }).catch(error => {
        console.error("Error writing document: ", error);
        alert('There was an error saving your order. Please contact support.');
    });
}
