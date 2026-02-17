import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, type User as FirebaseUser } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBzqWLoZmHoKg0zHBsb_HRFosdPYy3LcJ0",
    authDomain: "cablepro-58443.firebaseapp.com",
    projectId: "cablepro-58443",
    storageBucket: "cablepro-58443.firebasestorage.app",
    messagingSenderId: "710244325897",
    appId: "1:710244325897:web:c90a2e24c29fa68558b6d8",
    measurementId: "G-ZPGM34WXFP",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/drive.file");

export { auth, googleProvider, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile };
export type { FirebaseUser };
