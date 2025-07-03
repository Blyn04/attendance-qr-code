import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const FireBaseConfig = {
  apiKey: "AIzaSyAdydUUfEHHL5KclVfj0wxT3oB623babfc",
  authDomain: "durable-epoch-409107.firebaseapp.com",
  projectId: "durable-epoch-409107",
  storageBucket: "durable-epoch-409107.firebasestorage.app",
  messagingSenderId: "969017298168",
  appId: "1:969017298168:web:33fae69766d60f8161ff0d",
  measurementId: "G-VWSCCQGN7T"
};

// Initialize Firebase
const app = initializeApp(FireBaseConfig);
const db = getFirestore(app);          // <-- Firestore database
const analytics = getAnalytics(app);   // (Optional)

export { db };
