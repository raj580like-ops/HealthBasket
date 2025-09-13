// js/firebase-config.js

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDI9uNRs7e7T-oX1MYdBEcTJy-XYQhHorw",
  authDomain: "health-basket-1603c.firebaseapp.com",
  projectId: "health-basket-1603c",
  storageBucket: "health-basket-1603c.firebasestorage.app",
  messagingSenderId: "820149827368",
  appId: "1:820149827368:web:05e08a6b463a12bb73421d"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth(); // We need auth for the new UI and Admin
