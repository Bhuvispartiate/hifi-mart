import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBcYaAk-uwyUSCoE0b9gYItPURsAVyTfqI",
  authDomain: "groceries-addd0.firebaseapp.com",
  projectId: "groceries-addd0",
  storageBucket: "groceries-addd0.firebasestorage.app",
  messagingSenderId: "102335990086",
  appId: "1:102335990086:web:a23864c23491039c00bd47",
  measurementId: "G-NSCVWMDLFH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth, RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
