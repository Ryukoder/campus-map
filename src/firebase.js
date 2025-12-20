// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSk7H2anHLo8M2Xb5azFKkxAU4phnj9j8",
  authDomain: "campus-map-3a07b.firebaseapp.com",
  projectId: "campus-map-3a07b",
  storageBucket: "campus-map-3a07b.firebasestorage.app",
  messagingSenderId: "1080683375992",
  appId: "1:1080683375992:web:59f8c48b42abef77a3ec8d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = getAuth(app);
