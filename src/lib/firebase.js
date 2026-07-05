// src/lib/firebase.js
// Replace these values with your actual Firebase project config
// Found in: Firebase Console → Project Settings → Your Apps → SDK setup

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAniMC4INGJKej1mksqg4TIg23sI6C6tZc",
  authDomain: "sai-ga-ka.firebaseapp.com",
  projectId: "sai-ga-ka",
  storageBucket: "sai-ga-ka.firebasestorage.app",
  messagingSenderId: "620837913319",
  appId: "1:620837913319:web:44e705ba378d7c86869842",
  measurementId: "G-0CP618L4TM"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Messaging only available in supported browsers
export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

export default app;
