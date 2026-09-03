import firebase from "firebase";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Values prefer REACT_APP_ env vars (see .env.example). Fallbacks keep the
// existing demo project working without extra setup.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCUOY5rAv0VklcNqVJ5Ko8T6-VZjUtrITo",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "a-flixs.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "a-flixs",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "a-flixs.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "864349967622",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:864349967622:web:0cd4e2ad557e11d71fba87",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-RXD1D9148C",
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

const db = firebaseApp.firestore();
const auth = firebase.auth();

export { auth };
export default db;
