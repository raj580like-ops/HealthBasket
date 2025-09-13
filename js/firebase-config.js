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
const auth = firebase.auth();

// ================================================================
// THE BULLETPROOF FIX, PART 1:
// We are EXPLICITLY telling Firebase Auth to save the user's
// session in the browser's local storage. This makes it persist
// across page reloads and navigations.
// ================================================================
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.error("Firebase persistence error:", error);
  });
