// src/context/CurrencyContext.jsx
// Manages dual-currency: GBP (primary) + NGN (secondary)
// Exchange rate stored in Firestore and can be updated manually or auto-fetched

import { createContext, useContext, useEffect, useState } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CurrencyContext = createContext(null);

// How to format GBP
export function fmtGBP(n, compact = false) {
  if (n === null || n === undefined || isNaN(n)) return '£0';
  const abs = Math.abs(n);
  if (compact && abs >= 1000) {
    return `£${(n / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

// How to format NGN
export function fmtNGN(n, compact = false) {
  if (n === null || n === undefined || isNaN(n)) return '₦0';
  const abs = Math.abs(n);
  if (compact && abs >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`;
  if (compact && abs >= 1000) return `₦${(n / 1000).toFixed(0)}k`;
  return '₦' + new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

export function CurrencyProvider({ children }) {
  const { user } = useAuth();
  // Default rate ~2024 rate — user can update
  const [exchangeRate, setExchangeRate] = useState(2050); // 1 GBP = X NGN
  const [rateUpdatedAt, setRateUpdatedAt] = useState(null);
  const [salaryConfig, setSalaryConfig] = useState({
    amountGBP: 0,
    amountNGN: 0,
    dayOfMonth: 25, // day salary lands
    currency: 'GBP',
  });

  // Listen to currency settings doc
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'settings', 'currency'), snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.exchangeRate) setExchangeRate(d.exchangeRate);
        if (d.rateUpdatedAt) setRateUpdatedAt(d.rateUpdatedAt);
        if (d.salaryConfig) setSalaryConfig(d.salaryConfig);
      }
    });
    return unsub;
  }, [user]);

  const updateExchangeRate = async (rate) => {
    if (!user) return;
    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', user.uid, 'settings', 'currency'), {
      exchangeRate: Number(rate),
      rateUpdatedAt: now,
    }, { merge: true });
    toast.success(`Rate updated: £1 = ₦${Number(rate).toLocaleString()}`);
  };

  const updateSalaryConfig = async (config) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'settings', 'currency'), {
      salaryConfig: config,
    }, { merge: true });
    setSalaryConfig(config);
    toast.success('Salary settings saved');
  };

  // Fetch live rate from open exchange rates (free, no key needed for GBP/NGN)
  const fetchLiveRate = async () => {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=GBP&to=NGN');
      const data = await res.json();
      if (data?.rates?.NGN) {
        await updateExchangeRate(Math.round(data.rates.NGN));
        return Math.round(data.rates.NGN);
      }
    } catch {
      // Frankfurter doesn't cover NGN — fall back silently
    }
    // Try exchangerate-api (free tier, no key)
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/GBP');
      const data = await res.json();
      if (data?.rates?.NGN) {
        await updateExchangeRate(Math.round(data.rates.NGN));
        return Math.round(data.rates.NGN);
      }
    } catch {
      toast.error('Could not fetch live rate. Please enter manually.');
    }
    return null;
  };

  // Convert NGN to GBP
  const ngnToGbp = (ngn) => ngn / (exchangeRate || 2050);

  // Convert GBP to NGN
  const gbpToNgn = (gbp) => gbp * (exchangeRate || 2050);

  return (
    <CurrencyContext.Provider value={{
      exchangeRate, rateUpdatedAt,
      salaryConfig,
      fmtGBP, fmtNGN,
      ngnToGbp, gbpToNgn,
      updateExchangeRate, updateSalaryConfig, fetchLiveRate,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};
