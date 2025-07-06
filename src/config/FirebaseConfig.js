import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAdydUUfEHHL5KclVfj0wxT3oB623babfc",
  authDomain: "durable-epoch-409107.firebaseapp.com",
  projectId: "durable-epoch-409107",
  storageBucket: "durable-epoch-409107.appspot.com", // ✅ fixed here
  messagingSenderId: "969017298168",
  appId: "1:969017298168:web:33fae69766d60f8161ff0d",
  measurementId: "G-VWSCCQGN7T"
};

// Initialize Firebase app ONCE
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);

// Optional: Only works if browser supports analytics
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.log("Analytics not supported in this environment");
}

export { db, auth };
