// firebase/config.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBtJlfnkI3ENCvG5jolgCyENHGTapptNek",
  authDomain: "meetpastor-ba4b0.firebaseapp.com",
  projectId: "meetpastor-ba4b0",
  storageBucket: "meetpastor-ba4b0.firebasestorage.app",
  messagingSenderId: "287171874010",
  appId: "1:287171874010:web:9358cfb76bfd2980dbe9e3",
  measurementId: "G-87FWL26M34", // optional
};

// ✅ prevents "already initialized" issues during Fast Refresh
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
