// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast from 'react-hot-toast';

// Whitelisted emails — only these can register or sign in
const ALLOWED_EMAILS = [
  'aabello143@yahoo.com',
  'aminubello2468@gmail.com',
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load Firestore profile
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setUserProfile(snap.data());
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
      throw new Error('This email is not authorized to access this app.');
    }
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred;
  };

  const register = async (email, password, displayName) => {
    if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
      throw new Error('This email is not authorized to register.');
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: cred.user.email,
      displayName,
      createdAt: new Date().toISOString(),
      currency: 'GBP',
      monthlyIncome: 0,
    });
    return cred;
  };

  const logout = async () => {
    await signOut(auth);
    toast.success('Signed out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
