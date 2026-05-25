import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following configuration with your database project configuration
// from the Firebase Console (https://console.firebase.google.com/).
const firebaseConfig = {
  apiKey: "AIzaSyCchYZnjuUjTTPvYV3lfDXESTVjGtZgDQ8",
  authDomain: "gate-app-ishant-2027.firebaseapp.com",
  projectId: "gate-app-ishant-2027",
  storageBucket: "gate-app-ishant-2027.firebasestorage.app",
  messagingSenderId: "1035293490524",
  appId: "1:1035293490524:web:0552f630034d1f24191599"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
