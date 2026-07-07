import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDk9uSRXoTAv65GQ1lFvmd6BAbumqRcRZE",
  authDomain: "spesa-smart-46c0f.firebaseapp.com",
  projectId: "spesa-smart-46c0f",
  storageBucket: "spesa-smart-46c0f.firebasestorage.app",
  messagingSenderId: "635238640697",
  appId: "635238640697:web:96105721edf7c04a67f1e8",
  measurementId: "G-MKH4N0WFYF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
