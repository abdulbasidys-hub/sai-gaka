// src/context/FinanceContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, where, orderBy, onSnapshot, Timestamp,
  setDoc, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import toast from 'react-hot-toast';

// Budget categories from Sadik's list
export const BUDGET_CATEGORIES = {
  Housing: {
    color: '#7c6aff',
    icon: '🏠',
    items: ['Rent', 'Electricity', 'Council Tax', 'Water (Northumbria)'],
  },
  Vehicle: {
    color: '#ff6a6a',
    icon: '🚗',
    items: ['Car Finance (Lendable)', 'Car Tax (DVLA)', 'Car Insurance (GoSkippy)'],
  },
  'Household & Family': {
    color: '#fbbf24',
    icon: '👨‍👩‍👧',
    items: ["Sky Internet", "Kids' Foodstuffs", 'My Shopping', 'Hajiya Yaya'],
  },
  'Education & Business': {
    color: '#4ade80',
    icon: '📚',
    items: ['Northwest University', 'Dayyib Corporation'],
  },
  'Support & Obligations': {
    color: '#fb923c',
    icon: '🤝',
    items: ['Landowners', 'Family Support (Babayi)', 'Abba Yakasai Generation', 'Charity'],
  },
  Savings: {
    color: '#38bdf8',
    icon: '💰',
    items: ['Savings'],
  },
};

export const ALL_CATEGORIES = Object.keys(BUDGET_CATEGORIES);

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Listen to transactions for current month
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const monthStart = startOfMonth(new Date(currentMonth + '-01'));
    const monthEnd = endOfMonth(new Date(currentMonth + '-01'));

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      where('date', '>=', Timestamp.fromDate(monthStart)),
      where('date', '<=', Timestamp.fromDate(monthEnd)),
      orderBy('date', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() }));
      setTransactions(data);
    });

    return unsub;
  }, [user, currentMonth]);

  // Listen to budgets
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'budgets'), where('month', '==', currentMonth));
    const unsub = onSnapshot(q, (snap) => {
      const data = {};
      snap.docs.forEach(d => { data[d.data().category] = { id: d.id, ...d.data() }; });
      setBudgets(data);
    });
    return unsub;
  }, [user, currentMonth]);

  // Listen to savings goals
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'savingsGoals'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSavingsGoals(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // Load monthly income from user doc
  useEffect(() => {
    if (!user) return;
    const fetchIncome = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid, 'monthlySettings', currentMonth));
      if (snap.exists()) setMonthlyIncome(snap.data().income || 0);
      else setMonthlyIncome(0);
    };
    fetchIncome();
  }, [user, currentMonth]);

  const addTransaction = async (data) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
      ...data,
      date: Timestamp.fromDate(data.date || new Date()),
      createdAt: Timestamp.now(),
    });
    toast.success('Transaction added');
  };

  const deleteTransaction = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    toast.success('Transaction deleted');
  };

  const upsertBudget = async (category, amount) => {
    if (!user) return;
    const existing = budgets[category];
    if (existing) {
      await updateDoc(doc(db, 'users', user.uid, 'budgets', existing.id), { amount: Number(amount) });
    } else {
      await addDoc(collection(db, 'users', user.uid, 'budgets'), {
        category, amount: Number(amount), month: currentMonth,
      });
    }
  };

  const addSavingsGoal = async (data) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'savingsGoals'), {
      ...data,
      currentAmount: 0,
      createdAt: Timestamp.now(),
    });
    toast.success('Savings goal created!');
  };

  const updateSavingsGoal = async (id, updates) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'savingsGoals', id), updates);
    toast.success('Goal updated!');
  };

  const deleteSavingsGoal = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'savingsGoals', id));
    toast.success('Goal deleted');
  };

  const updateMonthlyIncome = async (income) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'monthlySettings', currentMonth), {
      income: Number(income), month: currentMonth,
    });
    setMonthlyIncome(Number(income));
    toast.success('Income updated');
  };

  // Computed totals
  const totalSpent = transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);
  const totalIncome = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : 0), 0) + monthlyIncome;
  const balance = totalIncome - totalSpent;

  const spentByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  return (
    <FinanceContext.Provider value={{
      transactions, budgets, savingsGoals, monthlyIncome,
      loading, currentMonth, setCurrentMonth,
      totalSpent, totalIncome, balance, spentByCategory,
      addTransaction, deleteTransaction,
      upsertBudget, updateMonthlyIncome,
      addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
};
