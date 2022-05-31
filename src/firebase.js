import firebase from "firebase";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCUOY5rAv0VklcNqVJ5Ko8T6-VZjUtrITo",
  authDomain: "a-flixs.firebaseapp.com",
  projectId: "a-flixs",
  storageBucket: "a-flixs.appspot.com",
  messagingSenderId: "864349967622",
  appId: "1:864349967622:web:0cd4e2ad557e11d71fba87",
  measurementId: "G-RXD1D9148C",
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

const db = firebaseApp.firestore();
const auth = firebase.auth();

export { auth };
export default db;
