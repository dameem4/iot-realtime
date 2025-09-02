// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: replace with your web app config from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyABHcDIyAxhKZzYwJdtAhRsfPmNRUR-egE",
  authDomain: "fresh-arcade-458420-p6.firebaseapp.com",
  projectId: "fresh-arcade-458420-p6",
  storageBucket: "fresh-arcade-458420-p6.firebasestorage.app",
  messagingSenderId: "252382216336",
  appId: "1:252382216336:web:8a77497c5e9fcc9ade5815"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

